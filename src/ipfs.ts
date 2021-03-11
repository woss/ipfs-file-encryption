import { toArray } from './utils'
import { ipfs } from './app'

export async function getUploadedFiles(ipfspath = '/'): Promise<any[]> {
  let files: any[] = []
  console.log('ipfspath', ipfspath)
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
