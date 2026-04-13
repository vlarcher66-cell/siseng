/* ═══════════════════════════════════════════════════════════
   SISENG — Mapa de Cotação  v3.0
   Negociação: desconto %, valor global, edição por item
═══════════════════════════════════════════════════════════ */

/* ── Helpers de API ──────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token') || '';
}

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res  = await fetch(`/api/compras${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { localStorage.removeItem('sis_token'); window.location.href = '../index.html'; throw new Error('Não autorizado'); }
  if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
  return data;
}

async function loadObrasCount() {
  const token = localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token') || '';
  if (!token) return;
  try {
    const res = await fetch('/api/obras', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      const el = document.getElementById('obrasCount');
      if (el) el.textContent = data.length;
    }
  } catch(_) {}
}

/* ── Estado ──────────────────────────────────────────────── */
let cotacoes      = [];
let mapaAtual     = null;
let cotacaoIdAtual = null;
let vencedores    = {};
let pendingSelect = null;
// Negociação: { [fornecedor_id]: { [resposta_item_id]: preco_negociado } }
let negociacoes   = {};

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();

  renderSidebar('mapa');
  carregarListaCotacoes();
  loadObrasCount();
});

/* ── Carregar lista de cotações ──────────────────────────── */
async function carregarListaCotacoes() {
  try {
    const data = await api('GET', '/cotacoes');
    cotacoes = data.filter(c => ['respondida','finalizada'].includes(c.status));
    populateSelect();
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) { const sel = document.getElementById('selectCotacao'); sel.value = id; if (sel.value === id) loadMapa(parseInt(id)); }
  } catch (err) { showToast(err.message, 'error'); }
}

