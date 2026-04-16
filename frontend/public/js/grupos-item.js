/* =========================================================
   grupos-item.js — SISENG
   Grupos de Item de Compra
   ========================================================= */

'use strict';

// ── Estado ────────────────────────────────────────────────
let grupos = [];
let editingId = null;
let deletingId = null;

// ── Utilitários de Auth / API ─────────────────────────────
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
  const res = await fetch(`${API_BASE}/compras${path}`, opts);
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

// ── Sidebar / Header helpers ──────────────────────────────
function toggleNavGroup(id) { document.getElementById(id)?.classList.toggle('open'); }
function toggleUserMenu() { document.getElementById('userDropdown').classList.toggle('hidden'); }
function handleLogout() {
  localStorage.removeItem('sis_token');
  localStorage.removeItem('sis_user');
  window.location.href = '../index.html';
}

function initSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const toggle   = document.getElementById('sidebarToggle');
  const menuBtn  = document.getElementById('menuBtn');
  const overlay  = document.getElementById('sidebarOverlay');
  const wrapper  = document.getElementById('mainWrapper');

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
    const u = JSON.parse(raw);
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

// ── Carregar Grupos ───────────────────────────────────────
async function loadGrupos() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = `<tr class="loading-row"><td colspan="4"><i class="fas fa-spinner fa-spin"></i> Carregando...</td></tr>`;
  try {
    const data = await api('GET', '/grupos');
    grupos = Array.isArray(data) ? data : (data.data || data.grupos || []);
    renderTable(grupos);
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
            <i class="fas fa-layer-group"></i>
            <p style="font-weight:600;color:#475569;">Nenhum grupo encontrado</p>
            <p style="font-size:.8rem;margin-top:4px;">Clique em "Novo Grupo" para começar</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list.map(g => {
    const isAtivo = (g.status || 'ativo') === 'ativo';
    return `
      <tr>
        <td style="font-weight:600;color:#0f172a;">${escHtml(g.descricao)}</td>
        <td>
          <span class="badge ${isAtivo ? 'badge-ativo' : 'badge-inativo'}">
            <i class="fas fa-circle" style="font-size:.45rem;"></i>
            ${isAtivo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td style="color:#94a3b8;">—</td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon" title="Editar" onclick="openModal(${g.id})">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn-icon toggle-status" title="${isAtivo ? 'Desativar' : 'Ativar'}" onclick="toggleStatus(${g.id})">
              <i class="fas fa-${isAtivo ? 'toggle-on' : 'toggle-off'}" style="color:${isAtivo ? '#22c55e' : '#94a3b8'};"></i>
            </button>
            <button class="btn-icon del" title="Excluir" onclick="openConfirm(${g.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ── Filtro / Busca ────────────────────────────────────────
function filterTable() {
  const q      = document.getElementById('searchInput').value.toLowerCase().trim();
  const status = document.getElementById('statusFilter').value;

  const filtered = grupos.filter(g => {
    const matchSearch = !q || g.descricao.toLowerCase().includes(q);
    const matchStatus = !status || (g.status || 'ativo') === status;
    return matchSearch && matchStatus;
  });

  renderTable(filtered);
}

// ── Modal Formulário ──────────────────────────────────────
function openModal(id = null) {
  editingId = id;
  const titulo      = document.getElementById('modalTitle');
  const inputDesc   = document.getElementById('inputDescricao');
  const inputStatus = document.getElementById('inputStatus');
  const statusGroup = document.getElementById('statusGroup');

  if (id) {
    const g = grupos.find(x => x.id === id);
    if (!g) return;
    titulo.textContent      = 'Editar Grupo';
    inputDesc.value         = g.descricao;
    inputStatus.value       = g.status || 'ativo';
    statusGroup.style.display = 'flex';
  } else {
    titulo.textContent        = 'Novo Grupo';
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

async function salvarGrupo() {
  const descricao = document.getElementById('inputDescricao').value.trim();
  const status    = document.getElementById('inputStatus').value;
  const btn       = document.getElementById('btnSalvar');

  if (!descricao) {
    showToast('Informe a descrição do grupo.', 'warning');
    document.getElementById('inputDescricao').focus();
    return;
  }

  btn.disabled  = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  try {
    if (editingId) {
      await api('PUT', `/grupos/${editingId}`, { descricao, status });
      showToast('Grupo atualizado com sucesso!');
    } else {
      await api('POST', '/grupos', { descricao });
      showToast('Grupo criado com sucesso!');
    }
    closeModal();
    await loadGrupos();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Salvar';
  }
}

// ── Toggle Status ─────────────────────────────────────────
async function toggleStatus(id) {
  const g = grupos.find(x => x.id === id);
  if (!g) return;
  const novoStatus = (g.status || 'ativo') === 'ativo' ? 'inativo' : 'ativo';
  try {
    await api('PUT', `/grupos/${id}`, { descricao: g.descricao, status: novoStatus });
    showToast(`Grupo ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
    await loadGrupos();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Modal Confirmação Exclusão ────────────────────────────
function openConfirm(id) {
  const g = grupos.find(x => x.id === id);
  if (!g) return;
  deletingId = id;
  document.getElementById('confirmName').textContent = `"${g.descricao}"`;
  document.getElementById('confirmOverlay').classList.remove('hidden');
}

function closeConfirm() {
  document.getElementById('confirmOverlay').classList.add('hidden');
  deletingId = null;
}

async function confirmarExclusao() {
  if (!deletingId) return;
  try {
    await api('DELETE', `/grupos/${deletingId}`);
    showToast('Grupo excluído com sucesso!');
    closeConfirm();
    await loadGrupos();
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

// ── Enter no modal ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeConfirm();
  }
  if (e.key === 'Enter' && !document.getElementById('modalOverlay').classList.contains('hidden')) {
    salvarGrupo();
  }
});

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();

  renderSidebar('grupos');
  loadGrupos();
  loadObrasCount();
});
