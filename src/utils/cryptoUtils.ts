import crypto from 'crypto';

// Use environment variable for encryption key, with fallback for development
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!';
const ALGORITHM = 'aes-256-cbc';

// Ensure the key is exactly 32 bytes for AES-256
const getKey = (): Buffer => {
  if (ENCRYPTION_KEY.length === 32) {
    return Buffer.from(ENCRYPTION_KEY);
  }
  // Hash the key to ensure it's exactly 32 bytes
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
};

/**
 * Encrypt a string (API key or secret)
 */
export function encryptApiCredential(text: string): string {
  try {
    const key = getKey();
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine IV and encrypted data
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt API credential');
  }
}

/**
 * Decrypt a string (API key or secret)
 */
export function decryptApiCredential(encryptedText: string): string {
  try {
    const key = getKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt API credential');
  }
}

/**
 * Mask an API credential for display (show first 8 chars + ***)
 */
export function maskApiCredential(credential: string): string {
  if (!credential || credential.length <= 8) {
    return '***';
  }
  return credential.substring(0, 8) + '***';
}

/**
 * Check if a string appears to be encrypted (has IV:data format)
 */
export function isEncrypted(text: string): boolean {
  return text.includes(':') && text.split(':').length === 2;
}