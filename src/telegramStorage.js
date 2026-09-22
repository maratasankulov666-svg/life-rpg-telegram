// telegramStorage.js
//
// Storage для Life RPG.
// В Telegram:
//   1. DeviceStorage — основное хранилище на устройстве.
//   2. localStorage — fallback.
// В обычном браузере:
//   localStorage.
//
// DeviceStorage доступен начиная с Bot API 9.0
// и имеет лимит 5 MB на пользователя.

const STORAGE_TIMEOUT_MS = 5000;

function getWebApp() {
  return typeof window !== 'undefined'
    ? window.Telegram?.WebApp
    : null;
}

function getDeviceStorage() {
  const webApp = getWebApp();

  if (!webApp || !webApp.DeviceStorage) {
    return null;
  }

  if (
    typeof webApp.isVersionAtLeast === 'function' &&
    !webApp.isVersionAtLeast('9.0')
  ) {
    return null;
  }

  return webApp.DeviceStorage;
}

function withTimeout(promise, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `${label}: Telegram не ответил за ${STORAGE_TIMEOUT_MS / 1000}с`
        )
      );
    }, STORAGE_TIMEOUT_MS);

    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function deviceGetItem(key) {
  return withTimeout(
    new Promise((resolve, reject) => {
      const storage = getDeviceStorage();

      if (!storage) {
        reject(new Error('Telegram DeviceStorage недоступен'));
        return;
      }

      storage.getItem(key, (error, value) => {
        if (error) {
          reject(error);
        } else {
          resolve(value || null);
        }
      });
    }),
    'DeviceStorage.getItem'
  );
}

function deviceSetItem(key, value) {
  return withTimeout(
    new Promise((resolve, reject) => {
      const storage = getDeviceStorage();

      if (!storage) {
        reject(new Error('Telegram DeviceStorage недоступен'));
        return;
      }

      storage.setItem(key, value, (error, success) => {
        if (error) {
          reject(error);
        } else {
          resolve(success !== false);
        }
      });
    }),
    'DeviceStorage.setItem'
  );
}

function deviceRemoveItem(key) {
  return withTimeout(
    new Promise((resolve, reject) => {
      const storage = getDeviceStorage();

      if (!storage) {
        reject(new Error('Telegram DeviceStorage недоступен'));
        return;
      }

      storage.removeItem(key, (error, success) => {
        if (error) {
          reject(error);
        } else {
          resolve(success !== false);
        }
      });
    }),
    'DeviceStorage.removeItem'
  );
}

// --------------------------------------------------
// localStorage fallback
// --------------------------------------------------

const localStorageImpl = {
  async get(key) {
    const value = window.localStorage.getItem(key);

    return value
      ? {
          key,
          value,
          shared: false,
        }
      : null;
  },

  async set(key, value) {
    window.localStorage.setItem(key, value);

    return {
      key,
      value,
      shared: false,
    };
  },

  async delete(key) {
    window.localStorage.removeItem(key);

    return {
      key,
      deleted: true,
      shared: false,
    };
  },

  async list(prefix) {
    const keys = Object.keys(window.localStorage).filter(
      key => !prefix || key.startsWith(prefix)
    );

    return {
      keys,
      prefix,
      shared: false,
    };
  },
};

// --------------------------------------------------
// Telegram DeviceStorage
// --------------------------------------------------

const deviceStorageImpl = {
  async get(key) {
    const value = await deviceGetItem(key);

    return value
      ? {
          key,
          value,
          shared: false,
        }
      : null;
  },

  async set(key, value) {
    await deviceSetItem(key, value);

    window.__telegramStorageLastSaveInfo = {
      bytes: value.length,
      status: 'ok',
      storage: 'DeviceStorage',
      time: Date.now(),
    };

    return {
      key,
      value,
      shared: false,
    };
  },

  async delete(key) {
    await deviceRemoveItem(key);

    return {
      key,
      deleted: true,
      shared: false,
    };
  },

  async list(prefix) {
    // DeviceStorage не предоставляет getKeys().
    // В нашем приложении list() не нужен для основного save/load.
    return {
      keys: [],
      prefix,
      shared: false,
    };
  },
};

// --------------------------------------------------
// Выбираем хранилище
// --------------------------------------------------

const deviceStorage = getDeviceStorage();

const impl = deviceStorage
  ? deviceStorageImpl
  : localStorageImpl;

// Диагностика
if (typeof window !== 'undefined') {
  const webApp = getWebApp();

  window.__telegramStorageDiagnostics = () => ({
    telegram: !!webApp,
    version: webApp?.version || null,
    platform: webApp?.platform || null,
    initData: !!webApp?.initData,
    deviceStorage: !!getDeviceStorage(),
    storage:
      getDeviceStorage()
        ? 'DeviceStorage'
        : 'localStorage',
    lastSave:
      window.__telegramStorageLastSaveInfo || null,
  });

  window.storage = impl;
}

export {};
