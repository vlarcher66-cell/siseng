/* ═══════════════════════════════════════════════════════════
   SISENG — Modelos de Etapa  v2.0 (API)
═══════════════════════════════════════════════════════════ */

const TIPOS = [
  { nome: 'Terraplanagem',             icone: 'fa-mountain',    cor: '#64748b' },
  { nome: 'Fundação',                  icone: 'fa-cube',        cor: '#f97316' },
  { nome: 'Estrutura',                 icone: 'fa-building',    cor: '#2563eb' },
  { nome: 'Alvenaria',                 icone: 'fa-border-all',  cor: '#8b5cf6' },
  { nome: 'Cobertura',                 icone: 'fa-home',        cor: '#0ea5e9' },
  { nome: 'Instalações Elétricas',     icone: 'fa-bolt',        cor: '#f59e0b' },
  { nome: 'Instalações Hidráulicas',   icone: 'fa-tint',        cor: '#0ea5e9' },
  { nome: 'Instalações de Gás',        icone: 'fa-fire',        cor: '#ef4444' },
  { nome: 'Revestimento Interno',      icone: 'fa-th-large',    cor: '#22c55e' },
  { nome: 'Revestimento Externo',      icone: 'fa-th-large',    cor: '#16a34a' },
  { nome: 'Esquadrias',                icone: 'fa-door-open',   cor: '#8b5cf6' },
  { nome: 'Pintura',                   icone: 'fa-paint-roller', cor: '#f97316' },
  { nome: 'Acabamentos',               icone: 'fa-star',        cor: '#f59e0b' },
  { nome: 'Paisagismo',                icone: 'fa-leaf',        cor: '#22c55e' },
  { nome: 'Limpeza Final',             icone: 'fa-broom',       cor: '#64748b' },
];

const MODELOS_DEFAULT = [
  { nome: 'Terraplanagem e Limpeza do Terreno', tipo: 'Terraplanagem',           descricao: 'Limpeza, nivelamento e preparação do terreno.', duracao: 15 },
  { nome: 'Execução de Fundação',               tipo: 'Fundação',                descricao: 'Fundação em radier, estacas ou sapatas conforme projeto.', duracao: 30 },
  { nome: 'Concretagem de Estrutura',           tipo: 'Estrutura',               descricao: 'Pilares, vigas e lajes em concreto armado.', duracao: 60 },
  { nome: 'Montagem de Estrutura Metálica',     tipo: 'Estrutura',               descricao: 'Montagem de perfis metálicos soldados e parafusados.', duracao: 45 },
  { nome: 'Alvenaria de Vedação',               tipo: 'Alvenaria',               descricao: 'Alvenaria em bloco cerâmico ou concreto.', duracao: 40 },
  { nome: 'Execução de Cobertura',              tipo: 'Cobertura',               descricao: 'Instalação de telhado, telhas e calhas.', duracao: 20 },
  { nome: 'Instalações Elétricas',              tipo: 'Instalações Elétricas',   descricao: 'Eletrodutos, fiação e quadros elétricos.', duracao: 30 },
  { nome: 'Instalações Hidráulicas',            tipo: 'Instalações Hidráulicas', descricao: 'Tubulações de água fria, quente e esgoto.', duracao: 25 },
  { nome: 'Revestimento Interno',               tipo: 'Revestimento Interno',    descricao: 'Chapisco, emboço, reboco e azulejos.', duracao: 35 },
  { nome: 'Revestimento de Fachada',            tipo: 'Revestimento Externo',    descricao: 'Revestimento externo em cerâmica ou textura.', duracao: 30 },
  { nome: 'Instalação de Esquadrias',           tipo: 'Esquadrias',              descricao: 'Portas, janelas e caixilhos.', duracao: 15 },
  { nome: 'Pintura Interna',                    tipo: 'Pintura',                 descricao: 'Massa corrida, selador e tinta interna.', duracao: 20 },
  { nome: 'Pintura Externa',                    tipo: 'Pintura',                 descricao: 'Tratamento e pintura da fachada.', duracao: 15 },
  { nome: 'Acabamentos e Louças',               tipo: 'Acabamentos',             descricao: 'Rodapés, louças sanitárias e metais.', duracao: 20 },
  { nome: 'Limpeza Final de Obra',              tipo: 'Limpeza Final',           descricao: 'Limpeza pós-obra para entrega ao cliente.', duracao: 5  },
];

