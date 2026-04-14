/* =========================================================
   fornecedores.js — SISENG
   Gestão de Fornecedores
   ========================================================= */

'use strict';

// ── Estado ────────────────────────────────────────────────
let fornecedores = [];
let editingId    = null;
let deletingId   = null;

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
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res  = await fetch(`/api/fornecedores${path}`, opts);
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
  const c    = document.getElementById('toastContainer');
  const t    = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: 'check-circle', error: 'exclamation-circle', warning: 'exclamation-triangle' };
  t.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── Máscaras ──────────────────────────────────────────────
function maskCnpj(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 14);
  v = v.replace(/^(\d{2})(\d)/, '$1.$2');
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
  v = v.replace(/(\d{4})(\d)/, '$1-$2');
  el.value = v;
}

function maskTelefone(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 10) {
    v = v.replace(/^(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  } else {
    v = v.replace(/^(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  }
  el.value = v;
}

// ── Sidebar / Header helpers ──────────────────────────────
function toggleNavGroup(id) { document.getElementById(id)?.classList.toggle('open'); }
function toggleUserMenu()   { document.getElementById('userDropdown').classList.toggle('hidden'); }
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
    try {
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
    } catch (_) {}
  }
}

// ── Carregar Fornecedores ─────────────────────────────────
async function loadFornecedores() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = `<tr class="loading-row"><td colspan="6"><i class="fas fa-spinner fa-spin"></i> Carregando...</td></tr>`;
  try {
    const data = await api('GET', '');
    fornecedores = Array.isArray(data) ? data : (data.data || data.fornecedores || []);
    updateStats();
    renderTable(fornecedores);
  } catch (err) {
    tbody.innerHTML = `<tr class="loading-row"><td colspan="6" style="color:#ef4444;">
      <i class="fas fa-exclamation-circle"></i> ${escHtml(err.message)}</td></tr>`;
  }
}

