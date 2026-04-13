/* ═══════════════════════════════════════════════════════════
   SISENG — Controller: Compras / Cotação
═══════════════════════════════════════════════════════════ */
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

/* ── Helpers ──────────────────────────────────────────────── */
function gerarNumero(prefixo, id) {
  const ano = new Date().getFullYear();
  return `${prefixo}-${ano}-${String(id).padStart(4, '0')}`;
}

/* ══════════════════════════════════════════════════════════
   FORNECEDORES (leitura para selects)
══════════════════════════════════════════════════════════ */
async function listarFornecedores(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, razao_social, nome_fantasia, cnpj, contato
       FROM fornecedores
       WHERE empresa_id = ? AND status = 'ativo'
       ORDER BY nome_fantasia, razao_social`,
      [req.user.empresa_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar fornecedores.', error: err.message });
  }
}

/* ══════════════════════════════════════════════════════════
   GRUPOS DE ITENS
══════════════════════════════════════════════════════════ */
async function listarGrupos(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM grupos_item WHERE empresa_id = ? ORDER BY descricao',
      [req.user.empresa_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar grupos.', error: err.message });
  }
}

async function criarGrupo(req, res) {
  const { descricao } = req.body;
  if (!descricao) return res.status(400).json({ message: 'Descrição obrigatória.' });
  try {
    const [r] = await pool.query(
      'INSERT INTO grupos_item (empresa_id, descricao) VALUES (?, ?)',
      [req.user.empresa_id, descricao.trim()]
    );
    res.status(201).json({ id: r.insertId, descricao, status: 'ativo' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar grupo.', error: err.message });
  }
}

async function atualizarGrupo(req, res) {
  const { id } = req.params;
  const { descricao, status } = req.body;
  try {
    await pool.query(
      'UPDATE grupos_item SET descricao = ?, status = ? WHERE id = ? AND empresa_id = ?',
      [descricao, status, id, req.user.empresa_id]
    );
    res.json({ message: 'Grupo atualizado.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar grupo.', error: err.message });
  }
}

async function excluirGrupo(req, res) {
  const { id } = req.params;
  try {
    await pool.query(
      'DELETE FROM grupos_item WHERE id = ? AND empresa_id = ?',
      [id, req.user.empresa_id]
    );
    res.json({ message: 'Grupo excluído.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir grupo.', error: err.message });
  }
}

/* ══════════════════════════════════════════════════════════
   SUBGRUPOS DE ITENS
══════════════════════════════════════════════════════════ */
async function listarSubgrupos(req, res) {
  try {
    const { grupo_id } = req.query;
    let sql = `SELECT s.*, g.descricao AS grupo_nome
               FROM subgrupos_item s
               JOIN grupos_item g ON g.id = s.id_grupo
               WHERE s.empresa_id = ?`;
    const params = [req.user.empresa_id];
    if (grupo_id) { sql += ' AND s.id_grupo = ?'; params.push(grupo_id); }
    sql += ' ORDER BY g.descricao, s.descricao';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar subgrupos.', error: err.message });
  }
}

async function criarSubgrupo(req, res) {
  const { id_grupo, descricao } = req.body;
  if (!id_grupo || !descricao) return res.status(400).json({ message: 'Grupo e descrição obrigatórios.' });
  try {
    const [[g]] = await pool.query('SELECT id FROM grupos_item WHERE id=? AND empresa_id=?', [id_grupo, req.user.empresa_id]);
    if (!g) return res.status(400).json({ message: 'Grupo inválido.' });
    const [r] = await pool.query(
      'INSERT INTO subgrupos_item (empresa_id, id_grupo, descricao) VALUES (?, ?, ?)',
      [req.user.empresa_id, id_grupo, descricao.trim()]
    );
    res.status(201).json({ id: r.insertId, id_grupo, descricao, status: 'ativo' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar subgrupo.', error: err.message });
  }
}

async function atualizarSubgrupo(req, res) {
  const { id } = req.params;
  const { id_grupo, descricao, status } = req.body;
  try {
    await pool.query(
      'UPDATE subgrupos_item SET id_grupo=?, descricao=?, status=? WHERE id=? AND empresa_id=?',
      [id_grupo, descricao, status, id, req.user.empresa_id]
    );
    res.json({ message: 'Subgrupo atualizado.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar subgrupo.', error: err.message });
  }
}

async function excluirSubgrupo(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM subgrupos_item WHERE id=? AND empresa_id=?', [id, req.user.empresa_id]);
    res.json({ message: 'Subgrupo excluído.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir subgrupo.', error: err.message });
  }
}

/* ══════════════════════════════════════════════════════════
   ITENS DE COMPRA
══════════════════════════════════════════════════════════ */
async function listarItens(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, g.descricao AS grupo_nome, s.descricao AS subgrupo_nome
       FROM itens_compra i
       LEFT JOIN grupos_item g    ON g.id = i.id_grupo
       LEFT JOIN subgrupos_item s ON s.id = i.id_subgrupo
       WHERE i.empresa_id = ? AND i.status = 'ativo'
       ORDER BY g.descricao, i.descricao`,
      [req.user.empresa_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar itens.', error: err.message });
  }
}

