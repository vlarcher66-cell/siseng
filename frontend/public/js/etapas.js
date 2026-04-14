/* ═══════════════════════════════════════════════════════════
   SISENG — Etapas CRUD  v1.0
   Gestão de etapas de obra com tipos de execução
═══════════════════════════════════════════════════════════ */

/* ── Tipos de Etapas padrão ──────────────────────────────── */
const TIPOS_DEFAULT = [
  { id: 't1',  nome: 'Terraplanagem',        icone: 'fa-mountain',   cor: '#64748b' },
  { id: 't2',  nome: 'Fundação',             icone: 'fa-cube',       cor: '#f97316' },
  { id: 't3',  nome: 'Estrutura',            icone: 'fa-building',   cor: '#2563eb' },
  { id: 't4',  nome: 'Alvenaria',            icone: 'fa-border-all', cor: '#8b5cf6' },
  { id: 't5',  nome: 'Cobertura',            icone: 'fa-home',       cor: '#0ea5e9' },
  { id: 't6',  nome: 'Instalações Elétricas',icone: 'fa-bolt',       cor: '#f59e0b' },
  { id: 't7',  nome: 'Instalações Hidráulicas',icone: 'fa-tint',     cor: '#0ea5e9' },
  { id: 't8',  nome: 'Instalações de Gás',   icone: 'fa-fire',       cor: '#ef4444' },
  { id: 't9',  nome: 'Revestimento Interno', icone: 'fa-th-large',   cor: '#22c55e' },
  { id: 't10', nome: 'Revestimento Externo', icone: 'fa-th-large',   cor: '#16a34a' },
  { id: 't11', nome: 'Esquadrias',           icone: 'fa-door-open',  cor: '#8b5cf6' },
  { id: 't12', nome: 'Pintura',              icone: 'fa-paint-roller',cor: '#f97316' },
  { id: 't13', nome: 'Acabamentos',          icone: 'fa-star',       cor: '#f59e0b' },
  { id: 't14', nome: 'Paisagismo',           icone: 'fa-leaf',       cor: '#22c55e' },
  { id: 't15', nome: 'Limpeza Final',        icone: 'fa-broom',      cor: '#64748b' },
];

/* ── Mock de etapas ──────────────────────────────────────── */
const ETAPAS_MOCK = [
  {
    id: 'et1', nome: 'Execução de Fundação',
    obraId: 'obra_1', obraNome: 'Residencial das Palmeiras',
    tipo: 'Fundação', tipoIcone: 'fa-cube', tipoCor: '#f97316',
    status: 'concluida', responsavel: 'Eng. Carlos Mendes',
    inicio: '2025-02-15', prazo: '2025-04-30',
    progresso: 100, custoPrevisto: 85000, custoReal: 82500,
    descricao: 'Fundação em radier com estacas hélice contínua.', criadoEm: '2025-02-10'
  },
  {
    id: 'et2', nome: 'Estrutura de Concreto',
    obraId: 'obra_1', obraNome: 'Residencial das Palmeiras',
    tipo: 'Estrutura', tipoIcone: 'fa-building', tipoCor: '#2563eb',
    status: 'concluida', responsavel: 'Eng. Carlos Mendes',
    inicio: '2025-05-01', prazo: '2025-09-30',
    progresso: 100, custoPrevisto: 210000, custoReal: 218000,
    descricao: 'Estrutura em concreto armado — 8 pavimentos.', criadoEm: '2025-02-10'
  },
  {
    id: 'et3', nome: 'Alvenaria de Vedação',
    obraId: 'obra_1', obraNome: 'Residencial das Palmeiras',
    tipo: 'Alvenaria', tipoIcone: 'fa-border-all', tipoCor: '#8b5cf6',
    status: 'em_andamento', responsavel: 'Mestre Joaquim',
    inicio: '2025-10-01', prazo: '2026-03-31',
    progresso: 68, custoPrevisto: 95000, custoReal: 61000,
    descricao: 'Alvenaria em bloco cerâmico — todos os pavimentos.', criadoEm: '2025-02-10'
  },
  {
    id: 'et4', nome: 'Instalações Elétricas',
    obraId: 'obra_1', obraNome: 'Residencial das Palmeiras',
    tipo: 'Instalações Elétricas', tipoIcone: 'fa-bolt', tipoCor: '#f59e0b',
    status: 'pendente', responsavel: 'Eletricista Sênior',
    inicio: '2026-04-01', prazo: '2026-06-30',
    progresso: 0, custoPrevisto: 48000, custoReal: 0,
    descricao: 'Instalações elétricas completas conforme projeto.', criadoEm: '2025-02-10'
  },
  {
    id: 'et5', nome: 'Estrutura Metálica Principal',
    obraId: 'obra_4', obraNome: 'Galpão Industrial Norte',
    tipo: 'Estrutura', tipoIcone: 'fa-building', tipoCor: '#2563eb',
    status: 'concluida', responsavel: 'Eng. Paulo Souza',
    inicio: '2024-04-01', prazo: '2024-08-31',
    progresso: 100, custoPrevisto: 820000, custoReal: 810000,
    descricao: 'Estrutura metálica com perfis soldados.', criadoEm: '2024-03-01'
  },
  {
    id: 'et6', nome: 'Cobertura Metálica',
    obraId: 'obra_4', obraNome: 'Galpão Industrial Norte',
    tipo: 'Cobertura', tipoIcone: 'fa-home', tipoCor: '#0ea5e9',
    status: 'concluida', responsavel: 'Eng. Paulo Souza',
    inicio: '2024-09-01', prazo: '2024-11-30',
    progresso: 100, custoPrevisto: 320000, custoReal: 315000,
    descricao: 'Telha metálica termoacústica.', criadoEm: '2024-03-01'
  },
  {
    id: 'et7', nome: 'Fundação Escola Municipal',
    obraId: 'obra_5', obraNome: 'Escola Municipal Jardim Verde',
    tipo: 'Fundação', tipoIcone: 'fa-cube', tipoCor: '#f97316',
    status: 'concluida', responsavel: 'Eng. Maria Santos',
    inicio: '2025-04-20', prazo: '2025-07-31',
    progresso: 100, custoPrevisto: 280000, custoReal: 275000,
    descricao: 'Fundação em sapatas corridas.', criadoEm: '2025-04-15'
  },
  {
    id: 'et8', nome: 'Estrutura — Blocos A e B',
    obraId: 'obra_5', obraNome: 'Escola Municipal Jardim Verde',
    tipo: 'Estrutura', tipoIcone: 'fa-building', tipoCor: '#2563eb',
    status: 'atrasada', responsavel: 'Eng. Maria Santos',
    inicio: '2025-08-01', prazo: '2025-11-30',
    progresso: 35, custoPrevisto: 450000, custoReal: 148000,
    descricao: 'Estrutura de concreto — obra paralisada por falta de verba.', criadoEm: '2025-04-15'
  },
];

