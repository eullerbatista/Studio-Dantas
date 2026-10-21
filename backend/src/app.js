// Servidor local: node src/app.js
import app from "./api.js"
import { loadStoredRefreshToken } from "./googleCalendar.js"

await loadStoredRefreshToken()

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
