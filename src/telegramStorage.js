// telegramStorage.js
//
// Заменяет window.storage (API артефактов Claude) на аналог,
// работающий через Telegram Mini Apps CloudStorage — данные привязаны
// к Telegram-аккаунту пользователя и синхронизируются между устройствами.
//
// CloudStorage ограничения: значение ≤ 4096 символов на ключ, всего
// ≤ 1024 ключей на бота. Наш JSON состояния почти всегда больше 4096
// символов, поэтому он режется на чанки и хранится под несколькими
// ключами + один "мета" ключ с их количеством.
//
// Если приложение открыто НЕ в Telegram (например, при разработке в
// обычном браузере), автоматически используется localStorage — это
// удобно для локальной проверки, но реального пользователя это не
// касается: в проде CloudStorage всегда доступен.
const CHUNK_SIZE = 3900; // с запасом под лимит 4096 символов (было 3500 — увеличили, чтобы
// уменьшить число обращений на одно сохранение)
const CALL_TIMEOUT_MS = 12000; // таймаут на один вызов CloudStorage (getItem/setItem/...) —
// на LTE один round-trip к серверам Telegram иногда занимает 1-2с, и это нормально

function getCloud() {
  const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  if (!webApp || !webApp.CloudStorage) return null;
  // CloudStorage появился в Bot API 6.9. Объект-заглушка `Telegram.WebApp.CloudStorage`
  // присутствует в SDK всегда (даже в клиентах, которые его не поддерживают) — если
  // не проверить версию, мы попытаемся вызвать методы, колбэк от которых никогда не
  // придёт, и получим ровно то бесконечное "нет ответа", что мы и видим. Поэтому если
  // клиент явно старее 6.9 — сразу считаем CloudStorage недоступным и уходим в fallback,
  // вместо того чтобы ждать 6-8 секунд впустую при каждом сохранении.
  if (typeof webApp.isVersionAtLeast === 'function' && !webApp.isVersionAtLeast('6.9')) return null;
  return webApp.CloudStorage;
}

// Диагностика — пригодится, чтобы понять, что именно за клиент Telegram у пользователя,
// если CloudStorage всё равно не отвечает даже при формально поддерживаемой версии.
function getTelegramDiagnostics() {
  const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  if (!webApp) return { present: false };
  return {
    present: true,
    version: webApp.version || null,
    platform: webApp.platform || null,
    hasInitData: !!(webApp.initData && webApp.initData.length > 0),
    cloudStorageObjectPresent: !!webApp.CloudStorage,
    versionSupportsCloud: typeof webApp.isVersionAtLeast === 'function' ? webApp.isVersionAtLeast('6.9') : 'неизвестно (isVersionAtLeast недоступен)',
    lastSave: typeof window !== 'undefined' ? window.__telegramStorageLastSaveInfo || null : null,
  };
}
if (typeof window !== 'undefined') {
  window.__telegramStorageDiagnostics = getTelegramDiagnostics;
}

// Оборачиваем колбэк-based вызов в промис С ТАЙМАУТОМ. Без этого: если
// колбэк от Telegram-моста по какой-то причине не придёт (что реальнее
// именно при "заторе" из нескольких почти одновременных вызовов — см. ниже
// про очередь сохранений), await виснет навсегда, а UI показывает
// бесконечное "Сохраняю...".
function withTimeout(promise, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`CloudStorage.${label}: нет ответа за ${CALL_TIMEOUT_MS / 1000}с`)), CALL_TIMEOUT_MS);
    promise.then(
      v => { clearTimeout(t); resolve(v); },
      e => { clearTimeout(t); reject(e); }
    );
  });
}

function cloudGetItem(key) {
  return withTimeout(new Promise((resolve, reject) => {
    const cloud = getCloud();
    if (!cloud) return reject(new Error('CloudStorage unavailable'));
    cloud.getItem(key, (err, value) => (err ? reject(err) : resolve(value || null)));
  }), 'getItem');
}
function cloudSetItem(key, value) {
  return withTimeout(new Promise((resolve, reject) => {
    const cloud = getCloud();
    if (!cloud) return reject(new Error('CloudStorage unavailable'));
    cloud.setItem(key, value, (err, ok) => (err ? reject(err) : resolve(ok)));
  }), 'setItem');
}
function cloudRemoveItem(key) {
  return withTimeout(new Promise((resolve, reject) => {
    const cloud = getCloud();
    if (!cloud) return reject(new Error('CloudStorage unavailable'));
    cloud.removeItem(key, (err, ok) => (err ? reject(err) : resolve(ok)));
  }), 'removeItem');
}
function cloudGetKeys() {
  return withTimeout(new Promise((resolve, reject) => {
    const cloud = getCloud();
    if (!cloud) return reject(new Error('CloudStorage unavailable'));
    cloud.getKeys((err, keys) => (err ? reject(err) : resolve(keys || [])));
  }), 'getKeys');
}

// --- Fallback для тестов вне Telegram (обычный браузер) --
const fallback = {
  async get(key) {
    const raw = window.localStorage.getItem(key);
    return raw ? { key, value: raw, shared: false } : null;
  },
  async set(key, value) {
    window.localStorage.setItem(key, value);
    return { key, value, shared: false };
  },
  async delete(key) {
    window.localStorage.removeItem(key);
    return { key, deleted: true, shared: false };
  },
  async list(prefix) {
    const keys = Object.keys(window.localStorage).filter(k => !prefix || k.startsWith(prefix));
    return { keys, prefix, shared: false };
  },
};

