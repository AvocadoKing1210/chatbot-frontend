/**
 * Simple encryption utilities for database connection strings
 * Uses Web Crypto API for client-side encryption
 */

// Generate a key from user ID (deterministic but secure)
async function generateKey(userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`db-conn-key-${userId}`)
  
  // Create a hash of the user ID to use as key material
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // Import the hash as a key
  return await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt a connection string using the user's ID as key material
 */
export async function encryptConnectionString(
  connectionString: string, 
  userId: string
): Promise<string> {
  try {
    const key = await generateKey(userId)
    const encoder = new TextEncoder()
    const data = encoder.encode(connectionString)
    
    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt connection string')
  }
}

/**
 * Decrypt a connection string using the user's ID as key material
 */
export async function decryptConnectionString(
  encryptedString: string, 
  userId: string
): Promise<string> {
  try {
    const key = await generateKey(userId)
    
    // Convert from base64
    const combined = new Uint8Array(
      atob(encryptedString).split('').map(char => char.charCodeAt(0))
    )
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )
    
    // Convert back to string
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt connection string')
  }
}

/**
 * Test if encryption/decryption works for the current user
 */
export async function testEncryption(userId: string): Promise<boolean> {
  try {
    const testString = 'test-connection-string'
    const encrypted = await encryptConnectionString(testString, userId)
    const decrypted = await decryptConnectionString(encrypted, userId)
    return decrypted === testString
  } catch (error) {
    console.error('Encryption test failed:', error)
    return false
  }
}
