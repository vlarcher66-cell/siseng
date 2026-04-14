/* ═══════════════════════════════════════════════════════════
   SISENG — Análise Cronograma  v1.0
   Orçado x Realizado — cruzamento de Etapas + Medições
═══════════════════════════════════════════════════════════ */

/* ── Mock de etapas (mesmo padrão de etapas.js) ──────────── */
const ETAPAS_MOCK = [
  {
    id: 'et1', nome: 'Execução de Fundação',
    obraId: 'obra_1', obraNome: 'Residencial das Palmeiras',
    tipo: 'Fundação', tipoIcone: 'fa-cube', tipoCor: '#f97316',
    status: 'concluida', inicio: '2025-02-15', prazo: '2025-04-30',
    progresso: 100, custoPrevisto: 85000, custoReal: 82500
  },
  {
    id: 'et2', nome: 'Estrutura de Concreto',
    obraId: 'obra_1', obraNome: 'Residencial das Palmeiras',
    tipo: 'Estrutura', tipoIcone: 'fa-building', tipoCor: '#2563eb',
    status: 'concluida', inicio: '2025-05-01', prazo: '2025-09-30',
    progresso: 100, custoPrevisto: 210000, custoReal: 218000
  },
  {
    id: 'et3', nome: 'Alvenaria de Vedação',
    obraId: 'obra_1', obraNome: 'Residencial das Palmeiras',
    tipo: 'Alvenaria', tipoIcone: 'fa-border-all', tipoCor: '#8b5cf6',
    status: 'em_andamento', inicio: '2025-10-01', prazo: '2026-03-31',
    progresso: 68, custoPrevisto: 95000, custoReal: 61000
  },
  {
    id: 'et4', nome: 'Instalações Elétricas',
    obraId: 'obra_1', obraNome: 'Residencial das Palmeiras',
    tipo: 'Instalações Elétricas', tipoIcone: 'fa-bolt', tipoCor: '#f59e0b',
    status: 'pendente', inicio: '2026-04-01', prazo: '2026-06-30',
    progresso: 0, custoPrevisto: 48000, custoReal: 0
  },
  {
    id: 'et5', nome: 'Estrutura Metálica Principal',
    obraId: 'obra_4', obraNome: 'Galpão Industrial Norte',
    tipo: 'Estrutura', tipoIcone: 'fa-building', tipoCor: '#2563eb',
    status: 'concluida', inicio: '2024-04-01', prazo: '2024-08-31',
    progresso: 100, custoPrevisto: 820000, custoReal: 810000
  },
  {
    id: 'et6', nome: 'Cobertura Metálica',
    obraId: 'obra_4', obraNome: 'Galpão Industrial Norte',
    tipo: 'Cobertura', tipoIcone: 'fa-home', tipoCor: '#0ea5e9',
    status: 'concluida', inicio: '2024-09-01', prazo: '2024-11-30',
    progresso: 100, custoPrevisto: 320000, custoReal: 315000
  },
  {
    id: 'et7', nome: 'Fundação Escola Municipal',
    obraId: 'obra_5', obraNome: 'Escola Municipal Jardim Verde',
    tipo: 'Fundação', tipoIcone: 'fa-cube', tipoCor: '#f97316',
    status: 'concluida', inicio: '2025-04-20', prazo: '2025-07-31',
    progresso: 100, custoPrevisto: 280000, custoReal: 275000
  },
  {
    id: 'et8', nome: 'Estrutura — Blocos A e B',
    obraId: 'obra_5', obraNome: 'Escola Municipal Jardim Verde',
    tipo: 'Estrutura', tipoIcone: 'fa-building', tipoCor: '#2563eb',
    status: 'atrasada', inicio: '2025-08-01', prazo: '2025-11-30',
    progresso: 35, custoPrevisto: 450000, custoReal: 148000
  }
];

/* ── Mock de medições (padrão sis_medicoes) ──────────────── */
const MEDICOES_MOCK = [
  { id: 'm1', etapaId: 'et1', obraId: 'obra_1', data: '2025-04-30', percExecutado: 100, custoReal: 82500, obs: 'Fundação concluída conforme projeto.' },
  { id: 'm2', etapaId: 'et2', obraId: 'obra_1', data: '2025-09-30', percExecutado: 100, custoReal: 218000, obs: 'Estrutura concluída com pequeno estouro.' },
  { id: 'm3', etapaId: 'et3', obraId: 'obra_1', data: '2026-03-15', percExecutado: 68, custoReal: 61000, obs: 'Alvenaria em andamento — 68% executado.' },
  { id: 'm4', etapaId: 'et5', obraId: 'obra_4', data: '2024-08-31', percExecutado: 100, custoReal: 810000, obs: 'Estrutura metálica concluída dentro do orçamento.' },
  { id: 'm5', etapaId: 'et6', obraId: 'obra_4', data: '2024-11-30', percExecutado: 100, custoReal: 315000, obs: 'Cobertura concluída com economia.' },
  { id: 'm6', etapaId: 'et7', obraId: 'obra_5', data: '2025-07-31', percExecutado: 100, custoReal: 275000, obs: 'Fundação concluída com leve economia.' },
  { id: 'm7', etapaId: 'et8', obraId: 'obra_5', data: '2025-12-01', percExecutado: 35, custoReal: 148000, obs: 'Obra paralisada — verba insuficiente.' }
];

/* ── Estado ───────────────────────────────────────────────── */
let etapas    = [];
let medicoes  = [];
let analiseData = [];   // dados cruzados calculados
let filteredData = [];  // após filtros
let currentSort   = 'etapa';
let currentSearch = '';
let filterObra    = '';
let filterPeriodo = '';
let filterStatus  = '';

/* ── API helpers ─────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token') || '';
}

async function apiGet(path) {
  const res = await fetch('https://siseng-production.up.railway.app/api' + path, { headers: { 'Authorization': `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

function mapEtapaApi(e) {
  return {
    id: e.id,
    nome: e.nome || e.tipo || '—',
    obraId: e.obra_id,
    obraNome: e.obra_nome || '',
    tipo: e.tipo || '',
    status: e.status || 'pendente',
    responsavel: e.responsavel || '',
    inicio: e.data_inicio ? e.data_inicio.split('T')[0] : '',
    prazo: e.data_fim ? e.data_fim.split('T')[0] : '',
    progresso: e.percentual || 0,
    custoPrevisto: parseFloat(e.custo_previsto) || 0,
    custoReal: parseFloat(e.custo_real) || 0,
  };
}

function mapMedicaoApi(m) {
  return {
    id: m.id,
    obraId: m.obra_id,
    obraNome: m.obra_nome || '',
    periodo: m.periodo ? m.periodo.split('T')[0] : '',
    status: m.status || 'rascunho',
    obs: m.obs || '',
    criadoEm: m.criado_em ? m.criado_em.split('T')[0] : '',
    itens: m.itens || [],
  };
}

async function loadStorage() {
  try {
    const [etapasApi, medicoesApi] = await Promise.all([
      apiGet('/etapas'),
      apiGet('/medicoes'),
    ]);
    etapas   = etapasApi.map(mapEtapaApi);
    medicoes = medicoesApi.map(mapMedicaoApi);
    // Remove dados antigos do localStorage
    localStorage.removeItem('sis_medicoes');
    localStorage.removeItem('sis_etapas');
  } catch (err) {
    console.warn('Erro ao carregar dados da API, usando mock:', err.message);
    etapas   = JSON.parse(JSON.stringify(ETAPAS_MOCK));
    medicoes = JSON.parse(JSON.stringify(MEDICOES_MOCK));
  }
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

/* ── Cruzamento de dados ─────────────────────────────────── */
function cruzarDados() {
  analiseData = etapas.map(etapa => {
    // Coleta todos os itens desta etapa em todas as medições (novo formato: m.itens[])
    const itensEtapa = [];
    medicoes.forEach(m => {
      const item = (m.itens || []).find(i => String(i.etapaId) === String(etapa.id));
      if (item) itensEtapa.push({ ...item, data: m.criadoEm || m.periodo });
    });

    const custoPrevisto = Number(etapa.custoPrevisto) || 0;
    const custoReal     = itensEtapa.reduce((acc, i) => acc + (parseFloat(i.custoReal) || 0), 0);
    const percRealizado = itensEtapa.reduce((acc, i) => acc + (parseFloat(i.percExecutado) || 0), 0);
    const percPlanejado = custoPrevisto > 0 ? 100 : 0;
    const ultimaMedicao = itensEtapa.sort((a, b) => (b.data || '').localeCompare(a.data || ''))[0]?.data || null;

    const desvioR      = custoReal - custoPrevisto;
    const desvioPct    = custoPrevisto > 0 ? (desvioR / custoPrevisto) * 100 : 0;

    // Status financeiro
    let statusFin;
    if (custoReal === 0 && percRealizado === 0) {
      statusFin = 'nao_iniciado';
    } else if (desvioPct > 10) {
      statusFin = 'estouro';
    } else if (desvioPct > 0) {
      statusFin = 'atencao';
    } else {
      statusFin = 'dentro';
    }

    return {
      ...etapa,
      custoReal,
      percPlanejado,
      percRealizado,
      desvioR,
      desvioPct,
      statusFin,
      ultimaMedicao
    };
  });
}

