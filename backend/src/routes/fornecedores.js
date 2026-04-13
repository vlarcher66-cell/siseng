const router = require('express').Router();
const { authMiddleware, requirePerfil } = require('../middlewares/auth');
const C = require('../controllers/fornecedoresController');

router.use(authMiddleware);

router.get   ('/',    C.listar);
router.get   ('/:id', C.obter);
router.post  ('/',    requirePerfil('admin','gerente','financeiro'), C.criar);
router.put   ('/:id', requirePerfil('admin','gerente','financeiro'), C.atualizar);
router.delete('/:id', requirePerfil('admin','gerente'),              C.excluir);

module.exports = router;
