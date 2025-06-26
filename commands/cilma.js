require('dotenv').config()
const axios = require('axios')

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY

module.exports = async (sock, message, args, from, sender) => {
  if (!args.length) {
    return await sock.sendMessage(from, { text: 'Use: !clima <cidade> (ex: !clima São Paulo)' }, { quoted: message })
  }

  const city = args.join(' ')

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`
    const response = await axios.get(url)
    const data = response.data

    const weatherDesc = data.weather[0].description
    const temp = data.main.temp
    const feelsLike = data.main.feels_like
    const humidity = data.main.humidity

    const reply = `🌤️ Tempo em *${data.name}*:\n` +
                  `Descrição: ${weatherDesc}\n` +
                  `Temperatura: ${temp}°C\n` +
                  `Sensação térmica: ${feelsLike}°C\n` +
                  `Umidade: ${humidity}%`

    await sock.sendMessage(from, { text: reply }, { quoted: message })

  } catch (error) {
    console.error(error)
    await sock.sendMessage(from, { text: 'Não consegui encontrar a cidade. Tente novamente.' }, { quoted: message })
  }
}