/* ── Utilidades ──────────────────────────────────────────── */
function formatCur(v) {
  if (v === null || v === undefined) return '—';
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}
function formatPct(v) {
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
}
function formatDate(d) {
  if (!d) return '—';
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}

/* ── Filtros e ordenação ─────────────────────────────────── */
function getFiltered() {
  let list = [...analiseData];

  if (filterObra)    list = list.filter(e => String(e.obraId) === String(filterObra));
  if (filterStatus)  list = list.filter(e => e.statusFin === filterStatus);

  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase();
    list = list.filter(e =>
      e.nome.toLowerCase().includes(q) ||
      (e.obraNome || '').toLowerCase().includes(q) ||
      (e.tipo || '').toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => {
    switch (currentSort) {
      case 'etapa':       return a.nome.localeCompare(b.nome);
      case 'obra':        return (a.obraNome || '').localeCompare(b.obraNome || '');
      case 'desvio_desc': return Math.abs(b.desvioR) - Math.abs(a.desvioR);
      case 'desvio_asc':  return Math.abs(a.desvioR) - Math.abs(b.desvioR);
      case 'fisico_desc': return b.percRealizado - a.percRealizado;
      default: return 0;
    }
  });

  return list;
}

function applyFilters() {
  filterObra    = document.getElementById('filterObra').value;
  filterPeriodo = document.getElementById('filterPeriodo').value;
  filterStatus  = document.getElementById('filterStatus').value;
  filteredData = getFiltered();
  renderKPIs(filteredData);
  renderTable(filteredData);
  renderObraSummary(filteredData);
}

function resetFilters() {
  document.getElementById('filterObra').value    = '';
  document.getElementById('filterPeriodo').value = '';
  document.getElementById('filterStatus').value  = '';
  document.getElementById('headerSearch').value  = '';
  filterObra = filterPeriodo = filterStatus = '';
  currentSearch = '';
  applyFilters();
  showToast('Filtros removidos.', 'info');
}

function searchAnalise(val) {
  currentSearch = val;
  filteredData = getFiltered();
  renderTable(filteredData);
}

function sortAnalise(val) {
  currentSort = val;
  filteredData = getFiltered();
  renderTable(filteredData);
}

/* ── Calcular KPIs ───────────────────────────────────────── */
function calcKPIs(list) {
  const totalOrcado    = list.reduce((s, e) => s + (e.custoPrevisto || 0), 0);
  const totalRealizado = list.reduce((s, e) => s + (e.custoReal || 0), 0);
  const desvioTotal    = totalRealizado - totalOrcado;
  const etapasTotais   = list.length;
  const etapasComDados = list.filter(e => e.percRealizado > 0).length;
  const mediaFisico    = etapasTotais > 0
    ? list.reduce((s, e) => s + e.percRealizado, 0) / etapasTotais
    : 0;
  const mediaPlanjado  = etapasTotais > 0
    ? list.reduce((s, e) => s + e.percPlanejado, 0) / etapasTotais
    : 0;

  return { totalOrcado, totalRealizado, desvioTotal, mediaFisico, mediaPlanjado, etapasTotais, etapasComDados };
}

/* ── Render KPIs ─────────────────────────────────────────── */
function renderKPIs(list) {
  const kpi  = calcKPIs(list);
  const grid = document.getElementById('kpiGrid');

  const desvioClass = kpi.desvioTotal > 0 ? 'kpi-desvio-bad' : 'kpi-desvio-ok';
  const desvioValClass = kpi.desvioTotal > 0 ? 'kpi-val-bad' : (kpi.desvioTotal < 0 ? 'kpi-val-ok' : '');
  const desvioIndClass = kpi.desvioTotal > 0 ? 'ind-bad' : 'ind-ok';
  const desvioIndIcon  = kpi.desvioTotal > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
  const desvioIndLabel = kpi.desvioTotal > 0 ? 'Estouro' : 'Economia';

  const fisicoClass = kpi.mediaFisico >= kpi.mediaPlanjado ? 'ind-ok' : 'ind-warn';
  const fisicoIcon  = kpi.mediaFisico >= kpi.mediaPlanjado ? 'fa-check' : 'fa-minus';
  const fisicoLabel = kpi.mediaFisico >= kpi.mediaPlanjado ? 'No prazo' : 'Abaixo';

  const desvioAbsPct = kpi.totalOrcado > 0
    ? Math.abs((kpi.desvioTotal / kpi.totalOrcado) * 100).toFixed(1)
    : 0;

  grid.innerHTML = `
    <!-- Total Orçado -->
    <div class="kpi-card kpi-orcado">
      <div class="kpi-card-header">
        <span class="kpi-card-label">Total Orçado</span>
        <div class="kpi-icon"><i class="fas fa-file-invoice-dollar"></i></div>
      </div>
      <div class="kpi-value">${formatCur(kpi.totalOrcado)}</div>
      <div class="kpi-subtext">
        <i class="fas fa-layer-group"></i>
        ${kpi.etapasTotais} etapa${kpi.etapasTotais !== 1 ? 's' : ''} no filtro
        <span class="kpi-indicator ind-info" style="margin-left:auto">
          <i class="fas fa-info-circle"></i> Previsto
        </span>
      </div>
      <div class="kpi-mini-bar"><div class="kpi-mini-bar-fill" style="width:100%"></div></div>
    </div>

    <!-- Total Realizado -->
    <div class="kpi-card kpi-realizado">
      <div class="kpi-card-header">
        <span class="kpi-card-label">Total Realizado</span>
        <div class="kpi-icon"><i class="fas fa-receipt"></i></div>
      </div>
      <div class="kpi-value">${formatCur(kpi.totalRealizado)}</div>
      <div class="kpi-subtext">
        <i class="fas fa-check-circle"></i>
        ${kpi.etapasComDados} com medição registrada
        <span class="kpi-indicator ${kpi.totalRealizado <= kpi.totalOrcado ? 'ind-ok' : 'ind-bad'}" style="margin-left:auto">
          <i class="fas ${kpi.totalRealizado <= kpi.totalOrcado ? 'fa-thumbs-up' : 'fa-thumbs-down'}"></i>
          ${kpi.totalRealizado <= kpi.totalOrcado ? 'Dentro' : 'Acima'}
        </span>
      </div>
      <div class="kpi-mini-bar">
        <div class="kpi-mini-bar-fill" style="width:${kpi.totalOrcado > 0 ? Math.min((kpi.totalRealizado / kpi.totalOrcado) * 100, 100).toFixed(1) : 0}%;background:#8b5cf6"></div>
      </div>
    </div>

    <!-- Desvio R$ -->
    <div class="kpi-card ${desvioClass}">
      <div class="kpi-card-header">
        <span class="kpi-card-label">Desvio Financeiro</span>
        <div class="kpi-icon"><i class="fas fa-balance-scale"></i></div>
      </div>
      <div class="kpi-value ${desvioValClass}">
        ${kpi.desvioTotal !== 0 ? (kpi.desvioTotal > 0 ? '+' : '') : ''}${formatCur(kpi.desvioTotal)}
      </div>
      <div class="kpi-subtext">
        Desvio de ${desvioAbsPct}% sobre o orçado
        <span class="kpi-indicator ${desvioIndClass}" style="margin-left:auto">
          <i class="fas ${desvioIndIcon}"></i> ${desvioIndLabel}
        </span>
      </div>
    </div>

    <!-- % Execução Física -->
    <div class="kpi-card kpi-fisico">
      <div class="kpi-card-header">
        <span class="kpi-card-label">Execução Física</span>
        <div class="kpi-icon"><i class="fas fa-tasks"></i></div>
      </div>
      <div class="kpi-value">${formatPct(kpi.mediaFisico)}</div>
      <div class="kpi-subtext">
        <i class="fas fa-ruler-combined"></i>
        Planejado: ${formatPct(kpi.mediaPlanjado)}
        <span class="kpi-indicator ${fisicoClass}" style="margin-left:auto">
          <i class="fas ${fisicoIcon}"></i> ${fisicoLabel}
        </span>
      </div>
      <div class="kpi-mini-bar">
        <div class="kpi-mini-bar-fill" style="width:${kpi.mediaFisico.toFixed(1)}%"></div>
      </div>
    </div>
  `;
}

