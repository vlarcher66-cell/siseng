/* =========================================================
   itens-compra.js — SISENG
   Itens de Compra
   ========================================================= */

'use strict';

// ── Estado ────────────────────────────────────────────────
let itens      = [];
let grupos     = [];
let subgrupos  = [];
let editingId  = null;
let deletingId = null;

const UNIDADES = ['un', 'kg', 'm²', 'm³', 'L', 'sc', 'hr', 'vb', 'cx', 'pç', 'ml', 't'];

// ── Auth / API ────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token') || '';
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

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
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

// ── Toast ─────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'exclamation-triangle';
  t.innerHTML = `<i class="fas fa-${icon}"></i> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── Sidebar / Header ──────────────────────────────────────
function toggleNavGroup(id) { document.getElementById(id)?.classList.toggle('open'); }
function toggleUserMenu() { document.getElementById('userDropdown').classList.toggle('hidden'); }
function handleLogout() {
  localStorage.removeItem('sis_token');
  localStorage.removeItem('sis_user');
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
    if (dd && !dd.classList.contains('hidden') && !e.target.closest('.header-user'))
      dd.classList.add('hidden');
  });

  const raw = localStorage.getItem('sis_user') || sessionStorage.getItem('sis_user');
  if (raw) {
    const u   = JSON.parse(raw);
    const ini = (u.nome || '?')[0].toUpperCase();
    document.getElementById('sidebarAvatar').textContent = ini;
    document.getElementById('sidebarName').textContent   = u.nome || 'Usuário';
    document.getElementById('headerAvatar').textContent  = ini;
    document.getElementById('headerName').textContent    = u.nome || 'Usuário';
    const hc = document.getElementById('headerCompany');
    if (hc) hc.textContent = u.empresa || '';
    const da = document.getElementById('dropAvatar');
    if (da) da.textContent = ini;
    const dn = document.getElementById('dropName');
    if (dn) dn.textContent = u.nome || 'Usuário';
    const de = document.getElementById('dropEmail');
    if (de) de.textContent = u.email || '';
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
  }
}

// ── Unidade chips ─────────────────────────────────────────
function renderChips(selected = '') {
  const container = document.getElementById('unidadeChips');
  container.innerHTML = UNIDADES.map(u =>
    `<span class="chip${selected === u ? ' selected' : ''}" onclick="selectChip('${u}')">${u}</span>`
  ).join('');
}

function selectChip(unidade) {
  document.getElementById('inputUnidade').value = unidade;
  renderChips(unidade);
}

function syncChips() {
  const val = document.getElementById('inputUnidade').value.trim();
  renderChips(val);
}

// ── Carregar Grupos ───────────────────────────────────────
async function loadGrupos() {
  try {
    const data = await api('GET', '/grupos');
    grupos = Array.isArray(data) ? data : (data.data || data.grupos || []);
    populateGrupoSelects();
  } catch (err) {
    console.warn('Erro ao carregar grupos:', err.message);
  }
}

function populateGrupoSelects() {
  const filterSel = document.getElementById('grupoFilter');
  const modalSel  = document.getElementById('selectGrupo');
  const fv = filterSel.value;
  const mv = modalSel.value;

  filterSel.innerHTML = '<option value="">Todos os grupos</option>' +
    grupos.map(g => `<option value="${g.id}">${escHtml(g.descricao)}</option>`).join('');
  filterSel.value = fv;

  modalSel.innerHTML = '<option value="">Selecione um grupo...</option>' +
    grupos.map(g => `<option value="${g.id}">${escHtml(g.descricao)}</option>`).join('');
  modalSel.value = mv;
}

// ── Carregar Subgrupos ────────────────────────────────────
async function loadSubgrupos() {
  try {
    const data = await api('GET', '/subgrupos');
    subgrupos = Array.isArray(data) ? data : (data.data || data.subgrupos || []);
  } catch (err) {
    console.warn('Erro ao carregar subgrupos:', err.message);
  }
}

// ── Filtro de subgrupo no header (dependente do grupo) ────
function onGrupoFilterChange() {
  const grupoId = document.getElementById('grupoFilter').value;
  const sel     = document.getElementById('subgrupoFilter');
  const prev    = sel.value;

  const lista = grupoId
    ? subgrupos.filter(s => String(s.id_grupo) === String(grupoId))
    : subgrupos;

  sel.innerHTML = '<option value="">Todos os subgrupos</option>' +
    lista.map(s => `<option value="${s.id}">${escHtml(s.descricao)}</option>`).join('');

  sel.value = lista.find(s => String(s.id) === String(prev)) ? prev : '';
  filterTable();
}

// ── Carregar Itens ────────────────────────────────────────
async function loadItens() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = `<tr class="loading-row"><td colspan="6"><i class="fas fa-spinner fa-spin"></i> Carregando...</td></tr>`;
  try {
    const data = await api('GET', '/itens');
    itens = Array.isArray(data) ? data : (data.data || data.itens || []);
    renderTable(itens);
  } catch (err) {
    tbody.innerHTML = `<tr class="loading-row"><td colspan="6" style="color:#ef4444;"><i class="fas fa-exclamation-circle"></i> ${err.message}</td></tr>`;
  }
}

// ── Renderizar Tabela ─────────────────────────────────────
function renderTable(list) {
  const tbody = document.getElementById('tableBody');
  document.getElementById('countBadge').textContent = list.length;

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <i class="fas fa-boxes-stacking"></i>
            <p style="font-weight:600;color:#475569;">Nenhum item encontrado</p>
            <p style="font-size:.8rem;margin-top:4px;">Clique em "Novo Item" para começar</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list.map(item => {
    const isAtivo      = (item.status || 'ativo') === 'ativo';
    const grupoNome    = getNome(grupos, item.id_grupo);
    const subgrupoNome = getNome(subgrupos, item.id_subgrupo);
    return `
      <tr>
        <td><span class="badge-grupo">${escHtml(grupoNome)}</span></td>
        <td><span class="badge-subgrupo">${escHtml(subgrupoNome)}</span></td>
        <td style="font-weight:600;color:#0f172a;max-width:220px;">${escHtml(item.descricao)}</td>
        <td><span class="badge-unidade">${escHtml(item.unidade || '—')}</span></td>
        <td>
          <span class="badge ${isAtivo ? 'badge-ativo' : 'badge-inativo'}">
            <i class="fas fa-circle" style="font-size:.45rem;"></i>
            ${isAtivo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon" title="Editar" onclick="openModal(${item.id})">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn-icon toggle-status" title="${isAtivo ? 'Desativar' : 'Ativar'}" onclick="toggleStatus(${item.id})">
              <i class="fas fa-${isAtivo ? 'toggle-on' : 'toggle-off'}" style="color:${isAtivo ? '#22c55e' : '#94a3b8'};"></i>
            </button>
            <button class="btn-icon del" title="Excluir" onclick="openConfirm(${item.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function getNome(arr, id) {
  const found = arr.find(x => x.id === id || x.id === Number(id));
  return found ? found.descricao : (id ? `#${id}` : '—');
}

