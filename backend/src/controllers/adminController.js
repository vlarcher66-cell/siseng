const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/database');

const ADMIN_USER = process.env.SUPERADMIN_USER || 'admin@siseng.com.br';
const ADMIN_PASS = process.env.SUPERADMIN_PASS || 'siseng@2026';
const ADMIN_SECRET = (process.env.JWT_SECRET || 'siseng_secret') + '_superadmin';

/* ── Login superadmin ── */
async function login(req, res) {
  const { email, password } = req.body;
  if (email !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }
  const token = jwt.sign({ superadmin: true }, ADMIN_SECRET, { expiresIn: '12h' });
  res.json({ token });
}

/* ── Middleware superadmin ── */
function requireSuperAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Token não fornecido.' });
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), ADMIN_SECRET);
    if (!payload.superadmin) throw new Error();
    next();
  } catch {
    res.status(401).json({ message: 'Acesso negado.' });
  }
}

/* ── Dashboard geral ── */
async function dashboard(req, res) {
  try {
    const [[totais]] = await pool.query(`
      SELECT
        COUNT(*) AS total_empresas,
        SUM(status='trial') AS em_trial,
        SUM(status='ativo') AS ativas,
        SUM(status='suspenso') AS suspensas,
        SUM(status='cancelado') AS canceladas
      FROM empresas`);

    const [[totaisOp]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
        (SELECT COUNT(*) FROM obras)    AS total_obras,
        (SELECT COUNT(*) FROM cotacoes) AS total_cotacoes,
        (SELECT COALESCE(SUM(valor_total),0) FROM pedidos_compra) AS total_pedidos_valor`);

    const [recentes] = await pool.query(`
      SELECT e.id, e.razao_social, e.email, e.status, e.trial_expira, e.criado_em,
             p.nome AS plano_nome,
             COUNT(DISTINCT u.id) AS total_usuarios,
             COUNT(DISTINCT o.id) AS total_obras
      FROM empresas e
      LEFT JOIN planos p ON p.id = e.plano_id
      LEFT JOIN usuarios u ON u.empresa_id = e.id
      LEFT JOIN obras o ON o.empresa_id = e.id
      GROUP BY e.id
      ORDER BY e.criado_em DESC
      LIMIT 5`);

    res.json({ ...totais, ...totaisOp, recentes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* ── Listar empresas ── */
async function listarEmpresas(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT e.id, e.uuid, e.razao_social, e.nome_fantasia, e.email, e.telefone,
             e.cnpj, e.status, e.trial_expira, e.criado_em,
             p.nome AS plano_nome, p.preco AS plano_preco,
             COUNT(DISTINCT u.id) AS total_usuarios,
             COUNT(DISTINCT o.id) AS total_obras,
             COUNT(DISTINCT c.id) AS total_cotacoes
      FROM empresas e
      LEFT JOIN planos p ON p.id = e.plano_id
      LEFT JOIN usuarios u ON u.empresa_id = e.id
      LEFT JOIN obras o ON o.empresa_id = e.id
      LEFT JOIN cotacoes c ON c.empresa_id = e.id
      GROUP BY e.id
      ORDER BY e.criado_em DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* ── Atualizar status empresa ── */
async function atualizarEmpresa(req, res) {
  const { id } = req.params;
  const { status, plano_id, trial_expira } = req.body;
  try {
    const campos = [], vals = [];
    if (status)       { campos.push('status=?');       vals.push(status); }
    if (plano_id)     { campos.push('plano_id=?');     vals.push(plano_id); }
    if (trial_expira) { campos.push('trial_expira=?'); vals.push(trial_expira); }
    if (!campos.length) return res.status(400).json({ message: 'Nada para atualizar.' });
    vals.push(id);
    await pool.query(`UPDATE empresas SET ${campos.join(',')} WHERE id=?`, vals);
    res.json({ message: 'Empresa atualizada.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* ── Listar planos ── */
async function listarPlanos(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM planos ORDER BY preco');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { login, requireSuperAdmin, dashboard, listarEmpresas, atualizarEmpresa, listarPlanos };
