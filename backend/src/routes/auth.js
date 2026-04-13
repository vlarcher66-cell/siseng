const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { register, login, forgotPassword, resetPassword, me } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');

// Helper de validação
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

// POST /api/auth/register
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório.'),
    body('company').trim().notEmpty().withMessage('Nome da empresa é obrigatório.'),
    body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres.')
  ],
  validate,
  register
);

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
    body('password').notEmpty().withMessage('Senha é obrigatória.')
  ],
  validate,
  login
);

// POST /api/auth/forgot-password
router.post('/forgot-password',
  [body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail()],
  validate,
  forgotPassword
);

// POST /api/auth/reset-password
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Token inválido.'),
    body('password').isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres.')
  ],
  validate,
  resetPassword
);

// GET /api/auth/me  (requer token)
router.get('/me', authMiddleware, me);

module.exports = router;
