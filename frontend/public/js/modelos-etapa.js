/* ═══════════════════════════════════════════════════════════
   SISENG — Modelos de Etapa CRUD  v1.0
═══════════════════════════════════════════════════════════ */

/* ── Tipos padrão (sincronizados com etapas.js) ─────────── */
const TIPOS = [
  { id: 't1',  nome: 'Terraplanagem',           icone: 'fa-mountain',    cor: '#64748b' },
  { id: 't2',  nome: 'Fundação',                icone: 'fa-cube',        cor: '#f97316' },
  { id: 't3',  nome: 'Estrutura',               icone: 'fa-building',    cor: '#2563eb' },
  { id: 't4',  nome: 'Alvenaria',               icone: 'fa-border-all',  cor: '#8b5cf6' },
  { id: 't5',  nome: 'Cobertura',               icone: 'fa-home',        cor: '#0ea5e9' },
  { id: 't6',  nome: 'Instalações Elétricas',   icone: 'fa-bolt',        cor: '#f59e0b' },
  { id: 't7',  nome: 'Instalações Hidráulicas', icone: 'fa-tint',        cor: '#0ea5e9' },
  { id: 't8',  nome: 'Instalações de Gás',      icone: 'fa-fire',        cor: '#ef4444' },
  { id: 't9',  nome: 'Revestimento Interno',    icone: 'fa-th-large',    cor: '#22c55e' },
  { id: 't10', nome: 'Revestimento Externo',    icone: 'fa-th-large',    cor: '#16a34a' },
  { id: 't11', nome: 'Esquadrias',              icone: 'fa-door-open',   cor: '#8b5cf6' },
  { id: 't12', nome: 'Pintura',                 icone: 'fa-paint-roller',cor: '#f97316' },
  { id: 't13', nome: 'Acabamentos',             icone: 'fa-star',        cor: '#f59e0b' },
  { id: 't14', nome: 'Paisagismo',              icone: 'fa-leaf',        cor: '#22c55e' },
  { id: 't15', nome: 'Limpeza Final',           icone: 'fa-broom',       cor: '#64748b' },
];

/* ── Modelos padrão ──────────────────────────────────────── */
const MODELOS_DEFAULT = [
  { id: 'me1',  nome: 'Terraplanagem e Limpeza do Terreno', tipoId: 't1',  descricao: 'Limpeza, nivelamento e preparação do terreno para início da obra.', duracao: 15, ativo: true },
  { id: 'me2',  nome: 'Execução de Fundação',               tipoId: 't2',  descricao: 'Fundação em radier, estacas ou sapatas conforme projeto estrutural.', duracao: 30, ativo: true },
  { id: 'me3',  nome: 'Concretagem de Estrutura',           tipoId: 't3',  descricao: 'Estrutura em concreto armado — pilares, vigas e lajes.', duracao: 60, ativo: true },
  { id: 'me4',  nome: 'Montagem de Estrutura Metálica',     tipoId: 't3',  descricao: 'Montagem de perfis metálicos soldados e parafusados.', duracao: 45, ativo: true },
  { id: 'me5',  nome: 'Alvenaria de Vedação',               tipoId: 't4',  descricao: 'Alvenaria em bloco cerâmico ou concreto — todos os pavimentos.', duracao: 40, ativo: true },
  { id: 'me6',  nome: 'Execução de Cobertura',              tipoId: 't5',  descricao: 'Instalação de telhado, telhas e calhas conforme projeto.', duracao: 20, ativo: true },
  { id: 'me7',  nome: 'Instalações Elétricas',              tipoId: 't6',  descricao: 'Passagem de eletrodutos, fiação e quadros elétricos.', duracao: 30, ativo: true },
  { id: 'me8',  nome: 'Instalações Hidráulicas',            tipoId: 't7',  descricao: 'Instalação de tubulações de água fria, quente e esgoto.', duracao: 25, ativo: true },
  { id: 'me9',  nome: 'Instalações de Gás',                 tipoId: 't8',  descricao: 'Instalação e teste de rede de gás conforme norma ABNT.', duracao: 10, ativo: true },
  { id: 'me10', nome: 'Revestimento Interno',               tipoId: 't9',  descricao: 'Chapisco, emboço e reboco interno + azulejos em áreas molhadas.', duracao: 35, ativo: true },
  { id: 'me11', nome: 'Revestimento de Fachada',            tipoId: 't10', descricao: 'Revestimento externo em cerâmica, textura ou pastilha.', duracao: 30, ativo: true },
  { id: 'me12', nome: 'Instalação de Esquadrias',           tipoId: 't11', descricao: 'Colocação de portas, janelas e caixilhos.', duracao: 15, ativo: true },
  { id: 'me13', nome: 'Pintura Interna',                    tipoId: 't12', descricao: 'Massa corrida, selador e aplicação de tinta em ambientes internos.', duracao: 20, ativo: true },
  { id: 'me14', nome: 'Pintura Externa',                    tipoId: 't12', descricao: 'Tratamento e aplicação de pintura na fachada.', duracao: 15, ativo: true },
  { id: 'me15', nome: 'Acabamentos e Louças',               tipoId: 't13', descricao: 'Rodapés, soleiras, louças sanitárias, metais e acabamentos finais.', duracao: 20, ativo: true },
  { id: 'me16', nome: 'Paisagismo e Jardins',               tipoId: 't14', descricao: 'Implantação de gramado, jardins, canteiros e irrigação.', duracao: 10, ativo: true },
  { id: 'me17', nome: 'Limpeza Final de Obra',              tipoId: 't15', descricao: 'Limpeza pós-obra completa para entrega ao cliente.', duracao: 5,  ativo: true },
];

