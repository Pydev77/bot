export default async (sock, message, args, from, sender, DONO) => {
  if (!from.endsWith('@g.us')) {
    return await sock.sendMessage(from, { text: '❌ Só pode usar esse comando em grupos.' }, { quoted: message })
  }

  if (sender !== DONO) {
    return await sock.sendMessage(from, { text: '❌ Apenas o dono do bot pode usar esse comando.' }, { quoted: message })
  }

  try {
    await sock.groupSettingUpdate(from, 'not_announcement')
    await sock.sendMessage(from, { text: '🔊 Grupo desbloqueado para todos!' }, { quoted: message })
  } catch (err) {
    console.error(err)
    await sock.sendMessage(from, { text: '❌ Erro ao desbloquear o grupo.' }, { quoted: message })
  }
}
