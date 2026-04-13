const router = require('express').Router();
const { authMiddleware } = require('../middlewares/auth');
const pool = require('../config/database');

router.use(authMiddleware);

/* ── Migração automática da tabela medicoes ── */
async function migrateMedicoes() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS medicoes (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      empresa_id  INT NOT NULL,
      obra_id     INT NOT NULL,
      periodo     DATE NULL,
      status      ENUM('rascunho','aprovado','cancelado') DEFAULT 'rascunho',
      obs         TEXT NULL,
      valor_total DECIMAL(15,2) DEFAULT 0,
      criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_empresa (empresa_id),
      INDEX idx_obra    (obra_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS medicao_itens (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      medicao_id   INT NOT NULL,
      etapa_id     INT NOT NULL,
      perc_executado DECIMAL(5,2) DEFAULT 0,
      custo_real   DECIMAL(15,2) DEFAULT 0,
      custo_previsto DECIMAL(15,2) DEFAULT 0,
      etapa_nome   VARCHAR(255) NULL,
      FOREIGN KEY (medicao_id) REFERENCES medicoes(id) ON DELETE CASCADE,
      INDEX idx_medicao (medicao_id),
      INDEX idx_etapa   (etapa_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}
migrateMedicoes().catch(err => console.warn('Migrate medicoes:', err.message));

/* GET /api/medicoes — lista todas as medições da empresa */
router.get('/', async (req, res) => {
  try {
    const { obra_id } = req.query;
    let sql = `
      SELECT m.id, m.obra_id, m.periodo, m.status, m.obs, m.valor_total,
             m.criado_em, m.atualizado_em,
             o.nome AS obra_nome
      FROM medicoes m
      JOIN obras o ON o.id = m.obra_id
      WHERE m.empresa_id = ?
    `;
    const params = [req.user.empresa_id];
    if (obra_id) { sql += ' AND m.obra_id = ?'; params.push(obra_id); }
    sql += ' ORDER BY m.periodo DESC, m.criado_em DESC';

    const [medicoes] = await pool.query(sql, params);

    // Busca itens de todas as medições em uma query só
    const ids = medicoes.map(m => m.id);
    let itens = [];
    if (ids.length > 0) {
      [itens] = await pool.query(
        `SELECT medicao_id, etapa_id, perc_executado, custo_real, custo_previsto, etapa_nome
         FROM medicao_itens WHERE medicao_id IN (?)`,
        [ids]
      );
    }

    // Agrupa itens por medicao_id
    const itensMap = {};
    itens.forEach(i => {
      if (!itensMap[i.medicao_id]) itensMap[i.medicao_id] = [];
      itensMap[i.medicao_id].push({
        etapaId:       i.etapa_id,
        etapaNome:     i.etapa_nome,
        percExecutado: parseFloat(i.perc_executado) || 0,
        custoReal:     parseFloat(i.custo_real) || 0,
        custoPrevisto: parseFloat(i.custo_previsto) || 0,
      });
    });

    const result = medicoes.map(m => ({
      id:         m.id,
      obra_id:    m.obra_id,
      obra_nome:  m.obra_nome,
      periodo:    m.periodo,
      status:     m.status,
      obs:        m.obs,
      valor_total: parseFloat(m.valor_total) || 0,
      criado_em:  m.criado_em,
      itens:      itensMap[m.id] || [],
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar medições.', error: err.message });
  }
});

/* GET /api/medicoes/:id */
router.get('/:id', async (req, res) => {
  try {
    const [[m]] = await pool.query(
      `SELECT m.*, o.nome AS obra_nome
       FROM medicoes m JOIN obras o ON o.id = m.obra_id
       WHERE m.id = ? AND m.empresa_id = ?`,
      [req.params.id, req.user.empresa_id]
    );
    if (!m) return res.status(404).json({ message: 'Medição não encontrada.' });

    const [itens] = await pool.query(
      'SELECT * FROM medicao_itens WHERE medicao_id = ?', [m.id]
    );
    m.itens = itens.map(i => ({
      etapaId:       i.etapa_id,
      etapaNome:     i.etapa_nome,
      percExecutado: parseFloat(i.perc_executado) || 0,
      custoReal:     parseFloat(i.custo_real) || 0,
      custoPrevisto: parseFloat(i.custo_previsto) || 0,
    }));
    res.json(m);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar medição.', error: err.message });
  }
});

/* POST /api/medicoes — criar medição */
router.post('/', async (req, res) => {
  const { obra_id, periodo, status, obs, itens } = req.body;
  if (!obra_id) return res.status(400).json({ message: 'obra_id é obrigatório.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const valorTotal = (itens || []).reduce((acc, i) => acc + (parseFloat(i.custoReal) || 0), 0);

    const [r] = await conn.query(
      `INSERT INTO medicoes (empresa_id, obra_id, periodo, status, obs, valor_total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.empresa_id, obra_id, periodo || null, status || 'rascunho', obs || null, valorTotal]
    );
    const medicaoId = r.insertId;

    if (itens && itens.length > 0) {
      const rows = itens.map(i => [
        medicaoId,
        i.etapaId,
        parseFloat(i.percExecutado) || 0,
        parseFloat(i.custoReal) || 0,
        parseFloat(i.custoPrevisto) || 0,
        i.etapaNome || null,
      ]);
      await conn.query(
        `INSERT INTO medicao_itens (medicao_id, etapa_id, perc_executado, custo_real, custo_previsto, etapa_nome)
         VALUES ?`,
        [rows]
      );
    }

    await conn.commit();
    conn.release();

    // Retorna a medição criada com itens
    const [[created]] = await pool.query(
      `SELECT m.*, o.nome AS obra_nome FROM medicoes m JOIN obras o ON o.id = m.obra_id WHERE m.id = ?`,
      [medicaoId]
    );
    const [createdItens] = await pool.query('SELECT * FROM medicao_itens WHERE medicao_id = ?', [medicaoId]);
    created.itens = createdItens.map(i => ({
      etapaId: i.etapa_id, etapaNome: i.etapa_nome,
      percExecutado: parseFloat(i.perc_executado) || 0,
      custoReal: parseFloat(i.custo_real) || 0,
      custoPrevisto: parseFloat(i.custo_previsto) || 0,
    }));

    res.status(201).json(created);
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ message: 'Erro ao criar medição.', error: err.message });
  }
});

/* PUT /api/medicoes/:id — atualizar medição */
router.put('/:id', async (req, res) => {
  const { obra_id, periodo, status, obs, itens } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verifica propriedade
    const [[existing]] = await conn.query(
      'SELECT id FROM medicoes WHERE id = ? AND empresa_id = ?',
      [req.params.id, req.user.empresa_id]
    );
    if (!existing) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: 'Medição não encontrada.' });
    }

    const valorTotal = (itens || []).reduce((acc, i) => acc + (parseFloat(i.custoReal) || 0), 0);

    await conn.query(
      `UPDATE medicoes SET obra_id=?, periodo=?, status=?, obs=?, valor_total=?
       WHERE id=? AND empresa_id=?`,
      [obra_id, periodo || null, status || 'rascunho', obs || null, valorTotal,
       req.params.id, req.user.empresa_id]
    );

    // Recria itens
    await conn.query('DELETE FROM medicao_itens WHERE medicao_id = ?', [req.params.id]);
    if (itens && itens.length > 0) {
      const rows = itens.map(i => [
        req.params.id,
        i.etapaId,
        parseFloat(i.percExecutado) || 0,
        parseFloat(i.custoReal) || 0,
        parseFloat(i.custoPrevisto) || 0,
        i.etapaNome || null,
      ]);
      await conn.query(
        `INSERT INTO medicao_itens (medicao_id, etapa_id, perc_executado, custo_real, custo_previsto, etapa_nome)
         VALUES ?`,
        [rows]
      );
    }

    await conn.commit();
    conn.release();

    const [[updated]] = await pool.query(
      `SELECT m.*, o.nome AS obra_nome FROM medicoes m JOIN obras o ON o.id = m.obra_id WHERE m.id = ?`,
      [req.params.id]
    );
    const [updatedItens] = await pool.query('SELECT * FROM medicao_itens WHERE medicao_id = ?', [req.params.id]);
    updated.itens = updatedItens.map(i => ({
      etapaId: i.etapa_id, etapaNome: i.etapa_nome,
      percExecutado: parseFloat(i.perc_executado) || 0,
      custoReal: parseFloat(i.custo_real) || 0,
      custoPrevisto: parseFloat(i.custo_previsto) || 0,
    }));

    res.json(updated);
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ message: 'Erro ao atualizar medição.', error: err.message });
  }
});

/* DELETE /api/medicoes/:id */
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM medicoes WHERE id = ? AND empresa_id = ?',
      [req.params.id, req.user.empresa_id]
    );
    res.json({ message: 'Medição excluída.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir medição.', error: err.message });
  }
});

module.exports = router;
