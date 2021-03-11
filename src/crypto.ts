import { generateKeyPairSync, randomBytes } from 'crypto'
import { existsSync, readFileSync, writeFileSync } from 'fs'

export async function generateAsymmetricKeys() {
  if (existsSync('../keys/private.pem') && existsSync('../keys/public.pem')) return

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

  writeFileSync('../keys/private.pem', privateKey)
  writeFileSync('../keys/public.pem', publicKey)
}

export function generateSymmetricKeys() {
  if (existsSync('../keys/key') && existsSync('../keys/iv')) {
    return
  }

  let key = null // 16 bytes -> 32 chars
  let iv = null // 8 bytes -> 16 chars
  if (!existsSync('../keys/key')) {
    writeFileSync('../keys/key', randomBytes(16).toString('hex'))
  }
  if (!existsSync('../keys/iv')) {
    writeFileSync('../keys/iv', randomBytes(8).toString('hex'))
  }
}

export function getSymmetricKeys(): { key: string; iv: string } {
  return {
    key: readFileSync('../keys/key').toString(),
    iv: readFileSync('../keys/iv').toString(),
  }
}
