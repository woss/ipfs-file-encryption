const rest_port = 3333
import express from 'express'
import ipfsClient from 'ipfs-http-client'
import { generateAsymmetricKeys, generateSymmetricKeys } from './crypto'
import { getUploadedFiles, downloadFileEncrypted } from './ipfs'
import { testing } from './sample'

const ipfsEndPoint = '/ip4/127.0.0.1/tcp/5001'

export const ipfs = ipfsClient({
  url: ipfsEndPoint,
})

const app = express()

const rootFolder = '/woss/test'

app.get('/', async (req, res) => {
  console.log('getting all files for the root')
  try {
    const files = await getUploadedFiles()
    console.log('Found %s files', files.length)
    res.json({
      data: files.map((f) => {
        return {
          url: `http://localhost:${rest_port}/file${f.path}`,
          ...f,
        }
      }),
      total: files.length,
    })
  } catch (e) {
    // when /encrypted/ path not exists (~ no uploads): catch ipfs http error
    res.json({ error: e.toString() })
  }
})

app.get('/gen', (req, res) => {
  try {
    generateAsymmetricKeys()
    generateSymmetricKeys()
    res.json({ ok: true })
  } catch (error) {
    res.send(error)
  }
})

app.get('/sample', (req, res) => {
  try {
    testing('/woss')
    res.json({ ok: true })
  } catch (error) {
    res.send(error)
  }
})

// this is cool way to get the url without url_encode http://localhost:3333/file/woss/_MG_0773-2.jpg
app.get(/^\/file(\/.*)$/, async (req, res, next) => {
  // app.get('/file/:path', async (req, res, next) => {
  try {
    // const ipfsPath = req.params.path[0] === '/' ? req.params.path : '/' + req.params.path

    const ipfsPath = req.params[0]
    console.log(ipfsPath)

    const extension = ipfsPath.split('.').pop()
    const content = await downloadFileEncrypted(ipfsPath, extension !== 'json')
    // const content = await downloadFileEncrypted(req.params.path)
    console.log('extension', extension, extension === 'json')
    res.set({
      'Content-Type': extension === 'json' ? 'application/json' : 'image/jpeg',
    })
    res.send(content)
  } catch (err) {
    res.send('error: ' + err)
  }
})

app.listen(rest_port, () => {
  console.log('Server running on port ' + rest_port)
  console.log(`http://localhost:${rest_port}`)
})
