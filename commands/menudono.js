export default async (sock, message, args, from, sender, DONO, config) => {
  if (sender !== DONO) {
    return await sock.sendMessage(from, { text: '❌ Apenas o dono do bot pode acessar este menu.' }, { quoted: message })
  }

  await sock.sendMessage(from, {
    text: `👑 Menu do ${config.NickDono}`,
    buttons: [
      { buttonId: 'botao_status', buttonText: { displayText: '📶 Status' }, type: 1 },
      { buttonId: 'botao_reiniciar', buttonText: { displayText: '🔄 Reiniciar' }, type: 1 },
      { buttonId: 'botao_logs', buttonText: { displayText: '📄 Logs' }, type: 1 }
    ],
    headerType: 1
  }, { quoted: message })
}