function populateSelect() {
  const sel = document.getElementById('selectCotacao');
  sel.innerHTML = '<option value="">— Selecione uma cotação com respostas —</option>';
  cotacoes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.numero} — ${c.titulo || 'Sem título'} (${c.respondidos || 0} resposta${c.respondidos!==1?'s':''})`;
    sel.appendChild(opt);
  });
  if (!cotacoes.length) sel.innerHTML += '<option disabled>Nenhuma cotação com respostas encontrada</option>';
}

/* ── Formatação ──────────────────────────────────────────── */
function formatCur(v) { return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function formatDate(d) { if (!d) return '—'; const [y,m,dd] = d.split('T')[0].split('-'); return `${dd}/${m}/${y}`; }

/* ══════════════════════════════════════════════════════════
   CARREGAR MAPA
══════════════════════════════════════════════════════════ */
async function loadMapa(cotacaoId) {
  if (!cotacaoId) {
    document.getElementById('mapaPlaceholder').classList.remove('hidden');
    document.getElementById('mapaContent').classList.add('hidden');
    return;
  }

  const placeholder = document.getElementById('mapaPlaceholder');
  placeholder.classList.remove('hidden');
  placeholder.innerHTML = '<div style="padding:60px;text-align:center;color:#2563eb"><i class="fas fa-circle-notch fa-spin" style="font-size:2rem"></i><p style="margin-top:12px;font-size:.85rem;color:#64748b">Carregando mapa de cotação...</p></div>';
  document.getElementById('mapaContent').classList.add('hidden');

  try {
    const data = await api('GET', `/cotacoes/${cotacaoId}/mapa`);
    mapaAtual      = data;
    cotacaoIdAtual = cotacaoId;
    vencedores = {};
    negociacoes = {};

    // Inicializa negociações com preco_negociado já salvo
    if (mapaAtual.itens) {
      mapaAtual.itens.forEach(item => {
        (item.precos || []).forEach(p => {
          if (p.preco_negociado != null) {
            if (!negociacoes[p.fornecedor_id]) negociacoes[p.fornecedor_id] = {};
            negociacoes[p.fornecedor_id][p.resposta_item_id] = p.preco_negociado;
          }
        });
      });
    }

    const vencedoresSalvos = await api('GET', `/cotacoes/${cotacaoId}/vencedores`).catch(() => []);
    if (Array.isArray(vencedoresSalvos) && vencedoresSalvos.length) {
      vencedoresSalvos.forEach(v => {
        vencedores[v.id_cotacao_item] = { id_fornecedor: v.id_fornecedor_vencedor, valor: parseFloat(v.valor_vencedor), eh_menor: !!v.eh_menor_preco, justificativa: v.justificativa || '' };
      });
    }

    if (!mapaAtual.itens || !mapaAtual.itens.length) {
      placeholder.innerHTML = '<div style="padding:60px;text-align:center;color:#94a3b8"><i class="fas fa-inbox" style="font-size:2rem"></i><p style="margin-top:12px">Esta cotação ainda não tem respostas de fornecedores.</p></div>';
      return;
    }

    placeholder.classList.add('hidden');
    document.getElementById('mapaContent').classList.remove('hidden');
    const btnComp = document.getElementById('btnCompartilhar');
    if (btnComp) btnComp.style.display = 'flex';
    document.getElementById('mapaInfo').textContent =
      `${mapaAtual.itens.length} ite${mapaAtual.itens.length !== 1 ? 'ns' : 'm'} • ${mapaAtual.fornecedores.length} fornecedor${mapaAtual.fornecedores.length !== 1 ? 'es' : ''}`;

    buildTable();
    buildSummary();

    if (!Object.keys(vencedores).length) { autoSelecionarMenores(); } else { refreshTableSelection(); buildSummary(); }

  } catch (err) {
    placeholder.innerHTML = `<div style="padding:60px;text-align:center;color:#ef4444"><i class="fas fa-exclamation-circle" style="font-size:2rem"></i><p style="margin-top:12px">${err.message}</p></div>`;
  }
}

/* ── Build table ─────────────────────────────────────────── */
function buildTable() {
  if (!mapaAtual) return;
  const { itens, fornecedores: forns } = mapaAtual;
  const head = document.getElementById('mapaTableHead');
  const body = document.getElementById('mapaTableBody');
  const foot = document.getElementById('mapaTableFoot');

  head.innerHTML = `
    <tr>
      <th class="th-item" rowspan="2">Item</th>
      <th class="th-qty" rowspan="2">Qtd</th>

      ${forns.map(f => {
        const nome = f.nome_fantasia || f.razao_social;
        return `<th class="th-forn" title="${nome}"><span class="th-forn-inner">${nome}</span></th>`;
      }).join('')}
      <th class="th-menor" rowspan="2">Negociação Sugerida</th>
    </tr>
    <tr>${forns.map(() => `<th class="th-sub">Unit. / Total</th>`).join('')}</tr>
  `;

  const totaisForn = forns.map(f => ({
    id: f.id,
    total: itens.reduce((acc, item) => {
      const p = (item.precos||[]).find(p => p.fornecedor_id === f.id);
      return acc + (p ? p.valor_total : 0);
    }, 0)
  }));
  const menorTotal = totaisForn.length ? Math.min(...totaisForn.filter(t => t.total > 0).map(t => t.total)) : 0;

  body.innerHTML = itens.map(item => {
    const precosCells = forns.map(resp => {
      const p = (item.precos||[]).find(p => p.fornecedor_id === resp.id);
      if (!p) return `<td class="td-preco"><span class="preco-sem">—</span></td>`;

      const isSel   = vencedores[item.id]?.id_fornecedor === resp.id;
      const negoc   = negociacoes[resp.id]?.[p.resposta_item_id];
      const temNeg  = negoc != null;
      const precoMostrar = temNeg ? negoc : p.valor_unitario;
      const totalMostrar = precoMostrar * parseFloat(item.quantidade);
      const cls     = p.eh_menor ? 'menor' : (isSel ? 'selecionado' : '');

      return `
        <td class="td-preco ${cls}" id="cell_${item.id}_${resp.id}">
          <div class="preco-cell">
            ${p.eh_menor ? '<span class="preco-badge-menor"><i class="fas fa-trophy"></i> Menor</span>' : ''}
            ${temNeg ? `<span class="preco-original">${formatCur(p.valor_unitario)}</span>` : ''}
            <span class="preco-unit ${temNeg ? 'negociado' : ''}">${formatCur(precoMostrar)}</span>
            <span class="preco-total">${formatCur(totalMostrar)}</span>
            ${p.marca ? `<span class="preco-marca">${p.marca}</span>` : ''}
            <button class="preco-select-btn ${isSel ? 'selected' : ''}"
                    id="btn_${item.id}_${resp.id}"
                    onclick="selecionarVencedor(${item.id}, ${resp.id}, ${precoMostrar}, ${p.eh_menor})">
              ${isSel ? '<i class="fas fa-check"></i> Selecionado' : 'Selecionar'}
            </button>
          </div>
        </td>
      `;
    }).join('');

    return `
      <tr>
        <td><div class="td-item-nome">${item.descricao}</div><div class="td-item-un">${item.unidade}</div></td>
        <td class="td-qty">${item.quantidade} ${item.unidade}</td>
        ${precosCells}
        <td class="td-menor-col">
          ${(() => {
            const venc = vencedores[item.id] || vencedores[String(item.id)];
            if (!venc) return '<span class="preco-sem">—</span>';
            // Usa sempre o fornecedor selecionado: negociado se houver, senão o cotado
            const p = (item.precos||[]).find(p => p.fornecedor_id === venc.id_fornecedor);
            if (!p) return '<span class="preco-sem">—</span>';
            const negoc = negociacoes[venc.id_fornecedor]?.[p.resposta_item_id];
            const precoFinal = negoc != null ? negoc : p.valor_unitario;
            const totalFinal = precoFinal * parseFloat(item.quantidade);
            const temNeg = negoc != null;
            return `<div class="preco-cell">
              ${temNeg ? `<span style="font-size:.68rem;color:#94a3b8;text-decoration:line-through">${formatCur(p.valor_unitario)}</span>` : ''}
              <span class="menor-unit">${formatCur(precoFinal)}</span>
              <span class="preco-total">${formatCur(totalFinal)} total</span>
            </div>`;
          })()}
        </td>
      </tr>`;
  }).join('');

  const footCells = totaisForn.map(t => {
    const isMenor = t.total > 0 && t.total === menorTotal;
    // Calcula total negociado desse fornecedor
    const totalNeg = itens.reduce((acc, item) => {
      const p = (item.precos||[]).find(p => p.fornecedor_id === t.id);
      if (!p) return acc;
      const negoc = negociacoes[t.id]?.[p.resposta_item_id];
      const pr = negoc != null ? negoc : p.valor_unitario;
      return acc + pr * parseFloat(item.quantidade);
    }, 0);
    const temNegociacao = totalNeg !== t.total;
    return `<td class="${isMenor ? 'td-total-menor' : 'td-total-val'}">
      ${temNegociacao ? `<div style="font-size:.68rem;color:#94a3b8;text-decoration:line-through">${formatCur(t.total)}</div>` : ''}
      ${formatCur(totalNeg)}${isMenor ? ' <i class="fas fa-trophy" style="font-size:.7rem"></i>' : ''}
    </td>`;
  }).join('');

  // Total da coluna "Negociação Sugerida" = soma dos preços do fornecedor selecionado (negociado ou cotado)
  const totalMenorPorItem = itens.reduce((acc, item) => {
    const venc = vencedores[item.id] || vencedores[String(item.id)];
    if (!venc) return acc;
    const p = (item.precos||[]).find(p => p.fornecedor_id === venc.id_fornecedor);
    if (!p) return acc;
    const negoc = negociacoes[venc.id_fornecedor]?.[p.resposta_item_id];
    const precoFinal = negoc != null ? negoc : p.valor_unitario;
    return acc + precoFinal * parseFloat(item.quantidade);
  }, 0);

  foot.innerHTML = `
    <tr>
      <td class="td-total-label"><i class="fas fa-calculator" style="margin-right:6px;color:#2563eb"></i>TOTAL</td>
      <td></td>
      ${footCells}
      <td style="text-align:center"><span style="font-weight:800;color:#15803d">${formatCur(totalMenorPorItem)}</span></td>
    </tr>`;
}

/* ── Auto selecionar menores ─────────────────────────────── */
function autoSelecionarMenores() {
  if (!mapaAtual) return;
  // Encontra o fornecedor com menor TOTAL geral e seleciona ele para todos os itens
  const { totais } = mapaAtual;
  if (!totais || !totais.length) return;
  const melhor = totais.filter(t => t.total_negociado > 0).sort((a, b) => a.total_negociado - b.total_negociado)[0];
  if (!melhor) return;
  selecionarTodosParaForn(melhor.fornecedor_id, '');
  refreshTableSelection();
  buildSummary();
}

/* ── Selecionar vencedor ─────────────────────────────────── */
function selecionarVencedor(itemId, fornId, valor, ehMenor) {
  // Verifica se já tem outro fornecedor selecionado em outro item
  const outroForn = Object.values(vencedores).find(v => v.id_fornecedor !== fornId);
  const temOutro  = outroForn != null;

  if (!ehMenor && temOutro) {
    // Fornecedor diferente e não é menor — pede justificativa
    pendingSelect = { itemId, fornId, valor, selecionarTodos: true };
    document.getElementById('fJustificativa').value = '';
    document.getElementById('modalJustificativa').classList.remove('hidden');
    return;
  }
  if (!ehMenor) {
    pendingSelect = { itemId, fornId, valor, selecionarTodos: true };
    document.getElementById('fJustificativa').value = vencedores[itemId]?.justificativa || '';
    document.getElementById('modalJustificativa').classList.remove('hidden');
    return;
  }

  // Seleciona TODOS os itens para este fornecedor
  selecionarTodosParaForn(fornId, '');
  refreshTableSelection();
  buildSummary();
}

function selecionarTodosParaForn(fornId, justificativa) {
  if (!mapaAtual) return;
  mapaAtual.itens.forEach(item => {
    const p = (item.precos||[]).find(p => p.fornecedor_id === fornId);
    if (p) {
      vencedores[item.id] = { id_fornecedor: fornId, valor: p.preco_efetivo, eh_menor: p.eh_menor, justificativa };
    }
  });
}

function confirmarSelecao() {
  if (!pendingSelect) return;
  const just = document.getElementById('fJustificativa').value.trim();
  if (!just) { showToast('Informe a justificativa.', 'error'); return; }
  const { fornId } = pendingSelect;
  selecionarTodosParaForn(fornId, just);
  pendingSelect = null;
  document.getElementById('modalJustificativa').classList.add('hidden');
  refreshTableSelection();
  buildSummary();
}

function closeModalJust(e) {
  if (e && e.target !== document.getElementById('modalJustificativa')) return;
  document.getElementById('modalJustificativa').classList.add('hidden');
  pendingSelect = null;
}

/* ── Refresh visual ──────────────────────────────────────── */
function refreshTableSelection() {
  if (!mapaAtual) return;
  mapaAtual.itens.forEach(item => {
    mapaAtual.fornecedores.forEach(resp => {
      const cell = document.getElementById(`cell_${item.id}_${resp.id}`);
      const btn  = document.getElementById(`btn_${item.id}_${resp.id}`);
      if (!cell || !btn) return;
      const isSel = vencedores[item.id]?.id_fornecedor === resp.id;
      const p = (item.precos||[]).find(p => p.fornecedor_id === resp.id);
      cell.className = `td-preco ${p?.eh_menor ? 'menor' : ''} ${isSel && !p?.eh_menor ? 'selecionado' : ''}`;
      btn.className  = `preco-select-btn ${isSel ? 'selected' : ''}`;
      btn.innerHTML  = isSel ? '<i class="fas fa-check"></i> Selecionado' : 'Selecionar';
    });
  });
}

/* ── Build summary ───────────────────────────────────────── */
function buildSummary() {
  if (!mapaAtual) return;
  const summary = document.getElementById('pedidoSummary');
  if (!summary) return;
  const { itens, fornecedores: forns } = mapaAtual;
  const porForn = {};
  Object.entries(vencedores).forEach(([itemId, v]) => {
    if (!porForn[v.id_fornecedor]) porForn[v.id_fornecedor] = { itens: [], total: 0 };
    const item  = itens.find(i => i.id === parseInt(itemId));
    const p     = (item?.precos||[]).find(p => p.fornecedor_id === v.id_fornecedor);
    const negoc = p ? negociacoes[v.id_fornecedor]?.[p.resposta_item_id] : null;
    const preco = negoc != null ? negoc : v.valor;
    const total = preco * (item?.quantidade || 0);
    porForn[v.id_fornecedor].itens.push({ ...item, valor: preco, total });
    porForn[v.id_fornecedor].total += total;
  });

  summary.innerHTML = forns.map(resp => {
    const data   = porForn[resp.id];
    const winner = data && data.itens.length > 0;
    const temNeg = winner && Object.keys(negociacoes[resp.id] || {}).length > 0;
    return `
      <div class="pedido-forn-card ${winner ? 'winner' : ''}">
        <div class="pedido-forn-nome">
          ${winner ? '<i class="fas fa-trophy" style="color:#2563eb;margin-right:6px"></i>' : ''}
          ${resp.nome_fantasia || resp.razao_social}
          ${temNeg ? '<span style="font-size:.65rem;background:#fef9c3;color:#b45309;padding:2px 6px;border-radius:4px;margin-left:6px">Negociado</span>' : ''}
        </div>
        <div class="pedido-forn-itens">
          ${winner ? data.itens.length + ' ite' + (data.itens.length!==1?'ns':'m') + ' selecionado' + (data.itens.length!==1?'s':'') : 'Nenhum item selecionado'}
        </div>
        <div class="pedido-forn-total">${winner ? formatCur(data.total) : '—'}</div>
        ${winner ? `<button class="btn-negociar" onclick="abrirNegociacao(${resp.id})"><i class="fas fa-handshake"></i> Negociar preços</button>` : ''}
      </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   NEGOCIAÇÃO
