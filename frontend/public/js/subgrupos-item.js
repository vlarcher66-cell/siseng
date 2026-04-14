/* =========================================================
   subgrupos-item.js — SISENG
   Subgrupos de Item de Compra
   ========================================================= */

'use strict';

// ── Estado ────────────────────────────────────────────────
let subgrupos = [];
let grupos    = [];
let editingId = null;
let deletingId = null;

// ── Auth / API ────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token') || '';
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

// ── Carregar Grupos (para filtro e select do modal) ───────
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

  // Salva seleção atual
  const filterVal = filterSel.value;
  const modalVal  = modalSel.value;

  // Filtro da tabela
  filterSel.innerHTML = '<option value="">Todos os grupos</option>' +
    grupos.map(g => `<option value="${g.id}">${escHtml(g.descricao)}</option>`).join('');
  filterSel.value = filterVal;

  // Modal
  modalSel.innerHTML = '<option value="">Selecione um grupo...</option>' +
    grupos.map(g => `<option value="${g.id}">${escHtml(g.descricao)}</option>`).join('');
  modalSel.value = modalVal;
}

// ── Carregar Subgrupos ────────────────────────────────────
async function loadSubgrupos() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = `<tr class="loading-row"><td colspan="4"><i class="fas fa-spinner fa-spin"></i> Carregando...</td></tr>`;
  try {
    const data = await api('GET', '/subgrupos');
    subgrupos = Array.isArray(data) ? data : (data.data || data.subgrupos || []);
    renderTable(subgrupos);
  } catch (err) {
    tbody.innerHTML = `<tr class="loading-row"><td colspan="4" style="color:#ef4444;"><i class="fas fa-exclamation-circle"></i> ${err.message}</td></tr>`;
  }
}