/* ── Render tabela ───────────────────────────────────────── */
function renderTable(list) {
  const tbody     = document.getElementById('analiseTableBody');
  const emptyState = document.getElementById('emptyState');
  const tableWrap  = document.getElementById('analiseTableWrap');
  const resultCount = document.getElementById('resultCount');

  resultCount.innerHTML = `Exibindo <strong>${list.length}</strong> etapa${list.length !== 1 ? 's' : ''}`;

  if (list.length === 0) {
    tableWrap.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }
  tableWrap.classList.remove('hidden');
  emptyState.classList.add('hidden');

  tbody.innerHTML = list.map(row => {
    const desvioClass  = row.desvioR > 0 ? 'val-desvio-bad' : (row.desvioR < 0 ? 'val-desvio-ok' : 'val-zero');
    const desvioSign   = row.desvioR > 0 ? '+' : '';
    const badgeClass   = row.desvioR > 0 ? (row.desvioPct > 10 ? 'bad' : 'warn') : (row.desvioR < 0 ? 'ok' : 'zero');
    const badgeIcon    = row.desvioR > 0 ? 'fa-arrow-up' : (row.desvioR < 0 ? 'fa-arrow-down' : 'fa-minus');

    const fillRealClass = row.desvioR > 0
      ? (row.desvioPct > 10 ? 'fill-realizado-bad' : 'fill-realizado-warn')
      : (row.desvioR < 0 ? 'fill-realizado-ok' : 'fill-realizado-zero');

    const statusInfo = getStatusInfo(row.statusFin, row);

    return `
      <tr>
        <td class="col-etapa">
          <div class="col-etapa-info">
            <span class="col-etapa-nome">${row.nome}</span>
            <span class="col-etapa-tipo" style="color:${row.tipoCor || 'var(--gray)'}">
              <i class="fas ${row.tipoIcone || 'fa-layer-group'}"></i>${row.tipo || '—'}
            </span>
          </div>
        </td>
        <td class="col-obra">
          <div class="col-obra-info">
            <span class="col-obra-dot" style="background:${obraColor(row.obraId)}"></span>
            <span class="col-obra-nome" title="${row.obraNome}">${row.obraNome || '—'}</span>
          </div>
        </td>
        <td class="col-valor"><span class="val-previsto">${row.custoPrevisto ? formatCur(row.custoPrevisto) : '<span class="val-zero">—</span>'}</span></td>
        <td class="col-valor"><span class="val-real">${row.custoReal ? formatCur(row.custoReal) : '<span class="val-zero">—</span>'}</span></td>
        <td class="col-valor">
          <span class="${desvioClass}">
            ${row.custoPrevisto > 0
              ? `${desvioSign}${formatCur(row.desvioR)}`
              : `<span class="val-zero">—</span>`}
          </span>
        </td>
        <td class="col-pct">
          ${row.custoPrevisto > 0
            ? `<span class="desvio-badge ${badgeClass}">
                 <i class="fas ${badgeIcon}"></i>${desvioSign}${formatPct(row.desvioPct)}
               </span>`
            : `<span class="desvio-badge zero">—</span>`}
        </td>
        <td>
          <div class="progress-single">
            <div class="progress-single-track">
              <div class="progress-single-fill ${fillRealClass}" style="width:${row.percRealizado}%"></div>
            </div>
            <span class="progress-single-pct">${row.percRealizado.toFixed(1)}%</span>
          </div>
        </td>
        <td class="col-status" style="text-align:center">
          <span class="status-badge ${statusInfo.cls}">
            <i class="fas ${statusInfo.icon}"></i>${statusInfo.label}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

/* ── Render resumo por obra ──────────────────────────────── */
function renderObraSummary(list) {
  const section = document.getElementById('obraSummarySection');
  const grid    = document.getElementById('obraSummaryGrid');

  if (list.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';

  // Agrupar por obra
  const obraMap = {};
  list.forEach(row => {
    if (!obraMap[row.obraId]) {
      obraMap[row.obraId] = {
        obraId: row.obraId,
        obraNome: row.obraNome,
        etapas: [],
        totalOrcado: 0,
        totalReal: 0,
        totalDesvio: 0,
        mediaFisico: 0,
        mediaPlanejado: 0
      };
    }
    const o = obraMap[row.obraId];
    o.etapas.push(row);
    o.totalOrcado   += row.custoPrevisto || 0;
    o.totalReal     += row.custoReal || 0;
    o.totalDesvio   += row.desvioR || 0;
  });

  // Calcular médias físicas por obra
  Object.values(obraMap).forEach(o => {
    o.totalDesvio  = o.totalReal - o.totalOrcado;
    o.mediaFisico  = o.etapas.reduce((s, e) => s + e.percRealizado, 0) / o.etapas.length;
    o.mediaPlanejado = o.etapas.reduce((s, e) => s + e.percPlanejado, 0) / o.etapas.length;
    o.desvioPct    = o.totalOrcado > 0 ? (o.totalDesvio / o.totalOrcado) * 100 : 0;
  });

  const obras = Object.values(obraMap).sort((a, b) => a.obraNome.localeCompare(b.obraNome));

  grid.innerHTML = obras.map((o, idx) => {
    const desvioValClass = o.totalDesvio > 0 ? 'bad' : (o.totalDesvio < 0 ? 'ok' : '');
    const desvioSign     = o.totalDesvio > 0 ? '+' : '';
    const barRealClass   = o.totalDesvio > 0 ? (o.desvioPct > 10 ? 'bad' : 'warn') : 'ok';
    const statusInfo     = o.totalDesvio > 0
      ? (o.desvioPct > 10 ? { cls: 'sb-bad', icon: 'fa-exclamation-circle', label: 'Acima' }
                          : { cls: 'sb-warn', icon: 'fa-exclamation-triangle', label: 'Atenção' })
      : { cls: 'sb-ok', icon: 'fa-check-circle', label: 'No orçamento' };

    const barOrcWidth  = 100;
    const barRealWidth = o.totalOrcado > 0
      ? Math.min((o.totalReal / o.totalOrcado) * 100, 110).toFixed(1)
      : 0;

    return `
      <div class="obra-summary-card" style="animation-delay:${idx * .06}s">
        <div class="obra-summary-header">
          <span class="obra-summary-name">${o.obraNome}</span>
          <span class="obra-summary-etapas">${o.etapas.length} etapa${o.etapas.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="obra-summary-values">
          <div class="obra-val-item">
            <span class="obra-val-label">Orçado</span>
            <span class="obra-val-value">${formatCur(o.totalOrcado)}</span>
          </div>
          <div class="obra-val-item">
            <span class="obra-val-label">Realizado</span>
            <span class="obra-val-value">${formatCur(o.totalReal)}</span>
          </div>
          <div class="obra-val-item">
            <span class="obra-val-label">Desvio R$</span>
            <span class="obra-val-value ${desvioValClass}">
              ${desvioSign}${formatCur(o.totalDesvio)}
            </span>
          </div>
          <div class="obra-val-item">
            <span class="obra-val-label">Físico Real</span>
            <span class="obra-val-value">${formatPct(o.mediaFisico)}</span>
          </div>
        </div>
        <div class="obra-summary-bar">
          <div class="obra-bar-header">
            <span><i class="fas fa-circle" style="font-size:.5rem;color:rgba(37,99,235,.4)"></i> Orçado</span>
            <span><i class="fas fa-circle" style="font-size:.5rem;color:var(--${barRealClass === 'ok' ? 'success' : barRealClass === 'warn' ? 'warning' : 'error'})"></i> Realizado</span>
            <span class="status-badge ${statusInfo.cls}" style="padding:2px 7px;font-size:.65rem">
              <i class="fas ${statusInfo.icon}"></i>${statusInfo.label}
            </span>
          </div>
          <div class="obra-bar-track">
            <div class="obra-bar-fill-planned" style="width:${barOrcWidth}%"></div>
            <div class="obra-bar-fill-real ${barRealClass}" style="width:${barRealWidth}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ── Helpers visuais ─────────────────────────────────────── */
const OBRA_COLORS = ['#2563eb', '#8b5cf6', '#0ea5e9', '#22c55e', '#f59e0b', '#f97316', '#ef4444', '#64748b'];
const obraColorMap = {};
let obraColorIdx = 0;
function obraColor(obraId) {
  if (!obraColorMap[obraId]) {
    obraColorMap[obraId] = OBRA_COLORS[obraColorIdx % OBRA_COLORS.length];
    obraColorIdx++;
  }
  return obraColorMap[obraId];
}

function getStatusInfo(statusFin, row) {
  if (statusFin === 'nao_iniciado') return { cls: 'sb-neutral', icon: 'fa-clock',              label: 'Não iniciado' };
  if (statusFin === 'estouro')      return { cls: 'sb-bad',     icon: 'fa-exclamation-circle',  label: 'Estouro' };
  if (statusFin === 'atencao')      return { cls: 'sb-warn',    icon: 'fa-exclamation-triangle', label: 'Atenção' };
  return                                   { cls: 'sb-ok',      icon: 'fa-check-circle',         label: 'No orçamento' };
}

/* ── Preencher select de obras ───────────────────────────── */
function populateObrasSelect() {
  const select = document.getElementById('filterObra');
  const obras = [...new Map(etapas.map(e => [e.obraId, e.obraNome])).entries()];
  obras.sort((a, b) => a[1].localeCompare(b[1]));
  obras.forEach(([id, nome]) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = nome;
    select.appendChild(opt);
  });
}

/* ══════════════════════════════════════════════════════════
   EXPORTAR RELATÓRIO PDF — jsPDF + AutoTable
══════════════════════════════════════════════════════════ */
function exportarRelatorio() {
  if (!window.jspdf) {
    showToast('Biblioteca de PDF ainda carregando, tente em 2 segundos.', 'warning');
    return;
  }

  showToast('Gerando relatório PDF...', 'info');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Dados do usuário ──────────────────────────────────
  let userName = 'SISENG', userEmpresa = '', userEmail = '';
  try {
    const raw = localStorage.getItem('sis_user') || sessionStorage.getItem('sis_user') || '{}';
    const u = JSON.parse(raw);
    userName    = u.nome    || 'SISENG';
    userEmpresa = u.empresa || '';
    userEmail   = u.email   || '';
  } catch(_) {}

  // ── Filtros ativos ────────────────────────────────────
  const obraFilterEl = document.getElementById('filterObra');
  const obraLabel = obraFilterEl?.selectedOptions[0]?.text || 'Todas as obras';
  const dataGeracao = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });

  const kpi = calcKPIs(filteredData);
  const pageW = 210, pageH = 297;
  const M = { l: 15, r: 15, t: 15 }; // margens

  // ════════════════════════════════════════════════════
  // PÁGINA 1 — CAPA
  // ════════════════════════════════════════════════════
  const C = { navy: [30, 58, 95], blue: [37, 99, 235], orange: [249, 115, 22],
              white: [255,255,255], gray: [100, 116, 139], lightGray: [241,245,249],
              dark: [15, 23, 42], green: [34, 197, 94], red: [239, 68, 68],
              yellow: [245, 158, 11], purple: [139, 92, 246] };

  // Fundo superior azul escuro
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, pageW, 130, 'F');

  // Detalhe decorativo — retângulo laranja
  doc.setFillColor(...C.orange);
  doc.rect(0, 126, pageW, 6, 'F');

  // Triângulo decorativo (simulado com polígono)
  doc.setFillColor(37, 99, 235, 0.4);
  doc.setFillColor(37, 99, 235);
  doc.triangle(pageW - 60, 0, pageW, 0, pageW, 80, 'F');

  // Logo — círculo laranja com ícone
  doc.setFillColor(...C.orange);
  doc.circle(pageW / 2, 42, 18, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('⚙', pageW / 2, 47, { align: 'center' }); // capacete aproximado

  // Nome do sistema
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.white);
  doc.text('SIS', pageW / 2 - 10, 75, { align: 'center' });
  doc.setTextColor(...C.orange);
  doc.text('OBRAS', pageW / 2 + 18, 75, { align: 'center' });

  // Linha abaixo do nome
  doc.setDrawColor(...C.orange);
  doc.setLineWidth(0.8);
  doc.line(pageW / 2 - 35, 79, pageW / 2 + 35, 79);

  // Subtítulo do relatório
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.white);
  doc.text('Sistema de Gestão de Obras', pageW / 2, 87, { align: 'center' });

  // Título do relatório
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.dark);
  doc.text('RELATÓRIO DE ANÁLISE', pageW / 2, 152, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.blue);
  doc.text('Cronograma · Orçado × Realizado · Gantt', pageW / 2, 162, { align: 'center' });

  // Card de informações
  doc.setFillColor(...C.lightGray);
  _roundedRect(doc, M.l, 172, pageW - M.l - M.r, 58, 4);
  doc.setFillColor(...C.lightGray);
  doc.rect(M.l, 172, pageW - M.l - M.r, 58, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.gray);

  const infoX = M.l + 8;
  const infoRows = [
    ['EMPRESA',       userEmpresa || '—'],
    ['RESPONSÁVEL',   userName],
    ['E-MAIL',        userEmail   || '—'],
    ['OBRA / FILTRO', obraLabel],
    ['DATA DE GERAÇÃO', dataGeracao],
  ];
  infoRows.forEach(([label, val], i) => {
    const y = 182 + i * 9;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.gray);
    doc.text(label + ':', infoX, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.dark);
    doc.text(String(val), infoX + 40, y);
  });

  // Rodapé da capa
  doc.setFontSize(8);
  doc.setTextColor(...C.gray);
  doc.text(`Gerado automaticamente pelo SISENG · ${dataGeracao}`, pageW / 2, pageH - 10, { align: 'center' });

  // ════════════════════════════════════════════════════
  // PÁGINA 2 — KPIs + RESUMO
  // ════════════════════════════════════════════════════
  doc.addPage();
  _pageHeader(doc, 'INDICADORES GERAIS', C, pageW, M);

  let yy = 42;

  // 4 KPI cards em linha
  const cardW = (pageW - M.l - M.r - 9) / 4;
  const kpiCards = [
    { label: 'Total Orçado',    valor: formatCur(kpi.totalOrcado),    icon: '💰', cor: C.blue   },
    { label: 'Total Realizado', valor: formatCur(kpi.totalRealizado),  icon: '📋', cor: C.purple },
    { label: 'Desvio R$',       valor: formatCur(kpi.desvioTotal),     icon: '⚖',  cor: kpi.desvioTotal > 0 ? C.red : C.green },
    { label: 'Execução Física', valor: formatPct(kpi.mediaFisico),     icon: '📊', cor: C.orange },
  ];

  kpiCards.forEach((k, i) => {
    const cx = M.l + i * (cardW + 3);
    // Sombra simulada
    doc.setFillColor(220, 228, 240);
    doc.rect(cx + 1, yy + 1, cardW, 30, 'F');
    // Card fundo
    doc.setFillColor(...C.white);
    doc.rect(cx, yy, cardW, 30, 'F');
    // Barra colorida topo
    doc.setFillColor(...k.cor);
    doc.rect(cx, yy, cardW, 3, 'F');
    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.gray);
    doc.text(k.label.toUpperCase(), cx + cardW / 2, yy + 10, { align: 'center' });
    // Valor
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.dark);
    doc.text(k.valor, cx + cardW / 2, yy + 22, { align: 'center' });
  });

  yy += 40;

  // Linha separadora
  doc.setDrawColor(...C.lightGray);
  doc.setLineWidth(0.4);
  doc.line(M.l, yy, pageW - M.r, yy);
  yy += 8;

  // Resumo por obra — título
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.navy);
  doc.text('RESUMO POR OBRA', M.l, yy);
  yy += 6;

  // Agrupa por obra
  const obraMap = {};
  filteredData.forEach(e => {
    if (!obraMap[e.obraId]) obraMap[e.obraId] = { nome: e.obraNome || '—', etapas: 0, previsto: 0, realizado: 0, fisico: 0 };
    obraMap[e.obraId].etapas++;
    obraMap[e.obraId].previsto   += e.custoPrevisto || 0;
    obraMap[e.obraId].realizado  += e.custoReal     || 0;
    obraMap[e.obraId].fisico     += e.percRealizado || e.progresso || 0;
  });
  const obraRows = Object.values(obraMap).map(o => ({
    ...o,
    fisico: o.etapas > 0 ? (o.fisico / o.etapas) : 0,
    desvio: o.realizado - o.previsto,
    desvioPct: o.previsto > 0 ? ((o.realizado - o.previsto) / o.previsto) * 100 : 0,
  }));

  // 55+14+30+30+27+12+12 = 180mm exatos
  doc.autoTable({
    startY: yy,
    margin: { left: M.l, right: M.r },
    tableWidth: 180,
    head: [['Obra', 'Etapas', 'Previsto', 'Realizado', 'Desvio R$', 'Desvio %', 'Físico']],
    body: obraRows.map(o => [
      o.nome,
      o.etapas,
      formatCur(o.previsto),
      formatCur(o.realizado),
      (o.desvio >= 0 ? '+' : '') + formatCur(o.desvio),
      (o.desvioPct >= 0 ? '+' : '') + formatPct(o.desvioPct),
      formatPct(o.fisico),
    ]),
    headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 8, halign: 'center' },
    bodyStyles:  { fontSize: 8, textColor: C.dark, minCellHeight: 9, valign: 'middle' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 27, halign: 'right' },
      5: { cellWidth: 12, halign: 'right' },
      6: { cellWidth: 12, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const col = data.column.index;
        if (col === 4 || col === 5) {
          const val = String(data.cell.raw);
          if (val.startsWith('+') && val !== '+R$ 0,00') {
            data.cell.styles.textColor = C.red;
            data.cell.styles.fontStyle = 'bold';
          } else if (val.startsWith('-')) {
            data.cell.styles.textColor = C.green;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
  });

  // ════════════════════════════════════════════════════
  // PÁGINA 3 — TABELA DE ETAPAS DETALHADA
  // ════════════════════════════════════════════════════
  const statusMap = {
    pendente: 'Pendente', em_andamento: 'Em andamento',
    concluida: 'Concluída', atrasada: 'Atrasada', bloqueada: 'Bloqueada',
  };
  const statusBg = {
    'Pendente':      [241,245,249], 'Em andamento': [219,234,254],
    'Concluída':     [220,252,231], 'Atrasada':     [254,226,226],
    'Bloqueada':     [237,233,254],
  };
  const statusFg = {
    'Pendente':      C.gray,       'Em andamento': C.blue,
    'Concluída':     C.green,      'Atrasada':     C.red,
    'Bloqueada':     C.purple,
  };

  doc.addPage();
  _pageHeader(doc, 'DETALHAMENTO POR ETAPA', C, pageW, M);

  // 8 colunas (sem Status separado — status como fundo da linha de etapa)
  // Larguras: 40+32+20+20+28+28+22+10 = 200 → não. Usamos 'wrap' sem largura fixa.
  // Solução: usar apenas 7 colunas, mover status para badge colorido na col Etapa
  doc.autoTable({
    startY: 42,
    margin: { left: M.l, right: M.r },
    head: [['Etapa / Status', 'Obra', 'Início', 'Prazo', 'Previsto', 'Realizado', 'Desvio', 'Físico']],
    body: filteredData.map(row => {
      const st = statusMap[row.status] || row.status;
      return [
        row.nome + '\n' + st,
        row.obraNome || '',
        formatDate(row.inicio),
        formatDate(row.prazo),
        formatCur(row.custoPrevisto),
        formatCur(row.custoReal),
        (row.desvioR >= 0 ? '+' : '') + formatCur(row.desvioR),
        formatPct(row.percRealizado ?? row.progresso ?? 0),
      ];
    }),
    headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
    bodyStyles:  { fontSize: 8, textColor: C.dark, minCellHeight: 12, valign: 'middle', overflow: 'linebreak' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    // Soma = 34+26+17+17+23+23+22+18 = 180mm exatos
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 26 },
      2: { cellWidth: 17, halign: 'center' },
      3: { cellWidth: 17, halign: 'center' },
      4: { cellWidth: 23, halign: 'right' },
      5: { cellWidth: 23, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 18, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        // linha 2 do texto = status → colorir em cinza
        data.cell.styles.fontSize = 7.5;
      }
      if (data.section === 'body' && data.column.index === 6) {
        const val = String(data.cell.raw);
        if (val.startsWith('+') && val !== '+R$ 0,00') {
          data.cell.styles.textColor = C.red;
          data.cell.styles.fontStyle = 'bold';
        } else if (val.startsWith('-')) {
          data.cell.styles.textColor = C.green;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawCell: (data) => {
      // Badge de status abaixo do nome da etapa
      if (data.section === 'body' && data.column.index === 0) {
        const rowIdx = data.row.index;
        const st = statusMap[filteredData[rowIdx]?.status] || '';
        if (!st) return;
        const bg = statusBg[st] || [241,245,249];
        const fg = statusFg[st] || C.gray;
        const bx = data.cell.x + 1;
        const by = data.cell.y + data.cell.height - 6;
        const bw = 28, bh = 4.5;
        doc.setFillColor(...bg);
        doc.roundedRect(bx, by, bw, bh, 1, 1, 'F');
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...fg);
        doc.text(st, bx + bw / 2, by + 3, { align: 'center' });
      }
    },
    showHead: 'everyPage',
    didDrawPage: (hookData) => {
      _pageFooter(doc, hookData.pageNumber, C, pageW, pageH);
    },
  });

  // ════════════════════════════════════════════════════
  // ÚLTIMA PÁGINA — GANTT
  // ════════════════════════════════════════════════════
  doc.addPage();
  _pageHeader(doc, 'GRÁFICO DE GANTT', C, pageW, M);

  const ganttRows = filteredData.filter(e => e.inicio && e.prazo)
    .sort((a, b) => {
      if ((a.obraNome || '') !== (b.obraNome || '')) return (a.obraNome || '').localeCompare(b.obraNome || '');
      return (a.inicio || '').localeCompare(b.inicio || '');
    });

  if (ganttRows.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(...C.gray);
    doc.text('Nenhuma etapa com datas definidas para exibir o Gantt.', pageW / 2, 80, { align: 'center' });
  } else {
    _drawGanttPDF(doc, ganttRows, C, pageW, M, pageH);
  }

  // ── Rodapé em todas as páginas anteriores ──
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    _pageFooter(doc, p, C, pageW, pageH, totalPages);
  }

  // ── Salva ──
  const nomeArquivo = `SIS_OBRAS_Relatorio_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(nomeArquivo);
  showToast('Relatório exportado com sucesso!', 'success');
}

/* ── Helpers internos do PDF ─────────────────────────────── */

function _roundedRect(doc, x, y, w, h, r) {
  doc.roundedRect(x, y, w, h, r, r, 'F');
}

function _pageHeader(doc, title, C, pageW, M) {
  // Faixa topo azul escuro
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, pageW, 28, 'F');
  // Acento laranja
  doc.setFillColor(...C.orange);
  doc.rect(0, 26, pageW, 3, 'F');
  // Logo texto
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.white);
  doc.text('SIS', M.l, 17);
  doc.setTextColor(...C.orange);
  doc.text('OBRAS', M.l + 9, 17);
  // Título da seção
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.white);
  doc.text(title, pageW / 2, 17, { align: 'center' });
}

function _pageFooter(doc, pageNum, C, pageW, pageH, total) {
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.gray);
  doc.text('SISENG — Sistema de Gestão de Obras', 15, pageH - 8);
  doc.text(`Página ${pageNum}${total ? ' de ' + total : ''}`, pageW - 15, pageH - 8, { align: 'right' });
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(15, pageH - 12, pageW - 15, pageH - 12);
}

function _drawGanttPDF(doc, rows, C, pageW, M, pageH) {
  const SIDEBAR_W = 52;   // largura da coluna de nome
  const CHART_X   = M.l + SIDEBAR_W + 2;
  const CHART_W   = pageW - CHART_X - M.r;
  const ROW_H     = 7;
  const HEADER_H  = 12;
  const START_Y   = 36;

  // Calcula range de datas
  let minD = null, maxD = null;
  rows.forEach(e => {
    const d1 = new Date(e.inicio), d2 = new Date(e.prazo);
    if (!minD || d1 < minD) minD = d1;
    if (!maxD || d2 > maxD) maxD = d2;
  });
  if (!minD || !maxD) return;
  minD = new Date(minD); minD.setDate(minD.getDate() - 7);
  maxD = new Date(maxD); maxD.setDate(maxD.getDate() + 7);
  const totalDays  = Math.round((maxD - minD) / 86400000) + 1;
  const pxPerDay   = CHART_W / totalDays;

  function dateX(dateStr) {
    const diff = Math.round((new Date(dateStr) - minD) / 86400000);
    return CHART_X + diff * pxPerDay;
  }

  const STATUS_COLORS_PDF = {
    pendente:     C.gray,
    em_andamento: C.blue,
    concluida:    C.green,
    atrasada:     C.red,
    bloqueada:    C.purple,
  };
  const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  // ── Cabeçalho do Gantt ──
  // Fundo header
  doc.setFillColor(...C.navy);
  doc.rect(M.l, START_Y, pageW - M.l - M.r, HEADER_H, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.white);
  doc.text('ETAPA', M.l + 2, START_Y + 8);

  // Meses no cabeçalho
  let cur = new Date(minD);
  while (cur <= maxD) {
    const m    = cur.getMonth();
    const y    = cur.getFullYear();
    const next = new Date(y, m + 1, 1);
    const endM = next < maxD ? next : maxD;
    const x1   = CHART_X + Math.round((cur - minD) / 86400000) * pxPerDay;
    const x2   = CHART_X + Math.round((endM - minD) / 86400000) * pxPerDay;
    const cx   = (x1 + x2) / 2;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    doc.text(`${MONTHS_PT[m]}/${String(y).slice(2)}`, cx, START_Y + 8, { align: 'center' });
    // Linha divisória de mês
    doc.setDrawColor(255, 255, 255, 0.3);
    doc.setLineWidth(0.2);
    if (x1 > CHART_X) doc.line(x1, START_Y, x1, START_Y + HEADER_H);
    cur = next;
  }

  // ── Linhas de grade verticais (meses) ──
  cur = new Date(minD);
  let rowsAreaH = rows.length * ROW_H;
  while (cur <= maxD) {
    const x = CHART_X + Math.round((cur - minD) / 86400000) * pxPerDay;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.line(x, START_Y + HEADER_H, x, START_Y + HEADER_H + rowsAreaH);
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  // ── Etapas ──
  rows.forEach((e, i) => {
    const rowY = START_Y + HEADER_H + i * ROW_H;

    // Zebra
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(M.l, rowY, pageW - M.l - M.r, ROW_H, 'F');
    }

    // Separador horizontal
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.1);
    doc.line(M.l, rowY + ROW_H, pageW - M.r, rowY + ROW_H);

    // Nome da etapa (sidebar)
    doc.setFontSize(6.5);
    doc.setFont('helvetica', e.status === 'atrasada' ? 'bold' : 'normal');
    doc.setTextColor(...C.dark);
    const nomeStr = e.nome.length > 22 ? e.nome.substring(0, 21) + '…' : e.nome;
    doc.text(nomeStr, M.l + 2, rowY + 4.5);

    // Obra pequena
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.gray);
    const obraStr = (e.obraNome || '').length > 22 ? (e.obraNome || '').substring(0, 20) + '…' : (e.obraNome || '');
    doc.text(obraStr, M.l + 2, rowY + 6.8);

    // Barra
    const x1   = dateX(e.inicio);
    const x2   = dateX(e.prazo) + pxPerDay;
    const barW  = Math.max(x2 - x1, pxPerDay * 2);
    const barY  = rowY + 1.5;
    const barH  = ROW_H - 3;
    const color = STATUS_COLORS_PDF[e.status] || C.gray;

    // Sombra da barra
    doc.setFillColor(180, 195, 215);
    doc.rect(x1 + 0.5, barY + 0.5, barW, barH, 'F');

    // Barra principal
    doc.setFillColor(...color);
    doc.rect(x1, barY, barW, barH, 'F');

    // Preenchimento de progresso (cor mais clara sobre a barra)
    const pct = Math.min(100, Math.max(0, e.percRealizado ?? e.progresso ?? 0)) / 100;
    if (pct > 0 && pct < 1) {
      // Desenha parte não-executada com cor levemente mais escura
      const doneW = barW * pct;
      const todoW = barW - doneW;
      if (todoW > 0) {
        const darken = color.map(v => Math.max(0, v - 40));
        doc.setFillColor(...darken);
        doc.rect(x1 + doneW, barY, todoW, barH, 'F');
      }
    }

    // % texto dentro da barra
    if (barW > 8) {
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.white);
      doc.text(`${Math.round(pct * 100)}%`, x1 + barW / 2, barY + barH / 2 + 1.5, { align: 'center' });
    }
  });

  // ── Linha HOJE ──
  const today = new Date(); today.setHours(0,0,0,0);
  if (today >= minD && today <= maxD) {
    const tx = dateX(today.toISOString().slice(0,10));
    doc.setDrawColor(...C.orange);
    doc.setLineWidth(0.6);
    doc.line(tx, START_Y, tx, START_Y + HEADER_H + rowsAreaH);
    doc.setFillColor(...C.orange);
    doc.rect(tx - 4, START_Y, 8, 5, 'F');
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    doc.text('HOJE', tx, START_Y + 3.5, { align: 'center' });
  }

  // ── Legenda ──
  const legendY = START_Y + HEADER_H + rowsAreaH + 8;
  const legendItems = [
    { label: 'Pendente',      cor: C.gray   },
    { label: 'Em andamento',  cor: C.blue   },
    { label: 'Concluída',     cor: C.green  },
    { label: 'Atrasada',      cor: C.red    },
    { label: 'Bloqueada',     cor: C.purple },
    { label: 'Hoje',          cor: C.orange },
  ];
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.gray);
  doc.text('LEGENDA:', M.l, legendY);
  legendItems.forEach((item, i) => {
    const lx = M.l + 18 + i * 30;
    doc.setFillColor(...item.cor);
    doc.circle(lx, legendY - 1.2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.dark);
    doc.text(item.label, lx + 3.5, legendY);
  });
}

/* ── Sidebar ─────────────────────────────────────────────── */
function toggleNavGroup(groupId) {
  const group = document.getElementById(groupId);
  if (group) group.classList.toggle('open');
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle  = document.getElementById('sidebarToggle');
  const menuBtn = document.getElementById('menuBtn');
  const overlay = document.getElementById('sidebarOverlay');
  const wrapper = document.getElementById('mainWrapper');

  const saved = localStorage.getItem('sidebar_collapsed');
  if (saved === 'true') {
    sidebar.classList.add('collapsed');
    wrapper.classList.add('sidebar-collapsed');
  }

  toggle?.addEventListener('click', () => {
    const collapsed = sidebar.classList.toggle('collapsed');
    wrapper.classList.toggle('sidebar-collapsed', collapsed);
    localStorage.setItem('sidebar_collapsed', collapsed);
  });

  menuBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
  });
}

/* ── User info ───────────────────────────────────────────── */
function loadUserInfo() {
  const raw = localStorage.getItem('sis_user') || sessionStorage.getItem('sis_user');
  if (!raw) return;
  const user = JSON.parse(raw);
  const initials = (user.nome || 'AD').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  ['sidebarAvatar', 'headerAvatar', 'dropAvatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = initials;
  });

  const sidebarName = document.getElementById('sidebarName');
  const headerName  = document.getElementById('headerName');
  const dropName    = document.getElementById('dropName');
  const headerComp  = document.getElementById('headerCompany');
  const dropEmail   = document.getElementById('dropEmail');

  if (sidebarName) sidebarName.textContent = user.nome    || 'Usuário';
  if (headerName)  headerName.textContent  = user.nome    || 'Usuário';
  if (dropName)    dropName.textContent    = user.nome    || 'Usuário';
  if (headerComp)  headerComp.textContent  = user.empresa || '';
  if (dropEmail)   dropEmail.textContent   = user.email   || '';

  if (user.trialExpira) {
    const dias = Math.ceil((new Date(user.trialExpira) - new Date()) / 86400000);
    if (dias > 0) {
      const headerRight = document.querySelector('.header-right');
      if (headerRight) headerRight.insertAdjacentHTML('afterbegin', `
        <div class="trial-badge" title="Período de teste">
          <i class="fas fa-clock"></i>
          <span class="trial-badge-days">${dias} dias</span>
          <span class="trial-badge-label">de teste</span>
        </div>
        <button class="btn-upgrade-sm"><i class="fas fa-rocket"></i> Assinar</button>
      `);
    }
  }
}

/* ── User dropdown ───────────────────────────────────────── */
function toggleUserMenu() {
  document.getElementById('userDropdown').classList.toggle('hidden');
}
document.addEventListener('click', e => {
  const dd = document.getElementById('userDropdown');
  const hu = document.querySelector('.header-user');
  if (dd && hu && !hu.contains(e.target)) dd.classList.add('hidden');
});

/* ── Logout ──────────────────────────────────────────────── */
function handleLogout() {
  localStorage.removeItem('sis_token');
  localStorage.removeItem('sis_user');
  sessionStorage.removeItem('sis_token');
  sessionStorage.removeItem('sis_user');
  window.location.href = '../index.html';
}

/* ── Toast ───────────────────────────────────────────────── */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const colors = { success: '#22c55e', error: '#ef4444', info: '#f97316', warning: '#f59e0b' };
  const icons  = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };

  const toast = document.createElement('div');
  toast.style.cssText = `
    display:flex;align-items:center;gap:10px;
    background:#fff;border-radius:12px;
    padding:14px 20px;
    box-shadow:0 8px 32px rgba(0,0,0,.18);
    border-left:4px solid ${colors[type]};
    font-size:.9rem;font-weight:600;color:var(--dark);
    min-width:260px;max-width:360px;
    animation:slideInToast .3s ease;
    pointer-events:auto;
  `;
  toast.innerHTML = `
    <i class="fas ${icons[type]}" style="color:${colors[type]};font-size:1.1rem;flex-shrink:0"></i>
    <span style="flex:1">${msg}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:#94a3b8;padding:0;font-size:.8rem">
      <i class="fas fa-times"></i>
    </button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOutToast .3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}

/* ── Animações do toast (CSS injetado) ────────────────────── */
(function injectToastStyles() {
  if (document.getElementById('_toastStyles')) return;
  const s = document.createElement('style');
  s.id = '_toastStyles';
  s.textContent = `
    @keyframes slideInToast {
      from { opacity:0; transform:translateX(40px); }
      to   { opacity:1; transform:none; }
    }
    @keyframes fadeOutToast {
      to { opacity:0; transform:translateX(40px); }
    }
  `;
  document.head.appendChild(s);
})();

/* ── Subtitle dinâmico ───────────────────────────────────── */
function updateSubtitle() {
  const el = document.getElementById('analiseSubtitle');
  if (!el) return;
  const total = analiseData.length;
  const estouros = analiseData.filter(e => e.statusFin === 'estouro').length;
  const ok       = analiseData.filter(e => e.statusFin === 'dentro').length;
  el.textContent = `${total} etapas analisadas · ${ok} dentro do orçamento · ${estouros} com estouro`;
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadStorage();
  cruzarDados();
  populateObrasSelect();
  filteredData = getFiltered();
  renderKPIs(filteredData);
  renderTable(filteredData);
  renderObraSummary(filteredData);
  updateSubtitle();
  initSidebar();

  renderSidebar('analise');
  loadUserInfo();
  loadObrasCount();
  populateGanttObraSelect();
});

