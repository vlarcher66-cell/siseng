/* ═══════════════════════════════════════════════════════════
   SISENG — Rotas: Compras / Cotação

   Integração em index.js:
     const comprasRoutes = require('./routes/compras');
     app.use('/api/compras', comprasRoutes);

   Rotas documentadas:

   [PÚBLICO]
   GET  /api/compras/cotacao/token/:token       — Portal do fornecedor
   POST /api/compras/cotacao/token/:token/responder — Responder cotação

   [AUTENTICADO]
   GET  /api/compras/grupos                     — Listar grupos
   POST /api/compras/grupos                     — Criar grupo
   PUT  /api/compras/grupos/:id                 — Atualizar grupo
   DEL  /api/compras/grupos/:id                 — Excluir grupo

   GET  /api/compras/itens                      — Listar itens
   POST /api/compras/itens                      — Criar item
   PUT  /api/compras/itens/:id                  — Atualizar item

   GET  /api/compras/cotacoes                   — Listar cotações
   GET  /api/compras/cotacoes/:id               — Obter cotação
   POST /api/compras/cotacoes                   — Criar cotação
   PUT  /api/compras/cotacoes/:id               — Atualizar cotação
   DEL  /api/compras/cotacoes/:id               — Excluir cotação
   POST /api/compras/cotacoes/:id/enviar        — Enviar para fornecedores

   GET  /api/compras/cotacoes/:id/mapa          — Obter mapa comparativo
   POST /api/compras/cotacoes/:id/vencedores    — Salvar vencedores

   GET  /api/compras/pedidos                    — Listar pedidos
   POST /api/compras/pedidos                    — Gerar pedido
═══════════════════════════════════════════════════════════ */
const router = require('express').Router();
const { authMiddleware, requirePerfil } = require('../middlewares/auth');
const C = require('../controllers/comprasController');

/* ── Rotas PÚBLICAS (portal fornecedor + mapa + pedido compartilhado) */
router.get ('/cotacao/token/:token',            C.obterCotacaoPorToken);
router.post('/cotacao/token/:token/responder',  C.responderCotacao);
router.get ('/mapa/publico/:token',             C.obterMapaPublico);
router.get ('/pedidos/publico/:token',          C.obterPedidoPublico);

/* ── Middleware de autenticação para todas abaixo ────────── */
router.use(authMiddleware);

/* ── Fornecedores (leitura, para selects) ────────────────── */
router.get ('/fornecedores', C.listarFornecedores);

/* ── Grupos de itens ─────────────────────────────────────── */
router.get ('/grupos',      C.listarGrupos);
router.post('/grupos',      requirePerfil('admin','gerente','financeiro'), C.criarGrupo);
router.put ('/grupos/:id',  requirePerfil('admin','gerente','financeiro'), C.atualizarGrupo);
router.delete('/grupos/:id',requirePerfil('admin','gerente'),              C.excluirGrupo);

/* ── Subgrupos de itens ──────────────────────────────────── */
router.get ('/subgrupos',      C.listarSubgrupos);
router.post('/subgrupos',      requirePerfil('admin','gerente','financeiro'), C.criarSubgrupo);
router.put ('/subgrupos/:id',  requirePerfil('admin','gerente','financeiro'), C.atualizarSubgrupo);
router.delete('/subgrupos/:id',requirePerfil('admin','gerente'),              C.excluirSubgrupo);

/* ── Itens de compra ─────────────────────────────────────── */
router.get ('/itens',      C.listarItens);
router.post('/itens',      requirePerfil('admin','gerente','financeiro'), C.criarItem);
router.put ('/itens/:id',  requirePerfil('admin','gerente','financeiro'), C.atualizarItem);

/* ── Cotações ─────────────────────────────────────────────── */
router.get ('/cotacoes',         C.listarCotacoes);
router.get ('/cotacoes/:id',     C.obterCotacao);
router.post('/cotacoes',         requirePerfil('admin','gerente','financeiro'), C.criarCotacao);
router.put ('/cotacoes/:id',     requirePerfil('admin','gerente','financeiro'), C.atualizarCotacao);
router.delete('/cotacoes/:id',   requirePerfil('admin','gerente'),              C.excluirCotacao);
router.post('/cotacoes/:id/enviar', requirePerfil('admin','gerente','financeiro'), C.enviarParaFornecedores);

/* ── Mapa de cotação ──────────────────────────────────────── */
router.get ('/cotacoes/:id/mapa',       C.obterMapa);
router.get ('/cotacoes/:id/vencedores', C.listarVencedores);
router.post('/cotacoes/:id/vencedores', requirePerfil('admin','gerente','financeiro'), C.salvarVencedores);
router.post('/cotacoes/:id/share',      requirePerfil('admin','gerente','financeiro'), C.gerarShareToken);

/* ── Negociação de preços ─────────────────────────────────── */
router.post('/cotacoes/:id/negociar',       requirePerfil('admin','gerente','financeiro'), C.negociarFornecedor);
router.post('/cotacoes/:id/negociar/limpar',requirePerfil('admin','gerente','financeiro'), C.limparNegociacao);

/* ── Pedidos de compra ────────────────────────────────────── */
router.get ('/pedidos',          C.listarPedidos);
router.get ('/pedidos/:id',      C.obterPedido);
router.post('/pedidos',          requirePerfil('admin','gerente','financeiro'), C.gerarPedido);
router.post('/pedidos/:id/share',requirePerfil('admin','gerente','financeiro'), C.gerarShareTokenPedido);

module.exports = router;
