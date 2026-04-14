/* ═══════════════════════════════════════════════════════════
   SISENG — Cotações  v2.0
   Integrado com API REST /api/compras
═══════════════════════════════════════════════════════════ */

/* ── Helpers de API ──────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token') || '';
}

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res  = await fetch(`/api/compras${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem('sis_token');
    window.location.href = '../index.html';
    throw new Error('Não autorizado');
  }
  if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
  return data;
}

async function loadObrasCount() {
  const token = localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token') || '';
  if (!token) return;
  try {
    const res = await fetch('https://siseng-production.up.railway.app/api/obras', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      const el = document.getElementById('obrasCount');
      if (el) el.textContent = data.length;
    }
  } catch(_) {}
}

/* ── Estado ──────────────────────────────────────────────── */
let cotacoes     = [];
let grupos       = [];
let itens        = [];
let fornecedores = [];
let obras        = [];
let editingId    = null;
let deletingId   = null;
let enviandoId   = null;
let viewingId    = null;
let searchTerm   = '';
let filterStatus = '';
let itemRowCount = 0;

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();

  renderSidebar('cotacoes');
  loadAll();
  loadObrasCount();
});

/* ── Carregar todos os dados ─────────────────────────────── */
async function loadAll() {
  showTableLoading(true);
  try {
    const [cotData, grpData, itData, fornData] = await Promise.all([
      api('GET', '/cotacoes'),
      api('GET', '/grupos'),
      api('GET', '/itens'),
      api('GET', '/fornecedores'),
    ]);
    cotacoes     = cotData;
    grupos       = grpData;
    itens        = itData;
    fornecedores = fornData;

    // Carrega obras para vincular à cotação
    try {
      const obraRes = await fetch('https://siseng-production.up.railway.app/api/obras', { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (obraRes.ok) obras = await obraRes.json();
    } catch(_) {}

    applyFilter();
    updateStats();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    showTableLoading(false);
  }
}

function showTableLoading(on) {
  const el = document.getElementById('tableLoading');
  if (el) el.classList.toggle('hidden', !on);
  const tb = document.getElementById('tableBody');
  if (tb) tb.style.opacity = on ? '.4' : '1';
}

/* ── Formatação ──────────────────────────────────────────── */
function formatCurrency(v) {
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}
function formatDate(d) {
  if (!d) return '—';
  const [y, m, dd] = d.split('T')[0].split('-');
  return `${dd}/${m}/${y}`;
}

/* ── Stats ───────────────────────────────────────────────── */
function formatCurStat(v) {
  if (!v || v == 0) return '—';
  if (v >= 1000000) return 'R$ ' + (v/1000000).toFixed(1).replace('.',',') + 'M';
  if (v >= 1000)    return 'R$ ' + (v/1000).toFixed(0) + 'k';
  return v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}

function updateStats() {
  const finalizadas  = cotacoes.filter(c => c.status === 'finalizada');
  const respondidas  = cotacoes.filter(c => c.status === 'respondida');
  const valorPedidos = finalizadas.reduce((s, c) => s + parseFloat(c.valor_pedidos || 0), 0);

  document.getElementById('statTotal').textContent       = cotacoes.length;
  document.getElementById('statEnviadas').textContent    = cotacoes.filter(c => c.status === 'enviada').length;
  document.getElementById('statRespondidas').textContent = respondidas.length;
  document.getElementById('statFinalizadas').textContent = finalizadas.length;

  // Sub-valores
  const elVal = document.getElementById('statValorFinalizadas');
  if (elVal) elVal.textContent = valorPedidos > 0 ? formatCurStat(valorPedidos) : '';
}

/* ── Filtro / Renderização ───────────────────────────────── */
function filterSearch(term) {
  searchTerm = term;
  applyFilter();
}

function applyFilter() {
  filterStatus = document.getElementById('filterStatus').value;
  let list = [...cotacoes];

  if (filterStatus) list = list.filter(c => c.status === filterStatus);
  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase();
    list = list.filter(c =>
      (c.numero  || '').toLowerCase().includes(q) ||
      (c.titulo  || '').toLowerCase().includes(q)
    );
  }

  renderTable(list);
}

function badgeHtml(status) {
  const map = {
    aberta:     { cls: 'badge-aberta',     icon: 'fa-circle-dot',    label: 'Aberta'      },
    enviada:    { cls: 'badge-enviada',    icon: 'fa-paper-plane',   label: 'Enviada'     },
    respondida: { cls: 'badge-respondida', icon: 'fa-comments',      label: 'Respondida'  },
    finalizada: { cls: 'badge-finalizada', icon: 'fa-check-circle',  label: 'Finalizada'  },
  };
  const s = map[status] || { cls: '', icon: 'fa-circle', label: status };
  return `<span class="badge ${s.cls}"><i class="fas ${s.icon}"></i>${s.label}</span>`;
}

function renderTable(list) {
  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('tableCount');

  count.textContent = `${list.length} cotaç${list.length !== 1 ? 'ões' : 'ão'}`;

  if (!list.length) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = list.map(c => {
    const respondidos = Number(c.respondidos   || 0);
    const total       = Number(c.total_fornecedores || 0);

    const canEdit      = c.status === 'aberta';
    const canSend      = !['cancelada','finalizada'].includes(c.status);
    const canDelete    = true;
    const canMapa      = ['enviada','respondida','finalizada'].includes(c.status);
    const canFinalizar = ['respondida'].includes(c.status);

    return `
      <tr>
        <td>
          <div class="cot-numero">${c.numero}</div>
          <div class="cot-titulo">${c.titulo || '—'}</div>
          <div class="cot-meta"><i class="fas fa-calendar-alt" style="margin-right:4px"></i>${formatDate(c.data_criacao)} • ${c.usuario_nome || 'Admin'}</div>
        </td>
        <td>
          <span class="cot-itens-count">
            <i class="fas fa-box"></i>${c.total_itens || 0} ite${(c.total_itens||0)!==1?'ns':'m'}
          </span>
        </td>
        <td>
          ${total
            ? `<div style="font-size:.78rem;color:#64748b">${respondidos}/${total} responderam</div>`
            : '<span style="color:#94a3b8;font-size:.75rem">Nenhum</span>'
          }
        </td>
        <td style="white-space:nowrap">${formatDate(c.data_validade)}</td>
        <td class="td-r" style="white-space:nowrap;font-weight:700;color:${parseFloat(c.valor_pedidos||0)>0?'#16a34a':'#94a3b8'}">
          ${parseFloat(c.valor_pedidos||0)>0 ? parseFloat(c.valor_pedidos).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '—'}
        </td>
        <td>${badgeHtml(c.status)}</td>
        <td class="td-ctr">
          <div class="row-actions">
            <button class="btn-action" title="Ver detalhes" onclick="openModalVer(${c.id})">
              <i class="fas fa-eye"></i>
            </button>
            ${canEdit ? `<button class="btn-action" title="Editar" onclick="openModalNova(${c.id})">
              <i class="fas fa-pen"></i>
            </button>` : ''}
            ${canSend ? `<button class="btn-action warning" title="Enviar para fornecedores" onclick="openModalEnviar(${c.id})">
              <i class="fas fa-paper-plane"></i>
            </button>` : ''}
            ${canMapa ? `<button class="btn-action success" title="Mapa de Cotação" onclick="irParaMapaId(${c.id})">
              <i class="fas fa-table"></i>
            </button>` : ''}
            ${canDelete ? `<button class="btn-action danger" title="Excluir" onclick="openModalDelete(${c.id})">
              <i class="fas fa-trash-alt"></i>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   MODAL NOVA / EDITAR COTAÇÃO
══════════════════════════════════════════════════════════ */
function openModalNova(id = null) {
  editingId    = id || null;
  itemRowCount = 0;

  const title = document.getElementById('modalNovaTitle');
  document.getElementById('fTitulo').value      = '';
  document.getElementById('fValidade').value    = '';
  document.getElementById('fObservacoes').value = '';
  document.getElementById('itensBody').innerHTML = '';
  toggleItensEmpty();

  // Popular select de obras
  const selObra = document.getElementById('fObra');
  selObra.innerHTML = '<option value="">— Nenhuma obra vinculada —</option>';
  (obras || []).filter(o => ['planejamento','em_andamento'].includes(o.status)).forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.id;
    opt.textContent = o.nome;
    selObra.appendChild(opt);
  });
  document.getElementById('fEtapa').innerHTML = '<option value="">— Selecione uma obra primeiro —</option>';
  document.getElementById('fEtapa').disabled = true;

  if (id) {
    const c = cotacoes.find(x => x.id === id);
    if (!c) return;
    title.innerHTML = '<i class="fas fa-pen"></i> Editar Cotação';
    document.getElementById('fTitulo').value      = c.titulo    || '';
    document.getElementById('fValidade').value    = c.data_validade ? c.data_validade.split('T')[0] : '';
    document.getElementById('fObservacoes').value = c.observacoes  || '';
    if (c.obra_id) { selObra.value = c.obra_id; carregarEtapas(c.etapa_id); }
    // Busca itens detalhados via API
    api('GET', `/cotacoes/${id}`)
      .then(full => (full.itens || []).forEach(item => addItemRow(item)))
      .catch(() => {});
  } else {
    title.innerHTML = '<i class="fas fa-plus-circle"></i> Nova Cotação';
  }

  document.getElementById('modalNova').classList.remove('hidden');
}

function closeModalNova(e) {
  if (e && e.target !== document.getElementById('modalNova')) return;
  document.getElementById('modalNova').classList.add('hidden');
  editingId = null;
}

async function carregarEtapas(etapaIdSelecionada = null) {
  const obraId  = document.getElementById('fObra').value;
  const selEtapa = document.getElementById('fEtapa');
  selEtapa.innerHTML = '<option value="">— Sem etapa vinculada —</option>';
  selEtapa.disabled = !obraId;
  if (!obraId) return;
  try {
    const res = await fetch(`/api/obras/etapas?obra_id=${obraId}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
    if (res.ok) {
      const etapas = await res.json();
      etapas.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = e.nome;
        selEtapa.appendChild(opt);
      });
      if (etapaIdSelecionada) selEtapa.value = etapaIdSelecionada;
    }
  } catch(_) {}
}

/* ── Gerenciamento de itens ──────────────────────────────── */
function getGrupoNome(id_grupo) {
  const g = grupos.find(g => g.id === id_grupo);
  return g ? g.descricao : '—';
}

function getItemById(id) {
  return itens.find(i => i.id === id) || null;
}

function addItemRow(existing = null) {
  const tbody = document.getElementById('itensBody');
  const rowId = 'ir_' + (++itemRowCount);

  const itemOptions = itens.map(it =>
    `<option value="${it.id}" data-unidade="${it.unidade}" data-grupo="${it.id_grupo}"
     ${existing && existing.id_item === it.id ? 'selected' : ''}>
     ${it.descricao}
    </option>`
  ).join('');

  const selected   = existing ? getItemById(existing.id_item) : null;
  const grupoNome  = selected ? getGrupoNome(selected.id_grupo) : '—';
  const unidadeVal = selected ? selected.unidade : '';

  const tr = document.createElement('tr');
  tr.id    = rowId;
  tr.innerHTML = `
    <td>
      <select class="form-group input" style="width:100%;padding:7px 8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:.82rem"
              id="${rowId}_item" onchange="onItemChange('${rowId}')">
        <option value="">Selecione o item...</option>
        ${itemOptions}
      </select>
    </td>
    <td><span id="${rowId}_grupo" style="font-size:.75rem;color:#64748b">${grupoNome}</span></td>
    <td>
      <input type="number" class="input-qty" id="${rowId}_qty"
             placeholder="0" min="0.001" step="0.001"
             value="${existing ? existing.quantidade : ''}">
    </td>
    <td class="td-unidade"><span id="${rowId}_un">${unidadeVal}</span></td>
    <td>
      <input type="text" style="width:100%;padding:7px 8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:.75rem"
             id="${rowId}_just" placeholder="Opcional..."
             value="${existing ? (existing.justificativa || '') : ''}">
    </td>
    <td>
      <button class="btn-remove-item" onclick="removeItemRow('${rowId}')">
        <i class="fas fa-times"></i>
      </button>
    </td>
  `;
  tbody.appendChild(tr);
  toggleItensEmpty();
}

function onItemChange(rowId) {
  const sel   = document.getElementById(rowId + '_item');
  const opt   = sel.options[sel.selectedIndex];
  const grupo = opt.dataset.grupo   || '';
  const unid  = opt.dataset.unidade || '';
  document.getElementById(rowId + '_grupo').textContent = getGrupoNome(grupo);
  document.getElementById(rowId + '_un').textContent    = unid;
}

function removeItemRow(rowId) {
  document.getElementById(rowId)?.remove();
  toggleItensEmpty();
}

function toggleItensEmpty() {
  const rows  = document.querySelectorAll('#itensBody tr');
  const empty = document.getElementById('itensEmpty');
  empty.classList.toggle('hidden', rows.length > 0);
}

function collectItens() {
  const rows   = document.querySelectorAll('#itensBody tr');
  const result = [];
  for (const row of rows) {
    const id    = row.id;
    const selEl = document.getElementById(id + '_item');
    const qtyEl = document.getElementById(id + '_qty');
    const justEl= document.getElementById(id + '_just');
    const itemId= parseInt(selEl?.value);
    const qty   = parseFloat(qtyEl?.value) || 0;
    if (!itemId) { showToast('Selecione o item em todas as linhas.', 'error'); return null; }
    if (qty <= 0) { showToast('Informe a quantidade de todos os itens.', 'error'); return null; }
    result.push({
      id_item:      itemId,
      quantidade:   qty,
      justificativa: justEl?.value.trim() || ''
    });
  }
  return result;
}

/* ── Salvar cotação ──────────────────────────────────────── */
async function salvarCotacao() {
  const titulo   = document.getElementById('fTitulo').value.trim();
  const validade = document.getElementById('fValidade').value || null;
  const obs      = document.getElementById('fObservacoes').value.trim() || null;
  const obra_id  = document.getElementById('fObra').value  || null;
  const etapa_id = document.getElementById('fEtapa').value || null;

  if (!titulo) { showToast('Informe o título da cotação.', 'error'); document.getElementById('fTitulo').focus(); return; }

  const itensForm = collectItens();
  if (!itensForm) return;
  if (!itensForm.length) { showToast('Adicione pelo menos um item.', 'error'); return; }

  const btn = document.getElementById('btnSalvar');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  try {
    if (editingId) {
      await api('PUT', `/cotacoes/${editingId}`, { titulo, data_validade: validade, observacoes: obs, obra_id, etapa_id });
      showToast('Cotação atualizada!', 'success');
    } else {
      await api('POST', '/cotacoes', { titulo, data_validade: validade, observacoes: obs, itens: itensForm, obra_id, etapa_id });
      showToast('Cotação criada com sucesso!', 'success');
    }
    document.getElementById('modalNova').classList.add('hidden');
    editingId = null;
    await loadAll();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Salvar Cotação';
  }
}

/* ══════════════════════════════════════════════════════════
   MODAL ENVIAR PARA FORNECEDORES
══════════════════════════════════════════════════════════ */
function openModalEnviar(id) {
  enviandoId = id;
  const c = cotacoes.find(x => x.id === id);
  if (!c) return;

  // Busca fornecedores já vinculados a esta cotação
  api('GET', `/cotacoes/${id}`)
    .then(full => {
      const jaEnviadosIds = (full.fornecedores || []).map(f => f.id_fornecedor);
      const list = document.getElementById('fornList');
      list.innerHTML = fornecedores.map(f => {
        const jaEnviado = jaEnviadosIds.includes(f.id);
        return `
          <label class="forn-item ${jaEnviado ? 'selected' : ''}">
            <input type="checkbox" id="fc_${f.id}" value="${f.id}" ${jaEnviado ? 'checked disabled' : ''} />
            <div class="forn-item-info">
              <div class="forn-item-nome">${f.nome_fantasia || f.razao_social}</div>
              <div class="forn-item-cnpj">CNPJ: ${f.cnpj || '—'}</div>
              ${f.contato ? `<div class="forn-item-contato"><i class="fas fa-phone" style="margin-right:4px;font-size:.65rem"></i>${f.contato}</div>` : ''}
            </div>
            ${jaEnviado ? '<span style="font-size:.7rem;color:#15803d;font-weight:700"><i class="fas fa-check"></i> Enviado</span>' : ''}
          </label>
        `;
      }).join('') || '<p style="color:#94a3b8;font-size:.82rem;padding:12px">Nenhum fornecedor cadastrado.</p>';
    })
    .catch(() => showToast('Erro ao carregar fornecedores.', 'error'));

  document.getElementById('linksGerados').classList.add('hidden');
  document.getElementById('linksList').innerHTML = '';
  document.getElementById('btnEnviar').disabled  = false;
  document.getElementById('btnEnviar').innerHTML = '<i class="fas fa-paper-plane"></i> Gerar Links';

  document.getElementById('modalEnviar').classList.remove('hidden');
}

function closeModalEnviar(e) {
  if (e && e.target !== document.getElementById('modalEnviar')) return;
  document.getElementById('modalEnviar').classList.add('hidden');
  enviandoId = null;
}

async function enviarCotacao() {
  const selecionados = [...document.querySelectorAll('#fornList input[type="checkbox"]:checked:not([disabled])')];
  if (!selecionados.length) { showToast('Selecione pelo menos um fornecedor.', 'error'); return; }

  const btn = document.getElementById('btnEnviar');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';

  try {
    const fornecedores_ids = selecionados.map(cb => parseInt(cb.value));
    const data = await api('POST', `/cotacoes/${enviandoId}/enviar`, { fornecedores_ids });

    // Exibe links gerados
    const linksList = document.getElementById('linksList');
    const baseUrl   = window.location.origin;
    linksList.innerHTML = (data.links || []).map(l => {
      const fornObj = fornecedores.find(f => f.id === l.fornecedor_id);
      const nome    = fornObj?.nome_fantasia || fornObj?.razao_social || 'Fornecedor';
      const fullLink= `${baseUrl}/app/cotacao-responder.html?token=${l.token}`;
      return `
        <div style="margin-bottom:10px">
          <div style="font-size:.78rem;font-weight:700;color:#334155;margin-bottom:4px">
            <i class="fas fa-truck" style="color:#2563eb;margin-right:5px"></i>${nome}
          </div>
          <div class="link-token-wrap">
            <span class="link-token" id="lnk_${l.token}">${fullLink}</span>
            <button class="btn-copy" onclick="copyLink('lnk_${l.token}')">
              <i class="fas fa-copy"></i> Copiar
            </button>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('linksGerados').classList.remove('hidden');
    btn.innerHTML = '<i class="fas fa-check"></i> Links Gerados';
    showToast(`Links gerados para ${(data.links||[]).length} fornecedor${(data.links||[]).length>1?'es':''}!`, 'success');
    await loadAll();
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Gerar Links';
  }
}

function copyLink(spanId) {
  const el = document.getElementById(spanId);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => showToast('Link copiado!', 'info'));
}

/* ══════════════════════════════════════════════════════════
   MODAL VER COTAÇÃO
══════════════════════════════════════════════════════════ */
async function openModalVer(id) {
  viewingId = id;
  const body    = document.getElementById('modalVerBody');
  const btnMapa = document.getElementById('btnVerMapa');
  body.innerHTML = '<div style="padding:32px;text-align:center;color:#94a3b8"><i class="fas fa-circle-notch fa-spin"></i> Carregando...</div>';
  btnMapa.style.display = 'none';
  document.getElementById('modalVer').classList.remove('hidden');

  try {
    const c = await api('GET', `/cotacoes/${id}`);

    btnMapa.style.display = ['respondida','finalizada'].includes(c.status) ? 'flex' : 'none';

    // Mapa de totais por fornecedor (soma das respostas)
    const totaisMap = {};
    (c.respostas || []).forEach(r => {
      const total = (r.itens || []).reduce((s, i) => s + parseFloat(i.preco_unitario || 0) * parseFloat(i.quantidade || 1), 0);
      totaisMap[r.id_fornecedor] = total;
    });

    const respondidos = (c.fornecedores || []).filter(f => f.status === 'respondido').length;
    const total_forn  = (c.fornecedores || []).length;

    // KPIs
    const kpisHtml = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
        <div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:1.4rem;font-weight:900;color:#0284c7">${(c.itens||[]).length}</div>
          <div style="font-size:.75rem;color:#64748b;margin-top:2px">Itens</div>
        </div>
        <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:1.4rem;font-weight:900;color:#16a34a">${respondidos}/${total_forn}</div>
          <div style="font-size:.75rem;color:#64748b;margin-top:2px">Responderam</div>
        </div>
        <div style="background:#fefce8;border:1.5px solid #fde68a;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:1.4rem;font-weight:900;color:#b45309">${c.data_validade ? formatDate(c.data_validade) : '—'}</div>
          <div style="font-size:.75rem;color:#64748b;margin-top:2px">Válido até</div>
        </div>
      </div>`;

    // Obra vinculada
    const obraHtml = c.obra_nome ? `
      <div style="display:flex;align-items:center;gap:8px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:.83rem">
        <i class="fas fa-building" style="color:#2563eb"></i>
        <span style="color:#64748b">Obra:</span>
        <span style="font-weight:700;color:#0f172a">${c.obra_nome}</span>
        ${c.etapa_nome ? `<span style="color:#94a3b8">•</span><span style="color:#64748b">${c.etapa_nome}</span>` : ''}
      </div>` : '';

    // Itens
    const itensHtml = (c.itens || []).map(it => `
      <tr>
        <td>${it.descricao}</td>
        <td class="td-r">${parseFloat(it.quantidade).toLocaleString('pt-BR')} ${it.unidade}</td>
        <td>${it.justificativa || '—'}</td>
      </tr>
    `).join('') || '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:16px">Nenhum item</td></tr>';

    // Fornecedores com valor total ofertado
    const fornsHtml = (c.fornecedores || []).map(f => {
      const total = totaisMap[f.id_fornecedor];
      const respondido = f.status === 'respondido';
      return `
        <div class="view-forn-card ${respondido ? 'resp' : 'pend'}">
          <div class="view-forn-nome">${f.nome_fantasia || f.razao_social}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px">
            <div class="view-forn-status ${respondido ? 'resp' : 'pend'}">
              <i class="fas ${respondido ? 'fa-check-circle' : 'fa-clock'}"></i>
              ${respondido ? 'Respondido' : 'Aguardando'}
            </div>
            ${respondido && total ? `<div style="font-weight:800;font-size:.82rem;color:#0f172a">${total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>` : ''}
          </div>
        </div>`;
    }).join('') || '<p style="font-size:.82rem;color:#94a3b8">Nenhum fornecedor selecionado ainda.</p>';

    body.innerHTML = `
      <div class="view-header">
        <div>
          <div class="view-numero">${c.numero}</div>
          <div class="view-titulo">${c.titulo || 'Sem título'}</div>
          <div class="view-meta">Criado em ${formatDate(c.data_criacao)} por ${c.usuario_nome}</div>
        </div>
        ${badgeHtml(c.status)}
      </div>
      ${kpisHtml}
      ${obraHtml}
      ${c.observacoes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 14px;font-size:.82rem;color:#78350f;margin-bottom:16px">
        <i class="fas fa-exclamation-circle" style="margin-right:6px"></i>${c.observacoes}
      </div>` : ''}
      <div class="view-section">
        <div class="view-section-title"><i class="fas fa-box"></i> Itens (${(c.itens||[]).length})</div>
        <table class="view-itens-table">
          <thead><tr><th>Descrição</th><th class="td-r">Qtd / Un.</th><th>Justificativa</th></tr></thead>
          <tbody>${itensHtml}</tbody>
        </table>
      </div>
      <div class="view-section">
        <div class="view-section-title"><i class="fas fa-truck"></i> Fornecedores (${total_forn})</div>
        <div class="view-forn-grid">${fornsHtml}</div>
      </div>
    `;
  } catch (err) {
    body.innerHTML = `<div style="padding:32px;text-align:center;color:#ef4444"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
}

function closeModalVer(e) {
  if (e && e.target !== document.getElementById('modalVer')) return;
  document.getElementById('modalVer').classList.add('hidden');
  viewingId = null;
}

function irParaMapa() {
  if (viewingId) irParaMapaId(viewingId);
}

function irParaMapaId(id) {
  window.location.href = `mapa-cotacao.html?id=${id}`;
}

/* ══════════════════════════════════════════════════════════
   MODAL DELETE
══════════════════════════════════════════════════════════ */
function openModalDelete(id) {
  const c = cotacoes.find(x => x.id === id);
  if (!c) return;
  deletingId = id;
  document.getElementById('deleteNome').textContent = `"${c.numero}"`;
  document.getElementById('modalDelete').classList.remove('hidden');
}

function closeModalDelete(e) {
  if (e && e.target !== document.getElementById('modalDelete')) return;
  document.getElementById('modalDelete').classList.add('hidden');
  deletingId = null;
}

async function confirmDelete() {
  try {
    await api('DELETE', `/cotacoes/${deletingId}`);
    document.getElementById('modalDelete').classList.add('hidden');
    deletingId = null;
    showToast('Cotação excluída.', 'success');
    await loadAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function finalizarCotacao(id) {
  const c = cotacoes.find(x => x.id === id);
  if (!c) return;
  if (!confirm(`Finalizar a cotação "${c.numero}" e gerar os pedidos de compra?\n\nOs vencedores selecionados no Mapa de Cotação serão usados.`)) return;

  try {
    // Busca vencedores do mapa
    const vencedores = await api('GET', `/cotacoes/${id}/vencedores`);
    if (!vencedores || !vencedores.length) {
      showToast('Selecione os vencedores no Mapa de Cotação antes de finalizar.', 'error');
      return;
    }

    // Encontra o fornecedor vencedor (com mais itens selecionados)
    const contagem = {};
    vencedores.forEach(v => {
      contagem[v.id_fornecedor_vencedor] = (contagem[v.id_fornecedor_vencedor] || 0) + 1;
    });
    const fornVencedor = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0];
    const fornId   = parseInt(fornVencedor[0]);
    const itens_ids = vencedores.map(v => v.id_cotacao_item);

    // Gera pedido único para o fornecedor vencedor
    const p = await api('POST', '/pedidos', { id_cotacao: id, id_fornecedor: fornId, itens_ids });

    showToast(`Cotação finalizada! Pedido ${p.numero} gerado.`, 'success');
    await loadAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Toast ───────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle';
  toast.innerHTML = `<i class="fas fa-${icon}"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

/* ── Sidebar ─────────────────────────────────────────────── */
function toggleNavGroup(groupId) {
  document.getElementById(groupId)?.classList.toggle('open');
}

function toggleUserMenu() {
  document.getElementById('userDropdown').classList.toggle('hidden');
}

function handleLogout() {
  localStorage.removeItem('sis_token');
  localStorage.removeItem('sis_user');
  sessionStorage.removeItem('sis_token');
  sessionStorage.removeItem('sis_user');
  window.location.href = '../index.html';
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle  = document.getElementById('sidebarToggle');
  const menuBtn = document.getElementById('menuBtn');
  const overlay = document.getElementById('sidebarOverlay');
  const wrapper = document.getElementById('mainWrapper');

  if (localStorage.getItem('sidebar_collapsed') === 'true') {
    sidebar.classList.add('collapsed');
    wrapper.classList.add('sidebar-collapsed');
  }

  toggle?.addEventListener('click', () => {
    const c = sidebar.classList.toggle('collapsed');
    wrapper.classList.toggle('sidebar-collapsed', c);
    localStorage.setItem('sidebar_collapsed', c);
  });

  menuBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
    overlay?.classList.toggle('active');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
  });

  document.addEventListener('click', e => {
    const dd = document.getElementById('userDropdown');
    if (dd && !dd.classList.contains('hidden') && !e.target.closest('.header-user')) {
      dd.classList.add('hidden');
    }
  });

  const raw = localStorage.getItem('sis_user') || sessionStorage.getItem('sis_user');
  if (raw) {
    try {
      const u = JSON.parse(raw);
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