══════════════════════════════════════════════════════════ */
let negocFornId   = null;
let negocItensLoc = []; // cópia local para edição

function abrirNegociacao(fornecedorId) {
  if (!mapaAtual) return;
  negocFornId = fornecedorId;

  const forn = mapaAtual.fornecedores.find(f => f.id === fornecedorId);
  document.getElementById('negocFornNome').textContent = forn?.nome_fantasia || forn?.razao_social || '';

  // Monta itens desse fornecedor
  negocItensLoc = mapaAtual.itens.map(item => {
    const p = (item.precos||[]).find(p => p.fornecedor_id === fornecedorId);
    if (!p) return null;
    const negoc = negociacoes[fornecedorId]?.[p.resposta_item_id];
    return {
      id:               item.id,
      descricao:        item.descricao,
      unidade:          item.unidade,
      quantidade:       parseFloat(item.quantidade),
      resposta_item_id: p.resposta_item_id,
      valor_original:   p.valor_unitario,
      valor_negociado:  negoc != null ? negoc : p.valor_unitario,
    };
  }).filter(Boolean);

  // Mostra total atual (negociado se já houver negociação, senão cotado)
  const totalCotado = negocItensLoc.reduce((a, i) => a + i.valor_original * i.quantidade, 0);
  const totalAtual  = negocItensLoc.reduce((a, i) => a + i.valor_negociado * i.quantidade, 0);
  const temNegAtual = Math.abs(totalAtual - totalCotado) > 0.001;
  document.getElementById('negocTotalCotado').textContent = formatCur(temNegAtual ? totalAtual : totalCotado);
  document.getElementById('negocInputPct').value   = '';
  document.getElementById('negocInputGlobal').value = '';
  document.getElementById('negocDescCalc').textContent = '';

  renderNegocItens();
  document.getElementById('modalNegociacao').classList.remove('hidden');
}