/* ── Estado ──────────────────────────────────────────────── */
let modelos = [];
let filteredModelos = [];
let editingId = null;
let deletingId = null;
let searchTerm = '';

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadStorage();
  populateTiposFilter();
  populateTiposSelect();
  applyFilters();
  updateStats();
  initSidebar();

  renderSidebar('modelos');
  initPreviewListeners();
  document.getElementById('fAtivo').addEventListener('change', function () {
    document.getElementById('toggleLabel').textContent = this.checked ? 'Ativo' : 'Inativo';
  });
});

/* ── Persistência ────────────────────────────────────────── */
function loadStorage() {
  const saved = localStorage.getItem('modelos_etapa');
  modelos = saved ? JSON.parse(saved) : [...MODELOS_DEFAULT];
}

function saveStorage() {
  localStorage.setItem('modelos_etapa', JSON.stringify(modelos));
}

/* ── Selects ─────────────────────────────────────────────── */
function populateTiposFilter() {
  const sel = document.getElementById('filterTipo');
  TIPOS.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.nome;
    sel.appendChild(opt);
  });
}

function populateTiposSelect() {
  const sel = document.getElementById('fTipo');
  sel.innerHTML = '<option value="">Selecione...</option>';
  TIPOS.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.nome;
    sel.appendChild(opt);
  });
}

/* ── Filtros e Renderização ──────────────────────────────── */
function filterModelos(term) {
  searchTerm = term;
  applyFilters();
}

function applyFilters() {
  const tipoFiltro   = document.getElementById('filterTipo').value;
  const statusFiltro = document.getElementById('filterStatus').value;

  filteredModelos = modelos.filter(m => {
    const matchSearch = !searchTerm ||
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchTipo = !tipoFiltro || m.tipoId === tipoFiltro;

    const matchStatus = !statusFiltro ||
      (statusFiltro === 'ativo' && m.ativo) ||
      (statusFiltro === 'inativo' && !m.ativo);

    return matchSearch && matchTipo && matchStatus;
  });

  renderTable();
  updateCount();
}

