import i18n from 'i18next';
import { appConfig } from './app.settings';
import en from '~/assets/locale/en.json';
import vi from '~/assets/locale/vi.json';

const language = appConfig.general.language;

i18n
  .init({
    lng: language,
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => updateUI());

function updateUI() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = i18n.t(key);
  });
}

export const t = i18n.t;

export default i18n;
