const ENCRYPTION_PASSPHRASE = 'antz-web-dashboard-2024-secure-key'
const SALT = 'antz_salt_v1'

// Check if crypto.subtle is available (requires secure context: HTTPS or localhost)
const isSecureContext = () => {
  try {
    return typeof window !== 'undefined' && window.isSecureContext && !!crypto?.subtle
  } catch {
    return false
  }
}

// ─── Fallback encoding (Base64 obfuscation for non-secure contexts) ───

const fallbackEncode = value => {
  try {
    return btoa(encodeURIComponent(value))
  } catch (error) {
    console.warn('Fallback encode failed:', error)

    return null
  }
}

const fallbackDecode = encodedValue => {
  try {
    return decodeURIComponent(atob(encodedValue))
  } catch (error) {
    console.warn('Fallback decode failed:', error)

    return null
  }
}

// ─── Secure encryption (AES-256-GCM via Web Crypto API) ───

// Derive AES-GCM key from passphrase using PBKDF2
const deriveKey = async () => {
  try {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(ENCRYPTION_PASSPHRASE), 'PBKDF2', false, [
      'deriveKey'
    ])

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(SALT),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  } catch (error) {
    console.error('Key derivation failed:', error)

    return null
  }
}

// Encrypt a string value — AES-GCM if secure context, Base64 fallback otherwise
export const encrypt = async value => {
  try {
    // Fallback: Base64 obfuscation for non-secure contexts (HTTP + IP)
    if (!isSecureContext()) {
      console.warn('Non-secure context: using Base64 obfuscation instead of AES encryption')

      return fallbackEncode(value)
    }

    // Secure: AES-256-GCM encryption
    const key = await deriveKey()
    if (!key) return fallbackEncode(value)

    const encoder = new TextEncoder()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(value))

    // Combine IV + ciphertext and base64 encode
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Encryption failed, using fallback:', error)

    // Last resort fallback
    return fallbackEncode(value)
  }
}

// Decrypt a string value — tries AES-GCM first, falls back to Base64
export const decrypt = async encryptedValue => {
  try {
    // Fallback: Base64 decode for non-secure contexts
    if (!isSecureContext()) {
      return fallbackDecode(encryptedValue)
    }

    // Secure: AES-256-GCM decryption
    const key = await deriveKey()
    if (!key) return fallbackDecode(encryptedValue)

    const combined = Uint8Array.from(atob(encryptedValue), c => c.charCodeAt(0))

    // Extract IV (first 12 bytes) and ciphertext (rest)
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)

    return new TextDecoder().decode(decrypted)
  } catch (error) {
    // AES decryption failed — try Base64 fallback (data may have been stored in non-secure context)
    try {
      const fallbackResult = fallbackDecode(encryptedValue)
      if (fallbackResult) return fallbackResult
    } catch {
      // Both methods failed
    }

    console.error('Decryption failed:', error)

    return null
  }
}

// ─── Encrypted localStorage helpers ───

export const setEncryptedItem = async (key, value) => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
    const encrypted = await encrypt(stringValue)
    if (encrypted) {
      localStorage.setItem(key, encrypted)
    }
  } catch (error) {
    console.error('setEncryptedItem failed:', error)
  }
}

export const getEncryptedItem = async key => {
  try {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) return null

    const decrypted = await decrypt(encrypted)

    return decrypted
  } catch (error) {
    console.error('getEncryptedItem failed:', error)

    return null
  }
}

// ─── Encrypted cookie helpers ───

export const setEncryptedCookie = async (key, value, maxAgeDays = 365) => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
    const encrypted = await encrypt(stringValue)
    if (encrypted) {
      const encodedValue = encodeURIComponent(encrypted)
      document.cookie = `${key}=${encodedValue};max-age=${maxAgeDays * 86400};path=/;SameSite=Strict`
    }
  } catch (error) {
    console.error('setEncryptedCookie failed:', error)
  }
}

export const getEncryptedCookie = async key => {
  try {
    const cookies = document.cookie.split(';')
    const cookie = cookies.find(c => c.trim().startsWith(`${key}=`))
    if (!cookie) return null

    const encodedValue = cookie.split('=').slice(1).join('=').trim()
    const encrypted = decodeURIComponent(encodedValue)
    const decrypted = await decrypt(encrypted)

    return decrypted
  } catch (error) {
    console.error('getEncryptedCookie failed:', error)

    return null
  }
}

export const removeEncryptedCookie = key => {
  document.cookie = `${key}=;max-age=0;path=/`
}
