const router = require('express').Router();
const A = require('../controllers/adminController');

router.post('/login', A.login);
router.get ('/dashboard',  A.requireSuperAdmin, A.dashboard);
router.get ('/empresas',   A.requireSuperAdmin, A.listarEmpresas);
router.put ('/empresas/:id', A.requireSuperAdmin, A.atualizarEmpresa);
router.get ('/planos',        A.requireSuperAdmin, A.listarPlanos);
router.delete('/empresas/:id', A.requireSuperAdmin, A.excluirEmpresa);

module.exports = router;