/* ── Estado da aplicação ─────────────────────────────────── */
let etapas  = [];
let tiposEtapa = [];
let obras   = [];
let modelosEtapa = [];
let currentFilter  = 'todos';
let currentView    = 'list';
let currentSort    = 'nome';
let currentSearch  = '';
let filterObra     = '';
let filterTipo     = '';
let filterStatus   = '';
let editingId  = null;
let deletingId = null;
let viewingId  = null;
let selectedColor = '#2563eb';

/* ── Auth / API ──────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token') || '';
}

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res  = await fetch(`/api${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem('sis_token');
    window.location.href = '../index.html';
    throw new Error('Não autorizado');
  }
  if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
  return data;
}

/* ── Mapeia registro do banco para formato interno ───────── */
function mapEtapa(e) {
  return {
    id:           e.id,
    nome:         e.nome,
    descricao:    e.descricao || '',
    obraId:       e.obra_id,
    obraNome:     e.obra_nome || '',
    tipo:         e.tipo || '',
    tipoIcone:    (TIPOS_DEFAULT.find(t => t.nome === e.tipo) || {}).icone || 'fa-layer-group',
    tipoCor:      (TIPOS_DEFAULT.find(t => t.nome === e.tipo) || {}).cor   || '#2563eb',
    status:       e.status || 'pendente',
    responsavel:  e.responsavel || '',
    inicio:       e.data_inicio ? e.data_inicio.split('T')[0] : '',
    prazo:        e.data_fim    ? e.data_fim.split('T')[0]    : '',
    progresso:    e.status === 'concluida' ? 100 : (e.percentual || 0),
    custoPrevisto: parseFloat(e.custo_previsto) || 0,
    custoReal:    parseFloat(e.custo_real)    || 0,
    criadoEm:     e.criado_em  ? e.criado_em.split('T')[0]   : '',
  };
}

/* ── Carregar Etapas da API ──────────────────────────────── */
async function loadEtapas() {
  try {
    const data = await api('GET', '/etapas');
    etapas = (Array.isArray(data) ? data : []).map(mapEtapa);
  } catch (err) {
    showToast('Erro ao carregar etapas: ' + err.message, 'error');
    etapas = [];
  }
}

/* ── Carregar Obras da API ───────────────────────────────── */
async function loadObrasApi() {
  try {
    const data = await api('GET', '/obras');
    obras = Array.isArray(data) ? data : [];
  } catch (_) {
    obras = [];
  }
}

/* ── Tipos de etapa ──────────────────────────────────────── */
function loadTipos() {
  const rawTipos = localStorage.getItem('sis_tipos_etapa');
  tiposEtapa = rawTipos ? JSON.parse(rawTipos) : JSON.parse(JSON.stringify(TIPOS_DEFAULT));
}
function saveTiposStorage() { localStorage.setItem('sis_tipos_etapa', JSON.stringify(tiposEtapa)); }

