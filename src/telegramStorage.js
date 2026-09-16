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
const CHUNK_SIZE = 3500; // с запасом под лимит 4096 символов
function getCloud() {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp?.CloudStorage : null;
}
function cloudGetItem(key) {
  return new Promise((resolve, reject) => {
    const cloud = getCloud();
    if (!cloud) return reject(new Error('CloudStorage unavailable'));
    cloud.getItem(key, (err, value) => (err ? reject(err) : resolve(value || null)));
  });
}
function cloudSetItem(key, value) {
  return new Promise((resolve, reject) => {
    const cloud = getCloud();
    if (!cloud) return reject(new Error('CloudStorage unavailable'));
    cloud.setItem(key, value, (err, ok) => (err ? reject(err) : resolve(ok)));
  });
}
function cloudRemoveItem(key) {
  return new Promise((resolve, reject) => {
    const cloud = getCloud();
    if (!cloud) return reject(new Error('CloudStorage unavailable'));
    cloud.removeItem(key, (err, ok) => (err ? reject(err) : resolve(ok)));
  });
}
function cloudGetKeys() {
  return new Promise((resolve, reject) => {
    const cloud = getCloud();
    if (!cloud) return reject(new Error('CloudStorage unavailable'));
    cloud.getKeys((err, keys) => (err ? reject(err) : resolve(keys || [])));
  });
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
async function cloudSet(key, value) {
  const chunks = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }
  // если новых чанков меньше, чем было — подчищаем хвост от старой версии
  let oldChunkCount = 0;
  try {
    const oldMetaRaw = await cloudGetItem(`${key}__meta`);
    if (oldMetaRaw) oldChunkCount = JSON.parse(oldMetaRaw).chunks || 0;
  } catch (_) { /* нет старых данных — не проблема */ }
  for (let i = 0; i < chunks.length; i++) {
    await cloudSetItem(`${key}__c${i}`, chunks[i]);
  }
  for (let i = chunks.length; i < oldChunkCount; i++) {
    try { await cloudRemoveItem(`${key}__c${i}`); } catch (_) { /* ignore */ }
  }
  await cloudSetItem(`${key}__meta`, JSON.stringify({ chunks: chunks.length }));
  return { key, value, shared: false };
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
