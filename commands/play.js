const ytdl = require('ytdl-core')
const yts = require('yt-search')
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
ffmpeg.setFfmpegPath(ffmpegPath)

module.exports = async (sock, m, args, from, sender) => {
  if (!args.length) {
    return sock.sendMessage(from, { text: "❌ Diga o nome da música.\nEx: !play Let it go" }, { quoted: m })
  }

  const search = await yts(args.join(' '))
  const video = search.videos[0]
  if (!video) return sock.sendMessage(from, { text: "❌ Música não encontrada." }, { quoted: m })

  const url = video.url
  const title = video.title
  const filename = `/tmp/${Date.now()}.mp3`

  const stream = ytdl(url, { filter: 'audioonly' })
  ffmpeg(stream)
    .audioBitrate(128)
    .save(filename)
    .on('end', async () => {
      await sock.sendMessage(from, { audio: fs.readFileSync(filename), mimetype: 'audio/mp4' }, { quoted: m })
      fs.unlinkSync(filename)
    })
    .on('error', (err) => {
      sock.sendMessage(from, { text: "❌ Erro ao baixar áudio." }, { quoted: m })
    })
}