async function criarItem(req, res) {
  const { id_grupo, id_subgrupo, descricao, unidade, especificacao } = req.body;
  if (!descricao || !unidade) return res.status(400).json({ message: 'Descrição e unidade obrigatórias.' });
  try {
    const [r] = await pool.query(
      'INSERT INTO itens_compra (empresa_id, id_grupo, id_subgrupo, descricao, unidade, especificacao) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.empresa_id, id_grupo || null, id_subgrupo || null, descricao.trim(), unidade.trim(), especificacao || null]
    );
    res.status(201).json({ id: r.insertId, descricao, unidade });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar item.', error: err.message });
  }
}

async function atualizarItem(req, res) {
  const { id } = req.params;
  const { id_grupo, id_subgrupo, descricao, unidade, especificacao, status } = req.body;
  try {
    await pool.query(
      `UPDATE itens_compra SET id_grupo=?, id_subgrupo=?, descricao=?, unidade=?, especificacao=?, status=?
       WHERE id = ? AND empresa_id = ?`,
      [id_grupo || null, id_subgrupo || null, descricao, unidade, especificacao || null, status, id, req.user.empresa_id]
    );
    res.json({ message: 'Item atualizado.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar item.', error: err.message });
  }
}

/* ══════════════════════════════════════════════════════════
   COTAÇÕES
══════════════════════════════════════════════════════════ */
async function listarCotacoes(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.nome AS usuario_nome,
              COUNT(DISTINCT ci.id) AS total_itens,
              COUNT(DISTINCT cf.id) AS total_fornecedores,
              COUNT(DISTINCT CASE WHEN cf.status='respondido' THEN cf.id END) AS respondidos,
              COALESCE(SUM(DISTINCT p.valor_total), 0) AS valor_pedidos
       FROM cotacoes c
       JOIN  usuarios u           ON u.id = c.id_usuario
       LEFT JOIN cotacao_itens ci ON ci.id_cotacao = c.id
       LEFT JOIN cotacao_fornecedores cf ON cf.id_cotacao = c.id
       LEFT JOIN pedidos_compra p ON p.id_cotacao = c.id
       WHERE c.empresa_id = ?
       GROUP BY c.id
       ORDER BY c.criado_em DESC`,
      [req.user.empresa_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar cotações.', error: err.message });
  }
}

async function obterCotacao(req, res) {
  const { id } = req.params;
  try {
    const [[cotacao]] = await pool.query(
      `SELECT c.*, u.nome AS usuario_nome,
              o.nome AS obra_nome, oe.nome AS etapa_nome
       FROM cotacoes c
       JOIN usuarios u ON u.id = c.id_usuario
       LEFT JOIN obras o ON o.id = c.obra_id
       LEFT JOIN etapas oe ON oe.id = c.etapa_id
       WHERE c.id = ? AND c.empresa_id = ?`,
      [id, req.user.empresa_id]
    );
    if (!cotacao) return res.status(404).json({ message: 'Cotação não encontrada.' });

    const [itens] = await pool.query(
      `SELECT ci.*, i.descricao, i.unidade, i.especificacao, g.descricao AS grupo_nome
       FROM cotacao_itens ci
       JOIN itens_compra i ON i.id = ci.id_item
       LEFT JOIN grupos_item g ON g.id = i.id_grupo
       WHERE ci.id_cotacao = ?`,
      [id]
    );

    const [fornecedores] = await pool.query(
      `SELECT cf.*, f.razao_social, f.nome_fantasia, f.cnpj, f.contato
       FROM cotacao_fornecedores cf
       JOIN fornecedores f ON f.id = cf.id_fornecedor
       WHERE cf.id_cotacao = ?`,
      [id]
    );

    const [respostas] = await pool.query(
      `SELECT r.*, f.razao_social, f.nome_fantasia FROM respostas_cotacao r
       JOIN fornecedores f ON f.id = r.id_fornecedor
       WHERE r.id_cotacao = ?`,
      [id]
    );

    for (const resp of respostas) {
      const [itensResp] = await pool.query(
        'SELECT ri.*, ci.id_item FROM resposta_itens ri JOIN cotacao_itens ci ON ci.id = ri.id_cotacao_item WHERE ri.id_resposta = ?',
        [resp.id]
      );
      resp.itens = itensResp;
    }

    res.json({ ...cotacao, itens, fornecedores, respostas });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter cotação.', error: err.message });
  }
}

async function criarCotacao(req, res) {
  const { titulo, data_validade, observacoes, itens, obra_id, etapa_id } = req.body;
  if (!itens || !itens.length) return res.status(400).json({ message: 'Adicione pelo menos um item.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const data_criacao = new Date().toISOString().split('T')[0];
    const [r] = await conn.query(
      'INSERT INTO cotacoes (empresa_id, obra_id, etapa_id, numero, titulo, data_criacao, data_validade, id_usuario, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.empresa_id, obra_id||null, etapa_id||null, 'TEMP', titulo || null, data_criacao, data_validade || null, req.user.id, observacoes || null]
    );

    const numero = gerarNumero('COT', r.insertId);
    await conn.query('UPDATE cotacoes SET numero = ? WHERE id = ?', [numero, r.insertId]);

    for (const item of itens) {
      await conn.query(
        'INSERT INTO cotacao_itens (id_cotacao, id_item, quantidade, justificativa) VALUES (?, ?, ?, ?)',
        [r.insertId, item.id_item, item.quantidade, item.justificativa || null]
      );
    }

    await conn.commit();
    res.status(201).json({ id: r.insertId, numero, message: 'Cotação criada com sucesso.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Erro ao criar cotação.', error: err.message });
  } finally {
    conn.release();
  }
}

async function atualizarCotacao(req, res) {
  const { id } = req.params;
  const { titulo, data_validade, observacoes, obra_id, etapa_id, status } = req.body;
  const statusValidos = ['aberta','enviada','respondida','finalizada'];
  try {
    let sql = 'UPDATE cotacoes SET titulo=?, data_validade=?, observacoes=?, obra_id=?, etapa_id=?';
    const params = [titulo || null, data_validade || null, observacoes || null, obra_id||null, etapa_id||null];
    if (status && statusValidos.includes(status)) { sql += ', status=?'; params.push(status); }
    sql += ' WHERE id=? AND empresa_id=?';
    params.push(id, req.user.empresa_id);
    await pool.query(sql, params);
    res.json({ message: 'Cotação atualizada.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar cotação.', error: err.message });
  }
}

async function excluirCotacao(req, res) {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    const [[cot]] = await conn.query('SELECT status FROM cotacoes WHERE id=? AND empresa_id=?', [id, req.user.empresa_id]);
    if (!cot) return res.status(404).json({ message: 'Cotação não encontrada.' });
    await conn.beginTransaction();
    // Remove filhos em ordem para respeitar FK
    // 1. pedido_itens (referencia cotacao_itens com RESTRICT — deve ser removido primeiro)
    const [pedidos] = await conn.query('SELECT id FROM pedidos_compra WHERE id_cotacao=?', [id]);
    for (const p of pedidos) {
      await conn.query('DELETE FROM pedido_itens WHERE id_pedido=?', [p.id]);
    }
    await conn.query('DELETE FROM pedidos_compra WHERE id_cotacao=?', [id]);
    // 2. respostas dos fornecedores
    const [respostas] = await conn.query('SELECT id FROM cotacao_fornecedores WHERE id_cotacao=?', [id]);
    for (const r of respostas) {
      await conn.query('DELETE FROM resposta_itens WHERE id_resposta=?', [r.id]);
    }
    await conn.query('DELETE FROM cotacao_fornecedores WHERE id_cotacao=?', [id]);
    // 3. itens e cotação
    await conn.query('DELETE FROM cotacao_itens WHERE id_cotacao=?', [id]);
    await conn.query('DELETE FROM cotacoes WHERE id=? AND empresa_id=?', [id, req.user.empresa_id]);
    await conn.commit();
    res.json({ message: 'Cotação excluída.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Erro ao excluir cotação.', error: err.message });
  } finally {
    conn.release();
  }
}

/* ══════════════════════════════════════════════════════════
   ENVIO PARA FORNECEDORES
══════════════════════════════════════════════════════════ */
async function enviarParaFornecedores(req, res) {
  const { id } = req.params;
  const { fornecedores_ids } = req.body;
  if (!fornecedores_ids || !fornecedores_ids.length) {
    return res.status(400).json({ message: 'Selecione pelo menos um fornecedor.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[cot]] = await conn.query('SELECT id, empresa_id FROM cotacoes WHERE id=? AND empresa_id=?', [id, req.user.empresa_id]);
    if (!cot) return res.status(404).json({ message: 'Cotação não encontrada.' });

    const links = [];
    for (const fid of fornecedores_ids) {
      const token = uuidv4().replace(/-/g, '');
      const [[exists]] = await conn.query('SELECT id FROM cotacao_fornecedores WHERE id_cotacao=? AND id_fornecedor=?', [id, fid]);
      if (!exists) {
        await conn.query(
          'INSERT INTO cotacao_fornecedores (id_cotacao, id_fornecedor, token) VALUES (?, ?, ?)',
          [id, fid, token]
        );
        links.push({ fornecedor_id: fid, token, link: `/app/cotacao-responder.html?token=${token}` });
      }
    }

    await conn.query("UPDATE cotacoes SET status='enviada' WHERE id=?", [id]);
    await conn.commit();

    res.json({ message: 'Cotação enviada com sucesso.', links });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Erro ao enviar cotação.', error: err.message });
  } finally {
    conn.release();
  }
}

/* ══════════════════════════════════════════════════════════
   PORTAL DO FORNECEDOR (público — sem auth)
══════════════════════════════════════════════════════════ */
async function obterCotacaoPorToken(req, res) {
  const { token } = req.params;
  try {
    const [[cf]] = await pool.query(
      `SELECT cf.*, c.titulo, c.data_validade, c.observacoes AS obs_geral,
              f.razao_social, f.nome_fantasia,
              COALESCE(e.nome_fantasia, e.razao_social) AS empresa_nome
       FROM cotacao_fornecedores cf
       JOIN cotacoes c   ON c.id = cf.id_cotacao
       JOIN fornecedores f ON f.id = cf.id_fornecedor
       JOIN empresas e    ON e.id = c.empresa_id
       WHERE cf.token = ?`,
      [token]
    );
    if (!cf) return res.status(404).json({ message: 'Link inválido ou expirado.' });
    if (cf.status === 'respondido') return res.status(400).json({ message: 'Você já respondeu esta cotação.', code: 'ALREADY_ANSWERED' });

    const [itens] = await pool.query(
      `SELECT ci.id, ci.quantidade, i.descricao, i.unidade, i.especificacao, g.descricao AS grupo_nome
       FROM cotacao_itens ci
       JOIN itens_compra i ON i.id = ci.id_item
       LEFT JOIN grupos_item g ON g.id = i.id_grupo
       WHERE ci.id_cotacao = ?
       ORDER BY g.descricao, i.descricao`,
      [cf.id_cotacao]
    );

    res.json({
      cotacao_id: cf.id_cotacao,
      cotacao_fornecedor_id: cf.id,
      titulo: cf.titulo,
      data_validade: cf.data_validade,
      obs_geral: cf.obs_geral,
      empresa_nome: cf.empresa_nome,
      fornecedor: { razao_social: cf.razao_social, nome_fantasia: cf.nome_fantasia },
      itens
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao carregar cotação.', error: err.message });
  }
}

async function responderCotacao(req, res) {
  const { token } = req.params;
  const { itens, observacoes } = req.body;
  if (!itens || !itens.length) return res.status(400).json({ message: 'Informe os valores dos itens.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[cf]] = await conn.query('SELECT * FROM cotacao_fornecedores WHERE token=?', [token]);
    if (!cf) return res.status(404).json({ message: 'Link inválido.' });
    if (cf.status === 'respondido') return res.status(400).json({ message: 'Você já respondeu esta cotação.' });

    const [[jaExiste]] = await conn.query('SELECT id FROM respostas_cotacao WHERE id_cotacao=? AND id_fornecedor=?', [cf.id_cotacao, cf.id_fornecedor]);
    if (jaExiste) return res.status(400).json({ message: 'Resposta já registrada.' });

    const [r] = await conn.query(
      'INSERT INTO respostas_cotacao (id_cotacao, id_fornecedor, id_cotacao_fornecedor, observacoes) VALUES (?, ?, ?, ?)',
      [cf.id_cotacao, cf.id_fornecedor, cf.id, observacoes || null]
    );

    for (const item of itens) {
      if (!item.valor_unitario || item.valor_unitario <= 0) continue;
      await conn.query(
        'INSERT INTO resposta_itens (id_resposta, id_cotacao_item, valor_unitario, marca, observacao) VALUES (?, ?, ?, ?, ?)',
        [r.insertId, item.id_cotacao_item, item.valor_unitario, item.marca || null, item.observacao || null]
      );
    }

    await conn.query("UPDATE cotacao_fornecedores SET status='respondido', respondido_em=NOW() WHERE id=?", [cf.id]);
    await conn.query("UPDATE cotacoes SET status='respondida' WHERE id=? AND status='enviada'", [cf.id_cotacao]);

    await conn.commit();
    res.json({ message: 'Resposta enviada com sucesso! Obrigado.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Erro ao registrar resposta.', error: err.message });
  } finally {
    conn.release();
  }
}

/* ══════════════════════════════════════════════════════════
   MAPA DE COTAÇÃO
══════════════════════════════════════════════════════════ */
async function obterMapa(req, res) {
  const { id } = req.params;
  try {
    const [[cot]] = await pool.query('SELECT * FROM cotacoes WHERE id=? AND empresa_id=?', [id, req.user.empresa_id]);
    if (!cot) return res.status(404).json({ message: 'Cotação não encontrada.' });

    const [itens] = await pool.query(
      `SELECT ci.id, ci.quantidade, i.descricao, i.unidade FROM cotacao_itens ci
       JOIN itens_compra i ON i.id = ci.id_item WHERE ci.id_cotacao = ?`,
      [id]
    );

    const [respostas] = await pool.query(
      `SELECT r.id, r.id_fornecedor, f.razao_social, f.nome_fantasia FROM respostas_cotacao r
       JOIN fornecedores f ON f.id = r.id_fornecedor WHERE r.id_cotacao = ?`,
      [id]
    );

    for (const resp of respostas) {
      const [ri] = await pool.query('SELECT * FROM resposta_itens WHERE id_resposta=?', [resp.id]);
      resp.itens = ri;
    }

    // Calcular menor preço por item (usa preco_negociado se existir)
    const mapa = itens.map(item => {
      const precos = respostas.map(resp => {
        const ri = resp.itens.find(i => i.id_cotacao_item === item.id);
        if (!ri) return null;
        const preco_base    = parseFloat(ri.valor_unitario);
        const preco_negoc   = ri.preco_negociado != null ? parseFloat(ri.preco_negociado) : null;
        const preco_efetivo = preco_negoc != null ? preco_negoc : preco_base;
        return {
          fornecedor_id:    resp.id_fornecedor,
          razao_social:     resp.razao_social,
          nome_fantasia:    resp.nome_fantasia,
          resposta_item_id: ri.id,
          valor_unitario:   preco_base,
          preco_negociado:  preco_negoc,
          preco_efetivo,
          marca:            ri.marca,
          observacao:       ri.observacao,
          valor_total:      preco_efetivo * parseFloat(item.quantidade)
        };
      }).filter(Boolean);

      const menorPreco = precos.length ? Math.min(...precos.map(p => p.preco_efetivo)) : null;
      precos.forEach(p => { p.eh_menor = p.preco_efetivo === menorPreco; });

      return { ...item, precos, menor_preco: menorPreco };
    });

    const totais = respostas.map(resp => ({
      fornecedor_id:  resp.id_fornecedor,
      razao_social:   resp.razao_social,
      nome_fantasia:  resp.nome_fantasia,
      total_cotado:   mapa.reduce((acc, item) => {
        const p = item.precos.find(p => p.fornecedor_id === resp.id_fornecedor);
        return acc + (p ? p.valor_unitario * parseFloat(item.quantidade) : 0);
      }, 0),
      total_negociado: mapa.reduce((acc, item) => {
        const p = item.precos.find(p => p.fornecedor_id === resp.id_fornecedor);
        return acc + (p ? p.valor_total : 0);
      }, 0)
    }));

    res.json({ cotacao: { ...cot, id: cot.id }, itens: mapa, fornecedores: respostas.map(r => ({ id: r.id_fornecedor, razao_social: r.razao_social, nome_fantasia: r.nome_fantasia })), totais });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao gerar mapa.', error: err.message });
  }
}

async function listarVencedores(req, res) {
  const { id } = req.params;
  try {
    const [[cot]] = await pool.query('SELECT id FROM cotacoes WHERE id=? AND empresa_id=?', [id, req.user.empresa_id]);
    if (!cot) return res.status(404).json({ message: 'Cotação não encontrada.' });
    const [rows] = await pool.query(
      'SELECT * FROM mapa_cotacao WHERE id_cotacao = ?',
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar vencedores.', error: err.message });
  }
}

async function salvarVencedores(req, res) {
  const { id } = req.params;
  const { vencedores } = req.body; // [{ id_cotacao_item, id_fornecedor, valor_unitario, eh_menor_preco, justificativa }]

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const v of vencedores) {
      await conn.query(
        `INSERT INTO mapa_cotacao (id_cotacao, id_cotacao_item, id_fornecedor_vencedor, valor_vencedor, eh_menor_preco, justificativa)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id_fornecedor_vencedor=VALUES(id_fornecedor_vencedor), valor_vencedor=VALUES(valor_vencedor), eh_menor_preco=VALUES(eh_menor_preco), justificativa=VALUES(justificativa)`,
        [id, v.id_cotacao_item, v.id_fornecedor, v.valor_unitario, v.eh_menor_preco ? 1 : 0, v.justificativa || null]
      );
    }
    await conn.commit();
    res.json({ message: 'Vencedores salvos.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Erro ao salvar vencedores.', error: err.message });
  } finally {
    conn.release();
  }
}

/* ══════════════════════════════════════════════════════════
   PEDIDO DE COMPRA
══════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════
   NEGOCIAÇÃO DE PREÇOS
══════════════════════════════════════════════════════════ */
async function negociarFornecedor(req, res) {
  // itens: [{ resposta_item_id, preco_negociado }]  — negociação por item
  // desconto_percentual: número  — aplica rateio proporcional
  // valor_global: número         — calcula % e aplica rateio
  const { id } = req.params; // id_cotacao
  const { id_fornecedor, itens, desconto_percentual, valor_global } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verifica se cotação pertence à empresa
    const [[cot]] = await conn.query('SELECT id FROM cotacoes WHERE id=? AND empresa_id=?', [id, req.user.empresa_id]);
    if (!cot) return res.status(404).json({ message: 'Cotação não encontrada.' });

    // Busca resposta do fornecedor
    const [[resp]] = await conn.query('SELECT id FROM respostas_cotacao WHERE id_cotacao=? AND id_fornecedor=?', [id, id_fornecedor]);
    if (!resp) return res.status(404).json({ message: 'Resposta do fornecedor não encontrada.' });

    if (itens && itens.length) {
      // Modo: edição por item (ou resultado de rateio já calculado no frontend)
      for (const it of itens) {
        await conn.query(
          'UPDATE resposta_itens SET preco_negociado=? WHERE id=? AND id_resposta=?',
          [it.preco_negociado != null ? it.preco_negociado : null, it.resposta_item_id, resp.id]
        );
      }
    } else if (desconto_percentual != null || valor_global != null) {
      // Modo: desconto global — busca todos os itens e aplica rateio
      const [ri] = await conn.query(
        'SELECT id, valor_unitario, id_cotacao_item FROM resposta_itens WHERE id_resposta=?',
        [resp.id]
      );
      // Busca quantidades para calcular total cotado
      const total_cotado = ri.reduce((acc, item) => acc + parseFloat(item.valor_unitario), 0);

      let pct;
      if (valor_global != null) {
        // Calcula desconto a partir do valor global
        const [ciRows] = await conn.query(
          `SELECT ci.id, ci.quantidade FROM cotacao_itens ci WHERE ci.id_cotacao=?`, [id]
        );
        const qtdMap = {};
        ciRows.forEach(c => { qtdMap[c.id] = parseFloat(c.quantidade); });
        const total_com_qtd = ri.reduce((acc, item) => acc + parseFloat(item.valor_unitario) * (qtdMap[item.id_cotacao_item] || 1), 0);
        pct = total_com_qtd > 0 ? (1 - parseFloat(valor_global) / total_com_qtd) : 0;
      } else {
        pct = parseFloat(desconto_percentual) / 100;
      }

      for (const item of ri) {
        const negociado = parseFloat(item.valor_unitario) * (1 - pct);
        await conn.query(
          'UPDATE resposta_itens SET preco_negociado=? WHERE id=? AND id_resposta=?',
          [Math.round(negociado * 10000) / 10000, item.id, resp.id]
        );
      }
    } else {
      return res.status(400).json({ message: 'Informe itens, desconto_percentual ou valor_global.' });
    }

    await conn.commit();
    res.json({ message: 'Negociação salva com sucesso.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Erro ao salvar negociação.', error: err.message });
  } finally {
    conn.release();
  }
}

async function limparNegociacao(req, res) {
  const { id } = req.params;
  const { id_fornecedor } = req.body;
  try {
    const [[cot]] = await pool.query('SELECT id FROM cotacoes WHERE id=? AND empresa_id=?', [id, req.user.empresa_id]);
    if (!cot) return res.status(404).json({ message: 'Cotação não encontrada.' });
    const [[resp]] = await pool.query('SELECT id FROM respostas_cotacao WHERE id_cotacao=? AND id_fornecedor=?', [id, id_fornecedor]);
    if (!resp) return res.status(404).json({ message: 'Resposta não encontrada.' });
    await pool.query('UPDATE resposta_itens SET preco_negociado=NULL WHERE id_resposta=?', [resp.id]);
    res.json({ message: 'Negociação removida.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao limpar negociação.', error: err.message });
  }
}

async function gerarPedido(req, res) {
  const { id_cotacao, id_fornecedor, itens_ids } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Busca cotação para pegar obra_id e etapa_id
    const [[cotacao]] = await conn.query('SELECT obra_id, etapa_id FROM cotacoes WHERE id=? AND empresa_id=?', [id_cotacao, req.user.empresa_id]);
    if (!cotacao) return res.status(404).json({ message: 'Cotação não encontrada.' });

    // Busca nome do fornecedor
    const [[forn]] = await conn.query('SELECT razao_social, nome_fantasia FROM fornecedores WHERE id=?', [id_fornecedor]);
    const fornNome = forn ? (forn.nome_fantasia || forn.razao_social) : '';

    // Busca itens do mapa para o fornecedor
    const [itensMapa] = await conn.query(
      `SELECT mc.*, ci.quantidade, i.descricao, i.unidade FROM mapa_cotacao mc
       JOIN cotacao_itens ci ON ci.id = mc.id_cotacao_item
       JOIN itens_compra i   ON i.id  = ci.id_item
       WHERE mc.id_cotacao = ? AND mc.id_fornecedor_vencedor = ?
       ${itens_ids && itens_ids.length ? 'AND mc.id_cotacao_item IN (?)' : ''}`,
      itens_ids && itens_ids.length
        ? [id_cotacao, id_fornecedor, itens_ids]
        : [id_cotacao, id_fornecedor]
    );

    if (!itensMapa.length) return res.status(400).json({ message: 'Nenhum item encontrado para o fornecedor.' });

    // Busca precos negociados da resposta do fornecedor
    const [[resposta]] = await conn.query('SELECT id FROM respostas_cotacao WHERE id_cotacao=? AND id_fornecedor=?', [id_cotacao, id_fornecedor]);
    let negociadosMap = {};
    if (resposta) {
      const [riRows] = await conn.query('SELECT id_cotacao_item, preco_negociado FROM resposta_itens WHERE id_resposta=?', [resposta.id]);
      riRows.forEach(r => { if (r.preco_negociado != null) negociadosMap[r.id_cotacao_item] = parseFloat(r.preco_negociado); });
    }

    // Usa preco negociado se existir, senão usa valor_vencedor do mapa
    const valorTotal = itensMapa.reduce((acc, i) => {
      const preco = negociadosMap[i.id_cotacao_item] != null ? negociadosMap[i.id_cotacao_item] : parseFloat(i.valor_vencedor);
      return acc + preco * parseFloat(i.quantidade);
    }, 0);

    const data_pedido = new Date().toISOString().split('T')[0];

    const [r] = await conn.query(
      'INSERT INTO pedidos_compra (empresa_id, numero, id_cotacao, obra_id, etapa_id, id_fornecedor, data_pedido, valor_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.empresa_id, 'TEMP', id_cotacao, cotacao.obra_id||null, cotacao.etapa_id||null, id_fornecedor, data_pedido, valorTotal]
    );

    const numero = gerarNumero('PC', r.insertId);
    await conn.query('UPDATE pedidos_compra SET numero=? WHERE id=?', [numero, r.insertId]);

    for (const item of itensMapa) {
      const preco = negociadosMap[item.id_cotacao_item] != null ? negociadosMap[item.id_cotacao_item] : parseFloat(item.valor_vencedor);
      const vt = preco * parseFloat(item.quantidade);
      await conn.query(
        'INSERT INTO pedido_itens (id_pedido, id_cotacao_item, quantidade, valor_unitario, valor_total) VALUES (?, ?, ?, ?, ?)',
        [r.insertId, item.id_cotacao_item, item.quantidade, preco, vt]
      );
    }

    await conn.query("UPDATE cotacoes SET status='finalizada' WHERE id=?", [id_cotacao]);
    await conn.commit();

    res.status(201).json({ id: r.insertId, numero, valorTotal, fornecedor: fornNome, message: 'Pedido de compra gerado.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Erro ao gerar pedido.', error: err.message });
  } finally {
    conn.release();
  }
}

/* ── Query reutilizável de pedido ───────────────────────── */
const PEDIDO_SELECT = `
  SELECT p.*, f.razao_social, f.nome_fantasia, f.cnpj, f.telefone, f.email AS forn_email,
         f.endereco AS forn_endereco, f.cidade AS forn_cidade, f.estado AS forn_estado,
         c.numero AS cotacao_numero, c.titulo AS cotacao_titulo,
         o.nome AS obra_nome, o.endereco AS obra_endereco,
         COALESCE(e.nome_fantasia, e.razao_social) AS empresa_nome,
         e.cnpj AS empresa_cnpj, e.telefone AS empresa_telefone, e.email AS empresa_email
  FROM pedidos_compra p
  JOIN fornecedores f  ON f.id  = p.id_fornecedor
  JOIN cotacoes c      ON c.id  = p.id_cotacao
  LEFT JOIN obras o    ON o.id  = p.obra_id
  LEFT JOIN empresas e ON e.id  = p.empresa_id`;

const ITENS_SELECT = `
  SELECT pi.*, i.descricao, i.unidade
  FROM pedido_itens pi
  JOIN cotacao_itens ci ON ci.id = pi.id_cotacao_item
  JOIN itens_compra i   ON i.id  = ci.id_item
  WHERE pi.id_pedido=?`;

async function obterPedidoPublico(req, res) {
  const { token } = req.params;
  try {
    const [[pedido]] = await pool.query(`${PEDIDO_SELECT} WHERE p.share_token=?`, [token]);
    if (!pedido) return res.status(404).json({ message: 'Pedido não encontrado.' });
    const [itens] = await pool.query(ITENS_SELECT, [pedido.id]);
    res.json({ ...pedido, itens });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter pedido.', error: err.message });
  }
}

async function gerarShareTokenPedido(req, res) {
  const { id } = req.params;
  try {
    const [[pedido]] = await pool.query('SELECT id, share_token FROM pedidos_compra WHERE id=? AND empresa_id=?', [id, req.user.empresa_id]);
    if (!pedido) return res.status(404).json({ message: 'Pedido não encontrado.' });
    let token = pedido.share_token;
    if (!token) {
      token = uuidv4();
      await pool.query('UPDATE pedidos_compra SET share_token=? WHERE id=?', [token, id]);
    }
    res.json({ token, url: `/app/pedido-compra.html?token=${token}` });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao gerar link.', error: err.message });
  }
}

async function obterPedido(req, res) {
  const { id } = req.params;
  try {
    const [[pedido]] = await pool.query(`${PEDIDO_SELECT} WHERE p.id=? AND p.empresa_id=?`, [id, req.user.empresa_id]);
    if (!pedido) return res.status(404).json({ message: 'Pedido não encontrado.' });
    const [itens] = await pool.query(ITENS_SELECT, [id]);
    res.json({ ...pedido, itens });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter pedido.', error: err.message });
  }
}

async function listarPedidos(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, f.razao_social, f.nome_fantasia, c.numero AS cotacao_numero, c.titulo AS cotacao_titulo,
              COUNT(pi.id) AS total_itens
       FROM pedidos_compra p
       JOIN fornecedores f ON f.id = p.id_fornecedor
       JOIN cotacoes c     ON c.id = p.id_cotacao
       LEFT JOIN pedido_itens pi ON pi.id_pedido = p.id
       WHERE p.empresa_id = ?
       GROUP BY p.id
       ORDER BY p.criado_em DESC`,
      [req.user.empresa_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar pedidos.', error: err.message });
  }
}