/* ═══════════════════════════════════════════════════════════
   GANTT CHART MODULE
═══════════════════════════════════════════════════════════ */
const GANTT = {
  DAY_W: 28,          // px por dia
  ROW_H: 48,          // px por linha
  HEADER_H: 72,       // altura total dos cabeçalhos (2 × 36px)
};

const STATUS_COLORS = {
  pendente:     '#64748b',
  em_andamento: '#2563eb',
  concluida:    '#22c55e',
  atrasada:     '#ef4444',
  bloqueada:    '#8b5cf6',
};

const STATUS_LABELS = {
  pendente:     'Pendente',
  em_andamento: 'Em andamento',
  concluida:    'Concluída',
  atrasada:     'Atrasada',
  bloqueada:    'Bloqueada',
};

/* ── Tab switch ─────────────────────────────────────────── */
function switchTab(tab) {
  document.getElementById('painelAnalise').style.display = tab === 'analise' ? '' : 'none';
  document.getElementById('painelGantt').style.display   = tab === 'gantt'   ? '' : 'none';
  document.getElementById('tabAnalise').classList.toggle('active', tab === 'analise');
  document.getElementById('tabGantt').classList.toggle('active', tab === 'gantt');
  if (tab === 'gantt') renderGantt();
}

/* ── Preenche select de obras no Gantt ─────────────────── */
function populateGanttObraSelect() {
  const sel = document.getElementById('ganttFilterObra');
  if (!sel) return;
  // usa analiseData para ter obras com dados cruzados
  const source = analiseData.length ? analiseData : etapas;
  const obras = [...new Map(source.map(e => [e.obraId, e.obraNome])).entries()];
  obras.sort((a, b) => a[1].localeCompare(b[1]));
  obras.forEach(([id, nome]) => {
    const opt = document.createElement('option');
    opt.value = id; opt.textContent = nome;
    sel.appendChild(opt);
  });
}