function renderNegocItens() {
  const tbody = document.getElementById('negocItensBody');
  const totalCotado   = negocItensLoc.reduce((a, i) => a + i.valor_original * i.quantidade, 0);
  const totalNegociad = negocItensLoc.reduce((a, i) => a + i.valor_negociado * i.quantidade, 0);
  const descGlobal    = totalCotado > 0 ? ((1 - totalNegociad / totalCotado) * 100) : 0;

  tbody.innerHTML = negocItensLoc.map((item, idx) => {
    const temAlteracao = Math.abs(item.valor_negociado - item.valor_original) > 0.001;
    return `
      <tr>
        <td><div style="font-weight:600;font-size:.85rem">${item.descricao}</div><div style="font-size:.72rem;color:#94a3b8">${item.quantidade} ${item.unidade}</div></td>
        <td style="text-align:right;color:#64748b;font-size:.85rem">${formatCur(item.valor_original)}</td>
        <td style="text-align:center">
          <input type="number" step="0.01" min="0"
            class="negoc-input ${temAlteracao ? 'alterado' : ''}"
            value="${item.valor_negociado.toFixed(2)}"
            onchange="onNegocItemChange(${idx}, this.value)"
            oninput="onNegocItemChange(${idx}, this.value)" />
        </td>
        <td style="text-align:right;font-size:.85rem;font-weight:700;color:${temAlteracao?'#16a34a':'#334155'}">
          ${formatCur(item.valor_negociado * item.quantidade)}
          ${temAlteracao ? `<div style="font-size:.65rem;color:#16a34a">-${(((item.valor_original-item.valor_negociado)/item.valor_original)*100).toFixed(1)}%</div>` : ''}
        </td>
      </tr>`;
  }).join('');

  document.getElementById('negocTotalNegociado').textContent = formatCur(totalNegociad);
  document.getElementById('negocDescocalc').textContent =
    descGlobal > 0.001 ? `-${descGlobal.toFixed(2)}% (${formatCur(totalCotado - totalNegociad)} de desconto)` : 'Sem desconto';
}

