/* ═══════════════════════════════════════════════════════════
   SISENG — Rotas: Modelos de Etapa
   Base: /api/modelos-etapa
═══════════════════════════════════════════════════════════ */
const router = require('express').Router();
const { authMiddleware } = require('../middlewares/auth');
const pool = require('../config/database');

router.use(authMiddleware);

/* Migração automática da tabela */
pool.query(`
  CREATE TABLE IF NOT EXISTS modelos_etapa (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id  INT UNSIGNED NOT NULL,
    nome        VARCHAR(150) NOT NULL,
    tipo        VARCHAR(100) NOT NULL,
    descricao   TEXT,
    duracao     SMALLINT UNSIGNED DEFAULT NULL COMMENT 'dias estimados',
    ativo       TINYINT(1) DEFAULT 1,
    criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_empresa (empresa_id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`).catch(err => console.warn('Migrate modelos_etapa:', err.message));

/* GET — listar modelos da empresa */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM modelos_etapa WHERE empresa_id = ? ORDER BY tipo, nome`,
      [req.user.empresa_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* POST — criar modelo */
router.post('/', async (req, res) => {
  const { nome, tipo, descricao, duracao, ativo } = req.body;
  if (!nome) return res.status(400).json({ message: 'Nome é obrigatório.' });
  if (!tipo) return res.status(400).json({ message: 'Tipo é obrigatório.' });
  try {
    const [r] = await pool.query(
      `INSERT INTO modelos_etapa (empresa_id, nome, tipo, descricao, duracao, ativo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.empresa_id, nome, tipo, descricao || null, duracao || null, ativo !== false ? 1 : 0]
    );
    const [[row]] = await pool.query('SELECT * FROM modelos_etapa WHERE id = ?', [r.insertId]);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* PUT — atualizar modelo */
router.put('/:id', async (req, res) => {
  const { nome, tipo, descricao, duracao, ativo } = req.body;
  try {
    await pool.query(
      `UPDATE modelos_etapa SET nome=?, tipo=?, descricao=?, duracao=?, ativo=?
       WHERE id=? AND empresa_id=?`,
      [nome, tipo, descricao || null, duracao || null, ativo !== false ? 1 : 0,
       req.params.id, req.user.empresa_id]
    );
    const [[row]] = await pool.query('SELECT * FROM modelos_etapa WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* DELETE — excluir modelo */
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM modelos_etapa WHERE id=? AND empresa_id=?',
      [req.params.id, req.user.empresa_id]);
    res.json({ message: 'Modelo excluído.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
