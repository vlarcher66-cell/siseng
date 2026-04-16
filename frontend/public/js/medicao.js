/* ═══════════════════════════════════════════════════════════
   SISENG — Medição (Boletim de Medição)  v1.0
═══════════════════════════════════════════════════════════ */

/* ── Dados mock ──────────────────────────────────────────── */
const MEDICOES_MOCK = [
  {
    id: 'bm1',
    obraId: 'obra_1', obraNome: 'Residencial das Palmeiras',
    periodo: '2026-02',
    itens: [
      { etapaId: 'et3', etapaNome: 'Alvenaria de Vedação', percPlanejado: 80, percExecutado: 68, custoPrevisto: 95000, custoReal: 61000 }
    ],
    valorTotal: 61000,
    status: 'aprovado',
    observacoes: 'Medição mensal conforme avanço da alvenaria.',
    criadoEm: '2026-02-28'
  },
  {
    id: 'bm2',
    obraId: 'obra_4', obraNome: 'Galpão Industrial Norte',
    periodo: '2026-02',
    itens: [
      { etapaId: 'et7', etapaNome: 'Piso Industrial', percPlanejado: 60, percExecutado: 45, custoPrevisto: 180000, custoReal: 98000 }
    ],
    valorTotal: 98000,
    status: 'rascunho',
    observacoes: '',
    criadoEm: '2026-02-25'
  }
];

/* ── Estado ──────────────────────────────────────────────── */
let medicoes = [];
let filteredMedicoes = [];
let searchTerm = '';
let editingId = null;
let deletingId = null;
let viewingId = null;

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadMedicoesFromApi(), loadObrasFromApi()]);
  populateFilterObras();
  populateModalObras();
  applyFilters();
  updateStats();
  initSidebar();

  renderSidebar('medicao');
});