function renderTable() {
  const tbody = document.getElementById('modelosTableBody');
  const empty = document.getElementById('meEmpty');

  if (filteredModelos.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = filteredModelos.map(m => {
    const tipo = TIPOS.find(t => t.id === m.tipoId) || { nome: '—', icone: 'fa-tag', cor: '#94a3b8' };
    const badgeStyle = `background:${tipo.cor}20; color:${tipo.cor}`;
    const statusBadge = m.ativo
      ? '<span class="badge-ativo"><i class="fas fa-circle" style="font-size:.5rem"></i> Ativo</span>'
      : '<span class="badge-inativo"><i class="fas fa-circle" style="font-size:.5rem"></i> Inativo</span>';

    return `
      <tr>
        <td>
          <span class="tipo-badge" style="${badgeStyle}">
            <i class="fas ${tipo.icone}"></i>
            ${tipo.nome}
          </span>
        </td>
        <td>
          <div class="modelo-nome">${m.nome}</div>
          ${m.duracao ? `<div class="modelo-desc"><i class="fas fa-clock" style="font-size:.7rem"></i> ${m.duracao} dias estimados</div>` : ''}
        </td>
        <td>
          <div class="modelo-desc">${m.descricao || '—'}</div>
        </td>
        <td>${statusBadge}</td>
        <td>
          <div class="me-actions">
            <button class="btn-edit-row" title="Editar" onclick="openModal('${m.id}')">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn-toggle-row" title="${m.ativo ? 'Desativar' : 'Ativar'}" onclick="toggleAtivo('${m.id}')">
              <i class="fas fa-${m.ativo ? 'eye-slash' : 'eye'}"></i>
            </button>
            <button class="btn-del-row" title="Excluir" onclick="openDelete('${m.id}')">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateCount() {
  document.getElementById('meCount').textContent =
    `${filteredModelos.length} modelo${filteredModelos.length !== 1 ? 's' : ''}`;
}

function updateStats() {
  document.getElementById('statTotal').textContent = modelos.length;
  document.getElementById('statAtivos').textContent = modelos.filter(m => m.ativo).length;
  const tiposUsados = new Set(modelos.map(m => m.tipoId)).size;
  document.getElementById('statTipos').textContent = tiposUsados;
}

/* ── Preview ao vivo ─────────────────────────────────────── */
function initPreviewListeners() {
  document.getElementById('fNome').addEventListener('input', updatePreview);
  document.getElementById('fTipo').addEventListener('change', updatePreview);
}

function updatePreview() {
  const nome  = document.getElementById('fNome').value.trim() || 'Nome do Modelo';
  const tipoId = document.getElementById('fTipo').value;
  const tipo  = TIPOS.find(t => t.id === tipoId);

  document.getElementById('previewNome').textContent = nome;
  document.getElementById('previewTipo').textContent = tipo ? tipo.nome : 'Tipo de Etapa';

  const icon = document.getElementById('previewIcon');
  if (tipo) {
    icon.innerHTML = `<i class="fas ${tipo.icone}"></i>`;
    icon.style.background = tipo.cor + '20';
    icon.style.color = tipo.cor;
  } else {
    icon.innerHTML = '<i class="fas fa-cube"></i>';
    icon.style.background = '';
    icon.style.color = '';
  }
}

/* ── Modal Criar / Editar ────────────────────────────────── */
function openModal(id = null) {
  editingId = id;
  populateTiposSelect();

  if (id) {
    const m = modelos.find(x => x.id === id);
    if (!m) return;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-pen"></i> Editar Modelo';
    document.getElementById('modeloId').value   = m.id;
    document.getElementById('fNome').value      = m.nome;
    document.getElementById('fTipo').value      = m.tipoId;
    document.getElementById('fDescricao').value = m.descricao || '';
    document.getElementById('fDuracao').value   = m.duracao || '';
    document.getElementById('fAtivo').checked   = m.ativo;
    document.getElementById('toggleLabel').textContent = m.ativo ? 'Ativo' : 'Inativo';
  } else {
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> Novo Modelo de Etapa';
    document.getElementById('modeloId').value   = '';
    document.getElementById('fNome').value      = '';
    document.getElementById('fTipo').value      = '';
    document.getElementById('fDescricao').value = '';
    document.getElementById('fDuracao').value   = '';
    document.getElementById('fAtivo').checked   = true;
    document.getElementById('toggleLabel').textContent = 'Ativo';
  }

  updatePreview();
  document.getElementById('modalOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('fNome').focus(), 100);
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.add('hidden');
  editingId = null;
}

function saveModelo() {
  const nome    = document.getElementById('fNome').value.trim();
  const tipoId  = document.getElementById('fTipo').value;
  const desc    = document.getElementById('fDescricao').value.trim();
  const duracao = parseInt(document.getElementById('fDuracao').value) || null;
  const ativo   = document.getElementById('fAtivo').checked;

  if (!nome) { showToast('Informe o nome do modelo.', 'error'); document.getElementById('fNome').focus(); return; }
  if (!tipoId) { showToast('Selecione o tipo de etapa.', 'error'); document.getElementById('fTipo').focus(); return; }

  const btn = document.getElementById('btnSave');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  setTimeout(() => {
    if (editingId) {
      const idx = modelos.findIndex(m => m.id === editingId);
      modelos[idx] = { ...modelos[idx], nome, tipoId, descricao: desc, duracao, ativo };
      showToast('Modelo atualizado com sucesso!', 'success');
    } else {
      modelos.push({
        id: 'me' + Date.now(),
        nome, tipoId, descricao: desc, duracao, ativo,
        criadoEm: new Date().toISOString().split('T')[0]
      });
      showToast('Modelo criado com sucesso!', 'success');
    }

    saveStorage();
    applyFilters();
    updateStats();
    document.getElementById('modalOverlay').classList.add('hidden');
    editingId = null;
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Salvar Modelo';
  }, 400);
}

/* ── Toggle Ativo ────────────────────────────────────────── */
function toggleAtivo(id) {
  const m = modelos.find(x => x.id === id);
  if (!m) return;
  m.ativo = !m.ativo;
  saveStorage();
  applyFilters();
  updateStats();
  showToast(m.ativo ? 'Modelo ativado.' : 'Modelo desativado.', 'success');
}

/* ── Modal Deletar ───────────────────────────────────────── */
function openDelete(id) {
  const m = modelos.find(x => x.id === id);
  if (!m) return;
  deletingId = id;
  document.getElementById('deleteNome').textContent = `"${m.nome}"`;
  document.getElementById('deleteOverlay').classList.remove('hidden');
}

function closeDelete(e) {
  if (e && e.target !== document.getElementById('deleteOverlay')) return;
  document.getElementById('deleteOverlay').classList.add('hidden');
  deletingId = null;
}

function confirmDelete() {
  modelos = modelos.filter(m => m.id !== deletingId);
  saveStorage();
  applyFilters();
  updateStats();
  document.getElementById('deleteOverlay').classList.add('hidden');
  deletingId = null;
  showToast('Modelo excluído.', 'success');
}

/* ── Toast ───────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
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
