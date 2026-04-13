const router = require('express').Router();
const { authMiddleware } = require('../middlewares/auth');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

router.use(authMiddleware);

/* GET /api/obras — lista obras da empresa */
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT id, uuid, nome, cliente, status, data_inicio, data_prevista,
                      orcamento, custo_real, percentual, cidade, estado, endereco,
                      descricao, criado_em
               FROM obras WHERE empresa_id = ?`;
    const params = [req.user.empresa_id];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY nome';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar obras.', error: err.message });
  }
});

/* GET /api/obras/etapas?obra_id=X — DEVE vir antes de /:id */
router.get('/etapas', async (req, res) => {
  const { obra_id } = req.query;
  if (!obra_id) return res.status(400).json({ message: 'obra_id obrigatório.' });
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, status, ordem, percentual, custo_previsto, custo_real FROM etapas WHERE obra_id = ? AND empresa_id = ? AND status = \'em_andamento\' ORDER BY ordem, nome',
      [obra_id, req.user.empresa_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar etapas.', error: err.message });
  }
});

/* GET /api/obras/:id — detalhe de uma obra */
router.get('/:id', async (req, res) => {
  try {
    const [[obra]] = await pool.query(
      'SELECT * FROM obras WHERE id = ? AND empresa_id = ?',
      [req.params.id, req.user.empresa_id]
    );
    if (!obra) return res.status(404).json({ message: 'Obra não encontrada.' });
    res.json(obra);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar obra.', error: err.message });
  }
});

/* POST /api/obras — criar obra */
router.post('/', async (req, res) => {
  const { nome, cliente, status, data_inicio, data_prevista, orcamento,
          cidade, estado, endereco, cep, descricao } = req.body;
  if (!nome) return res.status(400).json({ message: 'Nome da obra é obrigatório.' });
  try {
    const [r] = await pool.query(
      `INSERT INTO obras (uuid, empresa_id, nome, cliente, status, data_inicio, data_prevista,
                          orcamento, cidade, estado, endereco, cep, descricao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.empresa_id, nome, cliente||null,
       status||'planejamento', data_inicio||null, data_prevista||null,
       orcamento||0, cidade||null, estado||null, endereco||null, cep||null, descricao||null]
    );
    const [[obra]] = await pool.query('SELECT * FROM obras WHERE id = ?', [r.insertId]);
    res.status(201).json(obra);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar obra.', error: err.message });
  }
});

/* PUT /api/obras/:id — atualizar obra */
router.put('/:id', async (req, res) => {
  const { nome, cliente, status, data_inicio, data_prevista, orcamento,
          cidade, estado, endereco, cep, descricao, percentual } = req.body;
  try {
    await pool.query(
      `UPDATE obras SET nome=?, cliente=?, status=?, data_inicio=?, data_prevista=?,
                        orcamento=?, cidade=?, estado=?, endereco=?, cep=?, descricao=?, percentual=?
       WHERE id=? AND empresa_id=?`,
      [nome, cliente||null, status||'planejamento', data_inicio||null, data_prevista||null,
       orcamento||0, cidade||null, estado||null, endereco||null, cep||null, descricao||null,
       percentual||0, req.params.id, req.user.empresa_id]
    );
    const [[obra]] = await pool.query('SELECT * FROM obras WHERE id = ?', [req.params.id]);
    res.json(obra);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar obra.', error: err.message });
  }
});

/* DELETE /api/obras/:id — excluir obra */
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM obras WHERE id=? AND empresa_id=?',
      [req.params.id, req.user.empresa_id]);
    res.json({ message: 'Obra excluída.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir obra.', error: err.message });
  }
});

module.exports = router;