/* ── API helpers ─────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token') || '';
}

async function apiCall(method, path, body) {
  const opts = {
    method,
    headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('https://siseng-production.up.railway.app/api' + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

function mapMedicaoApi(m) {
  return {
    id:          m.id,
    obraId:      m.obra_id,
    obraNome:    m.obra_nome || '',
    periodo:     m.periodo ? m.periodo.split('T')[0] : '',
    status:      m.status || 'rascunho',
    observacoes: m.obs || '',
    valorTotal:  parseFloat(m.valor_total) || 0,
    criadoEm:    m.criado_em ? m.criado_em.split('T')[0] : '',
    itens:       (m.itens || []).map(i => ({
      etapaId:       i.etapaId,
      etapaNome:     i.etapaNome,
      percExecutado: parseFloat(i.percExecutado) || 0,
      custoReal:     parseFloat(i.custoReal) || 0,
      custoPrevisto: parseFloat(i.custoPrevisto) || 0,
    })),
  };
}

async function loadMedicoesFromApi() {
  try {
    const data = await apiCall('GET', '/medicoes');
    medicoes = data.map(mapMedicaoApi);
    // Remove dados antigos do localStorage (migrado para o banco)
    localStorage.removeItem('sis_medicoes');
    localStorage.removeItem('sis_etapas');
  } catch (err) {
    console.warn('Erro ao carregar medições:', err.message);
    medicoes = [];
  }
}

let _obrasCache = [];

async function loadObrasFromApi() {
  const token = localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token') || '';
  if (!token) return;
  try {
    const res = await fetch('https://siseng-production.up.railway.app/api/obras', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) _obrasCache = await res.json();
  } catch(_) {}
}

function getObras() {
  return _obrasCache;
}

async function getEtapasByObra(obraId) {
  const token = localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token') || '';
  try {
    const res = await fetch(`${API_BASE}/obras/etapas?obra_id=${obraId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) return await res.json();
  } catch(_) {}
  return [];
}

/* ── Helpers ─────────────────────────────────────────────── */
function formatCurrency(value) {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPeriodo(periodo) {
  if (!periodo) return '—';
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const [year, month] = periodo.split('-');
  const idx = parseInt(month, 10) - 1;
  return `${meses[idx] || month}/${year}`;
}

function statusLabel(status) {
  const map = { rascunho: 'Rascunho', aprovado: 'Aprovado', faturado: 'Faturado' };
  return map[status] || status;
}

function statusBadge(status) {
  const cls = { rascunho: 'badge-rascunho', aprovado: 'badge-aprovado', faturado: 'badge-faturado' };
  const icon = { rascunho: 'fa-pencil-alt', aprovado: 'fa-check-circle', faturado: 'fa-file-invoice-dollar' };
  return `<span class="badge-status ${cls[status] || ''}">
    <i class="fas ${icon[status] || 'fa-circle'}" style="font-size:.55rem"></i>
    ${statusLabel(status)}
  </span>`;
}

/* ── Filtro / Renderização ───────────────────────────────── */
function filterMedicoes(term) {
  searchTerm = term;
  applyFilters();
}

function applyFilters() {
  const obraFiltro   = document.getElementById('filterObra').value;
  const statusFiltro = document.getElementById('filterStatus').value;

  filteredMedicoes = medicoes.filter(m => {
    const matchSearch = !searchTerm ||
      (m.obraNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatPeriodo(m.periodo).toLowerCase().includes(searchTerm.toLowerCase());

    const matchObra   = !obraFiltro   || String(m.obraId) === String(obraFiltro);
    const matchStatus = !statusFiltro || m.status  === statusFiltro;

    return matchSearch && matchObra && matchStatus;
  });

  renderTable();
  updateCount();
}

function renderTable() {
  const tbody = document.getElementById('bmTableBody');
  const empty = document.getElementById('bmEmpty');

  if (filteredMedicoes.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = filteredMedicoes.map(m => `
    <tr>
      <td>
        <div class="bm-obra-nome">${m.obraNome || '—'}</div>
      </td>
      <td>
        <span class="bm-periodo"><i class="fas fa-calendar-alt"></i> ${formatPeriodo(m.periodo)}</span>
      </td>
      <td>
        <span class="bm-etapas-count">
          <i class="fas fa-list-check"></i>
          ${(m.itens || []).length} etapa${(m.itens || []).length !== 1 ? 's' : ''}
        </span>
      </td>
      <td>
        <span class="bm-valor">${formatCurrency(m.valorTotal)}</span>
      </td>
      <td>${statusBadge(m.status)}</td>
      <td>
        <div class="bm-actions">
          <button class="btn-view-row" title="Visualizar BM" onclick="openModalBM('${m.id}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-edit-row" title="Editar" onclick="openModalNova('${m.id}')">
            <i class="fas fa-pen"></i>
          </button>
          <button class="btn-report-row" title="Gerar Relatório" onclick="gerarRelatorio('${m.id}')">
            <i class="fas fa-file-pdf"></i>
          </button>
          <button class="btn-del-row" title="Excluir" onclick="openDelete('${m.id}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateCount() {
  document.getElementById('bmCount').textContent =
    `${filteredMedicoes.length} medição${filteredMedicoes.length !== 1 ? 'ões' : ''}`;
}

function updateStats() {
  document.getElementById('statTotalBMs').textContent    = medicoes.length;
  document.getElementById('statAprovados').textContent   = medicoes.filter(m => m.status === 'aprovado').length;
  const total = medicoes.reduce((acc, m) => acc + (parseFloat(m.valorTotal) || 0), 0);
  document.getElementById('statValorTotal').textContent  = formatCurrency(total);
}

/* ── Populate selects ────────────────────────────────────── */
function populateFilterObras() {
  const sel = document.getElementById('filterObra');
  sel.innerHTML = '<option value="">Todas as obras</option>';

  const obras = getObras();
  if (obras.length > 0) {
    obras.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = o.nome || o.name || o.id;
      sel.appendChild(opt);
    });
  } else {
    // Fallback: usar obras presentes nas medições
    const obrasNasMedicoes = [...new Map(medicoes.map(m => [m.obraId, { id: m.obraId, nome: m.obraNome }])).values()];
    obrasNasMedicoes.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = o.nome;
      sel.appendChild(opt);
    });
  }
}

function populateModalObras() {
  const sel = document.getElementById('fObra');
  sel.innerHTML = '<option value="">Selecione a obra...</option>';

  const obras = getObras();
  if (obras.length > 0) {
    obras.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = o.nome || o.name || o.id;
      sel.appendChild(opt);
    });
  } else {
    // Fallback com obras das medições mock para demo
    const obrasNasMedicoes = [...new Map(medicoes.map(m => [m.obraId, { id: m.obraId, nome: m.obraNome }])).values()];
    obrasNasMedicoes.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = o.nome;
      sel.appendChild(opt);
    });
  }
}

/* ── % acumulado de medições aprovadas para uma etapa ─────── */
function getPercTotalEtapa(etapaId) {
  return medicoes
    .filter(m => String(m.id) !== String(editingId) && m.status === 'aprovado')
    .reduce((acc, m) => {
      const item = (m.itens || []).find(i => String(i.etapaId) === String(etapaId));
      return acc + (parseFloat(item?.percExecutado) || 0);
    }, 0);
}

/* ── Recalcula Custo Real ao digitar % executado ─────────── */
function onPercExecInput(input) {
  const row = input.closest('tr');
  const custoPrev = parseFloat(row.dataset.custoPrevisto) || 0;
  const percTotal = parseFloat(row.dataset.percTotal) || 0;
  let val = parseFloat(input.value) || 0;

  const maxPerc = Math.max(0, 100 - percTotal);
  if (val > maxPerc) {
    input.value = maxPerc;
    val = maxPerc;
    showToast(`Esta etapa tem apenas ${maxPerc.toFixed(1)}% disponível para medir.`, 'error');
  }

  const custoReal = val * custoPrev / 100;
  const cell = document.getElementById('custoReal_' + row.dataset.etapaId);
  if (cell) cell.textContent = formatCurrency(custoReal);
}

/* ── Ao selecionar obra no modal ─────────────────────────── */
async function onObraChange(obraId) {
  const table       = document.getElementById('bmItensTable');
  const placeholder = document.getElementById('bmItensPlaceholder');
  const hint        = document.getElementById('etapasSectionHint');
  const tbody       = document.getElementById('bmItensBody');

  if (!obraId) {
    table.classList.add('hidden');
    placeholder.classList.remove('hidden');
    hint.textContent = 'Selecione uma obra para carregar as etapas';
    return;
  }

  hint.textContent = 'Carregando etapas...';
  const etapas = await getEtapasByObra(obraId);

  if (etapas.length === 0) {
    placeholder.classList.remove('hidden');
    table.classList.add('hidden');
    hint.textContent = 'Nenhuma etapa planejada encontrada para esta obra';
    return;
  }

  hint.textContent = `${etapas.length} etapa${etapas.length !== 1 ? 's' : ''} encontrada${etapas.length !== 1 ? 's' : ''}`;
  placeholder.classList.add('hidden');
  table.classList.remove('hidden');

  // Se estiver editando, pre-preenche com dados existentes
  let existingItens = [];
  if (editingId) {
    const med = medicoes.find(m => m.id === editingId);
    if (med) existingItens = med.itens || [];
  }

  tbody.innerHTML = etapas.map(et => {
    const existing       = existingItens.find(i => String(i.etapaId) === String(et.id));
    const percExec       = existing ? existing.percExecutado : '';
    const custoPrev      = parseFloat(et.custo_previsto || et.custoPrevisto || 0);
    const percTotal      = getPercTotalEtapa(et.id);
    const maxPerc        = Math.max(0, 100 - percTotal);
    const valorExecutado = percTotal * custoPrev / 100;
    const custoRealVal   = percExec !== '' ? (parseFloat(percExec) * custoPrev / 100) : 0;
    const concluida      = et.status === 'concluida' || percTotal >= 100;

    return `
      <tr data-etapa-id="${et.id}"
          data-etapa-nome="${escapeHtml(et.nome || et.id)}"
          data-perc-total="${percTotal}"
          data-custo-previsto="${custoPrev}"
          ${concluida ? 'style="opacity:.55;background:#f8fafc;"' : ''}>
        <td class="etapa-nome-cell">
          ${et.nome || et.id}
          ${concluida ? '<span style="margin-left:6px;font-size:.68rem;font-weight:700;color:#22c55e;background:#dcfce7;padding:2px 7px;border-radius:20px;">✓ Concluída</span>' : ''}
        </td>
        <td class="perc-total-cell">
          <span class="perc-total-pct">${percTotal.toFixed(1)}%</span>
          <span class="perc-total-val">${formatCurrency(valorExecutado)}</span>
        </td>
        <td class="td-num">
          <input
            type="number"
            class="input-perc"
            placeholder="${concluida ? '—' : '0'}"
            min="0"
            max="${maxPerc}"
            step="0.1"
            value="${percExec}"
            data-field="percExecutado"
            oninput="onPercExecInput(this)"
            title="${concluida ? 'Etapa concluída — medição bloqueada' : '% executado neste período (máx: ' + maxPerc.toFixed(1) + '%)'}"
            ${concluida ? 'disabled style="background:#f1f5f9;color:#94a3b8;cursor:not-allowed;"' : ''}
          />
        </td>
        <td class="custo-previsto-cell">${formatCurrency(custoPrev)}</td>
        <td class="custo-real-cell" id="custoReal_${et.id}">${formatCurrency(custoRealVal)}</td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Coletar itens da tabela ─────────────────────────────── */
function collectItens() {
  const rows = document.querySelectorAll('#bmItensBody tr[data-etapa-id]');
  const itens = [];
  let blockSave = false;

  rows.forEach(row => {
    const etapaId    = row.dataset.etapaId;
    const etapaNome  = row.dataset.etapaNome;
    const percTotal  = parseFloat(row.dataset.percTotal) || 0;
    const custoPrev  = parseFloat(row.dataset.custoPrevisto) || 0;
    const percInput  = row.querySelector('[data-field="percExecutado"]');
    const percExecutado = parseFloat(percInput?.value) || 0;

    if (percExecutado <= 0) return;

    if (percTotal + percExecutado > 100 + 0.001) {
      showToast(`"${etapaNome}": total ultrapassaria 100% do custo previsto.`, 'error');
      blockSave = true;
      return;
    }

    const custoReal = percExecutado * custoPrev / 100;
    itens.push({ etapaId, etapaNome, percTotal, percExecutado, custoPrevisto: custoPrev, custoReal });
  });

  return blockSave ? null : itens;
}

/* ── Modal Nova Medição ──────────────────────────────────── */
function openModalNova(id = null) {
  editingId = id ? Number(id) || id : null;
  const title = document.getElementById('modalNovaTitle');

  // Reset form
  document.getElementById('medicaoId').value    = '';
  document.getElementById('fPeriodo').value     = '';
  document.getElementById('fObservacoes').value = '';
  document.getElementById('bmItensBody').innerHTML = '';
  document.getElementById('bmItensTable').classList.add('hidden');
  document.getElementById('bmItensPlaceholder').classList.remove('hidden');
  document.getElementById('etapasSectionHint').textContent = 'Selecione uma obra para carregar as etapas';

  populateModalObras();

  if (id) {
    const m = medicoes.find(x => String(x.id) === String(id));
    if (!m) return;

    title.innerHTML = '<i class="fas fa-pen"></i> Editar Medição';
    document.getElementById('medicaoId').value    = m.id;
    document.getElementById('fObra').value        = m.obraId;
    document.getElementById('fPeriodo').value     = m.periodo;
    document.getElementById('fObservacoes').value = m.observacoes || '';

    // Carrega etapas com dados existentes
    onObraChange(m.obraId);
  } else {
    title.innerHTML = '<i class="fas fa-plus-circle"></i> Nova Medição';
    document.getElementById('fObra').value = '';
  }

  document.getElementById('modalNova').classList.remove('hidden');
  setTimeout(() => document.getElementById('fObra').focus(), 100);
}

function closeModalNova(e) {
  if (e && e.target !== document.getElementById('modalNova')) return;
  document.getElementById('modalNova').classList.add('hidden');
  editingId = null;
}

/* ── Salvar medição ──────────────────────────────────────── */
async function saveMedicao(status) {
  const obraId  = document.getElementById('fObra').value;
  const periodo = document.getElementById('fPeriodo').value;
  const obs     = document.getElementById('fObservacoes').value.trim();

  if (!obraId)  { showToast('Selecione a obra vinculada.', 'error'); return; }
  if (!periodo) { showToast('Informe a data da medição.', 'error'); return; }

  const itens = collectItens();
  if (itens === null) return;

  const btn = status === 'rascunho'
    ? document.getElementById('btnRascunho')
    : document.getElementById('btnAprovar');

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  try {
    const payload = { obra_id: obraId, periodo, status, obs, itens };

    let saved;
    if (editingId) {
      saved = await apiCall('PUT', `/medicoes/${editingId}`, payload);
      showToast('Medição atualizada com sucesso!', 'success');
    } else {
      saved = await apiCall('POST', '/medicoes', payload);
      showToast(
        status === 'aprovado'
          ? 'Boletim de Medição aprovado e salvo!'
          : 'Medição salva como rascunho.',
        'success'
      );
    }

    // Atualiza array local
    const mapped = mapMedicaoApi(saved);
    if (editingId) {
      const idx = medicoes.findIndex(m => m.id === editingId);
      if (idx !== -1) medicoes[idx] = mapped;
    } else {
      medicoes.unshift(mapped);
    }

    applyFilters();
    updateStats();
    populateFilterObras();
    document.getElementById('modalNova').classList.add('hidden');
    editingId = null;
  } catch (err) {
    showToast('Erro ao salvar: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    if (status === 'rascunho') {
      btn.innerHTML = '<i class="fas fa-save"></i> Salvar Rascunho';
    } else {
      btn.innerHTML = '<i class="fas fa-check-circle"></i> Aprovar e Salvar';
    }
  }
}

/* ── Modal Visualização BM ───────────────────────────────── */
function openModalBM(id) {
  const m = medicoes.find(x => String(x.id) === String(id));
  if (!m) return;
  viewingId = id;

  const body = document.getElementById('bmViewBody');

  const itensRows = (m.itens || []).map(item => `
    <tr>
      <td>${item.etapaNome || '—'}</td>
      <td class="td-r">${(item.percTotal ?? item.percPlanejado ?? 0).toFixed(1)}%</td>
      <td class="td-r">
        <div class="mini-prog-wrap" style="justify-content:flex-end">
          <div class="mini-prog-bar">
            <div class="mini-prog-fill" style="width:${Math.min(item.percExecutado || 0, 100)}%"></div>
          </div>
          <span class="mini-prog-label">${item.percExecutado || 0}%</span>
        </div>
      </td>
      <td class="td-r">${formatCurrency(item.custoPrevisto)}</td>
      <td class="td-r" style="font-weight:700;color:var(--dark)">${formatCurrency(item.custoReal)}</td>
    </tr>
  `).join('') || `<tr><td colspan="5" style="text-align:center;padding:20px;color:#94a3b8">Nenhuma etapa medida</td></tr>`;

  body.innerHTML = `
    <div class="bm-view-header">
      <div>
        <p class="bm-view-header-title"><i class="fas fa-ruler-combined"></i> ${m.obraNome || '—'}</p>
        <p class="bm-view-header-sub">Período: ${formatPeriodo(m.periodo)} &nbsp;|&nbsp; Emitido em: ${m.criadoEm || '—'}</p>
      </div>
      <span class="bm-view-badge">${statusLabel(m.status)}</span>
    </div>

    <div class="bm-view-meta">
      <div class="bm-meta-item">
        <span class="bm-meta-label"><i class="fas fa-hard-hat"></i> Obra</span>
        <span class="bm-meta-val">${m.obraNome || '—'}</span>
      </div>
      <div class="bm-meta-item">
        <span class="bm-meta-label"><i class="fas fa-calendar-alt"></i> Período</span>
        <span class="bm-meta-val">${formatPeriodo(m.periodo)}</span>
      </div>
      <div class="bm-meta-item">
        <span class="bm-meta-label"><i class="fas fa-list-check"></i> Etapas Medidas</span>
        <span class="bm-meta-val">${(m.itens || []).length}</span>
      </div>
    </div>

    <div class="bm-view-itens-title">
      <i class="fas fa-table"></i> Itens Medidos
    </div>
    <table class="bm-view-table">
      <thead>
        <tr>
          <th>Etapa</th>
          <th class="th-r">% Total</th>
          <th class="th-r">% Executado neste período</th>
          <th class="th-r">Custo Previsto</th>
          <th class="th-r">Custo Real</th>
        </tr>
      </thead>
      <tbody>${itensRows}</tbody>
    </table>

    <div class="bm-view-total-row">
      <div class="bm-view-total">
        <span class="bm-view-total-label">Total Medido</span>
        <span class="bm-view-total-val">${formatCurrency(m.valorTotal)}</span>
      </div>
    </div>

    ${m.observacoes ? `
      <div class="bm-view-obs" style="margin-top:16px">
        <strong><i class="fas fa-sticky-note"></i> Observações</strong>
        ${m.observacoes}
      </div>
    ` : ''}
  `;

  document.getElementById('modalBM').classList.remove('hidden');
}

function closeModalBM(e) {
  if (e && e.target !== document.getElementById('modalBM')) return;
  document.getElementById('modalBM').classList.add('hidden');
  viewingId = null;
}

function printBM() {
  showToast('Preparando impressão do BM...', 'info');
  setTimeout(() => window.print(), 300);
}

/* ── Modal Deletar ───────────────────────────────────────── */
function openDelete(id) {
  const m = medicoes.find(x => String(x.id) === String(id));
  if (!m) return;
  deletingId = id;
  document.getElementById('deleteNome').textContent =
    `"${m.obraNome} — ${formatPeriodo(m.periodo)}"`;
  document.getElementById('deleteOverlay').classList.remove('hidden');
}

function closeDelete(e) {
  if (e && e.target !== document.getElementById('deleteOverlay')) return;
  document.getElementById('deleteOverlay').classList.add('hidden');
  deletingId = null;
}

async function confirmDelete() {
  const btn = document.querySelector('#deleteOverlay .btn-delete');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...'; }
  try {
    await apiCall('DELETE', `/medicoes/${deletingId}`);
    medicoes = medicoes.filter(m => String(m.id) !== String(deletingId));
    applyFilters();
    updateStats();
    document.getElementById('deleteOverlay').classList.add('hidden');
    deletingId = null;
    showToast('Medição excluída com sucesso.', 'success');
  } catch (err) {
    showToast('Erro ao excluir: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash-alt"></i> Excluir'; }
  }
}

/* ── Toast ───────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
  toast.innerHTML = `<i class="fas fa-${icon}"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

/* ── Sidebar ─────────────────────────────────────────────── */
function toggleNavGroup(groupId) {
  const group = document.getElementById(groupId);
  if (group) group.classList.toggle('open');
}

function toggleUserMenu() {
  document.getElementById('userDropdown').classList.toggle('hidden');
}

function handleLogout() {
  localStorage.removeItem('sis_token');
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
    overlay.classList.toggle('active');
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
}

/* ── Gerar Relatório de Medição ──────────────────────────── */
async function gerarRelatorio(id) {
  const m = medicoes.find(x => String(x.id) === String(id));
  if (!m) return;

  const user = JSON.parse(localStorage.getItem('sis_user') || sessionStorage.getItem('sis_user') || '{}');
  const empresa = user.empresa || 'SISENG';

  // Busca todas as etapas da obra via API
  const todasEtapas = m.obraId ? await getEtapasByObra(m.obraId) : [];

  const statusLabel = { rascunho: 'Rascunho', aprovado: 'Aprovado', cancelado: 'Cancelado' };
  const statusColor = { rascunho: '#f59e0b', aprovado: '#22c55e', cancelado: '#ef4444' };

  const itens = m.itens || [];
  const totalPrevisto = itens.reduce((acc, i) => acc + (parseFloat(i.custoPrevisto) || 0), 0);
  const totalReal     = itens.reduce((acc, i) => acc + (parseFloat(i.custoReal)     || 0), 0);

  const linhasTabela = itens.map(i => {
    // Acumulado = soma de todas medições aprovadas para essa etapa (incluindo a atual)
    const acumulado = medicoes
      .filter(x => x.status === 'aprovado')
      .reduce((acc, x) => {
        const it = (x.itens || []).find(t => String(t.etapaId) === String(i.etapaId));
        return acc + (parseFloat(it?.percExecutado) || 0);
      }, 0);
    return `
    <tr>
      <td>${i.etapaNome || '—'}</td>
      <td class="center">${acumulado.toFixed(1)}%</td>
      <td class="center">${(i.percExecutado || 0).toFixed(1)}%</td>
      <td class="right">R$ ${parseFloat(i.custoPrevisto || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
      <td class="right">R$ ${parseFloat(i.custoReal || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
    </tr>
  `;
  }).join('');

  const variacao    = totalPrevisto > 0 ? ((totalReal - totalPrevisto) / totalPrevisto * 100).toFixed(1) : null;
  const variacaoOk  = parseFloat(variacao) <= 0;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Boletim de Medição — ${m.obraNome}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Inter',sans-serif;color:#1e293b;background:#eef2f7;padding:32px 24px;}

    /* Barra de ação */
    .print-bar{position:fixed;top:0;left:0;right:0;z-index:100;background:#0f172a;padding:12px 32px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 16px rgba(0,0,0,.3);}
    .print-bar-logo{color:#fff;font-weight:800;font-size:1rem;letter-spacing:-.3px;}
    .print-bar-logo span{color:#f97316;}
    .print-bar-btns{display:flex;gap:10px;}
    .btn-fechar{background:rgba(255,255,255,.08);color:#cbd5e1;border:1.5px solid rgba(255,255,255,.12);padding:8px 20px;border-radius:8px;font-weight:600;font-size:.85rem;cursor:pointer;transition:.2s;}
    .btn-fechar:hover{background:rgba(255,255,255,.15);}
    .btn-imprimir{background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;padding:8px 24px;border-radius:8px;font-weight:700;font-size:.85rem;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(249,115,22,.4);transition:.2s;}
    .btn-imprimir:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(249,115,22,.5);}

    /* Página */
    .page{max-width:860px;margin:64px auto 0;background:#fff;border-radius:20px;box-shadow:0 8px 48px rgba(0,0,0,.12);overflow:hidden;}

    /* Header */
    .header{background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#1d4ed8 100%);padding:36px 44px;display:flex;justify-content:space-between;align-items:flex-start;position:relative;overflow:hidden;}
    .header::before{content:'';position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;background:rgba(249,115,22,.08);}
    .header::after{content:'';position:absolute;bottom:-80px;right:80px;width:160px;height:160px;border-radius:50%;background:rgba(37,99,235,.15);}
    .logo-wrap{display:flex;align-items:center;gap:16px;position:relative;z-index:1;}
    .logo-icon{width:52px;height:52px;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;box-shadow:0 4px 16px rgba(249,115,22,.4);}
    .logo-text h1{font-size:1.7rem;font-weight:900;color:#fff;letter-spacing:-.5px;}
    .logo-text h1 span{color:#f97316;}
    .logo-text p{font-size:.8rem;color:rgba(255,255,255,.55);margin-top:3px;font-weight:500;}
    .header-info{text-align:right;position:relative;z-index:1;}
    .doc-type{font-size:.68rem;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.12em;}
    .doc-num{font-size:1.8rem;font-weight:900;color:#fff;margin:4px 0;letter-spacing:-1px;}
    .status-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:50px;font-size:.75rem;font-weight:700;margin-top:6px;}
    .status-pill.aprovado{background:rgba(34,197,94,.2);color:#4ade80;border:1.5px solid rgba(34,197,94,.3);}
    .status-pill.rascunho{background:rgba(245,158,11,.2);color:#fbbf24;border:1.5px solid rgba(245,158,11,.3);}
    .status-pill.cancelado{background:rgba(239,68,68,.2);color:#f87171;border:1.5px solid rgba(239,68,68,.3);}

    /* Cards de info */
    .info-strip{display:grid;grid-template-columns:repeat(3,1fr);background:#f8fafc;border-bottom:1.5px solid #e2e8f0;}
    .info-card{padding:20px 28px;border-right:1.5px solid #e2e8f0;}
    .info-card:last-child{border-right:none;}
    .info-card-icon{width:32px;height:32px;border-radius:8px;background:#dbeafe;display:flex;align-items:center;justify-content:center;margin-bottom:10px;font-size:.9rem;}
    .info-card-label{font-size:.65rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;}
    .info-card-value{font-size:.95rem;font-weight:700;color:#0f172a;}

    /* Seção */
    .section{padding:32px 44px;}
    .section+.section{padding-top:0;}
    .section-header{display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #f1f5f9;}
    .section-icon{width:34px;height:34px;background:#dbeafe;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#2563eb;font-size:.95rem;flex-shrink:0;}
    .section-title{font-size:.8rem;font-weight:800;color:#1e3a5f;text-transform:uppercase;letter-spacing:.08em;}

    /* Tabela */
    table{width:100%;border-collapse:collapse;font-size:.85rem;}
    thead tr{background:#f8fafc;}
    thead th{padding:10px 14px;text-align:left;font-size:.67rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;border-bottom:2px solid #e2e8f0;}
    th.r,td.r{text-align:right;}
    th.c,td.c{text-align:center;}
    tbody tr{border-bottom:1px solid #f1f5f9;transition:.15s;}
    tbody tr:nth-child(even){background:#fafbfc;}
    tbody td{padding:13px 14px;color:#334155;vertical-align:middle;}
    .etapa-nome{font-weight:600;color:#0f172a;}
    /* Barra progresso */
    .prog-wrap{display:flex;align-items:center;gap:8px;justify-content:center;}
    .prog-bar{width:70px;height:6px;background:#e2e8f0;border-radius:50px;overflow:hidden;}
    .prog-fill{height:100%;border-radius:50px;background:linear-gradient(90deg,#2563eb,#60a5fa);}
    .prog-pct{font-size:.8rem;font-weight:700;color:#2563eb;min-width:36px;}
    .exec-pct{font-size:.85rem;font-weight:700;color:#f97316;}
    /* Custo real colorido */
    .custo-ok{color:#16a34a;font-weight:600;}
    .custo-alto{color:#dc2626;font-weight:600;}
    tfoot tr{background:linear-gradient(135deg,#1e3a5f,#1d4ed8);color:#fff;}
    tfoot td{padding:14px;font-weight:700;font-size:.88rem;}

    /* KPIs */
    .kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px;}
    .kpi{border-radius:14px;padding:20px 22px;border:1.5px solid #e2e8f0;}
    .kpi.kpi-prev{background:#f8fafc;}
    .kpi.kpi-real{background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;border-color:transparent;box-shadow:0 6px 24px rgba(37,99,235,.25);}
    .kpi.kpi-var{background:#f8fafc;}
    .kpi-label{font-size:.67rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.6;margin-bottom:8px;}
    .kpi-valor{font-size:1.35rem;font-weight:900;line-height:1;}
    .kpi-sub{font-size:.72rem;font-weight:600;margin-top:6px;opacity:.7;}
    .var-pos{color:#dc2626;}
    .var-neg{color:#16a34a;}

    /* Observações */
    .obs-box{background:#f8fafc;border-left:4px solid #2563eb;border-radius:0 12px 12px 0;padding:16px 20px;font-size:.86rem;color:#475569;line-height:1.75;}

    /* Assinatura */
    .assin-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:8px;}
    .assin-item{text-align:center;}
    .assin-linha{border-top:1.5px solid #cbd5e1;margin-bottom:8px;}
    .assin-nome{font-size:.75rem;font-weight:700;color:#475569;}
    .assin-cargo{font-size:.68rem;color:#94a3b8;margin-top:2px;}

    /* Footer */
    .footer{background:#f8fafc;border-top:1.5px solid #e2e8f0;padding:18px 44px;display:flex;justify-content:space-between;align-items:center;}
    .footer-brand{font-size:.75rem;color:#94a3b8;}
    .footer-brand strong{color:#64748b;}
    .footer-page{font-size:.72rem;color:#cbd5e1;font-weight:500;}

    @media print{
      body{background:#fff;padding:0;}
      .print-bar{display:none;}
      .page{margin:0;border-radius:0;box-shadow:none;}
      tbody tr:nth-child(even){background:#f9fafb !important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    }
  </style>
</head>
<body>
  <!-- Barra de ação -->
  <div class="print-bar">
    <div class="print-bar-logo">SIS<span>OBRAS</span> — Boletim de Medição</div>
    <div class="print-bar-btns">
      <button class="btn-fechar" onclick="window.close()">✕ Fechar</button>
      <button class="btn-imprimir" onclick="window.print()">🖨 Imprimir / Salvar PDF</button>
    </div>
  </div>

  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo-wrap">
        <div class="logo-icon">⛑</div>
        <div class="logo-text">
          <h1>SIS<span>OBRAS</span></h1>
          <p>${empresa}</p>
        </div>
      </div>
      <div class="header-info">
        <div class="doc-type">Boletim de Medição</div>
        <div class="doc-num">#BM-${String(id).slice(-4).toUpperCase()}</div>
        <div class="status-pill ${m.status || 'rascunho'}">
          <span style="width:7px;height:7px;border-radius:50%;background:currentColor;display:inline-block;"></span>
          ${statusLabel[m.status] || m.status}
        </div>
      </div>
    </div>

    <!-- Info strip -->
    <div class="info-strip">
      <div class="info-card">
        <div class="info-card-icon">🏗</div>
        <div class="info-card-label">Obra</div>
        <div class="info-card-value">${m.obraNome || '—'}</div>
      </div>
      <div class="info-card">
        <div class="info-card-icon">📅</div>
        <div class="info-card-label">Data da Medição</div>
        <div class="info-card-value">${m.periodo ? new Date(m.periodo + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</div>
      </div>
      <div class="info-card">
        <div class="info-card-icon">🖨</div>
        <div class="info-card-label">Emitido em</div>
        <div class="info-card-value">${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
      </div>
    </div>

    <!-- Etapas -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📋</div>
        <div class="section-title">Etapas Medidas</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Etapa</th>
            <th class="c">% Acumulado</th>
            <th class="c">% Este Período</th>
            <th class="r">Custo Previsto</th>
            <th class="r">Custo Real</th>
          </tr>
        </thead>
        <tbody>
          ${linhasTabela || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px">Nenhuma etapa registrada</td></tr>'}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3"><strong>TOTAL GERAL</strong></td>
            <td class="r">R$ ${totalPrevisto.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
            <td class="r">R$ ${totalReal.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
          </tr>
        </tfoot>
      </table>

      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi kpi-prev">
          <div class="kpi-label">Custo Previsto</div>
          <div class="kpi-valor">R$ ${totalPrevisto.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
          <div class="kpi-sub">Orçamento desta medição</div>
        </div>
        <div class="kpi kpi-real">
          <div class="kpi-label">Valor Medido</div>
          <div class="kpi-valor">R$ ${totalReal.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
          <div class="kpi-sub">Custo real apurado</div>
        </div>
        <div class="kpi kpi-var">
          <div class="kpi-label">Variação de Custo</div>
          <div class="kpi-valor ${variacao !== null ? (variacaoOk ? 'var-neg' : 'var-pos') : ''}">
            ${variacao !== null ? (variacaoOk ? '▼ ' : '▲ ') + Math.abs(variacao) + '%' : '—'}
          </div>
          <div class="kpi-sub">${variacao !== null ? (variacaoOk ? 'Abaixo do previsto ✓' : 'Acima do previsto ⚠') : 'Sem dados'}</div>
        </div>
      </div>
    </div>

    ${m.observacoes ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">💬</div>
        <div class="section-title">Observações</div>
      </div>
      <div class="obs-box">${m.observacoes}</div>
    </div>` : ''}

    <!-- Assinaturas -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">✍</div>
        <div class="section-title">Assinaturas</div>
      </div>
      <div class="assin-grid">
        <div class="assin-item">
          <div style="height:48px;"></div>
          <div class="assin-linha"></div>
          <div class="assin-nome">Responsável pela Medição</div>
          <div class="assin-cargo">Engenheiro / Mestre de Obras</div>
        </div>
        <div class="assin-item">
          <div style="height:48px;"></div>
          <div class="assin-linha"></div>
          <div class="assin-nome">Aprovação do Cliente</div>
          <div class="assin-cargo">Contratante / Fiscal de Obra</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-brand"><strong>SISENG</strong> — Sistema de Gestão de Obras · Documento gerado em ${new Date().toLocaleString('pt-BR')}</div>
      <div class="footer-page">Página 1 de 1</div>
    </div>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}
