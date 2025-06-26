module.exports = async (sock, m, args, from, sender) => {
  if (!from.endsWith('@g.us')) return;
  const metadata = await sock.groupMetadata(from);
  const members = metadata.participants.map(p => `• @${p.id.split('@')[0]}`).join('\\n');
  const message = `👥 Membros do grupo:\\n\\n${members}`;
  await sock.sendMessage(from, { text: message, mentions: metadata.participants.map(p => p.id) }, { quoted: m });
};