function onNegocItemChange(idx, val) {
  const v = parseFloat(val);
  if (isNaN(v) || v < 0) return;
  negocItensLoc[idx].valor_negociado = v;
  // Recalcula totais mas não re-renderiza (evita perder foco)
  const totalCotado   = negocItensLoc.reduce((a, i) => a + i.valor_original * i.quantidade, 0);
  const totalNegociad = negocItensLoc.reduce((a, i) => a + i.valor_negociado * i.quantidade, 0);
  const descGlobal    = totalCotado > 0 ? ((1 - totalNegociad / totalCotado) * 100) : 0;
  document.getElementById('negocTotalNegociado').textContent = formatCur(totalNegociad);
  document.getElementById('negocDescocalc').textContent =
    descGlobal > 0.001 ? `-${descGlobal.toFixed(2)}% (${formatCur(totalCotado - totalNegociad)} de desconto)` : 'Sem desconto';
  // Atualiza classe do input
  const inputs = document.querySelectorAll('.negoc-input');
  if (inputs[idx]) {
    inputs[idx].classList.toggle('alterado', Math.abs(negocItensLoc[idx].valor_negociado - negocItensLoc[idx].valor_original) > 0.001);
  }
}

function aplicarDesconto() {
  const pctVal    = document.getElementById('negocInputPct').value;
  const globalVal = document.getElementById('negocInputGlobal').value;

  if (!pctVal && !globalVal) { showToast('Informe o percentual ou valor global.', 'error'); return; }

  const totalCotado = negocItensLoc.reduce((a, i) => a + i.valor_original * i.quantidade, 0);
  let pct;

  if (globalVal) {
    const vg = parseFloat(globalVal);
    if (isNaN(vg) || vg <= 0 || vg >= totalCotado) { showToast('Valor global inválido.', 'error'); return; }
    pct = (totalCotado - vg) / totalCotado;
    // Atualiza campo de %
    document.getElementById('negocInputPct').value = (pct * 100).toFixed(2);
  } else {
    pct = parseFloat(pctVal) / 100;
    if (isNaN(pct) || pct <= 0 || pct >= 1) { showToast('Percentual inválido.', 'error'); return; }
    const totalNeg = totalCotado * (1 - pct);
    document.getElementById('negocInputGlobal').value = totalNeg.toFixed(2);
  }

  // Aplica rateio proporcional com precisão máxima internamente
  // Ajusta o último item para fechar o total exato
  const totalDesejado = totalCotado * (1 - pct);
  let acumulado = 0;
  negocItensLoc.forEach((item, idx) => {
    if (idx === negocItensLoc.length - 1) {
      // Último item: valor exato para fechar o total
      const totalAcumuladoQtd = negocItensLoc.slice(0, -1).reduce((a, i) => a + i.valor_negociado * i.quantidade, 0);
      const qtdUltimo = item.quantidade;
      item.valor_negociado = Math.round(((totalDesejado - totalAcumuladoQtd) / qtdUltimo) * 10000) / 10000;
    } else {
      // Mantém 4 casas decimais internamente
      item.valor_negociado = Math.round(item.valor_original * (1 - pct) * 10000) / 10000;
    }
  });

  renderNegocItens();
  showToast('Desconto aplicado. Revise e confirme.', 'success');
}

