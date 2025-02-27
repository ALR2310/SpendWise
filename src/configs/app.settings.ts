enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

enum Language {
  VI = 'vi',
  EN = 'en',
}

const spendPageConfigs = {
  name: 'Spend',
  list: '',
  sort: 'date',
};

const statsPageConfigs = {
  name: 'Stats',
};

const notePageConfigs = {
  name: 'Note',
};

const settingPageConfigs = {
  name: 'Setting',
};

const defaultConfigs = {
  general: {
    defaultPage: 'spend',
    language: Language.VI,
    notification: true,
    autoUpdate: true,
    theme: Theme.LIGHT,
    version: '',
  },
  page: {
    spend: spendPageConfigs,
    stats: statsPageConfigs,
    note: notePageConfigs,
    setting: settingPageConfigs,
  },
  data: {
    fileId: '',
    lastBackup: '',
    lastSync: '',
  },
  version: 1,
};

class AppSettings {
  private settings: any;
  private storageKey = 'appSettings';

  constructor() {
    this.init();
  }

  private mergeSettings(target: any, source: any) {
    for (const key in source) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        this.mergeSettings(target[key], source[key]);
      } else if (!(key in target)) target[key] = source[key];
    }
  }

  private removeOldSettings(target: any, source: any) {
    for (const key in target)
      if (!(key in source)) delete target[key];
      else if (typeof target[key] === 'object' && typeof source[key] === 'object')
        this.removeOldSettings(target[key], source[key]);
  }

  private init() {
    const storedSettingStr = localStorage.getItem(this.storageKey);
    const storedSetting = storedSettingStr ? JSON.parse(storedSettingStr) : null;

    if (!storedSetting || storedSetting.version !== defaultConfigs.version) {
      this.settings = { ...defaultConfigs };
    } else {
      this.settings = { ...storedSetting };
      this.mergeSettings(this.settings, defaultConfigs);
      this.removeOldSettings(this.settings, defaultConfigs);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
  }

  public get(path?: string): string {
    if (!path) return this.settings;

    const keys = path.split('.');
    let result: any = this.settings;

    for (let key of keys) {
      if (result[key] === undefined) return '';
      result = result[key];
    }
    return result;
  }

  public set(path: string, value: any): void {
    const keys = path.split('.');
    let obj = this.settings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
    localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
  }
}

export const appSettings = new AppSettings();
