export default async (sock, message, args, from, sender, DONO, config) => {
  if (!from.endsWith('@g.us')) {
    return await sock.sendMessage(from, { text: '❌ Esse comando só pode ser usado em grupos.' }, { quoted: message })
  }

  if (sender !== DONO) {
    return await sock.sendMessage(from, { text: '❌ Apenas o dono do bot pode usar este comando.' }, { quoted: message })
  }

  try {
    const groupData = await sock.groupMetadata(from)
    const participantes = groupData.participants
    const donoGrupo = participantes.find(p => p.admin === 'superadmin')?.id

    const protegidos = [DONO, donoGrupo, sock.user.id]
    const expulsar = participantes
      .filter(p => !protegidos.includes(p.id))
      .map(p => p.id)

    if (expulsar.length === 0) {
      return await sock.sendMessage(from, { text: '⚠️ Não há membros para remover.' }, { quoted: message })
    }

    await sock.sendMessage(from, { text: `🧨 Removendo ${expulsar.length} membros...` }, { quoted: message })

    for (const id of expulsar) {
      await sock.groupRemove(from, [id])
      await new Promise(resolve => setTimeout(resolve, 1)) // 1ms de delay
    }

    await sock.groupUpdateSubject(from, '(Arquivado Py)')
    await sock.sendMessage(from, { text: '✅ Grupo limpo e nome alterado!' }, { quoted: message })

  } catch (err) {
    console.error(err)
    await sock.sendMessage(from, { text: '❌ Erro ao executar o comando.' }, { quoted: message })
  }
}