async function loadObrasCount() {
  const token = getToken();
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

/* ── Utilitários ─────────────────────────────────────────── */
function generateId() { return 'et_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); }
function formatDate(d) { if (!d) return '—'; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; }
function isPast(d)    { return d && new Date(d) < new Date(); }
function formatCur(v) { return v ? 'R$ ' + Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2}) : '—'; }

const STATUS_LABEL = {
  em_andamento: 'Em Andamento', pendente: 'Pendente',
  concluida: 'Concluída', atrasada: 'Atrasada', bloqueada: 'Bloqueada'
};
const STATUS_ICON = {
  em_andamento: 'fa-play-circle', pendente: 'fa-clock',
  concluida: 'fa-check-circle',   atrasada: 'fa-exclamation-triangle', bloqueada: 'fa-ban'
};
function statusClass(s) {
  return { em_andamento:'ebadge-em_andamento', pendente:'ebadge-pendente',
           concluida:'ebadge-concluida', atrasada:'ebadge-atrasada', bloqueada:'ebadge-bloqueada' }[s] || '';
}
function progressColor(pct, status) {
  if (status === 'concluida') return '#22c55e';
  if (status === 'bloqueada') return '#94a3b8';
  if (status === 'atrasada')  return '#ef4444';
  if (pct >= 75) return '#22c55e';
  if (pct >= 40) return '#2563eb';
  return '#f97316';
}

/* ── Render principal ────────────────────────────────────── */
function getFiltered() {
  let list = [...etapas];

  if (currentFilter !== 'todos')  list = list.filter(e => e.status === currentFilter);
  if (filterObra)                 list = list.filter(e => String(e.obraId) === String(filterObra));
  if (filterTipo)                 list = list.filter(e => e.tipo === filterTipo);
  if (filterStatus)               list = list.filter(e => e.status === filterStatus);

  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase();
    list = list.filter(e =>
      e.nome.toLowerCase().includes(q) ||
      (e.obraNome || '').toLowerCase().includes(q) ||
      (e.tipo || '').toLowerCase().includes(q) ||
      (e.responsavel || '').toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => {
    switch (currentSort) {
      case 'nome':     return a.nome.localeCompare(b.nome);
      case 'prazo':    return new Date(a.prazo || '9999') - new Date(b.prazo || '9999');
      case 'pct_desc': return b.progresso - a.progresso;
      case 'obra':     return (a.obraNome || '').localeCompare(b.obraNome || '');
      default: return 0;
    }
  });
  return list;
}

function renderEtapas() {
  const container  = document.getElementById('etapasContainer');
  const emptyState = document.getElementById('emptyState');
  const resultCount = document.getElementById('resultCount');
  const list = getFiltered();

  if (!list.length) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    resultCount.textContent = '0 etapas encontradas';
    return;
  }
  emptyState.classList.add('hidden');
  resultCount.textContent = `${list.length} etapa${list.length !== 1 ? 's' : ''} encontrada${list.length !== 1 ? 's' : ''}`;

  if (currentView === 'grid') {
    container.classList.remove('list-view');
    container.innerHTML = list.map(renderCardGrid).join('');
    container.querySelectorAll('.etapa-card').forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(14px)';
      setTimeout(() => {
        card.style.transition = 'opacity .32s ease, transform .32s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 55);
    });
  } else {
    container.classList.add('list-view');
    container.innerHTML = `
      <table class="obras-table">
        <thead>
          <tr>
            <th class="col-status">Status</th>
            <th class="col-nome">Etapa / Tipo</th>
            <th>Obra</th>
            <th>Responsável</th>
            <th class="col-datas">Início</th>
            <th class="col-datas">Entrega</th>
            <th class="col-orc">Custo Prev.</th>
            <th class="col-prog">Progresso</th>
            <th class="col-acoes">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(renderRowList).join('')}
        </tbody>
      </table>
    `;
  }
}