// --- Реальная реализация через CloudStorage (с чанкованием) --
async function cloudGet(key) {
  const metaRaw = await cloudGetItem(`${key}__meta`);
  if (!metaRaw) return null;
  const meta = JSON.parse(metaRaw);
  let full = '';
  for (let i = 0; i < meta.chunks; i++) {
    full += (await cloudGetItem(`${key}__c${i}`)) || '';
  }
  return { key, value: full, shared: false };
}

async function cloudSetInner(key, value) {
  const startedAt = Date.now();
  const chunks = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }
  window.__telegramStorageLastSaveInfo = { bytes: value.length, chunks: chunks.length, status: 'в процессе', ms: null };
  let oldChunkCount = 0;
  try {
    const oldMetaRaw = await cloudGetItem(`${key}__meta`);
    if (oldMetaRaw) oldChunkCount = JSON.parse(oldMetaRaw).chunks || 0;
  } catch (_) { /* нет старых данных — не проблема */ }
  try {
    for (let i = 0; i < chunks.length; i++) {
      await cloudSetItem(`${key}__c${i}`, chunks[i]);
    }
    for (let i = chunks.length; i < oldChunkCount; i++) {
      try { await cloudRemoveItem(`${key}__c${i}`); } catch (_) { /* ignore */ }
    }
    await cloudSetItem(`${key}__meta`, JSON.stringify({ chunks: chunks.length }));
    window.__telegramStorageLastSaveInfo = { bytes: value.length, chunks: chunks.length, status: 'ok', ms: Date.now() - startedAt };
  } catch (e) {
    window.__telegramStorageLastSaveInfo = { bytes: value.length, chunks: chunks.length, status: 'ошибка: ' + (e && e.message ? e.message : String(e)), ms: Date.now() - startedAt };
    throw e;
  }
  return { key, value, shared: false };
}

// ВАЖНО: сохранение состояния может занимать десяток+ последовательных сетевых
// вызовов (по одному на чанк). Приложение вызывает set() при КАЖДОМ изменении
// state — а сразу после импорта/загрузки несколько эффектов React обычно
// срабатывают почти одновременно (проверка ачивок, ИИ-квесты, снепшот
// баланса и т.д.), и каждый из них тоже дергает автосохранение. Если два
// таких сохранения накладываются друг на друга, они одновременно пишут в
// одни и те же ключи `key__c0`, `key__c1`... — Telegram-мост это не всегда
// корректно разруливает, и колбэк на один из вызовов может просто никогда
// не прийти. Именно это и выглядит как "автосохранение зависло/не сработало"
// именно в момент после импорта, а не при обычных мелких правках (там
// сохранение всегда одно, без наложений).
//
// Чиним очередью: если сохранение уже идёт, новый вызов не стартует
// параллельно, а просто запоминает последнее значение и ждёт своей очереди;
// когда текущее сохранение завершится (успешно или с ошибкой), сразу
// запускается ещё одно — но уже с самым свежим состоянием, а не со всеми
// промежуточными.
let saveInFlight = null;
let pendingValue = null;
let pendingKey = null;
function cloudSet(key, value) {
  if (saveInFlight) {
    // Уже что-то сохраняется — просто запоминаем самое свежее значение
    // и отдаём тот же промис ожидания очереди (когда очередь дойдёт,
    // resolve/reject произойдёт для актуального значения).
    pendingKey = key;
    pendingValue = value;
    return saveInFlight.then(() => runQueued());
  }
  saveInFlight = cloudSetInner(key, value).finally(() => { saveInFlight = null; });
  return saveInFlight;
}
function runQueued() {
  if (pendingValue === null) return Promise.resolve({ key: pendingKey, value: pendingValue, shared: false });
  const key = pendingKey, value = pendingValue;
  pendingValue = null; pendingKey = null;
  return cloudSet(key, value);
}

async function cloudDelete(key) {
  let oldChunkCount = 0;
  try {
    const oldMetaRaw = await cloudGetItem(`${key}__meta`);
    if (oldMetaRaw) oldChunkCount = JSON.parse(oldMetaRaw).chunks || 0;
  } catch (_) { /* ignore */ }
  for (let i = 0; i < oldChunkCount; i++) {
    try { await cloudRemoveItem(`${key}__c${i}`); } catch (_) { /* ignore */ }
  }
  try { await cloudRemoveItem(`${key}__meta`); } catch (_) { /* ignore */ }
  return { key, deleted: true, shared: false };
}
async function cloudList(prefix) {
  const keys = await cloudGetKeys();
  const metaKeys = keys.filter(k => k.endsWith('__meta') && (!prefix || k.startsWith(prefix)));
  return { keys: metaKeys.map(k => k.replace(/__meta$/, '')), prefix, shared: false };
}

const impl = getCloud()
  ? { get: cloudGet, set: cloudSet, delete: cloudDelete, list: cloudList }
  : fallback;

if (typeof window !== 'undefined') {
  window.storage = impl;
}
export {};
