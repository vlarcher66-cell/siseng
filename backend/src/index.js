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
async function addColumnIfMissing(table, column, definition) {
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (cols.length === 0) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`  + ${table}.${column}`);
  }
}

async function runMigrations() {
  await addColumnIfMissing('etapas',   'responsavel',      'VARCHAR(150) NULL');
  await addColumnIfMissing('etapas',   'tipo',             'VARCHAR(100) NULL');
  await addColumnIfMissing('etapas',   'custo_previsto',   'DECIMAL(15,2) DEFAULT 0');
  await addColumnIfMissing('etapas',   'custo_real',       'DECIMAL(15,2) DEFAULT 0');
  await addColumnIfMissing('empresas', 'aviso_3d_enviado', 'DATETIME NULL');
  await addColumnIfMissing('empresas', 'aviso_0d_enviado', 'DATETIME NULL');

  // ── Tabelas do módulo Compras ───────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS grupos_item (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      empresa_id  INT UNSIGNED NOT NULL,
      descricao   VARCHAR(100) NOT NULL,
      status      ENUM('ativo','inativo') DEFAULT 'ativo',
      criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_empresa (empresa_id),
      FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS subgrupos_item (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      empresa_id  INT UNSIGNED NOT NULL,
      id_grupo    INT UNSIGNED NOT NULL,
      descricao   VARCHAR(100) NOT NULL,
      status      ENUM('ativo','inativo') DEFAULT 'ativo',
      criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_empresa (empresa_id),
      INDEX idx_grupo   (id_grupo),
      FOREIGN KEY (empresa_id) REFERENCES empresas(id)   ON DELETE CASCADE,
      FOREIGN KEY (id_grupo)   REFERENCES grupos_item(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // ── Seed: plano de materiais para todas as empresas sem grupos ──
  await seedPlanoMateriais();

  console.log('✅ Migrations concluídas');
}

const PLANO_MATERIAIS = [
  { grupo: 'Estrutura',                      subgrupos: ['Cimento', 'Areia e Brita', 'Aço e Ferragem', 'Madeira para Forma', 'Blocos e Tijolos', 'Concreto Usinado'] },
  { grupo: 'Alvenaria e Revestimento',       subgrupos: ['Argamassa e Rejunte', 'Cerâmica e Porcelanato', 'Gesso e Drywall', 'Pintura (tinta, massa, fundo)', 'Pastilha e Pedras Naturais'] },
  { grupo: 'Cobertura e Impermeabilização',  subgrupos: ['Telhas', 'Estrutura Metálica / Madeiramento', 'Impermeabilizantes', 'Calhas e Rufos'] },
  { grupo: 'Instalações Hidráulicas',        subgrupos: ['Tubos e Conexões (água fria)', 'Tubos e Conexões (esgoto)', 'Caixas d\'água e Reservatórios', 'Registros e Válvulas'] },
  { grupo: 'Instalações Elétricas',          subgrupos: ['Fios e Cabos', 'Eletrodutos e Perfilados', 'Quadros e Disjuntores', 'Tomadas, Interruptores e Espelhos'] },
  { grupo: 'Esquadrias',                     subgrupos: ['Portas de Madeira', 'Portas de Alumínio / Ferro', 'Janelas de Alumínio / Ferro', 'Vidros e Espelhos', 'Portões'] },
  { grupo: 'Louças e Metais',                subgrupos: ['Bacias e Caixas Acopladas', 'Pias e Cubas', 'Torneiras e Misturadores', 'Chuveiros e Duchas', 'Acessórios de Banheiro'] },
  { grupo: 'Acabamentos Gerais',             subgrupos: ['Rodapé e Soleira', 'Forro (PVC, gesso, madeira)', 'Escadas e Corrimão', 'Divisórias'] },
  { grupo: 'Materiais Diversos',             subgrupos: ['Parafusos, Buchas e Fixadores', 'Selantes e Adesivos', 'Telas e Telas Metálicas', 'Materiais de Limpeza da Obra'] },
];

async function seedPlanoMateriais() {
  const conn = await pool.getConnection();
  try {
    const [empresas] = await conn.query('SELECT id FROM empresas');
    if (!empresas.length) return;
    for (const empresa of empresas) {
      const eid = empresa.id;
      const [[{ total }]] = await conn.query(
        'SELECT COUNT(*) as total FROM grupos_item WHERE empresa_id=?', [eid]
      );
      if (total > 0) continue;
      console.log(`🌱 Inserindo plano de materiais para empresa_id=${eid}...`);
      for (const g of PLANO_MATERIAIS) {
        const [r] = await conn.query(
          'INSERT IGNORE INTO grupos_item (empresa_id, descricao) VALUES (?, ?)', [eid, g.grupo]
        );
        const grupoId = r.insertId || (await conn.query(
          'SELECT id FROM grupos_item WHERE empresa_id=? AND descricao=?', [eid, g.grupo]
        ))[0][0].id;
        for (const sub of g.subgrupos) {
          await conn.query(
            'INSERT IGNORE INTO subgrupos_item (empresa_id, id_grupo, descricao) VALUES (?, ?, ?)',
            [eid, grupoId, sub]
          );
        }
      }
      console.log(`✅ Plano inserido para empresa_id=${eid}`);
    }
  } finally {
    conn.release();
  }
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
