/* =========================================================
   SISENG — Rotas de Etapas
   Base: /api/etapas
   ========================================================= */
const router = require('express').Router();
const { authMiddleware } = require('../middlewares/auth');
const pool = require('../config/database');

router.use(authMiddleware);

/* Migração: garante que 'bloqueada' existe no ENUM status */
pool.query(`ALTER TABLE etapas MODIFY COLUMN status ENUM('pendente','em_andamento','concluida','atrasada','bloqueada') DEFAULT 'pendente'`)
  .catch(() => {});

/* GET /api/etapas — lista etapas da empresa (filtros: obra_id, status) */
router.get('/', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const { obra_id, status } = req.query;
    const params = [req.user.empresa_id];
    let where = 'WHERE e.empresa_id = ?';
    if (obra_id) { where += ' AND e.obra_id = ?'; params.push(obra_id); }
    if (status)  { where += ' AND e.status = ?';  params.push(status);  }
    const [rows] = await pool.query(
      `SELECT e.id, e.obra_id, e.nome, e.descricao, e.status,
              e.data_inicio, e.data_fim, e.responsavel,
              e.tipo, e.custo_previsto, e.custo_real, e.criado_em,
              o.nome AS obra_nome,
              COALESCE(
                (SELECT SUM(mi.perc_executado)
                 FROM medicao_itens mi
                 JOIN medicoes m ON m.id = mi.medicao_id
                 WHERE mi.etapa_id = e.id AND m.empresa_id = e.empresa_id),
                e.percentual, 0
              ) AS percentual
       FROM etapas e
       JOIN obras o ON o.id = e.obra_id
       ${where}
       ORDER BY e.data_inicio, e.nome`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar etapas.', error: err.message });
  }
});

/* GET /api/etapas/:id */
router.get('/:id', async (req, res) => {
  try {
    const [[etapa]] = await pool.query(
      `SELECT e.*, o.nome AS obra_nome
       FROM etapas e JOIN obras o ON o.id = e.obra_id
       WHERE e.id = ? AND e.empresa_id = ?`,
      [req.params.id, req.user.empresa_id]
    );
    if (!etapa) return res.status(404).json({ message: 'Etapa não encontrada.' });
    res.json(etapa);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar etapa.', error: err.message });
  }
});

/* POST /api/etapas — criar etapa */
router.post('/', async (req, res) => {
  const { obra_id, nome, descricao, status, data_inicio, data_fim,
          percentual, responsavel, tipo, custo_previsto, custo_real } = req.body;
  if (!obra_id) return res.status(400).json({ message: 'obra_id é obrigatório.' });
  if (!nome)    return res.status(400).json({ message: 'nome é obrigatório.' });
  // Etapa concluída = sempre 100%
  const percFinal = status === 'concluida' ? 100 : (percentual || 0);
  try {
    const [r] = await pool.query(
      `INSERT INTO etapas
         (empresa_id, obra_id, nome, descricao, status, data_inicio, data_fim,
          percentual, responsavel, tipo, custo_previsto, custo_real)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.empresa_id, obra_id, nome, descricao || null,
       status || 'pendente', data_inicio || null, data_fim || null,
       percFinal, responsavel || null, tipo || null,
       custo_previsto || 0, custo_real || 0]
    );
    const [[etapa]] = await pool.query(
      `SELECT e.*, o.nome AS obra_nome FROM etapas e JOIN obras o ON o.id = e.obra_id WHERE e.id = ?`,
      [r.insertId]
    );
    res.status(201).json(etapa);
  } catch (err) {
    console.error('Erro ao criar etapa:', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* PUT /api/etapas/:id — atualizar etapa */
router.put('/:id', async (req, res) => {
  const { obra_id, nome, descricao, status, data_inicio, data_fim,
          percentual, responsavel, tipo, custo_previsto, custo_real } = req.body;
  if (!obra_id) return res.status(400).json({ message: 'obra_id é obrigatório.' });
  if (!nome)    return res.status(400).json({ message: 'nome é obrigatório.' });
  // Etapa concluída = sempre 100%
  const percFinal = status === 'concluida' ? 100 : (percentual || 0);
  try {
    await pool.query(
      `UPDATE etapas SET obra_id=?, nome=?, descricao=?, status=?,
              data_inicio=?, data_fim=?, percentual=?, responsavel=?,
              tipo=?, custo_previsto=?, custo_real=?
       WHERE id=? AND empresa_id=?`,
      [obra_id, nome, descricao || null, status || 'pendente',
       data_inicio || null, data_fim || null, percFinal,
       responsavel || null, tipo || null,
       custo_previsto || 0, custo_real || 0,
       req.params.id, req.user.empresa_id]
    );
    const [[etapa]] = await pool.query(
      `SELECT e.*, o.nome AS obra_nome FROM etapas e JOIN obras o ON o.id = e.obra_id WHERE e.id = ?`,
      [req.params.id]
    );
    res.json(etapa);
  } catch (err) {
    console.error('PUT /etapas error:', err.message, err.sql || '');
    res.status(500).json({ message: 'Erro ao atualizar etapa.', error: err.message });
  }
});

/* DELETE /api/etapas/:id */
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM etapas WHERE id=? AND empresa_id=?',
      [req.params.id, req.user.empresa_id]);
    res.json({ message: 'Etapa excluída.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir etapa.', error: err.message });
  }
});

module.exports = router;
