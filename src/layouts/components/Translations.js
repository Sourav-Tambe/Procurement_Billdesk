import { useTranslation } from 'react-i18next'

/**
 * Converts a navigation title to a snake_case key.
 * e.g. "Egg Module" → "egg_module", "Doctors & Staffs" → "doctors_and_staffs"
 */
const toSnakeCase = str =>
  str
    .replace(/&/g, 'and')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase()

const Translations = ({ text }) => {
  const { t } = useTranslation()
  const key = toSnakeCase(text)

  return <>{t(`navigation.${key}`, { defaultValue: text })}</>
}

export default Translations
