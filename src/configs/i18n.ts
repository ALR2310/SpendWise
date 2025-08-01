import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '~/assets/locale/en.json';
import vi from '~/assets/locale/vi.json';

import { appSettings } from './settings';

const currLang = appSettings.general.language;

i18n.use(initReactI18next).init({
  lng: currLang,
  fallbackLng: 'vi',
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
