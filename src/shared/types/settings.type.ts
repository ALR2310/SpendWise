export enum THEME {
  SYSTEM = 'system',
  LIGHT = 'light',
  DARK = 'dark',
  CUPCAKE = 'cupcake',
  GARDEN = 'garden',
  DRACULA = 'dracula',
}

export enum PAGE {
  SPENDING = 'expenses',
  STATISTICS = 'statistics',
  NOTES = 'notes',
  SETTINGS = 'settings',
}

export enum LANGUAGE {
  VI = 'vi',
  EN = 'en',
}

interface SpendPageConfigs {
  name: PAGE.SPENDING;
  list: string;
  sort: string;
}

interface StatsPageConfigs {
  name: PAGE.STATISTICS;
}

interface NotePageConfigs {
  name: PAGE.NOTES;
}

interface SettingPageConfigs {
  name: PAGE.SETTINGS;
}

export interface AppSettings {
  general: {
    defaultPage: PAGE;
    language: LANGUAGE;
    notification: boolean;
    autoUpdate: boolean;
    theme: THEME;
    version: string;
  };
  pages: {
    spending: SpendPageConfigs;
    statistics: StatsPageConfigs;
    notes: NotePageConfigs;
    settings: SettingPageConfigs;
  };
  data: {
    fileId: string;
    dateBackup: string;
    dateSync: string;
  };
  version: number;
}