// ── Stats ─────────────────────────────────────────────────
function updateStats() {
  const total    = fornecedores.length;
  const ativos   = fornecedores.filter(f => (f.status || 'ativo') === 'ativo').length;
  const inativos = total - ativos;
  document.getElementById('statTotal').textContent   = total;
  document.getElementById('statAtivos').textContent  = ativos;
  document.getElementById('statInativos').textContent = inativos;
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
            <i class="fas fa-truck"></i>
            <p style="font-weight:600;color:#475569;">Nenhum fornecedor encontrado</p>
            <p style="font-size:.8rem;margin-top:4px;">Clique em "Novo Fornecedor" para começar</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list.map(f => {
    const isAtivo   = (f.status || 'ativo') === 'ativo';
    const nomeExib  = escHtml(f.razao_social || '—');
    const fantasia  = f.nome_fantasia ? `<br><span style="font-size:.78rem;color:#94a3b8;font-weight:400;">${escHtml(f.nome_fantasia)}</span>` : '';
    const cnpj      = escHtml(f.cnpj || '—');
    const telefone  = escHtml(f.telefone || '—');
    const categoria = f.categoria
      ? `<span style="background:#e0e7ff;color:#3730a3;border-radius:6px;padding:2px 8px;font-size:.72rem;font-weight:700;">${escHtml(f.categoria)}</span>`
      : '<span style="color:#94a3b8;">—</span>';

    return `
      <tr>
        <td>
          <span style="font-weight:600;color:#0f172a;">${nomeExib}</span>${fantasia}
        </td>
        <td style="font-family:monospace;font-size:.82rem;">${cnpj}</td>
        <td>${telefone}</td>
        <td>${categoria}</td>
        <td>
          <span class="badge ${isAtivo ? 'badge-ativo' : 'badge-inativo'}">
            <i class="fas fa-circle" style="font-size:.45rem;"></i>
            ${isAtivo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon" title="Editar" onclick="openModal(${f.id})">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn-icon toggle-status" title="${isAtivo ? 'Desativar' : 'Ativar'}" onclick="toggleStatus(${f.id})">
              <i class="fas fa-${isAtivo ? 'toggle-on' : 'toggle-off'}"
                 style="color:${isAtivo ? '#22c55e' : '#94a3b8'};font-size:1rem;"></i>
            </button>
            <button class="btn-icon del" title="Excluir" onclick="openConfirm(${f.id})">
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

  const filtered = fornecedores.filter(f => {
    const haystack = [f.razao_social, f.nome_fantasia, f.cnpj]
      .map(s => (s || '').toLowerCase())
      .join(' ');
    const matchSearch = !q || haystack.includes(q);
    const matchStatus = !status || (f.status || 'ativo') === status;
    return matchSearch && matchStatus;
  });

  renderTable(filtered);
}

// ── Modal Formulário ──────────────────────────────────────
function openModal(id = null) {
  editingId = id;

  // Resetar todos os campos
  const fields = ['inputRazaoSocial','inputNomeFantasia','inputCnpj','inputEmail',
                  'inputTelefone','inputContato','inputEndereco','inputCidade',
                  'inputObservacoes'];
  fields.forEach(fid => { const el = document.getElementById(fid); if (el) el.value = ''; });
  document.getElementById('inputCategoria').value = '';
  document.getElementById('inputEstado').value     = '';
  document.getElementById('inputStatus').value     = 'ativo';

  const statusGroup = document.getElementById('statusGroup');
  const obsGroup    = document.getElementById('obsGroupFull');

  if (id) {
    const f = fornecedores.find(x => x.id === id);
    if (!f) return;
    document.getElementById('modalTitle').textContent       = 'Editar Fornecedor';
    document.getElementById('inputRazaoSocial').value       = f.razao_social   || '';
    document.getElementById('inputNomeFantasia').value      = f.nome_fantasia  || '';
    document.getElementById('inputCnpj').value              = f.cnpj           || '';
    document.getElementById('inputEmail').value             = f.email          || '';
    document.getElementById('inputTelefone').value          = f.telefone       || '';
    document.getElementById('inputContato').value           = f.contato        || '';
    document.getElementById('inputEndereco').value          = f.endereco       || '';
    document.getElementById('inputCidade').value            = f.cidade         || '';
    document.getElementById('inputEstado').value            = f.estado         || '';
    document.getElementById('inputCategoria').value         = f.categoria      || '';
    document.getElementById('inputObservacoes').value       = f.observacoes    || '';
    document.getElementById('inputStatus').value            = f.status         || 'ativo';
    statusGroup.style.display = 'flex';
    // Mantém obs full-width mas status ocupa meia coluna — ajusta grid
    obsGroup.style.gridColumn = '1 / -1';
  } else {
    document.getElementById('modalTitle').textContent = 'Novo Fornecedor';
    statusGroup.style.display = 'none';
    obsGroup.style.gridColumn = '1 / -1';
  }

  document.getElementById('modalOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('inputRazaoSocial').focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  editingId = null;
}

async function salvarFornecedor() {
  const razao_social  = document.getElementById('inputRazaoSocial').value.trim();
  const nome_fantasia = document.getElementById('inputNomeFantasia').value.trim();
  const cnpj          = document.getElementById('inputCnpj').value.trim();
  const email         = document.getElementById('inputEmail').value.trim();
  const telefone      = document.getElementById('inputTelefone').value.trim();
  const contato       = document.getElementById('inputContato').value.trim();
  const endereco      = document.getElementById('inputEndereco').value.trim();
  const cidade        = document.getElementById('inputCidade').value.trim();
  const estado        = document.getElementById('inputEstado').value;
  const categoria     = document.getElementById('inputCategoria').value;
  const observacoes   = document.getElementById('inputObservacoes').value.trim();
  const status        = document.getElementById('inputStatus').value;

  if (!razao_social) {
    showToast('Informe a Razão Social do fornecedor.', 'warning');
    document.getElementById('inputRazaoSocial').focus();
    return;
  }

  const payload = { razao_social, nome_fantasia, cnpj, email, telefone,
                    contato, endereco, cidade, estado, categoria, observacoes, status };

  const btn = document.getElementById('btnSalvar');
  btn.disabled  = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  try {
    if (editingId) {
      await api('PUT', `/${editingId}`, payload);
      showToast('Fornecedor atualizado com sucesso!');
    } else {
      await api('POST', '', payload);
      showToast('Fornecedor criado com sucesso!');
    }
    closeModal();
    await loadFornecedores();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Salvar';
  }
}

// ── Toggle Status ─────────────────────────────────────────
async function toggleStatus(id) {
  const f = fornecedores.find(x => x.id === id);
  if (!f) return;
  const novoStatus = (f.status || 'ativo') === 'ativo' ? 'inativo' : 'ativo';
  try {
    await api('PUT', `/${id}`, { ...f, status: novoStatus });
    showToast(`Fornecedor ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
    await loadFornecedores();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Modal Confirmação Exclusão ────────────────────────────
function openConfirm(id) {
  const f = fornecedores.find(x => x.id === id);
  if (!f) return;
  deletingId = id;
  const nome = f.nome_fantasia || f.razao_social || 'este fornecedor';
  document.getElementById('confirmName').textContent = `"${nome}"`;
  document.getElementById('confirmOverlay').classList.remove('hidden');
}

function closeConfirm() {
  document.getElementById('confirmOverlay').classList.add('hidden');
  deletingId = null;
}

async function confirmarExclusao() {
  if (!deletingId) return;
  try {
    await api('DELETE', `/${deletingId}`);
    showToast('Fornecedor excluído com sucesso!');
    closeConfirm();
    await loadFornecedores();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Escape HTML ───────────────────────────────────────────
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Atalhos de Teclado ────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeConfirm();
  }
});

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();

  renderSidebar('fornecedores');
  loadFornecedores();
  loadObrasCount();
});
