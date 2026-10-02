/**
 * i18n Initialization
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { defaultLanguage, languageCodes } from './config.js';
import en from '../../locales/en.json';

const resources = {
  en: { translation: en },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: defaultLanguage,
    supportedLngs: languageCodes,
    defaultNS: 'translation',
    ns: ['translation'],
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: { escapeValue: false },
    saveMissing: false,
    debug: import.meta.env.DEV,
  });

export default i18n;