let modelos = [];
let filteredModelos = [];
let editingId = null;
let deletingId = null;
let searchTerm = '';

/* ── Auth / API ──────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token') || '';
}

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res  = await fetch(`${API_BASE}/modelos-etapa${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { localStorage.removeItem('sis_token'); window.location.href = '../index.html'; throw new Error('Não autorizado'); }
  if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
  return data;
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  populateTiposFilter();
  populateTiposSelect();
  initSidebar();
  renderSidebar('modelos');
  initPreviewListeners();
  document.getElementById('fAtivo').addEventListener('change', function () {
    document.getElementById('toggleLabel').textContent = this.checked ? 'Ativo' : 'Inativo';
  });
  await loadModelos();
});

async function loadModelos() {
  try {
    modelos = await api('GET', '');
    // Se empresa nova (sem modelos), semeia os defaults
    if (modelos.length === 0) {
      for (const m of MODELOS_DEFAULT) {
        await api('POST', '', { ...m, ativo: true }).catch(() => {});
      }
      modelos = await api('GET', '');
    }
  } catch (e) {
    showToast('Erro ao carregar modelos: ' + e.message, 'error');
  }
  applyFilters();
  updateStats();
}

/* ── Selects ─────────────────────────────────────────────── */
function populateTiposFilter() {
  const sel = document.getElementById('filterTipo');
  TIPOS.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.nome;
    opt.textContent = t.nome;
    sel.appendChild(opt);
  });
}

function populateTiposSelect() {
  const sel = document.getElementById('fTipo');
  sel.innerHTML = '<option value="">Selecione...</option>';
  TIPOS.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.nome;
    opt.textContent = t.nome;
    sel.appendChild(opt);
  });
}

/* ── Filtros e Renderização ──────────────────────────────── */
function filterModelos(term) { searchTerm = term; applyFilters(); }

function applyFilters() {
  const tipoFiltro   = document.getElementById('filterTipo').value;
  const statusFiltro = document.getElementById('filterStatus').value;
  filteredModelos = modelos.filter(m => {
    const matchSearch = !searchTerm ||
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo   = !tipoFiltro   || m.tipo === tipoFiltro;
    const matchStatus = !statusFiltro ||
      (statusFiltro === 'ativo'   && m.ativo) ||
      (statusFiltro === 'inativo' && !m.ativo);
    return matchSearch && matchTipo && matchStatus;
  });
  renderTable();
  updateCount();
}

