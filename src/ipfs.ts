import { toArray } from './utils'
import { ipfs } from './app'
import { readFileSync } from 'fs'
import { decryptAES, encryptAES, getSymmetricKeys } from './crypto'

export async function getUploadedFiles(ipfspath = '/'): Promise<any[]> {
  console.log('Getting uploaded files for the path', ipfspath)
  let files: any[] = []
  const arr = await toArray(ipfs.files.ls(ipfspath))
  for (let file of arr) {
    if (file.type === 'directory') {
      const inner = await getUploadedFiles(ipfspath + file.name + '/')
      files = files.concat(inner)
    } else {
      files.push({
        path: ipfspath + file.name,
        size: file.size,
        cid: file.cid.toString(),
      })
    }
  }
  return files
}

export async function uploadFileEncrypted(localPath: string, ipfspath: string) {
  try {
    const { key, iv } = getSymmetricKeys()
    const fileBuffer = readFileSync(localPath)
    // const ekey = encryptRSA(key); // 32 chars -> 684 chars
    const encryptedHexString = encryptAES(fileBuffer, key, iv)

    const content = Buffer.concat([
      // headers: encrypted key and IV (len: 700=684+16)
      // Buffer.from(ekey, 'utf8'),   // char length: 684
      Buffer.from(iv, 'utf8'), // char length: 16
      Buffer.from(encryptedHexString, 'utf8'),
    ])
    // const uploaded = await cluster.add({
    //   path: ipfspath,
    //   content: buff
    // })

    // console.log(uploaded)
    await ipfs.files.write(
      ipfspath,
      content,
      // fileBuffer,
      { create: true, parents: true, hashAlg: 'blake2b-256', cidVersion: 1 },
    )

    // console.log('ENCRYPTION --------')
    // // console.log('key:', key, 'iv:', iv, 'ekey:', ekey.length)
    // console.log('key:', key, 'iv:', iv,)
    // console.log('contents:', buff.length, 'encrypted:', ebuff.length)
    // console.log('encrypted is bigger %s times', ebuff.length / buff.length,)
    // console.log(' ')
  } catch (err) {
    console.log(err)
    throw err
  }
}

export async function downloadFileEncrypted(ipfspath: string) {
  try {
    console.log('Downloading file for the path %s', ipfspath)

    const { key } = getSymmetricKeys()

    // for await (const file of ipfs.ls(ipfspath)) {
    //   console.log(file)
    // }
    const readStart = process.hrtime()
    let file_data = ipfs.files.read(ipfspath)
    let edata = []
    for await (const chunk of file_data) {
      edata.push(chunk)
    }
    const readEnd = process.hrtime(readStart)

    const encBuffer = Buffer.concat(edata)

    // const key = decryptRSA(edata.slice(0, 684).toString())
    // const iv = encBuffer.slice(684, 700).toString()

    const iv = encBuffer.slice(0, 16).toString()
    // 16 because we are adding only one header
    const econtent = encBuffer.slice(16).toString()

    const ebuf = Buffer.from(econtent, 'hex')

    const decryptStart = process.hrtime()
    const content = decryptAES(ebuf, key, iv)
    const decryptEnd = process.hrtime(decryptStart)

    console.log(' ')
    console.log('DECRYPTION --------')
    console.log('key:', key, 'iv:', iv)
    console.log('contents:', content.length, 'encrypted:', econtent.length)
    console.log('downloaded:', edata.length)
    console.log('reading took %s sec %s ms', readEnd[0], readEnd[1] / 1000000)
    console.log('decrypting took %s sec %s ms', decryptEnd[0], decryptEnd[1] / 1000000)

    return content
  } catch (err) {
    console.error(err)
    throw err
  }
}
