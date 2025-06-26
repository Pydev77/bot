module.exports = async (sock, message, args, from, sender) => {
  await sock.sendMessage(from, { text: 'Pong!' }, { quoted: message })
}