/* ── Calcular range de datas do Gantt ───────────────────── */
function calcGanttRange(rows) {
  let minD = null, maxD = null;
  rows.forEach(e => {
    if (e.inicio) { const d = new Date(e.inicio); if (!minD || d < minD) minD = d; }
    if (e.prazo)  { const d = new Date(e.prazo);  if (!maxD || d > maxD) maxD = d; }
  });
  if (!minD || !maxD) return null;
  // Padding: 2 semanas antes e depois
  minD = new Date(minD); minD.setDate(minD.getDate() - 14);
  maxD = new Date(maxD); maxD.setDate(maxD.getDate() + 21);
  // Ajusta para início de semana (segunda)
  const dow = minD.getDay();
  minD.setDate(minD.getDate() - (dow === 0 ? 6 : dow - 1));
  return { minD, maxD };
}

/* ── Converte data para posição X em px ─────────────────── */
function dateToX(date, minD) {
  const ms = new Date(date) - minD;
  return Math.round(ms / 86400000) * GANTT.DAY_W;
}

/* ── Renderiza cabeçalho de meses ───────────────────────── */
function renderGanttHeaders(minD, maxD) {
  const monthsEl = document.getElementById('ganttHeaderMonths');
  const weeksEl  = document.getElementById('ganttHeaderWeeks');
  monthsEl.innerHTML = weeksEl.innerHTML = '';

  const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  // Meses
  let cur = new Date(minD);
  while (cur <= maxD) {
    const m = cur.getMonth();
    const y = cur.getFullYear();
    // Calcula quantos dias este mês ocupa dentro do range
    const firstDay = new Date(cur); // início do mês (ou minD se for o primeiro)
    const nextMonth = new Date(y, m + 1, 1);
    const lastDay = nextMonth < maxD ? new Date(nextMonth - 1) : maxD;
    const days = Math.round((lastDay - firstDay) / 86400000) + 1;
    const w = days * GANTT.DAY_W;

    const cell = document.createElement('div');
    cell.className = 'gantt-month-cell';
    cell.style.width = w + 'px';
    cell.textContent = `${MONTHS_PT[m]} ${y}`;
    monthsEl.appendChild(cell);

    cur = nextMonth;
  }

  // Semanas (a cada 7 dias)
  cur = new Date(minD);
  const totalDays = Math.round((maxD - minD) / 86400000) + 1;
  for (let d = 0; d < totalDays; d += 7) {
    const weekDate = new Date(minD);
    weekDate.setDate(minD.getDate() + d);
    const cell = document.createElement('div');
    cell.className = 'gantt-week-cell';
    cell.style.width = (7 * GANTT.DAY_W) + 'px';
    cell.textContent = weekDate.getDate() + '/' + (weekDate.getMonth() + 1);
    weeksEl.appendChild(cell);
  }
}

