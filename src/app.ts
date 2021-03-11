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
    res.json({ data: files, total: files.length })
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
    testing()
    res.json({ ok: true })
  } catch (error) {
    res.send(error)
  }
})

app.get('/file/:path', async (req, res, next) => {
  try {
    let ipfspath = req.params.path[0] === '/' ? req.params.path : '/' + req.params.path
    //  ipfspath = req.params[0]
    // ipfspath = req.params.path

    const content = await downloadFileEncrypted(ipfspath)
    res.set({
      'Content-Type': 'image/jpeg',
    })
    res.send(content)
  } catch (err) {
    res.send('error: ' + err)
  }
})

// app.get('/test', (req, res) => {
//   try {
//     _testing()
//     res.json({ ok: true })
//   } catch (error) {
//     res.send(error)
//   }
// })

// app.get('/status', async (req, res) => {
//   res.json({
//     cluster: {
//       health: await cluster.health.graph(),
//     },
//   })
// })

app.listen(rest_port, () => {
  console.log('Server running on port ' + rest_port)
  console.log(`http://localhost:${rest_port}`)
})
