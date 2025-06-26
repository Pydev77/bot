import fs from 'fs';
import path from 'path';

const filePath = path.join('./database/mutados.json');

export default async (sock, message, args, from, sender, DONO) => {
  if (!from.endsWith('@g.us')) {
    return await sock.sendMessage(from, { text: '❌ Só pode usar em grupos.' }, { quoted: message });
  }

  const groupMetadata = await sock.groupMetadata(from);
  const senderIsAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin !== null;
  const isDono = sender === DONO;

  if (!senderIsAdmin && !isDono) {
    return await sock.sendMessage(from, { text: '❌ Somente administradores ou o dono podem usar este comando.' }, { quoted: message });
  }

  try {
    const participantes = groupMetadata.participants;

    // Filtra os membros que não são admins nem o dono do bot
    const mutados = participantes
      .filter(p => {
        const isAdmin = p.admin !== null;
        return !isAdmin && p.id !== DONO && p.id !== sock.user.id;
      })
      .map(p => p.id);

    // Lê o arquivo existente ou cria um novo
    let dados = [];
    if (fs.existsSync(filePath)) {
      dados = JSON.parse(fs.readFileSync(filePath));
    }

    // Atualiza ou adiciona os mutados do grupo
    const grupo = dados.find(d => d.gpid === from);
    if (grupo) {
      grupo.mutados = mutados;
    } else {
      dados.push({ gpid: from, mutados });
    }

    // Salva o JSON
    fs.writeFileSync(filePath, JSON.stringify(dados, null, 2));

    await sock.sendMessage(from, { text: `🔇 ${mutados.length} membros foram marcados como mutados.` }, { quoted: message });
  } catch (err) {
    console.error(err);
    await sock.sendMessage(from, { text: '❌ Erro ao mutar os membros.' }, { quoted: message });
  }
};
