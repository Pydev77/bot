import * as baileys from '@whiskeysockets/baileys'
import pino from 'pino'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import qrcode from 'qrcode-terminal'

dotenv.config()

const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🟢 Iniciando o bot...')

const startBot = async () => {
  try {
    console.log('📡 Inicializando autenticação...')
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth'))

    console.log('📡 Buscando versão mais recente do WhatsApp Web...')
    const { version } = await fetchLatestBaileysVersion()
    console.log('📦 Versão do WhatsApp Web:', version)

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'info' }),
      auth: state,
      browser: ['Ubuntu', 'Chrome', '22.0'] // Pode personalizar isso se quiser
    })

    sock.ev.on('creds.update', saveCreds)

    const DONO = process.env.DONO || '5511999999999@c.us'
    const PREFIXO = process.env.PREFIXO || '!'

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return
      const m = messages[0]
      if (!m.message || m.key.fromMe) return

      const from = m.key.remoteJid
      const isGroup = from.endsWith('@g.us')
      const sender = isGroup ? m.key.participant : from

      const msg = m.message.conversation || m.message.extendedTextMessage?.text || ''
      const trimmedMsg = msg.trim()

      // COMANDOS SEM PREFIXO: abrir/fechar grupo com 'a' e 'f'
      if (isGroup && (trimmedMsg === 'a' || trimmedMsg === 'f')) {
        try {
          const groupMetadata = await sock.groupMetadata(from)
          const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id)

          if (!admins.includes(sender)) return // só admins podem usar

          if (trimmedMsg === 'a') {
            await sock.groupSettingUpdate(from, 'not_announcement') // abre o grupo
            await sock.sendMessage(from, { text: '✅ Grupo aberto para todos enviarem mensagens.' })
          } else if (trimmedMsg === 'f') {
            await sock.groupSettingUpdate(from, 'announcement') // fecha o grupo
            await sock.sendMessage(from, { text: '🔒 Grupo fechado: apenas admins podem enviar mensagens.' })
          }
        } catch (err) {
          console.error('Erro ao atualizar grupo:', err)
        }
        return
      }

      // COMANDOS COM PREFIXO
      if (!msg.startsWith(PREFIXO)) return

      const [command, ...args] = msg.slice(PREFIXO.length).trim().split(/\s+/)
      const commandPath = path.join(__dirname, 'commands', `${command}.js`)

      if (fs.existsSync(commandPath)) {
        try {
          const run = (await import(`./commands/${command}.js`)).default
          await run(sock, m, args, from, sender, DONO)
        } catch (err) {
          console.error(err)
          await sock.sendMessage(from, { text: '❌ Erro ao executar o comando.' }, { quoted: m })
        }
      }
    })

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        console.log('📲 Escaneie o QR Code abaixo para conectar seu número:')
        qrcode.generate(qr, { small: true })
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
        if (shouldReconnect) {
          console.log('🔁 Reconectando...')
          startBot()
        } else {
          console.log('🔌 Desconectado. Faça login novamente.')
        }
      } else if (connection === 'open') {
        console.log('✅ Conectado com sucesso!')
      }
    })
  } catch (error) {
    console.error('❌ Erro no startBot:', error)
  }
}

startBot()
console.log('⚙️ Bot iniciado e função startBot chamada')