/* ══════════════════════════════════════════════════════════
   COMPARTILHAMENTO PÚBLICO DO MAPA
══════════════════════════════════════════════════════════ */
async function gerarShareToken(req, res) {
  const { id } = req.params;
  try {
    // Garante que a coluna existe
    await pool.query(`ALTER TABLE cotacoes ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) NULL`).catch(() => {});

    const [[cot]] = await pool.query('SELECT id, share_token FROM cotacoes WHERE id=? AND empresa_id=?', [id, req.user.empresa_id]);
    if (!cot) return res.status(404).json({ message: 'Cotação não encontrada.' });

    let token = cot.share_token;
    if (!token) {
      token = uuidv4().replace(/-/g, '');
      await pool.query('UPDATE cotacoes SET share_token=? WHERE id=?', [token, id]);
    }

    res.json({ token, url: `/app/mapa-publico.html?t=${token}` });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao gerar link.', error: err.message });
  }
}

async function obterMapaPublico(req, res) {
  const { token } = req.params;
  try {
    const [[cot]] = await pool.query('SELECT * FROM cotacoes WHERE share_token=?', [token]);
    if (!cot) return res.status(404).json({ message: 'Link inválido ou expirado.' });

    // Reutiliza a mesma lógica do obterMapa mas sem restrição de empresa_id
    const [itens] = await pool.query(
      `SELECT ci.id, ci.quantidade, i.descricao, i.unidade FROM cotacao_itens ci
       JOIN itens_compra i ON i.id = ci.id_item WHERE ci.id_cotacao = ?`, [cot.id]
    );
    const [respostas] = await pool.query(
      `SELECT r.id, r.id_fornecedor, f.razao_social, f.nome_fantasia FROM respostas_cotacao r
       JOIN fornecedores f ON f.id = r.id_fornecedor WHERE r.id_cotacao = ?`, [cot.id]
    );
    for (const resp of respostas) {
      const [ri] = await pool.query('SELECT * FROM resposta_itens WHERE id_resposta=?', [resp.id]);
      resp.itens = ri;
    }

    const mapa = itens.map(item => {
      const precos = respostas.map(resp => {
        const ri = resp.itens.find(i => i.id_cotacao_item === item.id);
        if (!ri) return null;
        const preco_base    = parseFloat(ri.valor_unitario);
        const preco_negoc   = ri.preco_negociado != null ? parseFloat(ri.preco_negociado) : null;
        const preco_efetivo = preco_negoc != null ? preco_negoc : preco_base;
        return {
          fornecedor_id: resp.id_fornecedor,
          nome_fantasia: resp.nome_fantasia,
          razao_social:  resp.razao_social,
          valor_unitario: preco_base,
          preco_negociado: preco_negoc,
          preco_efetivo,
          marca: ri.marca,
          valor_total: preco_efetivo * parseFloat(item.quantidade)
        };
      }).filter(Boolean);

      const menorPreco = precos.length ? Math.min(...precos.map(p => p.preco_efetivo)) : null;
      precos.forEach(p => { p.eh_menor = p.preco_efetivo === menorPreco; });
      return { ...item, precos, menor_preco: menorPreco };
    });

    // Vencedores salvos
    const [vencedores] = await pool.query(
      'SELECT * FROM mapa_cotacao WHERE id_cotacao=?', [cot.id]
    ).catch(() => [[]]);

    res.json({
      cotacao: { numero: cot.numero, titulo: cot.titulo, status: cot.status, criado_em: cot.criado_em },
      itens: mapa,
      fornecedores: respostas.map(r => ({ id: r.id_fornecedor, razao_social: r.razao_social, nome_fantasia: r.nome_fantasia })),
      vencedores
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao carregar mapa.', error: err.message });
  }
}

module.exports = {
  listarFornecedores,
  listarGrupos, criarGrupo, atualizarGrupo, excluirGrupo,
  listarSubgrupos, criarSubgrupo, atualizarSubgrupo, excluirSubgrupo,
  listarItens, criarItem, atualizarItem,
  listarCotacoes, obterCotacao, criarCotacao, atualizarCotacao, excluirCotacao,
  enviarParaFornecedores,
  obterCotacaoPorToken, responderCotacao,
  obterMapa, listarVencedores, salvarVencedores,
  negociarFornecedor, limparNegociacao,
  gerarPedido, listarPedidos, obterPedido, gerarShareTokenPedido, obterPedidoPublico,
  gerarShareToken, obterMapaPublico
};
