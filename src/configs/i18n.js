// procure-web-lite: English only, no translation server
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
if (!i18n.isInitialized) i18n.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', resources: { en: { translation: { filter: 'Filter', clear_all: 'Clear All', apply_filter: 'Apply Filter', select_all: 'Select All', no_data_found: 'No data found' } } }, interpolation: { escapeValue: false }, react: { useSuspense: false } })
export default i18n