function renderCardGrid(e) {
  const pct    = e.progresso || 0;
  const pColor = progressColor(pct, e.status);
  const lateClass = (e.status !== 'concluida' && isPast(e.prazo)) ? ' late' : '';

  return `
    <div class="etapa-card" data-id="${e.id}">
      <div class="etapa-card-bar ebar-${e.status}"></div>
      <div class="etapa-card-body">
        <div class="etapa-card-header">
          <span class="etapa-status-badge ${statusClass(e.status)}">
            <i class="fas ${STATUS_ICON[e.status]}"></i> ${STATUS_LABEL[e.status]}
          </span>
          <div class="etapa-card-actions">
            <button onclick="openModalView('${e.id}')" title="Ver detalhes"><i class="fas fa-eye"></i></button>
            <button onclick="openModalEtapa('${e.id}')" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-danger-sm" onclick="openModalDelete('${e.id}')" title="Excluir"><i class="fas fa-trash-alt"></i></button>
          </div>
        </div>

        <div class="etapa-card-name">${e.nome}</div>

        ${e.tipo ? `
          <div class="etapa-tipo-badge" style="background:${e.tipoCor}18;color:${e.tipoCor}">
            <i class="fas ${e.tipoIcone || 'fa-layer-group'}"></i> ${e.tipo}
          </div>` : ''}

        <div class="etapa-meta">
          ${e.responsavel ? `<span class="etapa-meta-item"><i class="fas fa-user"></i>${e.responsavel}</span>` : ''}
          ${e.prazo ? `<span class="etapa-meta-item${lateClass}"><i class="fas fa-calendar-alt"></i>${formatDate(e.prazo)}</span>` : ''}
          ${e.custoPrevisto ? `<span class="etapa-meta-item"><i class="fas fa-dollar-sign"></i>R$ ${Number(e.custoPrevisto/1000).toFixed(0)}k</span>` : ''}
        </div>

        <div class="etapa-progress">
          <div class="etapa-progress-header">
            <span>Progresso</span>
            <span style="font-weight:800;color:${pColor}">${pct}%</span>
          </div>
          <div class="etapa-progress-bar">
            <div class="etapa-progress-fill" style="width:${pct}%;background:${pColor}"></div>
          </div>
        </div>
      </div>
      <div class="etapa-obra-tag">
        <i class="fas fa-hard-hat"></i> ${e.obraNome || '—'}
      </div>
    </div>
  `;
}

function renderRowList(e) {
  const pct    = e.progresso || 0;
  const pColor = progressColor(pct, e.status);
  const late   = e.status !== 'concluida' && isPast(e.prazo);

  return `
    <tr class="obra-row ebar-${e.status}" data-id="${e.id}">
      <td class="col-status">
        <span class="etapa-status-badge ${statusClass(e.status)}">
          <i class="fas ${STATUS_ICON[e.status]}"></i> ${STATUS_LABEL[e.status]}
        </span>
      </td>
      <td class="col-nome">
        <div class="row-nome">${e.nome}</div>
        ${e.tipo ? `<div class="row-cliente" style="color:${e.tipoCor}"><i class="fas ${e.tipoIcone||'fa-layer-group'}"></i> ${e.tipo}</div>` : ''}
      </td>
      <td>
        <span class="row-cidade"><i class="fas fa-hard-hat"></i> ${e.obraNome || '—'}</span>
      </td>
      <td>
        <span class="row-data">${e.responsavel || '—'}</span>
      </td>
      <td class="col-datas">
        <span class="row-data">${formatDate(e.inicio)}</span>
      </td>
      <td class="col-datas">
        <span class="row-data ${late ? 'row-data-late' : ''}">${formatDate(e.prazo)}</span>
      </td>
      <td class="col-orc">
        <span class="row-orc">${formatCur(e.custoPrevisto)}</span>
      </td>
      <td class="col-prog">
        <div class="row-prog-wrap">
          <div class="row-prog-bar">
            <div class="row-prog-fill" style="width:${pct}%;background:${pColor}"></div>
          </div>
          <span class="row-prog-pct" style="color:${pColor}">${pct}%</span>
        </div>
      </td>
      <td class="col-acoes">
        <div class="obra-card-actions" style="justify-content:center">
          <button onclick="openModalView('${e.id}')" title="Ver"><i class="fas fa-eye"></i></button>
          <button onclick="openModalEtapa('${e.id}')" title="Editar"><i class="fas fa-edit"></i></button>
          <button class="btn-danger-sm" onclick="openModalDelete('${e.id}')" title="Excluir"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    </tr>
  `;
}

/* ── Tab counts ──────────────────────────────────────────── */
function updateTabCounts() {
  document.getElementById('ecnt-todos').textContent = etapas.length;
  ['em_andamento','pendente','concluida','atrasada','bloqueada'].forEach(s => {
    const el = document.getElementById('ecnt-' + s);
    if (el) el.textContent = etapas.filter(e => e.status === s).length;
  });
  const badge = document.getElementById('etapasCount');
  if (badge) badge.textContent = etapas.length;

  const subtitle = document.getElementById('etapasSubtitle');
  if (subtitle) {
    const em = etapas.filter(e => e.status === 'em_andamento').length;
    const atrasadas = etapas.filter(e => e.status === 'atrasada').length;
    subtitle.textContent = `${etapas.length} etapa${etapas.length !== 1 ? 's' : ''} cadastrada${etapas.length !== 1 ? 's' : ''} · ${em} em andamento${atrasadas ? ` · ${atrasadas} atrasada${atrasadas > 1 ? 's' : ''}` : ''}`;
  }
}