/* ── Renderiza sidebar (nomes das etapas) ───────────────── */
function renderGanttSidebar(rows) {
  const el = document.getElementById('ganttSidebarRows');
  el.innerHTML = '';
  rows.forEach(e => {
    const row = document.createElement('div');
    row.className = 'gantt-sidebar-row' + (e.status === 'atrasada' ? ' atrasada' : '');
    row.innerHTML = `
      <span class="gsrow-name" title="${e.nome}">${e.nome}</span>
      <span class="gsrow-badge ${e.status}">${STATUS_LABELS[e.status] || e.status}</span>
    `;
    el.appendChild(row);
  });
}

/* ── Renderiza área de barras ───────────────────────────── */
function renderGanttBars(rows, minD) {
  const area = document.getElementById('ganttBarsArea');
  area.innerHTML = '';
  const totalDays = Math.ceil((rows.reduce((mx, e) => {
    const d = e.prazo ? new Date(e.prazo) : new Date(minD);
    return d > mx ? d : mx;
  }, minD) - minD) / 86400000) + 22;
  const totalW = totalDays * GANTT.DAY_W;

  area.style.width  = totalW + 'px';
  area.style.height = (rows.length * GANTT.ROW_H) + 'px';
  area.style.position = 'relative';

  // Fundo zebrado + grid
  rows.forEach((_, i) => {
    const bg = document.createElement('div');
    bg.className = 'gantt-row-bg';
    bg.style.top = (i * GANTT.ROW_H) + 'px';
    bg.style.width = totalW + 'px';
    area.appendChild(bg);
  });

  // Linhas de grid (a cada 7 dias = semana)
  for (let d = 0; d < totalDays; d += 7) {
    const line = document.createElement('div');
    line.className = 'gantt-grid-line';
    line.style.left = (d * GANTT.DAY_W) + 'px';
    area.appendChild(line);
  }

  // Barras
  const tooltip = document.getElementById('ganttTooltip');
  rows.forEach((e, i) => {
    if (!e.inicio && !e.prazo) return;
    const x1 = e.inicio ? dateToX(e.inicio, minD) : 0;
    const x2 = e.prazo  ? dateToX(e.prazo, minD) + GANTT.DAY_W : x1 + GANTT.DAY_W;
    const barW = Math.max(x2 - x1, GANTT.DAY_W * 2);
    const color = STATUS_COLORS[e.status] || '#64748b';
    // percRealizado vem de analiseData (soma das medições); fallback para progresso da etapa
    const pct = Math.min(100, Math.max(0, e.percRealizado ?? e.progresso ?? 0));

    const bar = document.createElement('div');
    bar.className = 'gantt-bar';
    bar.style.cssText = `
      left:${x1}px; top:${i * GANTT.ROW_H + 10}px;
      width:${barW}px; background:${color};
    `;
    bar.innerHTML = `
      <div class="gantt-bar-fill" style="width:${pct}%"></div>
      <span class="gantt-bar-label">${pct}%</span>
    `;

    // Tooltip
    bar.addEventListener('mouseenter', ev => {
      tooltip.innerHTML = `
        <strong>${e.nome}</strong>
        <span style="color:#94a3b8;font-size:.75rem">${e.obraNome || ''}</span>
        <div class="gantt-tooltip-row" style="margin-top:6px">
          <span>Início:</span><span>${formatDate(e.inicio)}</span>
        </div>
        <div class="gantt-tooltip-row">
          <span>Prazo:</span><span>${formatDate(e.prazo)}</span>
        </div>
        <div class="gantt-tooltip-row">
          <span>Progresso:</span><span class="gantt-tooltip-pct">${pct}%</span>
        </div>
        <div class="gantt-tooltip-row">
          <span>Previsto:</span><span>${formatCur(e.custoPrevisto)}</span>
        </div>
        <div class="gantt-tooltip-row">
          <span>Realizado:</span><span>${formatCur(e.custoReal)}</span>
        </div>
      `;
      tooltip.style.display = 'block';
      positionTooltip(ev);
    });
    bar.addEventListener('mousemove', positionTooltip);
    bar.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

    area.appendChild(bar);
  });
}