// ── Filtro / Busca ────────────────────────────────────────
function filterTable() {
  const q          = document.getElementById('searchInput').value.toLowerCase().trim();
  const grupoId    = document.getElementById('grupoFilter').value;
  const subgrupoId = document.getElementById('subgrupoFilter').value;
  const status     = document.getElementById('statusFilter').value;

  const filtered = itens.filter(item => {
    const matchSearch    = !q || item.descricao.toLowerCase().includes(q);
    const matchGrupo     = !grupoId    || String(item.id_grupo)    === String(grupoId);
    const matchSubgrupo  = !subgrupoId || String(item.id_subgrupo) === String(subgrupoId);
    const matchStatus    = !status     || (item.status || 'ativo') === status;
    return matchSearch && matchGrupo && matchSubgrupo && matchStatus;
  });

  renderTable(filtered);
}

// ── Subgrupos dependentes no modal ────────────────────────
function onModalGrupoChange() {
  const grupoId = document.getElementById('selectGrupo').value;
  const sel     = document.getElementById('selectSubgrupo');

  const lista = grupoId
    ? subgrupos.filter(s => String(s.id_grupo) === String(grupoId) && (s.status || 'ativo') === 'ativo')
    : [];

  sel.innerHTML = '<option value="">Selecione um subgrupo...</option>' +
    lista.map(s => `<option value="${s.id}">${escHtml(s.descricao)}</option>`).join('');
}

