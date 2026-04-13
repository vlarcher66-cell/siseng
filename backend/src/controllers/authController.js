const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool    = require('../config/database');
const mailer  = require('../services/mailer');

// ── Cadastro + criação de empresa (trial 15 dias) ──
async function register(req, res) {
  const { name, company, email, phone, password, plan } = req.body;

  if (!name || !company || !email || !password) {
    return res.status(400).json({ message: 'Campos obrigatórios não preenchidos.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verifica e-mail duplicado
    const [[existing]] = await conn.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email.toLowerCase()]
    );
    if (existing) {
      await conn.rollback();
      return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
    }

    // Busca plano
    const [[planRow]] = await conn.query(
      'SELECT id FROM planos WHERE slug = ? AND ativo = 1',
      [plan || 'pro']
    );

    // Trial expira em 15 dias
    const trialExpira = new Date();
    trialExpira.setDate(trialExpira.getDate() + 15);
    const trialStr = trialExpira.toISOString().split('T')[0];

    // Cria empresa
    const empresaUuid = uuidv4();
    const [empresaResult] = await conn.query(
      `INSERT INTO empresas (uuid, razao_social, email, telefone, plano_id, status, trial_expira)
       VALUES (?, ?, ?, ?, ?, 'trial', ?)`,
      [empresaUuid, company, email.toLowerCase(), phone || null, planRow?.id || null, trialStr]
    );
    const empresaId = empresaResult.insertId;

    // Cria usuário admin
    const senhaHash   = await bcrypt.hash(password, 12);
    const usuarioUuid = uuidv4();
    const [userResult] = await conn.query(
      `INSERT INTO usuarios (uuid, empresa_id, nome, email, senha_hash, perfil)
       VALUES (?, ?, ?, ?, ?, 'admin')`,
      [usuarioUuid, empresaId, name, email.toLowerCase(), senhaHash]
    );

    await conn.commit();

    mailer.sendWelcomeEmail(email.toLowerCase(), name, company).catch(() => {});

    return res.status(201).json({
      message: 'Conta criada com sucesso! Seu período de teste de 15 dias começou.',
      trialExpira: trialStr
    });

  } catch (err) {
    await conn.rollback();
    console.error('Erro no registro:', err);
    return res.status(500).json({ message: 'Erro interno ao criar conta. Tente novamente.' });
  } finally {
    conn.release();
  }
}

// ── Login ──────────────────────────────────────
async function login(req, res) {
  const { email, password, remember } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Informe e-mail e senha.' });
  }

  try {
    const [[user]] = await pool.query(
      `SELECT u.id, u.uuid, u.nome, u.email, u.senha_hash, u.perfil, u.empresa_id, u.ativo,
              e.status AS empresa_status, e.trial_expira, e.razao_social
       FROM   usuarios u
       JOIN   empresas e ON e.id = u.empresa_id
       WHERE  u.email = ?`,
      [email.toLowerCase()]
    );

    if (!user || !user.ativo) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    const senhaValida = await bcrypt.compare(password, user.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    // Verifica status
    if (user.empresa_status === 'suspenso' || user.empresa_status === 'cancelado') {
      return res.status(403).json({ message: 'Conta suspensa. Entre em contato com o suporte.' });
    }

    if (user.empresa_status === 'trial' && user.trial_expira) {
      const hoje = new Date();
      const expira = new Date(user.trial_expira);
      if (hoje > expira) {
        return res.status(403).json({
          message: 'Período de teste expirado. Assine um plano para continuar.',
          code: 'TRIAL_EXPIRED'
        });
      }
    }

    // Gera token
    const expiresIn = remember ? '30d' : (process.env.JWT_EXPIRES_IN || '8h');
    const token = jwt.sign(
      { userId: user.id, empresaId: user.empresa_id, perfil: user.perfil },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    // Atualiza último acesso
    await pool.query('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = ?', [user.id]);

    return res.json({
      token,
      user: {
        id:       user.uuid,
        nome:     user.nome,
        email:    user.email,
        perfil:   user.perfil,
        empresa:  user.razao_social,
        trialExpira: user.trial_expira
      }
    });

  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
}

// ── Esqueci senha ──────────────────────────────
async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Informe o e-mail.' });
  }

  try {
    const [[user]] = await pool.query(
      'SELECT id, nome FROM usuarios WHERE email = ? AND ativo = 1',
      [email.toLowerCase()]
    );

    // Sempre responde OK por segurança
    if (!user) {
      return res.json({ message: 'Se este e-mail estiver cadastrado, você receberá as instruções.' });
    }

    const token  = require('crypto').randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h

    await pool.query(
      'UPDATE usuarios SET reset_token = ?, reset_expira = ? WHERE id = ?',
      [token, expira, user.id]
    );

    mailer.sendResetEmail(email.toLowerCase(), user.nome || '', token).catch(() => {});

    return res.json({ message: 'Se este e-mail estiver cadastrado, você receberá as instruções.' });

  } catch (err) {
    console.error('Erro forgot-password:', err);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
}

// ── Resetar senha ──────────────────────────────
async function resetPassword(req, res) {
  const { token, password } = req.body;

  if (!token || !password || password.length < 8) {
    return res.status(400).json({ message: 'Dados inválidos.' });
  }

  try {
    const [[user]] = await pool.query(
      'SELECT id FROM usuarios WHERE reset_token = ? AND reset_expira > NOW()',
      [token]
    );

    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado. Solicite um novo.' });
    }

    const senhaHash = await bcrypt.hash(password, 12);
    await pool.query(
      'UPDATE usuarios SET senha_hash = ?, reset_token = NULL, reset_expira = NULL WHERE id = ?',
      [senhaHash, user.id]
    );

    return res.json({ message: 'Senha redefinida com sucesso. Faça login.' });

  } catch (err) {
    console.error('Erro reset-password:', err);
    return res.status(500).json({ message: 'Erro interno.' });
  }
}

// ── Me (perfil atual) ──────────────────────────
async function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = { register, login, forgotPassword, resetPassword, me };