/* ── Filtros ─────────────────────────────────────────────── */
function setTabFilter(status, el) {
  currentFilter = status;
  document.querySelectorAll('.etapa-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderEtapas();
}
function setView(v) {
  currentView = v;
  document.getElementById('btnGrid').classList.toggle('active', v === 'grid');
  document.getElementById('btnList').classList.toggle('active', v === 'list');
  renderEtapas();
}
function sortEtapas(v)  { currentSort = v; renderEtapas(); }
function searchEtapas(v){ currentSearch = v; renderEtapas(); }
function applyFilters() {
  filterObra   = document.getElementById('filterObra').value;
  filterTipo   = document.getElementById('filterTipo').value;
  filterStatus = document.getElementById('filterStatus').value;
  renderEtapas();
}

/* ── Populate selects ────────────────────────────────────── */
function populateSelects() {
  // Modelos de Etapa select no modal
  // Se houver modelos cadastrados, usa-os; senão usa TIPOS_DEFAULT como fallback
  const selNome = document.getElementById('etapaNome');
  const savedNome = selNome?.value;
  if (selNome) {
    let opts = '<option value="">Selecione o nome da etapa...</option>';
    if (modelosEtapa.length) {
      const byTipo = {};
      modelosEtapa.forEach(m => {
        const tipo = TIPOS_DEFAULT.find(t => t.id === m.tipoId);
        const tipoNome = tipo ? tipo.nome : 'Outros';
        if (!byTipo[tipoNome]) byTipo[tipoNome] = [];
        byTipo[tipoNome].push(m);
      });
      Object.entries(byTipo).forEach(([grupo, items]) => {
        opts += `<optgroup label="${grupo}">`;
        opts += items.map(m => `<option value="${m.id}" data-tipo-id="${m.tipoId}" data-nome="${m.nome}">${m.nome}</option>`).join('');
        opts += '</optgroup>';
      });
    } else {
      // Fallback: lista os tipos padrão como nomes de etapa
      TIPOS_DEFAULT.forEach(t => {
        opts += `<option value="${t.id}" data-tipo-id="${t.id}" data-nome="${t.nome}">${t.nome}</option>`;
      });
    }
    selNome.innerHTML = opts;
    if (savedNome) selNome.value = savedNome;
  }

  // Obras select no modal
  const selObra = document.getElementById('etapaObra');
  const saved = selObra?.value;
  if (selObra) {
    selObra.innerHTML = '<option value="">Selecione a obra...</option>' +
      obras.map(o => `<option value="${o.id}">${o.nome}</option>`).join('');
    if (saved) selObra.value = saved;
  }

  // Tipos select no modal
  const selTipo = document.getElementById('etapaTipo');
  const savedT = selTipo?.value;
  if (selTipo) {
    selTipo.innerHTML = '<option value="">Selecione...</option>' +
      tiposEtapa.map(t =>
        `<option value="${t.nome}" data-icone="${t.icone}" data-cor="${t.cor}">${t.nome}</option>`
      ).join('');
    if (savedT) selTipo.value = savedT;
  }

  // Filter select — obras
  const fObra = document.getElementById('filterObra');
  if (fObra) {
    const cur = fObra.value;
    fObra.innerHTML = '<option value="">Todas as obras</option>' +
      obras.map(o => `<option value="${o.id}">${o.nome}</option>`).join('');
    fObra.value = cur;
  }

  // Filter select — tipos
  const fTipo = document.getElementById('filterTipo');
  if (fTipo) {
    const cur = fTipo.value;
    fTipo.innerHTML = '<option value="">Todos os tipos</option>' +
      tiposEtapa.map(t => `<option value="${t.nome}">${t.nome}</option>`).join('');
    fTipo.value = cur;
  }
}

/* ── Modal Etapa ─────────────────────────────────────────── */
function openModalEtapa(id = null) {
  editingId = id;
  // Recarrega modelos (pode ter sido atualizado em outra aba)
  const rawModelos = localStorage.getItem('modelos_etapa');
  modelosEtapa = rawModelos ? JSON.parse(rawModelos).filter(m => m.ativo) : [];
  populateSelects();
  const title = document.getElementById('modalEtapaTitle');

  if (id) {
    const e = etapas.find(x => String(x.id) === String(id));
    if (!e) return;
    title.innerHTML = '<i class="fas fa-edit"></i> Editar Etapa';
    fillFormEtapa(e);
    // Garante que o tipo está disponível no select mesmo se não estiver em tiposEtapa
    const selTipo = document.getElementById('etapaTipo');
    if (selTipo && e.tipo && !selTipo.value) {
      const opt = document.createElement('option');
      opt.value = e.tipo;
      opt.textContent = e.tipo;
      selTipo.appendChild(opt);
      selTipo.value = e.tipo;
    }
  } else {
    title.innerHTML = '<i class="fas fa-tasks"></i> Nova Etapa';
    clearFormEtapa();
  }

  document.getElementById('modalEtapa').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('etapaNome')?.focus(), 150);
}

/* Auto-preenche Tipo ao selecionar um Modelo de Etapa */
function onModeloSelect(sel) {
  const opt = sel.options[sel.selectedIndex];
  if (!opt || !opt.value) return;
  const tipoId = opt.dataset.tipoId;
  const tipo = TIPOS_DEFAULT.find(t => t.id === tipoId);
  if (tipo) {
    const selTipo = document.getElementById('etapaTipo');
    if (selTipo) selTipo.value = tipo.nome;
  }
}

