/* ═══════════════════════════════════════════════════════════
   SISENG — Obras CRUD  v1.0
   Gerenciamento completo de obras com localStorage
═══════════════════════════════════════════════════════════ */

/* ── Dados iniciais (mock) ────────────────────────────────── */
const OBRAS_MOCK = [
  {
    id: 'obra_1',
    nome: 'Residencial das Palmeiras',
    cliente: 'João Ferreira',
    responsavel: 'Eng. Carlos Mendes',
    status: 'em_andamento',
    sistema: 'Alvenaria Convencional',
    cobertura: 'Telha Cerâmica',
    area: 320,
    inicio: '2025-02-10',
    prazo: '2026-08-30',
    orcamento: 850000,
    endereco: 'Rua das Palmeiras, 123',
    cidade: 'São Paulo — SP',
    descricao: 'Condomínio residencial com 24 unidades, área de lazer completa.',
    progresso: 62,
    criadoEm: '2025-02-10'
  },
  {
    id: 'obra_2',
    nome: 'Edifício Comercial Centro',
    cliente: 'Grupo Investimentos SA',
    responsavel: 'Eng. Ana Lima',
    status: 'planejamento',
    sistema: 'Concreto Armado',
    cobertura: 'Laje Impermeabilizada',
    area: 1250,
    inicio: '2026-05-01',
    prazo: '2028-12-31',
    orcamento: 4200000,
    endereco: 'Av. Paulista, 1500',
    cidade: 'São Paulo — SP',
    descricao: 'Torre comercial de 18 andares no centro financeiro.',
    progresso: 8,
    criadoEm: '2026-01-15'
  },
  {
    id: 'obra_3',
    nome: 'Casa Alto Padrão — Morumbi',
    cliente: 'Ricardo Alves',
    responsavel: 'Eng. Carlos Mendes',
    status: 'atrasada',
    sistema: 'Steel Frame',
    cobertura: 'Shingle Americano',
    area: 480,
    inicio: '2025-06-01',
    prazo: '2025-12-31',
    orcamento: 1350000,
    endereco: 'Rua Bela Vista, 78',
    cidade: 'São Paulo — SP',
    descricao: 'Residência unifamiliar de alto padrão com piscina e spa.',
    progresso: 45,
    criadoEm: '2025-06-01'
  },
  {
    id: 'obra_4',
    nome: 'Galpão Industrial Norte',
    cliente: 'Indústrias Beta Ltda',
    responsavel: 'Eng. Paulo Souza',
    status: 'concluida',
    sistema: 'Estrutura Metálica',
    cobertura: 'Telha Metálica',
    area: 3200,
    inicio: '2024-03-01',
    prazo: '2025-01-31',
    orcamento: 2800000,
    endereco: 'Rodovia Anhanguera, km 42',
    cidade: 'Campinas — SP',
    descricao: 'Galpão logístico com doca de carga e área administrativa.',
    progresso: 100,
    criadoEm: '2024-03-01'
  },
  {
    id: 'obra_5',
    nome: 'Escola Municipal Jardim Verde',
    cliente: 'Prefeitura Municipal',
    responsavel: 'Eng. Maria Santos',
    status: 'paralizada',
    sistema: 'Alvenaria Convencional',
    cobertura: 'Telha Fibrocimento',
    area: 1800,
    inicio: '2025-04-15',
    prazo: '2026-04-14',
    orcamento: 3100000,
    endereco: 'Rua Escola, s/n',
    cidade: 'Guarulhos — SP',
    descricao: 'Escola pública com 12 salas de aula, refeitório e quadra poliesportiva.',
    progresso: 28,
    criadoEm: '2025-04-15'
  },
  {
    id: 'obra_6',
    nome: 'Loteamento Horizonte',
    cliente: 'Construtora Horizonte',
    responsavel: 'Eng. Ana Lima',
    status: 'cancelada',
    sistema: '',
    cobertura: '',
    area: 0,
    inicio: '2025-01-01',
    prazo: '2027-06-30',
    orcamento: 9500000,
    endereco: 'Zona Leste — Gleba A',
    cidade: 'Mogi das Cruzes — SP',
    descricao: 'Loteamento cancelado por questões ambientais.',
    progresso: 5,
    criadoEm: '2025-01-01'
  }
];

