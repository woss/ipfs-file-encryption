import { generateKeyPairSync, randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

export async function generateAsymmetricKeys() {
  const path = resolve(__dirname, '../keys')

  if (existsSync(`${path}/private.pem`) && existsSync(`${path}/public.pem`)) return

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: '',
    },
  })

  writeFileSync(`${path}/private.pem`, privateKey)
  writeFileSync(`${path}/public.pem`, publicKey)
}

export function generateSymmetricKeys() {
  const path = resolve(__dirname, '../keys')

  if (existsSync(`${path}/key`) && existsSync(`${path}/iv`)) {
    return
  }

  let key = null // 16 bytes -> 32 chars
  let iv = null // 8 bytes -> 16 chars
  if (!existsSync(`${path}/key`)) {
    writeFileSync(`${path}/key`, randomBytes(16).toString('hex'))
  }
  if (!existsSync(`${path}/iv`)) {
    writeFileSync(`${path}/iv`, randomBytes(8).toString('hex'))
  }
}

export function getSymmetricKeys(): { key: string; iv: string } {
  const path = resolve(__dirname, '../keys')

  return {
    key: readFileSync(`${path}/key`).toString(),
    iv: readFileSync(`${path}/iv`).toString(),
  }
}

/**
 * Return encrypted HEX string
 * @param buffer
 * @param secretKey
 * @param iv
 * @returns
 */
export function encryptAES(buffer: Buffer, secretKey: string, iv: string): string {
  const cipher = createCipheriv('aes-256-ctr', secretKey, iv)
  const data = cipher.update(buffer)
  const encrypted = Buffer.concat([data, cipher.final()])
  return encrypted.toString('hex')
}

export function decryptAES(buffer: Buffer, secretKey: string, iv: string) {
  const decipher = createDecipheriv('aes-256-ctr', secretKey, iv)
  const data = decipher.update(buffer)
  const decrypted = Buffer.concat([data, decipher.final()])
  return decrypted
}
