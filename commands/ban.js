export default async (sock, message, args, from, sender, DONO) => {
  if (!from.endsWith('@g.us')) {
    return await sock.sendMessage(from, { text: '❌ Só em grupos.' }, { quoted: message })
  }

  const groupMetadata = await sock.groupMetadata(from)
  const isAdmin = groupMetadata.participants
    .find(p => p.id === sender)?.admin !== null

  const isDono = sender === DONO

  if (!isAdmin && !isDono) {
    return await sock.sendMessage(from, { text: '❌ Apenas administradores ou o dono do bot podem usar esse comando.' }, { quoted: message })
  }

  const mentions = message.message.extendedTextMessage?.contextInfo?.mentionedJid || []
  if (mentions.length === 0) {
    return await sock.sendMessage(from, { text: '❌ Marque quem deseja banir.' }, { quoted: message })
  }

  for (const user of mentions) {
    try {
      await sock.groupRemove(from, [user])
    } catch (err) {
      console.error(`Erro ao banir ${user}`, err)
    }
  }

  await sock.sendMessage(from, { text: '✅ Usuário(s) removido(s).' }, { quoted: message })
}
