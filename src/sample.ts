import { readdirSync, statSync } from 'fs'
import { resolve, join } from 'path'
import { uploadFileEncrypted } from './ipfs'
const dirPath = resolve(__dirname, '../images')

async function uploadFile(rootPath: string, fileName: string) {
  try {
    const f = resolve(dirPath, fileName)

    const stats = statSync(f)

    const start = process.hrtime()

    await uploadFileEncrypted(f, `${rootPath}/${fileName}`)

    const end = process.hrtime(start)
    console.info('Execution time (hr): %ds %dms', end[0], end[1] / 1000000)
    console.log('file size in MB', stats.size / 1000000)
  } catch (error) {}
}

export async function testing(rootPath = '/') {
  const fileNames = readdirSync(dirPath)

  fileNames.forEach(async (fileName) => {
    if (statSync(dirPath + '/' + fileName).isDirectory()) {
      throw new Error('not implemented sub dir')
    } else {
      await uploadFile(rootPath, fileName)
    }
  })

  // upload to ipfs path
  // await uploadFileEncrypted(file, ipfspath)

  // // download from ipfs path
  // const dl = await downloadFileEncrypted(ipfspath)

  // // to buffer
  // const buff = Buffer.from(dl, 'hex')

  // // save buffer to file
  // const outfile = ipfsreplace(/\//g, '_');
  // console.log('writing:', outfile)
  // writeFile(outfile, buff, function (err) {
  //   if (err) throw err;
  // })
}
