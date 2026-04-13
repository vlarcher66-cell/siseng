/* ═══════════════════════════════════════════════════════════
   SISENG — Rotas: RDO (Relatório Diário de Obra)

   Registrar em index.js:
     app.use('/api/rdo', require('./routes/rdo'));

   GET    /api/rdo              — Listar (filtros: obra_id, mes, ano)
   GET    /api/rdo/:id          — Detalhe completo (+ mão de obra + anexos)
   POST   /api/rdo              — Criar (multipart/form-data)
   PUT    /api/rdo/:id          — Atualizar (multipart/form-data)
   DELETE /api/rdo/:id/anexos/:anexoId — Excluir um anexo
   DELETE /api/rdo/:id          — Excluir RDO
═══════════════════════════════════════════════════════════ */
const router = require('express').Router();
const { authMiddleware, requirePerfil } = require('../middlewares/auth');
const C = require('../controllers/rdoController');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Funções da equipe (cadastro rápido) — ANTES de /:id para não ser interceptado
router.get   ('/funcoes',        C.listarFuncoes);
router.post  ('/funcoes',        C.criarFuncao);
router.delete('/funcoes/:id',    C.excluirFuncao);

// Responsáveis (cadastro rápido)
router.get   ('/responsaveis',      C.listarResponsaveis);
router.post  ('/responsaveis',      C.criarResponsavel);
router.delete('/responsaveis/:id',  C.excluirResponsavel);

// Listagem e detalhe — todos os perfis
router.get('/',    C.listar);
router.get('/:id', C.obter);

// Criar e editar — qualquer perfil autenticado (encarregado no campo)
router.post('/',    C.upload, C.criar);
router.put('/:id',  C.upload, C.atualizar);

// Excluir anexo — qualquer perfil
router.delete('/:rdoId/anexos/:anexoId', C.excluirAnexo);

// Excluir RDO — apenas admin/gerente
router.delete('/:id', requirePerfil('admin', 'gerente'), C.excluir);

module.exports = router;