function renderTable() {
  const tbody = document.getElementById('modelosTableBody');
  const empty = document.getElementById('meEmpty');
  if (filteredModelos.length === 0) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  tbody.innerHTML = filteredModelos.map(m => {
    const tipo = TIPOS.find(t => t.nome === m.tipo) || { nome: m.tipo, icone: 'fa-tag', cor: '#94a3b8' };
    const badgeStyle  = `background:${tipo.cor}20; color:${tipo.cor}`;
    const statusBadge = m.ativo
      ? '<span class="badge-ativo"><i class="fas fa-circle" style="font-size:.5rem"></i> Ativo</span>'
      : '<span class="badge-inativo"><i class="fas fa-circle" style="font-size:.5rem"></i> Inativo</span>';
    return `
      <tr>
        <td><span class="tipo-badge" style="${badgeStyle}"><i class="fas ${tipo.icone}"></i> ${tipo.nome}</span></td>
        <td>
          <div class="modelo-nome">${m.nome}</div>
          ${m.duracao ? `<div class="modelo-desc"><i class="fas fa-clock" style="font-size:.7rem"></i> ${m.duracao} dias estimados</div>` : ''}
        </td>
        <td><div class="modelo-desc">${m.descricao || '—'}</div></td>
        <td>${statusBadge}</td>
        <td>
          <div class="me-actions">
            <button class="btn-edit-row"   title="Editar"   onclick="openModal(${m.id})"><i class="fas fa-pen"></i></button>
            <button class="btn-toggle-row" title="${m.ativo ? 'Desativar' : 'Ativar'}" onclick="toggleAtivo(${m.id})"><i class="fas fa-${m.ativo ? 'eye-slash' : 'eye'}"></i></button>
            <button class="btn-del-row"    title="Excluir"  onclick="openDelete(${m.id})"><i class="fas fa-trash-alt"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function updateCount() {
  document.getElementById('meCount').textContent = `${filteredModelos.length} modelo${filteredModelos.length !== 1 ? 's' : ''}`;
}

function updateStats() {
  document.getElementById('statTotal').textContent  = modelos.length;
  document.getElementById('statAtivos').textContent = modelos.filter(m => m.ativo).length;
  document.getElementById('statTipos').textContent  = new Set(modelos.map(m => m.tipo)).size;
}

/* ── Preview ─────────────────────────────────────────────── */
function initPreviewListeners() {
  document.getElementById('fNome').addEventListener('input', updatePreview);
  document.getElementById('fTipo').addEventListener('change', updatePreview);
}

function updatePreview() {
  const nome  = document.getElementById('fNome').value.trim() || 'Nome do Modelo';
  const tipoNome = document.getElementById('fTipo').value;
  const tipo  = TIPOS.find(t => t.nome === tipoNome);
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
    document.getElementById('fTipo').value      = m.tipo;
    document.getElementById('fDescricao').value = m.descricao || '';
    document.getElementById('fDuracao').value   = m.duracao || '';
    document.getElementById('fAtivo').checked   = !!m.ativo;
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

async function saveModelo() {
  const nome    = document.getElementById('fNome').value.trim();
  const tipo    = document.getElementById('fTipo').value;
  const descricao = document.getElementById('fDescricao').value.trim();
  const duracao = parseInt(document.getElementById('fDuracao').value) || null;
  const ativo   = document.getElementById('fAtivo').checked;

  if (!nome) { showToast('Informe o nome do modelo.', 'error'); return; }
  if (!tipo) { showToast('Selecione o tipo de etapa.', 'error'); return; }

  const btn = document.getElementById('btnSave');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  try {
    if (editingId) {
      await api('PUT', `/${editingId}`, { nome, tipo, descricao, duracao, ativo });
      showToast('Modelo atualizado!', 'success');
    } else {
      await api('POST', '', { nome, tipo, descricao, duracao, ativo });
      showToast('Modelo criado!', 'success');
    }
    await loadModelos();
    document.getElementById('modalOverlay').classList.add('hidden');
    editingId = null;
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Salvar Modelo';
  }
}

/* ── Toggle Ativo ────────────────────────────────────────── */
async function toggleAtivo(id) {
  const m = modelos.find(x => x.id === id);
  if (!m) return;
  try {
    await api('PUT', `/${id}`, { nome: m.nome, tipo: m.tipo, descricao: m.descricao, duracao: m.duracao, ativo: !m.ativo });
    showToast(m.ativo ? 'Modelo desativado.' : 'Modelo ativado.', 'success');
    await loadModelos();
  } catch (e) { showToast(e.message, 'error'); }
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

async function confirmDelete() {
  try {
    await api('DELETE', `/${deletingId}`);
    showToast('Modelo excluído.', 'success');
    await loadModelos();
    document.getElementById('deleteOverlay').classList.add('hidden');
    deletingId = null;
  } catch (e) { showToast(e.message, 'error'); }
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
function toggleUserMenu() { document.getElementById('userDropdown').classList.toggle('hidden'); }
function handleLogout() { localStorage.removeItem('sis_token'); window.location.href = '../index.html'; }

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
  menuBtn?.addEventListener('click', () => { sidebar.classList.toggle('mobile-open'); overlay.classList.toggle('active'); });
  overlay?.addEventListener('click', () => { sidebar.classList.remove('mobile-open'); overlay.classList.remove('active'); });
  document.addEventListener('click', e => {
    const dd = document.getElementById('userDropdown');
    if (dd && !dd.classList.contains('hidden') && !e.target.closest('.header-user')) dd.classList.add('hidden');
  });
}
