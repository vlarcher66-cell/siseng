const bcrypt  = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool    = require('../config/database');
const mailer  = require('../services/mailer');

async function listar(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, uuid, nome, email, perfil, ativo, ultimo_acesso, criado_em
       FROM usuarios WHERE empresa_id = ? ORDER BY nome`,
      [req.user.empresa_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar usuários.', error: err.message });
  }
}

async function criar(req, res) {
  const { nome, email, perfil, password } = req.body;
  if (!nome || !email || !perfil) return res.status(400).json({ message: 'Nome, e-mail e perfil são obrigatórios.' });

  const perfisValidos = ['admin', 'gerente', 'financeiro', 'operacional'];
  if (!perfisValidos.includes(perfil)) return res.status(400).json({ message: 'Perfil inválido.' });

  try {
    const [[existing]] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email.toLowerCase()]);
    if (existing) return res.status(409).json({ message: 'Este e-mail já está em uso.' });

    const senha = password || Math.random().toString(36).slice(-10) + 'A1!';
    const senhaHash = await bcrypt.hash(senha, 12);
    const uuid = uuidv4();

    const [r] = await pool.query(
      `INSERT INTO usuarios (uuid, empresa_id, nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid, req.user.empresa_id, nome.trim(), email.toLowerCase(), senhaHash, perfil]
    );

    // Busca nome da empresa
    const [[emp]] = await pool.query('SELECT razao_social FROM empresas WHERE id=?', [req.user.empresa_id]);

    // Envia e-mail de convite (silencioso se falhar)
    mailer.sendUserInviteEmail(email.toLowerCase(), nome, emp?.razao_social || 'SISENG', senha).catch(() => {});

    res.status(201).json({ id: r.insertId, uuid, nome, email, perfil, message: 'Usuário criado com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar usuário.', error: err.message });
  }
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, perfil, ativo } = req.body;

  // Não pode editar a si mesmo via esta rota
  if (parseInt(id) === req.user.id) return res.status(400).json({ message: 'Use o perfil para editar seus próprios dados.' });

  try {
    const [[u]] = await pool.query('SELECT id FROM usuarios WHERE id=? AND empresa_id=?', [id, req.user.empresa_id]);
    if (!u) return res.status(404).json({ message: 'Usuário não encontrado.' });

    const campos = [];
    const vals   = [];
    if (nome  !== undefined) { campos.push('nome=?');  vals.push(nome.trim()); }
    if (perfil !== undefined) { campos.push('perfil=?'); vals.push(perfil); }
    if (ativo  !== undefined) { campos.push('ativo=?');  vals.push(ativo ? 1 : 0); }

    if (!campos.length) return res.status(400).json({ message: 'Nada para atualizar.' });

    vals.push(id);
    await pool.query(`UPDATE usuarios SET ${campos.join(',')} WHERE id=?`, vals);
    res.json({ message: 'Usuário atualizado.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar usuário.', error: err.message });
  }
}

async function resetarSenha(req, res) {
  const { id } = req.params;
  try {
    const [[u]] = await pool.query('SELECT nome, email FROM usuarios WHERE id=? AND empresa_id=?', [id, req.user.empresa_id]);
    if (!u) return res.status(404).json({ message: 'Usuário não encontrado.' });

    const novaSenha = Math.random().toString(36).slice(-8) + 'A1!';
    const hash = await bcrypt.hash(novaSenha, 12);
    await pool.query('UPDATE usuarios SET senha_hash=? WHERE id=?', [hash, id]);

    const [[emp]] = await pool.query('SELECT razao_social FROM empresas WHERE id=?', [req.user.empresa_id]);
    mailer.sendUserInviteEmail(u.email, u.nome, emp?.razao_social || 'SISENG', novaSenha).catch(() => {});

    res.json({ message: 'Senha redefinida e enviada por e-mail.', senha: novaSenha });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao resetar senha.', error: err.message });
  }
}

async function excluir(req, res) {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) return res.status(400).json({ message: 'Não é possível excluir sua própria conta.' });
  try {
    const [[u]] = await pool.query('SELECT id FROM usuarios WHERE id=? AND empresa_id=?', [id, req.user.empresa_id]);
    if (!u) return res.status(404).json({ message: 'Usuário não encontrado.' });
    await pool.query('UPDATE usuarios SET ativo=0 WHERE id=?', [id]);
    res.json({ message: 'Usuário desativado.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir usuário.', error: err.message });
  }
}

module.exports = { listar, criar, atualizar, resetarSenha, excluir };