// ── Modal Formulário ──────────────────────────────────────
function openModal(id = null) {
  editingId = id;

  const titulo       = document.getElementById('modalTitle');
  const selectGrupo  = document.getElementById('selectGrupo');
  const selectSubg   = document.getElementById('selectSubgrupo');
  const inputDesc    = document.getElementById('inputDescricao');
  const inputUnidade = document.getElementById('inputUnidade');
  const inputEspec   = document.getElementById('inputEspec');
  const inputStatus  = document.getElementById('inputStatus');
  const statusGroup  = document.getElementById('statusGroup');

  // Popula grupos no modal
  populateGrupoSelects();

  if (id) {
    const item = itens.find(x => x.id === id);
    if (!item) return;

    titulo.textContent        = 'Editar Item de Compra';
    selectGrupo.value         = item.id_grupo || '';
    // Popula subgrupos do grupo selecionado
    onModalGrupoChange();
    selectSubg.value          = item.id_subgrupo || '';
    inputDesc.value           = item.descricao || '';
    inputUnidade.value        = item.unidade || '';
    inputEspec.value          = item.especificacao || '';
    inputStatus.value         = item.status || 'ativo';
    statusGroup.style.display = 'flex';
    renderChips(item.unidade || '');
  } else {
    titulo.textContent        = 'Novo Item de Compra';
    selectGrupo.value         = '';
    selectSubg.innerHTML      = '<option value="">Selecione um subgrupo...</option>';
    inputDesc.value           = '';
    inputUnidade.value        = '';
    inputEspec.value          = '';
    inputStatus.value         = 'ativo';
    statusGroup.style.display = 'none';
    renderChips('');
  }

  document.getElementById('modalOverlay').classList.remove('hidden');
  setTimeout(() => inputDesc.focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  editingId = null;
}

async function salvarItem() {
  const id_grupo    = document.getElementById('selectGrupo').value;
  const id_subgrupo = document.getElementById('selectSubgrupo').value;
  const descricao   = document.getElementById('inputDescricao').value.trim();
  const unidade     = document.getElementById('inputUnidade').value.trim();
  const especificacao = document.getElementById('inputEspec').value.trim();
  const status      = document.getElementById('inputStatus').value;
  const btn         = document.getElementById('btnSalvar');

  if (!id_grupo) {
    showToast('Selecione o grupo do item.', 'warning');
    document.getElementById('selectGrupo').focus();
    return;
  }
  if (!id_subgrupo) {
    showToast('Selecione o subgrupo do item.', 'warning');
    document.getElementById('selectSubgrupo').focus();
    return;
  }
  if (!descricao) {
    showToast('Informe a descrição do item.', 'warning');
    document.getElementById('inputDescricao').focus();
    return;
  }
  if (!unidade) {
    showToast('Informe a unidade do item.', 'warning');
    document.getElementById('inputUnidade').focus();
    return;
  }

  btn.disabled  = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  const payload = {
    id_grupo:     Number(id_grupo),
    id_subgrupo:  Number(id_subgrupo),
    descricao,
    unidade,
    especificacao: especificacao || null,
    status
  };

  try {
    if (editingId) {
      await api('PUT', `/itens/${editingId}`, payload);
      showToast('Item atualizado com sucesso!');
    } else {
      await api('POST', '/itens', payload);
      showToast('Item criado com sucesso!');
    }
    closeModal();
    await loadItens();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Salvar';
  }
}

// ── Toggle Status ─────────────────────────────────────────
async function toggleStatus(id) {
  const item = itens.find(x => x.id === id);
  if (!item) return;
  const novoStatus = (item.status || 'ativo') === 'ativo' ? 'inativo' : 'ativo';
  try {
    await api('PUT', `/itens/${id}`, {
      id_grupo:    item.id_grupo,
      id_subgrupo: item.id_subgrupo,
      descricao:   item.descricao,
      unidade:     item.unidade,
      status:      novoStatus
    });
    showToast(`Item ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
    await loadItens();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Confirmar Exclusão ────────────────────────────────────
function openConfirm(id) {
  const item = itens.find(x => x.id === id);
  if (!item) return;
  deletingId = id;
  document.getElementById('confirmName').textContent = `"${item.descricao}"`;
  document.getElementById('confirmOverlay').classList.remove('hidden');
}

function closeConfirm() {
  document.getElementById('confirmOverlay').classList.add('hidden');
  deletingId = null;
}

async function confirmarExclusao() {
  if (!deletingId) return;
  try {
    await api('DELETE', `/itens/${deletingId}`);
    showToast('Item excluído com sucesso!');
    closeConfirm();
    await loadItens();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Escape HTML ───────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Teclado ───────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeConfirm(); }
});

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initSidebar();

  renderSidebar('itens');
  await Promise.all([loadGrupos(), loadSubgrupos()]);
  await loadItens();
  loadObrasCount();
});
