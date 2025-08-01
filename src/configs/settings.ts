import { Preferences } from '@capacitor/preferences';

import { AppSettings, LANGUAGE, PAGE, THEME } from '~/shared/types/settings.type';

const defaultSettings: AppSettings = {
  general: {
    defaultPage: PAGE.SPENDING,
    language: LANGUAGE.VI,
    notification: true,
    autoUpdate: true,
    theme: THEME.DARK,
    version: __APP_VERSION__,
  },
  pages: {
    spending: { name: PAGE.SPENDING, list: '', sort: 'date' },
    statistics: { name: PAGE.STATISTICS },
    notes: { name: PAGE.NOTES },
    settings: { name: PAGE.SETTINGS },
  },
  data: { fileId: '', dateBackup: '', dateSync: '' },
  version: 1,
};

const saveToStorage = async (key: string, data: any) => {
  const dataStr = JSON.stringify(data);
  localStorage.setItem(key, dataStr);
  Preferences.set({ key, value: dataStr });
};

function createSettingsProxy<T>(data: T, storageKey: string, rootData: T = data): T {
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      const value = target[prop];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return createSettingsProxy(value, storageKey, rootData);
      }
      return value;
    },
    set(target, prop, value) {
      target[prop] = value;
      saveToStorage(storageKey, rootData);
      return true;
    },
  };
  return new Proxy(data, handler);
}

function initializeAppSettings(storageKey: string): AppSettings {
  const storedSettingStr = localStorage.getItem(storageKey);
  const storedSetting: AppSettings | null = storedSettingStr ? JSON.parse(storedSettingStr) : null;
  let settings: AppSettings;

  if (!storedSetting || storedSetting.version !== defaultSettings.version) {
    settings = { ...defaultSettings };
  } else {
    settings = { ...storedSetting };
    mergeSettings(settings, defaultSettings);
    removeOldSettings(settings, defaultSettings);
  }
  saveToStorage(storageKey, settings);
  return createSettingsProxy(settings, storageKey);
}

async function syncFromPreferences(storageKey: string) {
  const storedSettingStr = (await Preferences.get({ key: storageKey })).value;
  if (!storedSettingStr) return;

  const storedSetting: AppSettings = JSON.parse(storedSettingStr);

  if (storedSetting.version !== defaultSettings.version) {
    mergeSettings(storedSetting, defaultSettings);
    removeOldSettings(storedSetting, defaultSettings);
    storedSetting.version = defaultSettings.version;
  }

  if (JSON.stringify(storedSetting) !== JSON.stringify(appSettings)) {
    Object.assign(appSettings, storedSetting);
    saveToStorage(storageKey, storedSetting);
  }
}

function mergeSettings(target: AppSettings, source: AppSettings) {
  for (const key in source) {
    if (typeof (source as any)[key] === 'object' && (source as any)[key] !== null && !Array.isArray((source as any)[key])) {
      (target as any)[key] = (target as any)[key] || {};
      mergeSettings((target as any)[key], (source as any)[key]);
    } else if (!(key in target)) {
      (target as any)[key] = (source as any)[key];
    }
  }
}

function removeOldSettings(target: AppSettings, source: AppSettings) {
  for (const key in target) {
    if (!(key in source)) delete (target as any)[key];
    else if (typeof (target as any)[key] === 'object' && typeof (source as any)[key] === 'object') {
      removeOldSettings((target as any)[key], (source as any)[key]);
    }
  }
}

export const appSettings = initializeAppSettings('appSettings');

syncFromPreferences('appSettings');
