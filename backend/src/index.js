require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const path         = require('path');

const authRoutes   = require('./routes/auth');
const pool         = require('./config/database');

const app  = express();

// ── Trust proxy (Railway fica atrás de proxy) ──
app.set('trust proxy', 1);

/* ── Migrations + inicialização ── */
const { startTrialJob } = require('./services/trialJob');
async function runMigrations() {
  const alters = [
    "ALTER TABLE etapas ADD COLUMN IF NOT EXISTS responsavel VARCHAR(150) NULL",
    "ALTER TABLE etapas ADD COLUMN IF NOT EXISTS tipo VARCHAR(100) NULL",
    "ALTER TABLE etapas ADD COLUMN IF NOT EXISTS custo_previsto DECIMAL(15,2) DEFAULT 0",
    "ALTER TABLE etapas ADD COLUMN IF NOT EXISTS custo_real DECIMAL(15,2) DEFAULT 0",
    "ALTER TABLE empresas ADD COLUMN IF NOT EXISTS aviso_3d_enviado DATETIME NULL",
    "ALTER TABLE empresas ADD COLUMN IF NOT EXISTS aviso_0d_enviado DATETIME NULL",
  ];
  for (const sql of alters) {
    try { await pool.query(sql); } catch (_) {}
  }
  console.log('✅ Migrations concluídas');
}
runMigrations()
  .catch(err => console.warn('Migrate:', err.message))
  .finally(() => startTrialJob());
const PORT = process.env.PORT || 3000;

// ── Segurança ──────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false  // ajustar ao ir para prod
}));

// ── CORS ───────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://www.siseng.com.br',
  'https://siseng.com.br',
  'https://siseng-production.up.railway.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // permissivo por enquanto
    }
  },
  credentials: true
}));

// ── Rate limiting ──────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      process.env.NODE_ENV === 'production' ? 300 : 5000,
  standardHeaders: true,
  message: { message: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      process.env.NODE_ENV === 'production' ? 10 : 100,
  message: { message: 'Muitas tentativas de login. Aguarde 15 minutos.' }
});

app.use('/api/', limiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Body parser ────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Log ────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Serve frontend (landing page) ─────────────
const frontendPath = path.join(__dirname, '../../frontend/public');
const frontendPathAlt = path.join(__dirname, '../../../frontend/public');
const fs = require('fs');
const FRONTEND = fs.existsSync(frontendPath) ? frontendPath : frontendPathAlt;
app.use(express.static(FRONTEND));

// ── Rotas da API ───────────────────────────────
app.use('/api/auth', authRoutes);

// Rotas
app.use('/api/obras',   require('./routes/obras'));
app.use('/api/etapas',      require('./routes/etapas'));
// app.use('/api/financeiro',  require('./routes/financeiro'));
app.use('/api/fornecedores', require('./routes/fornecedores'));
// app.use('/api/documentos',  require('./routes/documentos'));
app.use('/api/usuarios',    require('./routes/usuarios'));
// app.use('/api/dashboard',   require('./routes/dashboard'));

// ── Módulo Compras/Cotação ──────────────────────────────
app.use('/api/compras',        require('./routes/compras'));
app.use('/api/modelos-etapa',  require('./routes/modelos_etapa'));
app.use('/api/medicoes',     require('./routes/medicoes'));
app.use('/api/rdo',          require('./routes/rdo'));
app.use('/api/admin',        require('./routes/admin'));

// ── Rota 404 da API ────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Rota não encontrada.' });
});

// ── SPA fallback (apenas para rotas sem extensão) ──
app.get('*', (req, res) => {
  if (req.path.includes('.')) {
    return res.status(404).send('Arquivo não encontrado.');
  }
  res.sendFile(path.join(FRONTEND, 'index.html'));
});

// ── Error handler global ───────────────────────
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

// ── Inicia servidor ────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SISENG rodando na porta ${PORT}`);
  console.log(`   🌐 http://localhost:${PORT}`);
  console.log(`   📡 API: http://localhost:${PORT}/api`);
  console.log(`   ⚙️  Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});