// ── Renderizar Tabela ─────────────────────────────────────
function renderTable(list) {
  const tbody = document.getElementById('tableBody');
  document.getElementById('countBadge').textContent = list.length;

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state">
            <i class="fas fa-sitemap"></i>
            <p style="font-weight:600;color:#475569;">Nenhum subgrupo encontrado</p>
            <p style="font-size:.8rem;margin-top:4px;">Clique em "Novo Subgrupo" para começar</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list.map(s => {
    const isAtivo     = (s.status || 'ativo') === 'ativo';
    const grupoNome   = getGrupoNome(s.id_grupo);
    return `
      <tr>
        <td><span class="badge-grupo">${escHtml(grupoNome)}</span></td>
        <td style="font-weight:600;color:#0f172a;">${escHtml(s.descricao)}</td>
        <td>
          <span class="badge ${isAtivo ? 'badge-ativo' : 'badge-inativo'}">
            <i class="fas fa-circle" style="font-size:.45rem;"></i>
            ${isAtivo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon" title="Editar" onclick="openModal(${s.id})">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn-icon toggle-status" title="${isAtivo ? 'Desativar' : 'Ativar'}" onclick="toggleStatus(${s.id})">
              <i class="fas fa-${isAtivo ? 'toggle-on' : 'toggle-off'}" style="color:${isAtivo ? '#22c55e' : '#94a3b8'};"></i>
            </button>
            <button class="btn-icon del" title="Excluir" onclick="openConfirm(${s.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function getGrupoNome(id_grupo) {
  const g = grupos.find(x => x.id === id_grupo || x.id === Number(id_grupo));
  return g ? g.descricao : `Grupo #${id_grupo}`;
}

// ── Filtro / Busca ────────────────────────────────────────
function filterTable() {
  const q        = document.getElementById('searchInput').value.toLowerCase().trim();
  const grupoId  = document.getElementById('grupoFilter').value;
  const status   = document.getElementById('statusFilter').value;

  const filtered = subgrupos.filter(s => {
    const matchSearch = !q || s.descricao.toLowerCase().includes(q);
    const matchGrupo  = !grupoId || String(s.id_grupo) === String(grupoId);
    const matchStatus = !status || (s.status || 'ativo') === status;
    return matchSearch && matchGrupo && matchStatus;
  });

  renderTable(filtered);
}

// ── Modal Formulário ──────────────────────────────────────
function openModal(id = null) {
  editingId = id;
  const titulo      = document.getElementById('modalTitle');
  const selectGrupo = document.getElementById('selectGrupo');
  const inputDesc   = document.getElementById('inputDescricao');
  const inputStatus = document.getElementById('inputStatus');
  const statusGroup = document.getElementById('statusGroup');

  // Garante que selects de grupo estejam populados
  populateGrupoSelects();

  if (id) {
    const s = subgrupos.find(x => x.id === id);
    if (!s) return;
    titulo.textContent        = 'Editar Subgrupo';
    selectGrupo.value         = s.id_grupo;
    inputDesc.value           = s.descricao;
    inputStatus.value         = s.status || 'ativo';
    statusGroup.style.display = 'flex';
  } else {
    titulo.textContent        = 'Novo Subgrupo';
    selectGrupo.value         = '';
    inputDesc.value           = '';
    inputStatus.value         = 'ativo';
    statusGroup.style.display = 'none';
  }

  document.getElementById('modalOverlay').classList.remove('hidden');
  setTimeout(() => inputDesc.focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  editingId = null;
}

async function salvarSubgrupo() {
  const id_grupo  = document.getElementById('selectGrupo').value;
  const descricao = document.getElementById('inputDescricao').value.trim();
  const status    = document.getElementById('inputStatus').value;
  const btn       = document.getElementById('btnSalvar');

  if (!id_grupo) {
    showToast('Selecione o grupo do subgrupo.', 'warning');
    document.getElementById('selectGrupo').focus();
    return;
  }
  if (!descricao) {
    showToast('Informe a descrição do subgrupo.', 'warning');
    document.getElementById('inputDescricao').focus();
    return;
  }

  btn.disabled  = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  try {
    if (editingId) {
      await api('PUT', `/subgrupos/${editingId}`, { id_grupo: Number(id_grupo), descricao, status });
      showToast('Subgrupo atualizado com sucesso!');
    } else {
      await api('POST', '/subgrupos', { id_grupo: Number(id_grupo), descricao });
      showToast('Subgrupo criado com sucesso!');
    }
    closeModal();
    await loadSubgrupos();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Salvar';
  }
}

// ── Toggle Status ─────────────────────────────────────────
async function toggleStatus(id) {
  const s = subgrupos.find(x => x.id === id);
  if (!s) return;
  const novoStatus = (s.status || 'ativo') === 'ativo' ? 'inativo' : 'ativo';
  try {
    await api('PUT', `/subgrupos/${id}`, { id_grupo: s.id_grupo, descricao: s.descricao, status: novoStatus });
    showToast(`Subgrupo ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
    await loadSubgrupos();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Confirmar Exclusão ────────────────────────────────────
function openConfirm(id) {
  const s = subgrupos.find(x => x.id === id);
  if (!s) return;
  deletingId = id;
  document.getElementById('confirmName').textContent = `"${s.descricao}"`;
  document.getElementById('confirmOverlay').classList.remove('hidden');
}

function closeConfirm() {
  document.getElementById('confirmOverlay').classList.add('hidden');
  deletingId = null;
}

async function confirmarExclusao() {
  if (!deletingId) return;
  try {
    await api('DELETE', `/subgrupos/${deletingId}`);
    showToast('Subgrupo excluído com sucesso!');
    closeConfirm();
    await loadSubgrupos();
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
  if (e.key === 'Enter' && !document.getElementById('modalOverlay').classList.contains('hidden')) {
    salvarSubgrupo();
  }
});

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initSidebar();

  renderSidebar('subgrupos');
  await loadGrupos();
  await loadSubgrupos();
  loadObrasCount();
});
