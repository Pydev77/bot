const db = require('../database')

module.exports = async (sock, message, args, from, sender) => {
  db.getFavorites(sender, async (err, rows) => {
    if (err) {
      console.error(err)
      return await sock.sendMessage(from, { text: 'Erro ao buscar seus favoritos.' }, { quoted: message })
    }

    if (!rows.length) {
      return await sock.sendMessage(from, { text: 'Você ainda não tem cidades favoritas.' }, { quoted: message })
    }

    const favs = rows.map(r => `- ${r.favorite}`).join('\n')
    await sock.sendMessage(from, { text: `Suas cidades favoritas:\n${favs}` }, { quoted: message })
  })
}