const SISTEMAS_DEFAULT = ['Alvenaria Convencional', 'Concreto Armado', 'Steel Frame', 'Estrutura Metálica', 'Wood Frame', 'Alvenaria Estrutural'];
const COBERTURAS_DEFAULT = ['Telha Cerâmica', 'Telha Metálica', 'Telha Fibrocimento', 'Laje Impermeabilizada', 'Shingle Americano', 'Policarbonato'];

/* ── Estado da aplicação ─────────────────────────────────── */
let obras = [];
let sistemas = [];
let coberturas = [];
let currentFilter = 'todos';
let currentView = 'list';
let currentSort = 'nome';
let currentSearch = '';
let editingId = null;
let deletingId = null;
let viewingId = null;

/* ── API helpers ─────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token') || '';
}

async function apiObras(method, path, body) {
  const res = await fetch('https://siseng-production.up.railway.app/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro na requisição');
  return data;
}

async function loadStorage() {
  sistemas   = JSON.parse(localStorage.getItem('sis_sistemas')  || JSON.stringify(SISTEMAS_DEFAULT));
  coberturas = JSON.parse(localStorage.getItem('sis_coberturas') || JSON.stringify(COBERTURAS_DEFAULT));
  obras = await apiObras('GET', '/obras');
}

function saveSistemas() {
  localStorage.setItem('sis_sistemas', JSON.stringify(sistemas));
}

function saveCoberturas() {
  localStorage.setItem('sis_coberturas', JSON.stringify(coberturas));
}

/* ── Utilitários ─────────────────────────────────────────── */
function generateId() {
  return 'obra_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function formatCurrency(value) {
  if (!value && value !== 0) return '—';
  return 'R$ ' + Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function isPast(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

const STATUS_LABEL = {
  planejamento: 'Planejamento',
  em_andamento: 'Em Andamento',
  paralizada:   'Paralisada',
  concluida:    'Concluída',
  atrasada:     'Atrasada',
  cancelada:    'Cancelada'
};

const STATUS_ICON = {
  planejamento: 'fa-drafting-compass',
  em_andamento: 'fa-hard-hat',
  paralizada:   'fa-pause-circle',
  concluida:    'fa-check-circle',
  atrasada:     'fa-exclamation-triangle',
  cancelada:    'fa-ban'
};

function statusClass(s) {
  const map = {
    em_andamento: 'badge-em_andamento',
    planejamento: 'badge-planejamento',
    paralizada:   'badge-paralizada',
    concluida:    'badge-concluida',
    atrasada:     'badge-atrasada',
    cancelada:    'badge-cancelada'
  };
  return map[s] || '';
}

/* ── Progresso: cor ──────────────────────────────────────── */
function progressColor(pct, status) {
  if (status === 'concluida') return '#22c55e';
  if (status === 'cancelada') return '#94a3b8';
  if (status === 'paralizada') return '#f59e0b';
  if (pct >= 75) return '#22c55e';
  if (pct >= 40) return '#f97316';
  return '#ef4444';
}

/* ── Render principal ────────────────────────────────────── */
function getFilteredObras() {
  let list = [...obras];

  // Filtro por status
  if (currentFilter !== 'todos') {
    list = list.filter(o => o.status === currentFilter);
  }

  // Filtro por busca
  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase();
    list = list.filter(o =>
      o.nome.toLowerCase().includes(q) ||
      (o.cliente || '').toLowerCase().includes(q) ||
      (o.responsavel || '').toLowerCase().includes(q) ||
      (o.cidade || '').toLowerCase().includes(q)
    );
  }

  // Ordenação
  list.sort((a, b) => {
    switch (currentSort) {
      case 'nome':      return a.nome.localeCompare(b.nome);
      case 'nome_desc': return b.nome.localeCompare(a.nome);
      case 'data':      return new Date(b.criado_em || b.criadoEm) - new Date(a.criado_em || a.criadoEm);
      case 'pct_desc':  return b.progresso - a.progresso;
      case 'orc_desc':  return (b.orcamento || 0) - (a.orcamento || 0);
      default:          return 0;
    }
  });

  return list;
}

function renderObras() {
  const container = document.getElementById('obrasContainer');
  const emptyState = document.getElementById('emptyState');
  const resultCount = document.getElementById('resultCount');

  const list = getFilteredObras();

  if (list.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    resultCount.textContent = '0 obras encontradas';
    return;
  }

  emptyState.classList.add('hidden');
  resultCount.textContent = `${list.length} obra${list.length !== 1 ? 's' : ''} encontrada${list.length !== 1 ? 's' : ''}`;

  if (currentView === 'grid') {
    container.classList.remove('list-view');
    container.innerHTML = list.map(obra => renderCardGrid(obra)).join('');

    // Animação de entrada
    container.querySelectorAll('.obra-card').forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(16px)';
      setTimeout(() => {
        card.style.transition = 'opacity .35s ease, transform .35s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 60);
    });
  } else {
    container.classList.add('list-view');
    container.innerHTML = `
      <table class="obras-table">
        <thead>
          <tr>
            <th class="col-status">Status</th>
            <th class="col-nome">Obra / Cliente</th>
            <th class="col-cidade">Cidade</th>
            <th class="col-datas">Início</th>
            <th class="col-datas">Entrega</th>
            <th class="col-orc">Orçamento</th>
            <th class="col-prog">Progresso</th>
            <th class="col-acoes">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(o => renderRowList(o)).join('')}
        </tbody>
      </table>
    `;
  }
}

function renderCardGrid(o) {
  const pct = o.percentual || o.progresso || 0;
  const prazo = o.data_prevista || o.prazo || null;
  const pColor = progressColor(pct, o.status);
  const prazoClass = (o.status !== 'concluida' && o.status !== 'cancelada' && isPast(prazo)) ? 'prazo-late' : '';

  return `
    <div class="obra-card" data-id="${o.id}">
      <div class="obra-card-bar bar-${o.status}"></div>
      <div class="obra-card-header">
        <div class="obra-status-badge ${statusClass(o.status)}">
          <i class="fas ${STATUS_ICON[o.status]}"></i>
          ${STATUS_LABEL[o.status]}
        </div>
        <div class="obra-card-actions">
          <button onclick="openModalView(${o.id})" title="Visualizar"><i class="fas fa-eye"></i></button>
          <button onclick="openModalObra(${o.id})" title="Editar"><i class="fas fa-edit"></i></button>
          <button class="btn-danger-sm" onclick="openModalDelete(${o.id})" title="Excluir"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>

      <div class="obra-card-body">
        <h3 class="obra-card-name" title="${o.nome}">${o.nome}</h3>
        ${o.cliente ? `<p class="obra-card-client"><i class="fas fa-user"></i> ${o.cliente}</p>` : ''}
        ${o.cidade ? `<p class="obra-card-city"><i class="fas fa-map-marker-alt"></i> ${o.cidade}</p>` : ''}
      </div>

      <div class="obra-card-progress">
        <div class="progress-header">
          <span>Progresso</span>
          <span style="font-weight:700;color:${pColor}">${pct}%</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${pct}%;background:${pColor}"></div>
        </div>
      </div>

      <div class="obra-card-footer">
        <div class="obra-meta-item">
          <i class="fas fa-calendar-alt"></i>
          <span class="${prazoClass}">${prazo ? formatDate(prazo.split('T')[0]) : '—'}</span>
        </div>
        <div class="obra-meta-item">
          <i class="fas fa-dollar-sign"></i>
          <span>${o.orcamento ? 'R$ ' + Number(o.orcamento / 1000).toFixed(0) + 'k' : '—'}</span>
        </div>
      </div>
    </div>
  `;
}

function renderRowList(o) {
  const pct    = o.percentual || o.progresso || 0;
  const inicio = o.data_inicio   || o.inicio   || null;
  const prazo  = o.data_prevista || o.prazo    || null;
  const pColor = progressColor(pct, o.status);
  const late   = o.status !== 'concluida' && o.status !== 'cancelada' && isPast(prazo);

  return `
    <tr class="obra-row bar-${o.status}" data-id="${o.id}">
      <td class="col-status">
        <span class="obra-status-badge ${statusClass(o.status)}">
          <i class="fas ${STATUS_ICON[o.status]}"></i>
          ${STATUS_LABEL[o.status]}
        </span>
      </td>
      <td class="col-nome">
        <div class="row-nome">${o.nome}</div>
        ${o.cliente ? `<div class="row-cliente"><i class="fas fa-user"></i> ${o.cliente}</div>` : ''}
      </td>
      <td class="col-cidade">
        ${o.cidade ? `<span class="row-cidade"><i class="fas fa-map-marker-alt"></i> ${o.cidade}</span>` : '<span class="row-empty">—</span>'}
      </td>
      <td class="col-datas">
        <span class="row-data">${inicio ? formatDate(inicio.split('T')[0]) : '—'}</span>
      </td>
      <td class="col-datas">
        <span class="row-data ${late ? 'row-data-late' : ''}">${prazo ? formatDate(prazo.split('T')[0]) : '—'}</span>
      </td>
      <td class="col-orc">
        <span class="row-orc">${o.orcamento ? formatCurrency(o.orcamento) : '—'}</span>
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
        <div class="obra-card-actions">
          <button onclick="openModalView(${o.id})" title="Visualizar"><i class="fas fa-eye"></i></button>
          <button onclick="openModalObra(${o.id})" title="Editar"><i class="fas fa-edit"></i></button>
          <button class="btn-danger-sm" onclick="openModalDelete(${o.id})" title="Excluir"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    </tr>
  `;
}

/* ── Tab counts ──────────────────────────────────────────── */
function updateTabCounts() {
  const total = obras.length;
  document.getElementById('cnt-todos').textContent = total;

  const statuses = ['em_andamento', 'planejamento', 'paralizada', 'concluida', 'atrasada', 'cancelada'];
  statuses.forEach(s => {
    const el = document.getElementById('cnt-' + s);
    if (el) el.textContent = obras.filter(o => o.status === s).length;
  });

  const badge = document.getElementById('obrasCount');
  if (badge) badge.textContent = total;

  const subtitle = document.getElementById('obrasSubtitle');
  if (subtitle) {
    const em = obras.filter(o => o.status === 'em_andamento').length;
    subtitle.textContent = `${total} obra${total !== 1 ? 's' : ''} cadastrada${total !== 1 ? 's' : ''} · ${em} em andamento`;
  }
}

/* ── Filtros e controles ─────────────────────────────────── */
function setStatusFilter(status, el) {
  currentFilter = status;
  document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderObras();
}

function setView(v) {
  currentView = v;
  document.getElementById('btnGrid').classList.toggle('active', v === 'grid');
  document.getElementById('btnList').classList.toggle('active', v === 'list');
  renderObras();
}

function sortObras(value) {
  currentSort = value;
  renderObras();
}

function searchObras(value) {
  currentSearch = value;
  renderObras();
}

/* ── Modal Obra: Abrir / Fechar ──────────────────────────── */
function openModalObra(id = null) {
  editingId = id;
  const modal = document.getElementById('modalObra');
  const title = document.getElementById('modalObraTitle');

  populateSelects();

  if (id) {
    const obra = obras.find(o => o.id === id);
    if (!obra) return;
    title.innerHTML = '<i class="fas fa-edit"></i> Editar Obra';
    fillForm(obra);
  } else {
    title.innerHTML = '<i class="fas fa-hard-hat"></i> Nova Obra';
    clearForm();
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('obraNome')?.focus(), 150);
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.modal-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.remove('hidden');
  document.getElementById('btn-' + tabId).classList.add('active');
}

function closeModalObra() {
  document.getElementById('modalObra').classList.add('hidden');
  document.body.style.overflow = '';
  editingId = null;
  switchTab('tab-ident');
}

function fillForm(o) {
  document.getElementById('obraNome').value       = o.nome       || '';
  document.getElementById('obraCliente').value    = o.cliente    || '';
  document.getElementById('obraResponsavel').value = o.responsavel || '';
  document.getElementById('obraStatus').value     = o.status     || 'planejamento';
  document.getElementById('obraSistema').value    = o.sistema    || '';
  document.getElementById('obraCobertura').value  = o.cobertura  || '';
  document.getElementById('obraArea').value       = o.area       || '';
  document.getElementById('obraInicio').value     = (o.data_inicio     || o.inicio     || '').split('T')[0];
  document.getElementById('obraPrazo').value      = (o.data_prevista   || o.prazo      || '').split('T')[0];
  document.getElementById('obraOrcamento').value  = o.orcamento  ? Number(o.orcamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
  document.getElementById('obraEndereco').value   = o.endereco   || '';
  document.getElementById('obraCidade').value     = o.cidade     || '';
  document.getElementById('obraDescricao').value  = o.descricao  || '';
}

function clearForm() {
  ['obraNome','obraCliente','obraResponsavel','obraArea','obraInicio',
   'obraPrazo','obraOrcamento','obraEndereco','obraCidade','obraDescricao'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('obraStatus').value    = 'planejamento';
  document.getElementById('obraSistema').value   = '';
  document.getElementById('obraCobertura').value = '';
}

function populateSelects() {
  const selSistema   = document.getElementById('obraSistema');
  const selCobertura = document.getElementById('obraCobertura');

  const prevSistema   = selSistema.value;
  const prevCobertura = selCobertura.value;

  selSistema.innerHTML = '<option value="">Selecione...</option>' +
    sistemas.map(s => `<option value="${s}">${s}</option>`).join('');

  selCobertura.innerHTML = '<option value="">Selecione...</option>' +
    coberturas.map(c => `<option value="${c}">${c}</option>`).join('');

  if (prevSistema)   selSistema.value   = prevSistema;
  if (prevCobertura) selCobertura.value = prevCobertura;
}

/* ── Salvar Obra ─────────────────────────────────────────── */
async function saveObra() {
  const nome = document.getElementById('obraNome').value.trim();
  if (!nome) {
    showToast('Informe o nome da obra.', 'error');
    document.getElementById('obraNome').focus();
    return;
  }

  const orcamentoRaw = document.getElementById('obraOrcamento').value.replace(/\./g, '').replace(',', '.');
  const orcamento    = parseFloat(orcamentoRaw) || 0;

  const payload = {
    nome,
    cliente:       document.getElementById('obraCliente').value.trim(),
    status:        document.getElementById('obraStatus').value,
    data_inicio:   document.getElementById('obraInicio').value || null,
    data_prevista: document.getElementById('obraPrazo').value || null,
    orcamento,
    endereco:      document.getElementById('obraEndereco').value.trim(),
    cidade:        document.getElementById('obraCidade').value.trim(),
    descricao:     document.getElementById('obraDescricao').value.trim()
  };

  const btn = document.getElementById('btnSaveObra');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  try {
    if (editingId) {
      await apiObras('PUT', `/obras/${editingId}`, payload);
      showToast('Obra atualizada com sucesso!', 'success');
    } else {
      await apiObras('POST', '/obras', payload);
      showToast('Obra cadastrada com sucesso!', 'success');
    }
    obras = await apiObras('GET', '/obras');
    updateTabCounts();
    renderObras();
    closeModalObra();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Salvar Obra';
  }
}

/* ── Modal View ──────────────────────────────────────────── */
function openModalView(id) {
  const obra = obras.find(o => o.id === id);
  if (!obra) return;
  viewingId = id;

  const pct    = obra.percentual || obra.progresso || 0;
  const pColor = progressColor(pct, obra.status);

  document.getElementById('viewTitle').innerHTML = `<i class="fas fa-hard-hat"></i> ${obra.nome}`;
  document.getElementById('viewBody').innerHTML = `
    <div class="view-hero">
      <div class="obra-card-bar bar-${obra.status}" style="position:static;height:6px;border-radius:4px;margin-bottom:18px"></div>
      <div class="view-header-row">
        <div>
          <h2 style="font-size:1.4rem;font-weight:800;color:var(--dark);margin:0 0 6px">${obra.nome}</h2>
          <span class="obra-status-badge ${statusClass(obra.status)} badge-lg">
            <i class="fas ${STATUS_ICON[obra.status]}"></i> ${STATUS_LABEL[obra.status]}
          </span>
        </div>
        <div class="view-progress-circle">
          <svg viewBox="0 0 60 60" width="70" height="70">
            <circle cx="30" cy="30" r="24" fill="none" stroke="#e2e8f0" stroke-width="6"/>
            <circle cx="30" cy="30" r="24" fill="none" stroke="${pColor}" stroke-width="6"
              stroke-dasharray="${2 * Math.PI * 24 * pct / 100} ${2 * Math.PI * 24 * (1 - pct / 100)}"
              stroke-linecap="round" transform="rotate(-90 30 30)"/>
            <text x="30" y="34" text-anchor="middle" font-size="11" font-weight="700" fill="${pColor}">${pct}%</text>
          </svg>
        </div>
      </div>
    </div>
    <div class="view-grid">
      ${viewRow('Usuário / Cliente', obra.cliente)}
      ${viewRow('Responsável', obra.responsavel)}
      ${viewRow('Sistema Construtivo', obra.sistema)}
      ${viewRow('Tipo de Cobertura', obra.cobertura)}
      ${viewRow('Área Construída', obra.area ? Number(obra.area).toLocaleString('pt-BR') + ' m²' : null)}
      ${viewRow('Data de Início', formatDate((obra.data_inicio || obra.inicio || '').split('T')[0]))}
      ${viewRow('Previsão de Entrega', formatDate((obra.data_prevista || obra.prazo || '').split('T')[0]))}
      ${viewRow('Orçamento Total', formatCurrency(obra.orcamento))}
      ${viewRow('Endereço', obra.endereco)}
      ${viewRow('Cidade', obra.cidade)}
    </div>
    ${obra.descricao ? `
      <div class="view-obs">
        <strong><i class="fas fa-sticky-note" style="color:var(--primary)"></i> Observações</strong>
        <p>${obra.descricao}</p>
      </div>` : ''}
  `;

  document.getElementById('modalView').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function viewRow(label, value) {
  if (!value || value === '—') return '';
  return `
    <div class="view-row">
      <span class="view-label">${label}</span>
      <span class="view-value">${value}</span>
    </div>
  `;
}

function closeModalView() {
  document.getElementById('modalView').classList.add('hidden');
  document.body.style.overflow = '';
  viewingId = null;
}

function editFromView() {
  const id = viewingId;
  closeModalView();
  openModalObra(id);
}

/* ── Modal Delete ────────────────────────────────────────── */
function openModalDelete(id) {
  const obra = obras.find(o => o.id === id);
  if (!obra) return;
  deletingId = id;
  document.getElementById('deleteObraName').textContent = obra.nome;
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
    await apiObras('DELETE', `/obras/${deletingId}`);
    obras = await apiObras('GET', '/obras');
    updateTabCounts();
    renderObras();
    closeModalDelete();
    showToast('Obra excluída com sucesso.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-trash-alt"></i> Sim, excluir';
  }
}

/* ── Popup Sistema Construtivo ───────────────────────────── */
function openPopupSistema() {
  renderPopupTags('listSistemas', sistemas, deleteSistema);
  document.getElementById('newSistema').value = '';
  document.getElementById('popupSistema').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('newSistema')?.focus(), 150);
}

function closePopupSistema() {
  document.getElementById('popupSistema').classList.add('hidden');
  document.body.style.overflow = 'hidden'; // mantém overflow para modal principal se aberto
  const modalObra = document.getElementById('modalObra');
  if (modalObra.classList.contains('hidden')) {
    document.body.style.overflow = '';
  }
}

function saveSistema() {
  const val = document.getElementById('newSistema').value.trim();
  if (!val) {
    showToast('Informe o nome do sistema construtivo.', 'error');
    return;
  }
  if (sistemas.includes(val)) {
    showToast('Este sistema já está cadastrado.', 'error');
    return;
  }
  sistemas.push(val);
  saveSistemas();
  populateSelects();
  document.getElementById('obraSistema').value = val;
  renderPopupTags('listSistemas', sistemas, deleteSistema);
  document.getElementById('newSistema').value = '';
  showToast(`"${val}" adicionado!`, 'success');
}

function deleteSistema(val) {
  sistemas = sistemas.filter(s => s !== val);
  saveSistemas();
  populateSelects();
  renderPopupTags('listSistemas', sistemas, deleteSistema);
}

/* ── Popup Tipo de Cobertura ─────────────────────────────── */
function openPopupCobertura() {
  renderPopupTags('listCoberturas', coberturas, deleteCobertura);
  document.getElementById('newCobertura').value = '';
  document.getElementById('popupCobertura').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('newCobertura')?.focus(), 150);
}

function closePopupCobertura() {
  document.getElementById('popupCobertura').classList.add('hidden');
  const modalObra = document.getElementById('modalObra');
  if (modalObra.classList.contains('hidden')) {
    document.body.style.overflow = '';
  }
}

function saveCobertura() {
  const val = document.getElementById('newCobertura').value.trim();
  if (!val) {
    showToast('Informe o tipo de cobertura.', 'error');
    return;
  }
  if (coberturas.includes(val)) {
    showToast('Este tipo já está cadastrado.', 'error');
    return;
  }
  coberturas.push(val);
  saveCoberturas();
  populateSelects();
  document.getElementById('obraCobertura').value = val;
  renderPopupTags('listCoberturas', coberturas, deleteCobertura);
  document.getElementById('newCobertura').value = '';
  showToast(`"${val}" adicionado!`, 'success');
}

function deleteCobertura(val) {
  coberturas = coberturas.filter(c => c !== val);
  saveCoberturas();
  populateSelects();
  renderPopupTags('listCoberturas', coberturas, deleteCobertura);
}

/* ── Render popup tags ───────────────────────────────────── */
function renderPopupTags(containerId, list, onDelete) {
  const el = document.getElementById(containerId);
  if (!list.length) {
    el.innerHTML = '<span style="font-size:.82rem;color:var(--gray);font-style:italic">Nenhum cadastrado ainda.</span>';
    return;
  }
  el.innerHTML = list.map(item => `
    <span class="popup-tag">
      ${item}
      <button onclick="(${onDelete.name})('${item.replace(/'/g, "\\'")}')">
        <i class="fas fa-times"></i>
      </button>
    </span>
  `).join('');
}

/* ── Export placeholder ──────────────────────────────────── */
function exportObras() {
  showToast('Exportação disponível na versão Pro.', 'info');
}

/* ── Toast ───────────────────────────────────────────────── */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const colors = {
    success: '#22c55e',
    error:   '#ef4444',
    info:    '#f97316',
    warning: '#f59e0b'
  };
  const icons = {
    success: 'fa-check-circle',
    error:   'fa-exclamation-circle',
    info:    'fa-info-circle',
    warning: 'fa-exclamation-triangle'
  };

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

/* ── Sidebar ─────────────────────────────────────────────── */
function toggleNavGroup(groupId) {
  const group = document.getElementById(groupId);
  if (group) group.classList.toggle('open');
}

function initSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const toggle   = document.getElementById('sidebarToggle');
  const menuBtn  = document.getElementById('menuBtn');
  const overlay  = document.getElementById('sidebarOverlay');
  const wrapper  = document.getElementById('mainWrapper');

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

  if (sidebarName) sidebarName.textContent = user.nome || 'Usuário';
  if (headerName)  headerName.textContent  = user.nome || 'Usuário';
  if (dropName)    dropName.textContent    = user.nome || 'Usuário';
  if (headerComp)  headerComp.textContent  = user.empresa || '';
  if (dropEmail)   dropEmail.textContent   = user.email || '';

  // Trial badge no header
  if (user.trialExpira) {
    const dias = Math.ceil((new Date(user.trialExpira) - new Date()) / 86400000);
    if (dias > 0) {
      const headerRight = document.querySelector('.header-right');
      if (headerRight) {
        const badge = document.createElement('div');
        badge.innerHTML = `
          <div class="trial-badge" title="Período de teste">
            <i class="fas fa-clock"></i>
            <span class="trial-badge-days">${dias} dias</span>
            <span class="trial-badge-label">de teste</span>
          </div>
          <button class="btn-upgrade-sm"><i class="fas fa-rocket"></i> Assinar</button>
        `;
        headerRight.insertAdjacentHTML('afterbegin', badge.innerHTML);
      }
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

/* ── Modal overlays — fechar ao clicar fora ──────────────── */
['modalObra', 'modalView', 'modalDelete', 'popupSistema', 'popupCobertura'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', function(e) {
    if (e.target === this) {
      if (id === 'modalObra')       closeModalObra();
      if (id === 'modalView')       closeModalView();
      if (id === 'modalDelete')     closeModalDelete();
      if (id === 'popupSistema')    closePopupSistema();
      if (id === 'popupCobertura')  closePopupCobertura();
    }
  });
});

/* ── Teclado ─────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModalObra();
    closeModalView();
    closeModalDelete();
    closePopupSistema();
    closePopupCobertura();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('headerSearch')?.focus();
  }
});

/* ── Enter nos popups ────────────────────────────────────── */
document.getElementById('newSistema')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveSistema();
});
document.getElementById('newCobertura')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveCobertura();
});

/* ── Máscara orçamento ───────────────────────────────────── */
document.getElementById('obraOrcamento')?.addEventListener('input', function() {
  let v = this.value.replace(/\D/g, '');
  if (!v) { this.value = ''; return; }
  const num = parseInt(v, 10) / 100;
  this.value = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});

/* ── Toast animation ─────────────────────────────────────── */
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  @keyframes slideInToast {
    from { opacity:0; transform: translateX(40px); }
    to   { opacity:1; transform: translateX(0); }
  }
  @keyframes fadeOutToast {
    to { opacity:0; transform: translateX(40px); }
  }
  .prazo-late { color: var(--error) !important; font-weight: 700; }
`;
document.head.appendChild(toastStyles);

/* ══════════════════════════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  loadUserInfo();
  initSidebar();

  renderSidebar('obras');
  await loadStorage();
  populateSelects();
  updateTabCounts();
  renderObras();
});
