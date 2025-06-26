const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.resolve(__dirname, 'botdata.sqlite')

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar no banco:', err)
  } else {
    console.log('Conectado ao banco SQLite')
  }
})

// Cria tabela de exemplo para usuários favoritos (pode mudar depois)
db.run(`
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    favorite TEXT NOT NULL
  )
`)

module.exports = {
  addFavorite: (userId, favorite, callback) => {
    const stmt = db.prepare('INSERT INTO favorites (user_id, favorite) VALUES (?, ?)')
    stmt.run(userId, favorite, callback)
    stmt.finalize()
  },
  getFavorites: (userId, callback) => {
    db.all('SELECT favorite FROM favorites WHERE user_id = ?', [userId], (err, rows) => {
      callback(err, rows)
    })
  }
}
