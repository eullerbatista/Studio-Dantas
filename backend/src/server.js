const express = require('express');
const bodyParser = require('body-parser');
const { oauth2Client, getAuthUrl, getTokens, loginClient, loginAdmin, checkRole } = require('./middleware/auth');
const { google } = require('googleapis');

const app = express();
app.use(bodyParser.json());

// 🔹 Login de cliente (via telefone)
app.post('/login-client', (req, res) => {
  const { phone } = req.body;
  const token = loginClient(phone);
  res.json({ token });
});

// 🔹 Login da admin (via Google OAuth)
app.get('/auth/google', (req, res) => {
  res.redirect(getAuthUrl());
});

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  const tokens = await getTokens(code);
  const jwtToken = loginAdmin(tokens);
  res.json({ token: jwtToken });
});

// 🔹 Rotas protegidas

// Clientes acessam agendamentos
app.get('/agendamentos', checkRole('client'), (req, res) => {
  res.json({ msg: 'Lista de agendamentos do cliente' });
});

// Admin acessa eventos do Google Calendar
app.get('/calendar-events', checkRole('admin'), async (req, res) => {
  oauth2Client.setCredentials(req.user.googleTokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const events = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  res.json(events.data.items);
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
