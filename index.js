import * as baileys from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import qrcode from 'qrcode-terminal'
import config from './config/config.json' assert { type: 'json' }
import { fileURLToPath } from 'url'

const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🟢 Iniciando o arquivo index.js...')

const startBot = async () => {
  console.log('📡 Entrou na função startBot')

  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'info' }),
    printQRInTerminal: false,
    auth: state
  })

  console.log(`✅ Socket criado! Aguardando conexão... 🤖 ${config.NomeDoBot}`)

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('📲 Escaneie este QR Code para conectar:')
      qrcode.generate(qr, { small: true })
    }

    console.log('🔄 Status da conexão:', connection)

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) {
        console.log('🧠 Tentando reconectar...')
        startBot()
      } else {
        console.log('🔌 Desconectado. Faça login novamente.')
      }
    } else if (connection === 'open') {
      console.log(`✅ Conectado com sucesso! BOT: ${config.NomeDoBot}`)
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    const m = messages[0]
    if (!m.message || m.key.fromMe) return

    const from = m.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const sender = isGroup ? m.key.participant : from

    // Botões
    if (m.message.buttonsResponseMessage) {
      if (sender !== config.NumeroDoDono) return
      const btn = m.message.buttonsResponseMessage.selectedButtonId
      if (btn === 'botao_status') await sock.sendMessage(from, { text: '🤖 Bot está rodando normalmente!' })
      else if (btn === 'botao_reiniciar') { await sock.sendMessage(from, { text: '🔄 Reiniciando...' }); process.exit(0) }
      else if (btn === 'botao_logs') await sock.sendMessage(from, { text: '📄 Logs: (adicione aqui sua lógica)' })
      else await sock.sendMessage(from, { text: 'Opção inválida.' })
      return
    }

    // Comandos
    const msg = m.message.conversation || m.message.extendedTextMessage?.text || ''
    if (msg.startsWith(config.prefixo)) {
      const [command, ...args] = msg.slice(config.prefixo.length).trim().split(/\s+/)
      const cmdPath = path.join(__dirname, 'commands', `${command}.js`)
      if (fs.existsSync(cmdPath)) {
        try {
          const { default: run } = await import(`file://${cmdPath}`)
          await run(sock, m, args, from, sender, config.NumeroDoDono, config)
        } catch (err) {
          console.error(err)
          await sock.sendMessage(from, { text: '❌ Erro ao executar o comando.' }, { quoted: m })
        }
      }
    }
  })
}

startBot()
console.log('⚙️ Chamou a função startBot')