function closeModalEtapa() {
  document.getElementById('modalEtapa').classList.add('hidden');
  document.body.style.overflow = '';
  editingId = null;
}

function fillFormEtapa(e) {
  document.getElementById('etapaObra').value        = e.obraId || '';
  document.getElementById('etapaTipo').value        = e.tipo || '';
  document.getElementById('etapaStatus').value      = e.status || 'pendente';
  document.getElementById('etapaResponsavel').value = e.responsavel || '';
  document.getElementById('etapaInicio').value      = e.inicio || '';
  document.getElementById('etapaPrazo').value       = e.prazo || '';
  document.getElementById('etapaCustoPrevisto').value = e.custoPrevisto
    ? Number(e.custoPrevisto).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
  document.getElementById('etapaDescricao').value   = e.descricao || '';
  const pct = e.progresso || 0;
  document.getElementById('etapaPercentual').value       = pct;
  document.getElementById('etapaPercentualVal').textContent = pct + '%';
}

function clearFormEtapa() {
  ['etapaResponsavel','etapaInicio','etapaPrazo',
   'etapaCustoPrevisto','etapaDescricao'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('etapaObra').value    = '';
  document.getElementById('etapaTipo').value    = '';
  document.getElementById('etapaStatus').value  = 'pendente';
  document.getElementById('etapaPercentual').value       = 0;
  document.getElementById('etapaPercentualVal').textContent = '0%';
}


/* ── Salvar Etapa ────────────────────────────────────────── */
async function saveEtapa() {
  const tipo   = document.getElementById('etapaTipo').value;
  const obraId = document.getElementById('etapaObra').value;

  if (!tipo)   { showToast('Selecione o tipo de etapa.', 'error'); document.getElementById('etapaTipo').focus(); return; }
  if (!obraId) { showToast('Selecione a obra vinculada.', 'error'); document.getElementById('etapaObra').focus(); return; }

  const parseCur = id => {
    const v = document.getElementById(id).value.replace(/\./g,'').replace(',','.');
    return parseFloat(v) || 0;
  };

  const payload = {
    obra_id:       Number(obraId),
    nome:          tipo,
    tipo:          tipo,
    status:        document.getElementById('etapaStatus').value,
    percentual:    parseInt(document.getElementById('etapaPercentual').value) || 0,
    responsavel:   document.getElementById('etapaResponsavel').value.trim(),
    data_inicio:   document.getElementById('etapaInicio').value || null,
    data_fim:      document.getElementById('etapaPrazo').value  || null,
    custo_previsto: parseCur('etapaCustoPrevisto'),
    descricao:     document.getElementById('etapaDescricao').value.trim()
  };

  const btn = document.getElementById('btnSaveEtapa');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  try {
    if (editingId) {
      await api('PUT', `/etapas/${editingId}`, payload);
      showToast('Etapa atualizada!', 'success');
    } else {
      await api('POST', '/etapas', payload);
      showToast('Etapa cadastrada!', 'success');
    }
    await loadEtapas();
    updateTabCounts();
    renderEtapas();
    closeModalEtapa();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Salvar Etapa';
  }
}

/* ── Modal View ──────────────────────────────────────────── */
function openModalView(id) {
  const e = etapas.find(x => String(x.id) === String(id));
  if (!e) return;
  viewingId = id;

  const pct    = e.progresso || 0;
  const pColor = progressColor(pct, e.status);
  const variacaoCusto = e.custoPrevisto && e.custoReal
    ? ((e.custoReal - e.custoPrevisto) / e.custoPrevisto * 100).toFixed(1)
    : null;

  document.getElementById('viewEtapaTitle').innerHTML = `<i class="fas fa-tasks"></i> ${e.nome}`;
  document.getElementById('viewBody').innerHTML = `
    <div style="padding:24px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:20px">
        <div>
          <div class="etapa-tipo-badge" style="background:${e.tipoCor||'#2563eb'}18;color:${e.tipoCor||'#2563eb'};margin-bottom:10px;display:inline-flex">
            <i class="fas ${e.tipoIcone||'fa-layer-group'}"></i> ${e.tipo || 'Sem tipo'}
          </div>
          <div class="etapa-status-badge ${statusClass(e.status)}" style="display:inline-flex;margin-left:8px">
            <i class="fas ${STATUS_ICON[e.status]}"></i> ${STATUS_LABEL[e.status]}
          </div>
        </div>
        <div style="text-align:center;flex-shrink:0">
          <svg viewBox="0 0 60 60" width="68" height="68">
            <circle cx="30" cy="30" r="24" fill="none" stroke="#e2e8f0" stroke-width="6"/>
            <circle cx="30" cy="30" r="24" fill="none" stroke="${pColor}" stroke-width="6"
              stroke-dasharray="${2*Math.PI*24*pct/100} ${2*Math.PI*24*(1-pct/100)}"
              stroke-linecap="round" transform="rotate(-90 30 30)"/>
            <text x="30" y="34" text-anchor="middle" font-size="11" font-weight="700" fill="${pColor}">${pct}%</text>
          </svg>
        </div>
      </div>

      <div class="view-etapa-section">
        <div class="view-etapa-title">Identificação</div>
        <div class="view-etapa-grid">
          ${vr('Obra', e.obraNome)}
          ${vr('Responsável', e.responsavel)}
          ${vr('Data de Início', formatDate(e.inicio))}
          ${vr('Previsão de Término', formatDate(e.prazo))}
        </div>
      </div>

      <div class="view-etapa-section">
        <div class="view-etapa-title">Financeiro</div>
        <div class="view-etapa-grid">
          ${vr('Custo Previsto', formatCur(e.custoPrevisto))}
          ${vr('Custo Real', formatCur(e.custoReal))}
          ${variacaoCusto !== null ? vr('Variação', `<span style="color:${parseFloat(variacaoCusto)>0?'#ef4444':'#22c55e'};font-weight:800">${parseFloat(variacaoCusto)>0?'+':''}${variacaoCusto}%</span>`) : ''}
        </div>
      </div>

      ${e.descricao ? `
        <div class="view-etapa-section">
          <div class="view-etapa-title">Observações</div>
          <p style="font-size:.88rem;color:var(--dark-2);line-height:1.65;padding:12px 14px;background:var(--gray-light);border-radius:10px;border-left:3px solid var(--primary)">${e.descricao}</p>
        </div>` : ''}
    </div>
  `;

  document.getElementById('modalView').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function vr(label, value) {
  if (!value || value === '—') return '';
  return `<div class="view-etapa-row"><span class="view-etapa-label">${label}</span><span class="view-etapa-value">${value}</span></div>`;
}
function closeModalView() {
  document.getElementById('modalView').classList.add('hidden');
  document.body.style.overflow = '';
  viewingId = null;
}
function editFromView() {
  const id = viewingId;
  closeModalView();
  openModalEtapa(id);
}

/* ── Modal Delete ────────────────────────────────────────── */
function openModalDelete(id) {
  const e = etapas.find(x => String(x.id) === String(id));
  if (!e) return;
  deletingId = id;
  document.getElementById('deleteEtapaName').textContent = e.nome;
  document.getElementById('modalDelete').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeModalDelete() {
  document.getElementById('modalDelete').classList.add('hidden');
  document.body.style.overflow = '';
  deletingId = null;
}
async function confirmDelete() {
  if (!deletingId) return;
  const btn = document.getElementById('btnConfirmDelete');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
  try {
    await api('DELETE', `/etapas/${deletingId}`);
    await loadEtapas();
    updateTabCounts();
    renderEtapas();
    closeModalDelete();
    showToast('Etapa excluída.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-trash-alt"></i> Sim, excluir';
  }
}

/* ── Popup Tipos de Etapas ───────────────────────────────── */
function openPopupTipos() {
  renderTiposList();
  document.getElementById('newTipoNome').value = '';
  document.getElementById('popupTipos').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('newTipoNome')?.focus(), 150);
}
function closePopupTipos() {
  document.getElementById('popupTipos').classList.add('hidden');
  const modalEtapa = document.getElementById('modalEtapa');
  if (modalEtapa.classList.contains('hidden')) document.body.style.overflow = '';
}

function selectColor(btn) {
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  btn.classList.add('active');
  selectedColor = btn.dataset.color;
}

function saveTipo() {
  const nome = document.getElementById('newTipoNome').value.trim();
  if (!nome) { showToast('Informe o nome do tipo.', 'error'); return; }
  if (tiposEtapa.find(t => t.nome.toLowerCase() === nome.toLowerCase())) {
    showToast('Este tipo já está cadastrado.', 'error'); return;
  }
  const icone = document.getElementById('newTipoIcone').value;
  const cor   = selectedColor || '#2563eb';

  tiposEtapa.push({ id: 'te_' + Date.now(), nome, icone, cor });
  saveTiposStorage();
  populateSelects();
  renderTiposList();
  document.getElementById('newTipoNome').value = '';
  showToast(`"${nome}" adicionado!`, 'success');
}

function deleteTipo(id) {
  const t = tiposEtapa.find(x => x.id === id);
  tiposEtapa = tiposEtapa.filter(x => x.id !== id);
  saveTiposStorage();
  populateSelects();
  renderTiposList();
  if (t) showToast(`"${t.nome}" removido.`, 'info');
}

function renderTiposList() {
  const container = document.getElementById('listTipos');
  const badge     = document.getElementById('tiposCount');
  if (badge) badge.textContent = tiposEtapa.length;

  if (!tiposEtapa.length) {
    container.innerHTML = '<div class="tipos-empty">Nenhum tipo cadastrado ainda.</div>';
    return;
  }
  container.innerHTML = tiposEtapa.map(t => `
    <div class="tipo-item">
      <div class="tipo-color-strip" style="background:${t.cor}"></div>
      <div class="tipo-icon-wrap" style="background:${t.cor}18;color:${t.cor}">
        <i class="fas ${t.icone}"></i>
      </div>
      <span class="tipo-nome">${t.nome}</span>
      <button class="tipo-delete-btn" onclick="deleteTipo('${t.id}')" title="Remover">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  `).join('');
}

/* ── Máscara currency ────────────────────────────────────── */
function maskCurrency(el) {
  el.addEventListener('input', function() {
    let v = this.value.replace(/\D/g,'');
    if (!v) { this.value = ''; return; }
    this.value = (parseInt(v,10)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  });
}

/* ── Toast ───────────────────────────────────────────────── */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const colors = { success:'#22c55e', error:'#ef4444', info:'#2563eb', warning:'#f59e0b' };
  const icons  = { success:'fa-check-circle', error:'fa-exclamation-circle', info:'fa-info-circle', warning:'fa-exclamation-triangle' };
  const toast  = document.createElement('div');
  toast.style.cssText = `
    display:flex;align-items:center;gap:10px;
    background:#fff;border-radius:12px;padding:14px 20px;
    box-shadow:0 8px 32px rgba(0,0,0,.18);
    border-left:4px solid ${colors[type]};
    font-size:.9rem;font-weight:600;color:var(--dark);
    min-width:260px;max-width:360px;
    animation:slideInToast .3s ease;
  `;
  toast.innerHTML = `
    <i class="fas ${icons[type]}" style="color:${colors[type]};font-size:1.1rem;flex-shrink:0"></i>
    <span style="flex:1">${msg}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:#94a3b8">
      <i class="fas fa-times"></i>
    </button>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation='fadeOutToast .3s ease forwards'; setTimeout(()=>toast.remove(),300); }, 3800);
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
  if (localStorage.getItem('sidebar_collapsed') === 'true') {
    sidebar.classList.add('collapsed'); wrapper.classList.add('sidebar-collapsed');
  }
  toggle?.addEventListener('click', () => {
    const c = sidebar.classList.toggle('collapsed');
    wrapper.classList.toggle('sidebar-collapsed', c);
    localStorage.setItem('sidebar_collapsed', c);
  });
  menuBtn?.addEventListener('click', () => { sidebar.classList.toggle('mobile-open'); overlay.classList.toggle('active'); });
  overlay?.addEventListener('click', () => { sidebar.classList.remove('mobile-open'); overlay.classList.remove('active'); });
}

/* ── User info ───────────────────────────────────────────── */
function loadUserInfo() {
  const raw = localStorage.getItem('sis_user') || sessionStorage.getItem('sis_user');
  if (!raw) return;
  const user = JSON.parse(raw);
  const initials = (user.nome||'AD').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  ['sidebarAvatar','headerAvatar','dropAvatar'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = initials;
  });
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('sidebarName', user.nome || 'Usuário');
  setEl('headerName',  user.nome || 'Usuário');
  setEl('dropName',    user.nome || 'Usuário');
  setEl('headerCompany', user.empresa || '');
  setEl('dropEmail',   user.email || '');
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

/* ── User dropdown / Logout ──────────────────────────────── */
function toggleUserMenu() { document.getElementById('userDropdown').classList.toggle('hidden'); }
document.addEventListener('click', e => {
  const dd = document.getElementById('userDropdown');
  const hu = document.querySelector('.header-user');
  if (dd && hu && !hu.contains(e.target)) dd.classList.add('hidden');
});
function handleLogout() {
  localStorage.removeItem('sis_token'); localStorage.removeItem('sis_user');
  sessionStorage.removeItem('sis_token'); sessionStorage.removeItem('sis_user');
  window.location.href = '../index.html';
}

/* ── Fechar modais ao clicar fora ────────────────────────── */
['modalEtapa','modalView','modalDelete','popupTipos'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', function(e) {
    if (e.target !== this) return;
    if (id === 'modalEtapa')  closeModalEtapa();
    if (id === 'modalView')   closeModalView();
    if (id === 'modalDelete') closeModalDelete();
    if (id === 'popupTipos')  closePopupTipos();
  });
});

/* ── Teclado ─────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModalEtapa(); closeModalView(); closeModalDelete(); closePopupTipos(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); document.getElementById('headerSearch')?.focus(); }
});
document.getElementById('newTipoNome')?.addEventListener('keydown', e => { if (e.key === 'Enter') saveTipo(); });

/* ── Toast animation styles ──────────────────────────────── */
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  @keyframes slideInToast { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
  @keyframes fadeOutToast  { to   { opacity:0; transform:translateX(40px); } }
`;
document.head.appendChild(toastStyles);

/* ══════════════════════════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  loadTipos();
  loadUserInfo();
  initSidebar();

  renderSidebar('etapas');
  maskCurrency(document.getElementById('etapaCustoPrevisto'));
  await Promise.all([loadEtapas(), loadObrasApi(), loadObrasCount()]);
  populateSelects();
  updateTabCounts();
  renderEtapas();
});
