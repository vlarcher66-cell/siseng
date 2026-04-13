const router = require('express').Router();
const { authMiddleware, requirePerfil } = require('../middlewares/auth');
const U = require('../controllers/usuariosController');

router.use(authMiddleware);

router.get ('/',              requirePerfil('admin'), U.listar);
router.post('/',              requirePerfil('admin'), U.criar);
router.put ('/:id',           requirePerfil('admin'), U.atualizar);
router.post('/:id/resetar',   requirePerfil('admin'), U.resetarSenha);
router.delete('/:id',         requirePerfil('admin'), U.excluir);

module.exports = router;
