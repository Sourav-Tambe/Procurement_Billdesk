/**
 * IndexedDB-based translation cache.
 * Web equivalent of mobile app's expo-file-system caching in /Document/locales/{lang}/
 *
 * Uses IndexedDB instead of localStorage because:
 * - localStorage limit: ~5 MB (UTF-16 doubles size, effective ~2.5 MB)
 * - 16K translation keys in Unicode (hi/ta/te) = ~1.8 MB → too close to limit
 * - IndexedDB limit: 50-100+ MB → no issues
 */

const DB_NAME = 'i18n_cache'
const DB_VERSION = 1
const STORE_NAME = 'translations'

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'))

      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = event => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

const dbPut = async (key, value) => {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).put(value, key)

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

const dbGet = async key => {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const request = tx.objectStore(STORE_NAME).get(key)

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close()
      resolve(request.result ?? null)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

const dbClear = async () => {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).clear()

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export const cacheTranslations = async (lang, translations) => {
  try {
    await dbPut(`${lang}_translations`, translations)
  } catch (e) {
    console.warn('Failed to cache translations:', e)
  }
}

export const cacheFormats = async (lang, formats) => {
  try {
    await dbPut(`${lang}_formats`, formats)
  } catch (e) {
    console.warn('Failed to cache formats:', e)
  }
}

export const getCachedTranslations = async lang => {
  try {
    return await dbGet(`${lang}_translations`)
  } catch {
    return null
  }
}

export const getCachedFormats = async lang => {
  try {
    return await dbGet(`${lang}_formats`)
  } catch {
    return null
  }
}

/**
 * Clear all cached translations and formats.
 * Called on logout — mirrors mobile app's clearLocaleDirectoryContent()
 */
export const clearTranslationCache = async () => {
  try {
    await dbClear()
  } catch (e) {
    console.warn('Failed to clear translation cache:', e)
  }
}
