<p align="center">
  <img src="frontend/src/assets/logo-curvas.svg" alt="Studio Dantas Lash Beauty" width="360" />
</p>

<p align="center">
  Sistema de agendamento online e gestão para o salão <strong>Studio Dantas · Lash Beauty</strong>.<br />
  Projeto Integrador II (PI2).
</p>

<p align="center">
  <img alt="Vue" src="https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white" />
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-24-5fa04e?logo=nodedotjs&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase&logoColor=white" />
  <img alt="Google Calendar" src="https://img.shields.io/badge/Google-Calendar-4285f4?logo=googlecalendar&logoColor=white" />
</p>

---

## Sobre o projeto

O Studio Dantas recebia os pedidos de horário por mensagem e controlava a agenda à mão. Este sistema permite que as clientes escolham um serviço e marquem um horário livre pelo site. A proprietária confirma, remarca e acompanha tudo em um painel, com a agenda sincronizada ao Google Calendar.

## Funcionalidades

### Para as clientes
- **Catálogo de serviços** por categoria: Mãos & Pés, Cabelos e Olhos & Sobrancelhas.
- **Acesso com telefone e senha:** no primeiro acesso a cliente informa nome, e-mail e cria uma senha. A sessão fica salva no aparelho por 60 dias, e trocar a senha encerra as sessões abertas em outros aparelhos.
- **Esqueci minha senha:** a cliente recebe por e-mail (enviado pelo Gmail da proprietária) um link válido por 1 hora para criar uma nova senha.
- **Agendamento** com os horários realmente livres. O sistema considera o horário de funcionamento, o almoço, os dias de folga e a duração do serviço.
- **Meus agendamentos:** consulta dos horários marcados e do status de cada um.
- **Contato rápido** pelo menu: WhatsApp, Instagram e localização no Google Maps.

### Para a proprietária (painel administrativo)
- **Login com Google**, restrito ao e-mail configurado em `ADMIN_EMAIL`.
- **Agendamentos:** confirmar, remarcar e excluir. Toda alteração é refletida no Google Calendar.
- **Clientes:** editar e excluir.
- **Serviços:** criar, editar, desativar e reativar, com categoria, duração e preço.
- **Análises:**
  - quantidade de serviços e faturamento por dia, semana ou mês, com gráficos;
  - filtros por período, cliente e status;
  - indicadores de total, ticket médio e clientes atendidas;
  - ranking de clientes;
  - exportação das planilhas (resumo e detalhada) em CSV, compatível com o Excel em português.
- **Valor por agendamento:** o preço é registrado no momento da marcação, então reajustes futuros não alteram o histórico financeiro.

## Arquitetura

```
┌──────────────────┐   HTTP/JSON (JWT)   ┌──────────────────┐        ┌───────────────────┐
│ Frontend         │ ──────────────────▶ │ Backend          │ ─────▶ │ Supabase          │
│ Vue 3 + Vite     │                     │ Node.js/Express  │        │ (PostgreSQL)      │
│ localhost:5173   │ ◀────────────────── │ localhost:3000   │ ─────▶ │ Google Calendar   │
└──────────────────┘                     └──────────────────┘        └───────────────────┘
```

- **Frontend:** SPA em Vue 3 (Composition API + TypeScript), Vue Router e Axios.
- **Backend:** API REST em Express 5.
  - A autenticação usa JWT, com os papéis `client` e `admin`.
  - A proprietária entra pelo OAuth 2.0 do Google.
- **Banco de dados:** Supabase/PostgreSQL. Um índice único impede dois agendamentos ativos no mesmo horário.
- **Agenda:** cada agendamento vira um evento no Google Calendar da proprietária. Os pendentes aparecem com o prefixo "[A confirmar]".

## Estrutura de pastas

```
StudioDantas/
├── backend/
│   ├── src/
│   │   ├── api.js            # monta a API (rotas e middlewares)
│   │   ├── app.js            # servidor local (porta 3000)
│   │   ├── config/           # cliente do Supabase
│   │   ├── controllers/      # regras de clientes, serviços e agendamentos
│   │   ├── middleware/       # autenticação (JWT, papéis, OAuth Google)
│   │   ├── routes/           # rotas da API
│   │   ├── services/         # cálculo de horários disponíveis
│   │   └── googleCalendar.js # integração com o Google Calendar
│   ├── netlify/functions/    # a mesma API como função serverless
│   ├── supabase/             # scripts SQL (rodar em ordem)
│   └── .env.example
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/           # estilos, logo e ícones
│       ├── components/       # navbar, modais, gráficos, análises
│       ├── composables/      # sessão e loader
│       ├── config/           # contatos do salão
│       ├── router/
│       ├── services/         # cliente HTTP (Axios)
│       └── views/            # páginas (inclui privacidade e termos)
├── netlify.toml              # configuração de deploy
└── prints/                   # capturas e diagrama do banco
```

## Como executar