function positionTooltip(ev) {
  const tt = document.getElementById('ganttTooltip');
  const margin = 14;
  let left = ev.clientX + margin;
  let top  = ev.clientY + margin;
  if (left + 280 > window.innerWidth)  left = ev.clientX - 280 - margin;
  if (top  + 180 > window.innerHeight) top  = ev.clientY - 180 - margin;
  tt.style.left = left + 'px';
  tt.style.top  = top  + 'px';
}

/* ── Linha "Hoje" ───────────────────────────────────────── */
function renderGanttTodayLine(minD, totalH) {
  const area = document.getElementById('ganttBarsArea');
  const today = new Date();
  today.setHours(0,0,0,0);
  if (today < minD) return;
  const x = dateToX(today, minD);
  const line = document.createElement('div');
  line.className = 'gantt-today-line';
  line.style.left = x + 'px';
  line.style.height = totalH + 'px';
  line.innerHTML = '<div class="gantt-today-label">HOJE</div>';
  area.appendChild(line);
}

/* ── Sync scroll ────────────────────────────────────────── */
function setupGanttScrollSync(rows) {
  const wrap = document.getElementById('ganttTimelineWrap');
  const sideRows = document.getElementById('ganttSidebarRows');
  // Scroll vertical da area de barras ↔ sidebar: aqui o gantt não tem scroll vertical
  // (todos os rows visíveis), mas deixamos o hook caso apareça overflow
  wrap.addEventListener('scroll', () => {
    sideRows.style.transform = `translateY(-${wrap.scrollTop}px)`;
  });
}

