const jwt  = require('jsonwebtoken');
const pool = require('../config/database');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de acesso não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Busca usuário e empresa
    const [rows] = await pool.query(
      `SELECT u.id, u.uuid, u.nome, u.email, u.perfil, u.empresa_id,
              e.status AS empresa_status, e.trial_expira
       FROM   usuarios u
       JOIN   empresas e ON e.id = u.empresa_id
       WHERE  u.id = ? AND u.ativo = 1`,
      [payload.userId]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Usuário não encontrado ou desativado.' });
    }

    const user = rows[0];

    // Verifica trial expirado
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

    if (user.empresa_status === 'suspenso' || user.empresa_status === 'cancelado') {
      return res.status(403).json({
        message: 'Conta suspensa. Entre em contato com o suporte.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado. Faça login novamente.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Token inválido.' });
  }
}

// Middleware de permissão por perfil
function requirePerfil(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.user.perfil)) {
      return res.status(403).json({ message: 'Permissão insuficiente para esta ação.' });
    }
    next();
  };
}

module.exports = { authMiddleware, requirePerfil };
