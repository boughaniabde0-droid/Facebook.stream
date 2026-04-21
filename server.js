const express = require('express')
const cors = require('cors')
const { spawn } = require('child_process')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

let streams = {}

app.get('/', (req,res)=>{
    res.sendFile(path.join(__dirname,'public/index.html'))
})

app.post('/start', (req, res) => {
    const { name, url, streamKey } = req.body

    if (!url || !streamKey) {
        return res.status(400).json({ error: 'Missing data' })
    }

    const id = Date.now()

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-i', url,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-f', 'flv',
        streamKey
    ])

    ffmpeg.stderr.on('data', data => {
        console.log(data.toString())
    })

    ffmpeg.on('close', () => {
        delete streams[id]
        console.log("Stream stopped")
    })

    streams[id] = { name, process: ffmpeg }

    res.json({ success: true, id })
})

app.post('/stop/:id', (req, res) => {
    if (streams[req.params.id]) {
        streams[req.params.id].process.kill('SIGINT')
        delete streams[req.params.id]
    }
    res.json({ success: true })
})

app.get('/streams', (req, res) => {
    res.json(streams)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log("🔥 Running on " + PORT))