/* ── Scrollar para hoje ─────────────────────────────────── */
function scrollGanttToToday() {
  const wrap = document.getElementById('ganttTimelineWrap');
  if (!wrap._ganttMinD) return;
  const x = dateToX(new Date(), wrap._ganttMinD);
  wrap.scrollTo({ left: Math.max(0, x - 200), behavior: 'smooth' });
}

/* ── Render Gantt principal ─────────────────────────────── */
function renderGantt() {
  const obraFilter   = (document.getElementById('ganttFilterObra')?.value   || '').toString();
  const statusFilter = (document.getElementById('ganttFilterStatus')?.value || '');

  // analiseData tem custoReal e percRealizado vindos das medições (fonte correta)
  // fallback para etapas caso cruzarDados ainda não tenha rodado
  const source = analiseData.length ? analiseData : etapas;
  let rows = source.filter(e => e.inicio || e.prazo);
  if (obraFilter)   rows = rows.filter(e => String(e.obraId) === obraFilter);
  if (statusFilter) rows = rows.filter(e => e.status === statusFilter);
  rows.sort((a, b) => {
    const aOb = a.obraNome || '';
    const bOb = b.obraNome || '';
    if (aOb !== bOb) return aOb.localeCompare(bOb);
    return (a.inicio || '').localeCompare(b.inicio || '');
  });

  const emptyEl = document.getElementById('ganttEmpty');
  const wrapEl  = document.getElementById('ganttBarsArea');

  if (rows.length === 0) {
    document.querySelector('.gantt-wrap').style.display = 'none';
    emptyEl.classList.remove('hidden');
    return;
  }
  document.querySelector('.gantt-wrap').style.display = '';
  emptyEl.classList.add('hidden');

  const range = calcGanttRange(rows);
  if (!range) return;
  const { minD, maxD } = range;

  const wrap = document.getElementById('ganttTimelineWrap');
  wrap._ganttMinD = minD;

  const totalDays = Math.round((maxD - minD) / 86400000) + 1;
  const totalW    = totalDays * GANTT.DAY_W;
  const totalH    = rows.length * GANTT.ROW_H;

  // Ajusta largura dos elementos de cabeçalho
  document.getElementById('ganttHeaderMonths').style.minWidth = totalW + 'px';
  document.getElementById('ganttHeaderWeeks').style.minWidth  = totalW + 'px';

  renderGanttHeaders(minD, maxD);
  renderGanttSidebar(rows);
  renderGanttBars(rows, minD);
  renderGanttTodayLine(minD, totalH);
  setupGanttScrollSync(rows);

  // Auto-scroll para hoje
  setTimeout(() => scrollGanttToToday(), 80);
}
