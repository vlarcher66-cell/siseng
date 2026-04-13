const pool = require('../config/database');

async function listar(req, res) {
  try {
    const { status, search } = req.query;
    let sql = 'SELECT * FROM fornecedores WHERE empresa_id = ?';
    const params = [req.user.empresa_id];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (search) { sql += ' AND (razao_social LIKE ? OR nome_fantasia LIKE ? OR cnpj LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    sql += ' ORDER BY razao_social';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar fornecedores.', error: err.message });
  }
}

async function obter(req, res) {
  try {
    const [[row]] = await pool.query('SELECT * FROM fornecedores WHERE id=? AND empresa_id=?', [req.params.id, req.user.empresa_id]);
    if (!row) return res.status(404).json({ message: 'Fornecedor não encontrado.' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter fornecedor.', error: err.message });
  }
}

async function criar(req, res) {
  const { razao_social, nome_fantasia, cnpj, email, telefone, contato, endereco, cidade, estado, categoria, observacoes } = req.body;
  if (!razao_social) return res.status(400).json({ message: 'Razão social obrigatória.' });
  try {
    const [r] = await pool.query(
      `INSERT INTO fornecedores (empresa_id, razao_social, nome_fantasia, cnpj, email, telefone, contato, endereco, cidade, estado, categoria, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.empresa_id, razao_social.trim(), nome_fantasia||null, cnpj||null, email||null, telefone||null, contato||null, endereco||null, cidade||null, estado||null, categoria||null, observacoes||null]
    );
    res.status(201).json({ id: r.insertId, message: 'Fornecedor criado.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar fornecedor.', error: err.message });
  }
}

async function atualizar(req, res) {
  const { razao_social, nome_fantasia, cnpj, email, telefone, contato, endereco, cidade, estado, categoria, observacoes, status } = req.body;
  try {
    await pool.query(
      `UPDATE fornecedores SET razao_social=?, nome_fantasia=?, cnpj=?, email=?, telefone=?, contato=?, endereco=?, cidade=?, estado=?, categoria=?, observacoes=?, status=?
       WHERE id=? AND empresa_id=?`,
      [razao_social, nome_fantasia||null, cnpj||null, email||null, telefone||null, contato||null, endereco||null, cidade||null, estado||null, categoria||null, observacoes||null, status||'ativo', req.params.id, req.user.empresa_id]
    );
    res.json({ message: 'Fornecedor atualizado.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar fornecedor.', error: err.message });
  }
}

async function excluir(req, res) {
  try {
    await pool.query('DELETE FROM fornecedores WHERE id=? AND empresa_id=?', [req.params.id, req.user.empresa_id]);
    res.json({ message: 'Fornecedor excluído.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir fornecedor.', error: err.message });
  }
}

module.exports = { listar, obter, criar, atualizar, excluir };