function onGlobalInput() {
  const totalCotado = negocItensLoc.reduce((a, i) => a + i.valor_original * i.quantidade, 0);
  const vg = parseFloat(document.getElementById('negocInputGlobal').value);
  if (!isNaN(vg) && vg > 0 && vg < totalCotado) {
    const pct = (totalCotado - vg) / totalCotado;
    document.getElementById('negocInputPct').value = (pct * 100).toFixed(2);
    document.getElementById('negocDescCalc').textContent =
      `Desconto: ${(pct*100).toFixed(2)}% — economia de ${formatCur(totalCotado - vg)}`;
  }
}

function onPctInput() {
  const totalCotado = negocItensLoc.reduce((a, i) => a + i.valor_original * i.quantidade, 0);
  const pct = parseFloat(document.getElementById('negocInputPct').value) / 100;
  if (!isNaN(pct) && pct > 0 && pct < 1) {
    const vg = totalCotado * (1 - pct);
    document.getElementById('negocInputGlobal').value = vg.toFixed(2);
    document.getElementById('negocDescCalc').textContent =
      `Total negociado: ${formatCur(vg)} — economia de ${formatCur(totalCotado - vg)}`;
  }
}

async function confirmarNegociacao() {
  if (!mapaAtual || !negocFornId) return;

  const itens = negocItensLoc.map(i => ({
    resposta_item_id: i.resposta_item_id,
    preco_negociado: Math.abs(i.valor_negociado - i.valor_original) > 0.001 ? i.valor_negociado : null,
  }));

  try {
    await api('POST', `/cotacoes/${cotacaoIdAtual}/negociar`, { id_fornecedor: negocFornId, itens });
    showToast('Negociação salva!', 'success');

    // Atualiza estado local
    if (!negociacoes[negocFornId]) negociacoes[negocFornId] = {};
    negocItensLoc.forEach(i => {
      if (Math.abs(i.valor_negociado - i.valor_original) > 0.001) {
        negociacoes[negocFornId][i.resposta_item_id] = i.valor_negociado;
      } else {
        delete negociacoes[negocFornId][i.resposta_item_id];
      }
    });

    fecharNegociacao();
    // Recarrega mapa para refletir preco_efetivo atualizado
    await loadMapa(cotacaoIdAtual);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function limparNegociacao() {
  if (!mapaAtual || !negocFornId) return;
  if (!confirm('Remover toda a negociação deste fornecedor?')) return;
  try {
    await api('POST', `/cotacoes/${cotacaoIdAtual}/negociar/limpar`, { id_fornecedor: negocFornId });
    delete negociacoes[negocFornId];
    showToast('Negociação removida.', 'success');
    fecharNegociacao();
    await loadMapa(cotacaoIdAtual);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function fecharNegociacao() {
  document.getElementById('modalNegociacao').classList.add('hidden');
  negocFornId   = null;
  negocItensLoc = [];
}

/* ── Salvar vencedores ───────────────────────────────────── */
async function salvarVencedores() {
  if (!mapaAtual) return;
  if (!Object.keys(vencedores).length) { showToast('Selecione pelo menos um vencedor.', 'error'); return; }

  const payload = Object.entries(vencedores).map(([id_cotacao_item, v]) => ({
    id_cotacao_item: parseInt(id_cotacao_item),
    id_fornecedor:   v.id_fornecedor,
    valor_unitario:  v.valor,
    eh_menor_preco:  v.eh_menor,
    justificativa:   v.justificativa || '',
  }));

  try {
    await api('POST', `/cotacoes/${cotacaoIdAtual}/vencedores`, { vencedores: payload });
    showToast('Vencedores salvos!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Gerar Pedido de Compra ──────────────────────────────── */
async function gerarPedido() {
  if (!mapaAtual) return;
  if (!Object.keys(vencedores).length) { showToast('Selecione os vencedores antes de gerar o pedido.', 'error'); return; }

  await salvarVencedores();

  const porForn = {};
  Object.entries(vencedores).forEach(([itemId, v]) => {
    if (!porForn[v.id_fornecedor]) porForn[v.id_fornecedor] = [];
    porForn[v.id_fornecedor].push(parseInt(itemId));
  });

  try {
    const pedidosGerados = [];
    for (const [fornId, itens_ids] of Object.entries(porForn)) {
      const p = await api('POST', '/pedidos', { id_cotacao: cotacaoIdAtual, id_fornecedor: parseInt(fornId), itens_ids });
      pedidosGerados.push(p);
    }
    showModalPedido(pedidosGerados);
    await carregarListaCotacoes();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function showModalPedido(pedidos) {
  const body = document.getElementById('modalPedidoBody');
  body.innerHTML = `
    <div style="margin-bottom:16px">
      <div style="font-size:.85rem;color:#15803d;font-weight:700;margin-bottom:4px">
        <i class="fas fa-check-circle" style="margin-right:6px"></i>
        ${pedidos.length} pedido${pedidos.length!==1?'s':''} de compra gerado${pedidos.length!==1?'s':''}!
      </div>
      <div style="font-size:.8rem;color:#64748b">Referente à cotação ${mapaAtual?.cotacao?.numero||''}</div>
    </div>
    ${pedidos.map(p => `
      <div style="border:1.5px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div>
            <div style="font-weight:800;font-size:.9rem;color:#2563eb">${p.numero||'Pedido'}</div>
            <div style="font-size:.8rem;color:#64748b;margin-top:2px">${p.fornecedor||''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <div style="font-size:1rem;font-weight:800;color:#0f172a">${formatCur(p.valorTotal||0)}</div>
            <a href="pedido-compra.html?id=${p.id}&jwt=${getToken()}" target="_blank"
               style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border-radius:50px;font-size:.78rem;font-weight:700;text-decoration:none;white-space:nowrap">
              <i class="fas fa-print"></i> Imprimir
            </a>
            <button onclick="compartilharPedido(${p.id})"
               style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border-radius:50px;font-size:.78rem;font-weight:700;border:none;cursor:pointer;white-space:nowrap">
              <i class="fas fa-share-nodes"></i> Enviar link
            </button>
          </div>
        </div>
        <div id="shareBoxPedido${p.id}" style="display:none;margin-top:12px;background:#f1f5f9;border-radius:8px;padding:10px;display:flex;gap:8px;align-items:center">
          <input id="shareLinkPedido${p.id}" type="text" readonly
            style="flex:1;border:1.5px solid #cbd5e1;border-radius:6px;padding:6px 10px;font-size:.8rem;color:#0f172a;background:#fff;outline:none">
          <button onclick="copiarLinkPedido(${p.id})"
            style="padding:6px 14px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:.78rem;font-weight:700;cursor:pointer;white-space:nowrap">
            <i class="fas fa-copy"></i> Copiar
          </button>
        </div>
      </div>`).join('')}
  `;
  document.getElementById('modalPedido').classList.remove('hidden');
}

async function compartilharPedido(pedidoId) {
  try {
    const data = await api('POST', `/pedidos/${pedidoId}/share`);
    const fullUrl = `${window.location.origin}/app/pedido-compra.html?token=${data.token}`;
    const box = document.getElementById(`shareBoxPedido${pedidoId}`);
    const input = document.getElementById(`shareLinkPedido${pedidoId}`);
    input.value = fullUrl;
    box.style.display = 'flex';
  } catch(err) {
    showToast(err.message, 'error');
  }
}

function copiarLinkPedido(pedidoId) {
  const input = document.getElementById(`shareLinkPedido${pedidoId}`);
  navigator.clipboard.writeText(input.value).then(() => showToast('Link copiado!')).catch(() => {
    input.select(); document.execCommand('copy'); showToast('Link copiado!');
  });
}

function closeModalPedido(e) {
  if (e && e.target !== document.getElementById('modalPedido')) return;
  document.getElementById('modalPedido').classList.add('hidden');
}

/* ── Toast ───────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type==='success'?'check-circle':type==='error'?'exclamation-circle':'exclamation-triangle';
  toast.innerHTML = `<i class="fas fa-${icon}"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

/* ── Sidebar ─────────────────────────────────────────────── */
function toggleNavGroup(id) { document.getElementById(id)?.classList.toggle('open'); }
function toggleUserMenu()   { document.getElementById('userDropdown').classList.toggle('hidden'); }

function handleLogout() {
  localStorage.removeItem('sis_token'); localStorage.removeItem('sis_user');
  sessionStorage.removeItem('sis_token'); sessionStorage.removeItem('sis_user');
  window.location.href = '../index.html';
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle  = document.getElementById('sidebarToggle');
  const menuBtn = document.getElementById('menuBtn');
  const overlay = document.getElementById('sidebarOverlay');
  const wrapper = document.getElementById('mainWrapper');

  if (localStorage.getItem('sidebar_collapsed') === 'true') { sidebar.classList.add('collapsed'); wrapper.classList.add('sidebar-collapsed'); }

  toggle?.addEventListener('click', () => { const c = sidebar.classList.toggle('collapsed'); wrapper.classList.toggle('sidebar-collapsed', c); localStorage.setItem('sidebar_collapsed', c); });
  menuBtn?.addEventListener('click', () => { sidebar.classList.toggle('mobile-open'); overlay?.classList.toggle('active'); });
  overlay?.addEventListener('click', () => { sidebar.classList.remove('mobile-open'); overlay.classList.remove('active'); });
  document.addEventListener('click', e => {
    const dd = document.getElementById('userDropdown');
    if (dd && !dd.classList.contains('hidden') && !e.target.closest('.header-user')) dd.classList.add('hidden');
  });

  const raw = localStorage.getItem('sis_user') || sessionStorage.getItem('sis_user');
  if (raw) {
    try {
      const u = JSON.parse(raw);
      const ini = (u.nome||'?')[0].toUpperCase();
      document.getElementById('sidebarAvatar').textContent = ini;
      document.getElementById('sidebarName').textContent   = u.nome||'Usuário';
      document.getElementById('headerAvatar').textContent  = ini;
      document.getElementById('headerName').textContent    = u.nome||'Usuário';
      const hc = document.getElementById('headerCompany'); if (hc) hc.textContent = u.empresa||'';
      const da = document.getElementById('dropAvatar');    if (da) da.textContent = ini;
      const dn = document.getElementById('dropName');      if (dn) dn.textContent = u.nome||'Usuário';
      const de = document.getElementById('dropEmail');     if (de) de.textContent = u.email||'';
      if (u.trialExpira) {
        const dias = Math.ceil((new Date(u.trialExpira) - new Date()) / 86400000);
        if (dias > 0) {
          const hr = document.querySelector('.header-right');
          if (hr) hr.insertAdjacentHTML('afterbegin', `
            <div class="trial-badge" title="Período de teste">
              <i class="fas fa-clock"></i>
              <span class="trial-badge-days">${dias} dias</span>
              <span class="trial-badge-label">de teste</span>
            </div>
            <button class="btn-upgrade-sm"><i class="fas fa-rocket"></i> Assinar</button>
          `);
        }
      }
    } catch(_) {}
  }
}

/* ══════════════════════════════════════════════════════════
   COMPARTILHAR MAPA
══════════════════════════════════════════════════════════ */
async function compartilharMapa() {
  if (!mapaAtual) return;
  const cotId = document.getElementById('selectCotacao').value;
  if (!cotId) return;

  const btnComp = document.getElementById('btnCompartilhar');
  const orig = btnComp.innerHTML;
  btnComp.disabled = true;
  btnComp.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Gerando...';

  try {
    const data = await api('POST', `/cotacoes/${cotId}/share`);
    const fullUrl = `${window.location.origin}${data.url}`;

    document.getElementById('shareLinkInput').value = fullUrl;
    document.getElementById('shareOpenLink').href   = data.url;
    document.getElementById('copyLabel').textContent = 'Copiar';
    document.getElementById('copyIcon').className   = 'fas fa-copy';
    document.getElementById('modalShare').classList.remove('hidden');
  } catch (err) {
    showToast('Erro ao gerar link: ' + err.message, 'error');
  } finally {
    btnComp.disabled = false;
    btnComp.innerHTML = orig;
  }
}

function copiarLink() {
  const input = document.getElementById('shareLinkInput');
  navigator.clipboard.writeText(input.value).then(() => {
    document.getElementById('copyLabel').textContent = 'Copiado!';
    document.getElementById('copyIcon').className   = 'fas fa-check';
    setTimeout(() => {
      document.getElementById('copyLabel').textContent = 'Copiar';
      document.getElementById('copyIcon').className   = 'fas fa-copy';
    }, 2500);
  }).catch(() => {
    input.select();
    document.execCommand('copy');
    showToast('Link copiado!', 'success');
  });
}

function closeModalShare(e) {
  if (e && e.target !== document.getElementById('modalShare')) return;
  document.getElementById('modalShare').classList.add('hidden');
}