### Pré-requisitos
- [Node.js](https://nodejs.org/) 22.18+ ou 24.12+
- Um projeto no [Supabase](https://supabase.com/)
- Um projeto no [Google Cloud](https://console.cloud.google.com/) com a **Google Calendar API** e a **Gmail API** ativadas e uma credencial **OAuth 2.0** do tipo "Aplicativo da Web"

### 1. Banco de dados

O banco usa as tabelas `clientes`, `servicos`, `agendamentos` e `admins`. O diagrama está em [`prints/schema.png`](prints/schema.png). Com elas criadas, rode no **SQL Editor** do Supabase, em ordem:

| Script | O que faz |
|---|---|
| `backend/supabase/001_correcoes_agendamento.sql` | Fuso horário, índice de horário único, telefone normalizado e colunas de serviço |
| `backend/supabase/002_seed_servicos.sql` | *(opcional)* Cadastra os serviços iniciais |
| `backend/supabase/003_valor_agendamento.sql` | Grava o valor cobrado em cada agendamento |
| `backend/supabase/004_senha_clientes.sql` | Senha e e-mail das clientes e links de redefinição de senha |

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # preencha as variáveis abaixo
npm run dev            # ou: npm start
```

A API sobe em `http://localhost:3000`.

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` / `SUPABASE_KEY` | URL do projeto e chave **service_role**. Só o backend usa essa chave. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credencial OAuth do Google Cloud |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3000/api/auth/google/callback`. Cadastre a mesma URL no Google Cloud. |
| `GOOGLE_CALENDAR_ID` | Agenda usada. O padrão é `primary`. |
| `JWT_SECRET` | Chave aleatória de no mínimo 32 caracteres |
| `ADMIN_EMAIL` | E-mail Google da proprietária, o único com acesso ao painel |
| `FRONTEND_URL` | Endereço do frontend. O padrão é `http://localhost:5173`. |
| `TIMEZONE` | Fuso do salão. O padrão é `America/Sao_Paulo`. |

Para gerar o `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

O site abre em `http://localhost:5173`. Para apontar para outra API, defina `VITE_API_URL` em `frontend/.env`. O padrão é `http://localhost:3000/api`.

### 4. Primeiro acesso da proprietária

Acesse `http://localhost:5173/admin` e entre com a conta Google de `ADMIN_EMAIL`. Nesse primeiro login, o sistema salva no banco a autorização da agenda e do Gmail (usado para enviar o e-mail de "esqueci minha senha"). A partir daí, os agendamentos das clientes são criados automaticamente no Google Calendar.

## Deploy (Netlify)

O site e a API são publicados juntos no [Netlify](https://www.netlify.com/), no plano gratuito. O frontend vira um site estático, e o backend roda como função serverless no mesmo endereço, em `/api/*`. Toda a configuração está em [`netlify.toml`](netlify.toml).

1. No Netlify, escolha **Add new project → Import an existing project → GitHub** e selecione este repositório. O Netlify lê os campos de build do `netlify.toml`.
2. Em **Project configuration → Environment variables**, cadastre as mesmas variáveis do `backend/.env`, ajustando:
   - `FRONTEND_URL` = `https://<seu-site>.netlify.app`
   - `GOOGLE_REDIRECT_URI` = `https://<seu-site>.netlify.app/api/auth/google/callback`
3. No Google Cloud, adicione essa mesma URL de callback em **Credenciais → URIs de redirecionamento autorizados**.
4. Clique em **Deploy**. A partir daí, cada `git push` na branch `main` publica uma nova versão.

As páginas [`/privacidade`](frontend/src/views/Privacidade.vue) e [`/termos`](frontend/src/views/Termos.vue) atendem à tela de consentimento OAuth do Google e à LGPD.

## Principais rotas da API

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/client/login` | público | Login da cliente por telefone e senha |
| `POST` | `/api/auth/client/register` | público | Cadastro da cliente |
| `POST` | `/api/auth/client/setup-password` | público | Cliente antiga cria a senha no primeiro login |
| `POST` | `/api/auth/client/forgot-password` | público | Envia o link de redefinição de senha |
| `POST` | `/api/auth/client/reset-password` | público | Nova senha pelo link do e-mail |
| `GET` | `/api/auth/google` | público | Inicia o login da proprietária |
| `GET` | `/api/servicos` | público | Serviços ativos |
| `GET` | `/api/calendar/availability?date=AAAA-MM-DD&servico_id=` | público | Horários livres de um dia |
| `POST` | `/api/agendamentos` | cliente | Cria um agendamento |
| `GET` | `/api/agendamentos/me` | cliente | Agendamentos da cliente |
| `GET` | `/api/agendamentos` | admin | Todos os agendamentos |
| `PUT` / `DELETE` | `/api/agendamentos/:id` | admin | Remarcar, confirmar ou excluir |
| `GET` / `PUT` / `DELETE` | `/api/clientes[/:id]` | admin | Gestão de clientes |
| `GET` `/todos` · `POST` · `PUT` · `DELETE` | `/api/servicos[/:id]` | admin | Gestão de serviços |
| `GET` | `/api/calendar/sync` | admin | Recria no Google os eventos que sumiram |

## Regras de agendamento

As regras ficam em [`backend/src/services/disponibilidade.js`](backend/src/services/disponibilidade.js):

- **Funcionamento:** das 08:00 às 18:00, com início a cada 60 minutos. O serviço precisa terminar até o fechamento.
- **Almoço:** das 12:00 às 13:00, sem atendimento.
- **Folgas:** domingo e segunda-feira.
- **Confirmação:** novos agendamentos entram como **pendentes** e a proprietária confirma pelo painel. Os cancelados liberam o horário.

## Segurança

- Credenciais ficam apenas em `backend/.env`, que é ignorado pelo Git.
- A chave `service_role` do Supabase nunca é enviada ao navegador.
- O painel aceita somente o e-mail Google definido em `ADMIN_EMAIL`. O callback do OAuth é protegido por um `state` assinado.
- O backend confere novamente se o horário está livre antes de gravar.

## Contexto acadêmico

Projeto desenvolvido para a disciplina de Projeto Integrador II (PI2), aplicado a um negócio real: o Studio Dantas · Lash Beauty.
