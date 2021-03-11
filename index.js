const ipfsClient = require('ipfs-http-client');
const { globSource } = ipfsClient;
const ipfsEndPoint = 'http://localhost:5001'
// const ipfsEndPoint = '/ip4/127.0.0.1/tcp/5001'
const ipfs = ipfsClient(ipfsEndPoint);
const IpfsClusterAPI = require('ipfs-cluster-api')

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cluster = IpfsClusterAPI('localhost', '9094', { protocol: 'http' }) // leaving out the arguments will default to these values

////////////////////////////////
//////////// IPFS //////////////
////////////////////////////////





async function uploadFileEncrypted(file, ipfspath) {
  try {
    const buff = fs.readFileSync(file);
    // const ekey = encryptRSA(key); // 32 chars -> 684 chars
    const ebuff = encryptAES(buff, key, iv);

    const content = Buffer.concat([ // headers: encrypted key and IV (len: 700=684+16)
      // Buffer.from(ekey, 'utf8'),   // char length: 684
      Buffer.from(iv, 'utf8'),     // char length: 16
      Buffer.from(ebuff, 'utf8')
    ])
    // const uploaded = await cluster.add({
    //   path: ipfspath,
    //   content: buff
    // })

    // console.log(uploaded)
    await ipfs.files.write(
      ipfspath,
      // content,
      buff,
      { create: true, parents: true, hashAlg: 'blake2b-256', cidVersion: 1 }
    );

    // console.log('ENCRYPTION --------')
    // // console.log('key:', key, 'iv:', iv, 'ekey:', ekey.length)
    // console.log('key:', key, 'iv:', iv,)
    // console.log('contents:', buff.length, 'encrypted:', ebuff.length)
    // console.log('encrypted is bigger %s times', ebuff.length / buff.length,)
    // console.log(' ')

  } catch (err) {
    console.log(err)
    throw err;
  }
}

async function toArray(asyncIterator) {
  const arr = [];
  for await (const i of asyncIterator) {
    arr.push(i);
  }
  return arr;
}

async function downloadFileEncrypted(ipfspath) {
  console.log('ipfspath', ipfspath);
  try {
    for await (const file of ipfs.ls(ipfspath)) {
      console.log(file)
    }


    let file_data = await ipfs.files.read(ipfspath)
    let edata = []
    for await (const chunk of file_data) { edata.push(chunk) }


    edata = Buffer.concat(edata)

    // const key = decryptRSA(edata.slice(0, 684).toString('utf8'))
    const iv = edata.slice(684, 700).toString('utf8')
    const econtent = edata.slice(700).toString('utf8')
    const ebuf = Buffer.from(econtent, 'hex')
    const content = decryptAES(ebuf, key, iv)

    console.log(' ')
    console.log('DECRYPTION --------')
    console.log('key:', key, 'iv:', iv)
    console.log('contents:', content.length, 'encrypted:', econtent.length)
    console.log('downloaded:', edata.length)

    return content

  } catch (err) {
    console.error(err)
    throw err;
  }
}

async function getUploadedFiles(ipfspath = `${rootFolder}/`) {
  let files = []
  console.log('ipfspath', ipfspath)
  console.log(await toArray(ipfs.ls(ipfspath)))
  const arr = await toArray(ipfs.files.ls(ipfspath))
  for (let file of arr) {
    if (file.type === 'directory') {
      const inner = await getUploadedFiles(ipfspath + file.name + '/')
      files = files.concat(inner)
    } else {
      files.push({
        path: ipfspath + file.name,
        size: file.size,
        cid: file.cid.toString()
      })
    }
  }
  return files
}

function encryptAES(buffer, secretKey, iv) {
  const cipher = crypto.createCipheriv('aes-256-ctr', secretKey, iv);
  const data = cipher.update(buffer);
  const encrypted = Buffer.concat([data, cipher.final()]);
  return encrypted.toString('hex')
}

function decryptAES(buffer, secretKey, iv) {
  const decipher = crypto.createDecipheriv('aes-256-ctr', secretKey, iv);
  const data = decipher.update(buffer)
  const decrypted = Buffer.concat([data, decipher.final()]);
  return decrypted;
}

function generateKeys() {
  if (fs.existsSync('private.pem') && fs.existsSync('public.pem'))
    return;

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
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

  fs.writeFileSync('private.pem', privateKey)
  fs.writeFileSync('public.pem', publicKey)
}

function encryptRSA(toEncrypt, pubkeyPath = 'public.pem') {

  const absolutePath = path.resolve(pubkeyPath)
  const publicKey = fs.readFileSync(absolutePath, 'utf8')
  const buffer = Buffer.from(toEncrypt, 'utf8')
  const encrypted = crypto.publicEncrypt(publicKey, buffer)
  return encrypted.toString('base64')
}

function decryptRSA(toDecrypt, privkeyPath = 'private.pem') {
  const absolutePath = path.resolve(privkeyPath)
  const privateKey = fs.readFileSync(absolutePath, 'utf8')
  const buffer = Buffer.from(toDecrypt, 'base64')
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey.toString(),
      passphrase: '',
    },
    buffer,
  )
  return decrypted.toString('utf8')
}

async function _testing() {
  const dirPath = './images'
  const files = fs.readdirSync(dirPath)
  files.forEach(async (file) => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      throw new Error('not implemented sub dir')
    } else {
      const f = path.join(__dirname, dirPath, "/", file)
      const stats = fs.statSync(f)


      const start = process.hrtime()

      await uploadFileEncrypted(f, `${rootFolder}/${file}`)

      const end = process.hrtime(start)
      console.info('Execution time (hr): %ds %dms', end[0], end[1] / 1000000)
      console.log('file size in MB', stats.size / 1000000);
    }
  })

  // upload to ipfs path
  // await uploadFileEncrypted(file, ipfspath)

  // // download from ipfs path
  // const dl = await downloadFileEncrypted(ipfspath)

  // // to buffer
  // const buff = Buffer.from(dl, 'hex')

  // // save buffer to file
  // const outfile = ipfspath.replace(/\//g, '_');
  // console.log('writing:', outfile)
  // fs.writeFile(outfile, buff, function (err) {
  //   if (err) throw err;
  // })
}
