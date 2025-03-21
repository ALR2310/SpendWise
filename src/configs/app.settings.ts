import { Preferences } from '@capacitor/preferences';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
  CUPCAKE = 'cupcake',
  GARDEN = 'garden',
  DRACULA = 'dracula',
}

enum Language {
  VI = 'vi',
  EN = 'en',
}

interface SpendPageConfigs {
  name: 'Spend';
  list: string;
  sort: string;
}

interface StatsPageConfigs {
  name: 'Stats';
}

interface NotePageConfigs {
  name: 'Note';
}

interface SettingPageConfigs {
  name: 'Setting';
}

interface AppConfigs {
  general: {
    defaultPage: 'spend' | 'stats' | 'note' | 'setting';
    language: Language;
    notification: boolean;
    autoUpdate: boolean;
    theme: Theme;
    autoSync: boolean;
    version: string;
  };
  page: {
    spend: SpendPageConfigs;
    stats: StatsPageConfigs;
    note: NotePageConfigs;
    setting: SettingPageConfigs;
  };
  data: {
    fileId: string;
    dateBackup: string;
    dateSync: string;
  };
  version: number;
}

const defaultConfigs: AppConfigs = {
  general: {
    defaultPage: 'spend',
    language: Language.VI,
    notification: true,
    autoUpdate: true,
    theme: Theme.LIGHT,
    autoSync: true,
    version: __APP_VERSION__,
  },
  page: {
    spend: { name: 'Spend', list: '', sort: 'date' },
    stats: { name: 'Stats' },
    note: { name: 'Note' },
    setting: { name: 'Setting' },
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

function initializeAppConfig(storageKey: string): AppConfigs {
  const storedSettingStr = localStorage.getItem(storageKey);
  const storedSetting: AppConfigs | null = storedSettingStr ? JSON.parse(storedSettingStr) : null;
  let settings: AppConfigs;

  if (!storedSetting || storedSetting.version !== defaultConfigs.version) {
    settings = { ...defaultConfigs };
  } else {
    settings = { ...storedSetting };
    mergeSettings(settings, defaultConfigs);
    removeOldSettings(settings, defaultConfigs);
  }
  saveToStorage(storageKey, settings);
  return createSettingsProxy(settings, storageKey);
}

async function syncFromPreferences(storageKey: string) {
  const storedSettingStr = (await Preferences.get({ key: storageKey })).value;
  if (!storedSettingStr) return;

  const storedSetting: AppConfigs = JSON.parse(storedSettingStr);

  if (storedSetting.version !== defaultConfigs.version) {
    mergeSettings(storedSetting, defaultConfigs);
    removeOldSettings(storedSetting, defaultConfigs);
    storedSetting.version = defaultConfigs.version;
  }

  if (JSON.stringify(storedSetting) !== JSON.stringify(appConfig)) {
    Object.assign(appConfig, storedSetting);
    saveToStorage(storageKey, storedSetting);
  }
}

function mergeSettings(target: AppConfigs, source: AppConfigs) {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      (target as any)[key] = (target as any)[key] || {};
      mergeSettings((target as any)[key], source[key] as any);
    } else if (!(key in target)) {
      (target as any)[key] = source[key];
    }
  }
}

function removeOldSettings(target: AppConfigs, source: AppConfigs) {
  for (const key in target) {
    if (!(key in source)) delete (target as any)[key];
    else if (typeof (target as any)[key] === 'object' && typeof (source as any)[key] === 'object') {
      removeOldSettings((target as any)[key], (source as any)[key]);
    }
  }
}

export const appConfig = initializeAppConfig('appConfigs');

syncFromPreferences('appConfigs');
