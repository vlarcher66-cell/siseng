/* ═══════════════════════════════════════════════════════════
   SISENG — Diário de Obras (RDO)
═══════════════════════════════════════════════════════════ */
const API = '/api';

/* ── Auth ─────────────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token') || '';
}
function authH() { return { 'Authorization': `Bearer ${getToken()}` }; }

function checkAuth() {
  if (!getToken()) { window.location.href = '../index.html'; return false; }
  return true;
}

/* ── Estado ───────────────────────────────────────────────── */
let rdos   = [];
let obras  = [];
let rdoAtual = null;
let novosArquivos = [];
let viewMode = localStorage.getItem('rdo_view') || 'list'; // 'card' | 'list'
let usuariosEmpresa = [];
let responsaveisCadastrados = [];

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;
  initSidebar();
  renderSidebar('diario');
  await Promise.allSettled([carregarObras(), carregarFuncoes(), carregarResponsaveis(), carregar()]);
  bindFiltros();
  bindUpload();
  setView(viewMode, true);

  // Data padrão: mês atual no filtro
  const hoje = new Date();
  document.getElementById('filtroMes').value =
    `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
});

/* ── initSidebar (padrão do sistema) ─────────────────────── */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle  = document.getElementById('sidebarToggle');
  const menuBtn = document.getElementById('menuBtn');
  const overlay = document.getElementById('sidebarOverlay');
  const wrapper = document.getElementById('mainWrapper');

  if (localStorage.getItem('sidebar_collapsed') === 'true') {
    sidebar?.classList.add('collapsed');
    wrapper?.classList.add('sidebar-collapsed');
  }

  toggle?.addEventListener('click', () => {
    const c = sidebar.classList.toggle('collapsed');
    wrapper?.classList.toggle('sidebar-collapsed', c);
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

  // Dados do usuário via sis_user
  try {
    const raw = localStorage.getItem('sis_user') || sessionStorage.getItem('sis_user');
    if (raw) {
      const u        = JSON.parse(raw);
      const nome     = u.nome || u.email || 'Usuário';
      const initials = nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
      const el = id => document.getElementById(id);
      if (el('sidebarName'))   el('sidebarName').textContent   = nome;
      if (el('sidebarRole'))   el('sidebarRole').textContent   = u.perfil || '';
      if (el('sidebarAvatar')) el('sidebarAvatar').textContent = initials;
      if (el('headerAvatar'))  el('headerAvatar').textContent  = initials;
      if (el('headerName'))    el('headerName').textContent    = nome.split(' ')[0];
      if (el('headerCompany')) el('headerCompany').textContent = u.empresa || '';
      if (el('dropAvatar'))    el('dropAvatar').textContent    = initials;
      if (el('dropName'))      el('dropName').textContent      = nome;
      if (el('dropEmail'))     el('dropEmail').textContent     = u.email || '';
      // Trial — footer sidebar + badge header
      if (u.trialExpira) {
        const dias = Math.ceil((new Date(u.trialExpira) - new Date()) / 86400000);
        if (el('trialDays')) el('trialDays').textContent = dias > 0 ? `${dias} dias` : 'Expirado';
        if (dias > 0 && el('trialBadge')) {
          el('trialBadge').style.display = 'flex';
          el('trialBadgeDays').textContent = `${dias} dias`;
        }
        if (el('btnAssinar')) el('btnAssinar').style.display = 'inline-flex';
      }
    }
  } catch(_) {}

  // Fecha dropdown ao clicar fora
  document.addEventListener('click', e => {
    const dd = document.getElementById('userDropdown');
    if (dd && !dd.classList.contains('hidden') && !e.target.closest('.header-user')) {
      dd.classList.add('hidden');
    }
  });
}

/* ══════════════════════════════════════════════════════════
   CARREGAR OBRAS (para selects)
══════════════════════════════════════════════════════════ */
async function carregarObras() {
  try {
    const r = await fetch(`${API}/obras`, { headers: authH() });
    obras = await r.json();
    const selFiltro = document.getElementById('filtroObra');
    const selForm   = document.getElementById('rdoObra');
    obras.forEach(o => {
      const opt1 = new Option(o.nome, o.id);
      const opt2 = new Option(o.nome, o.id);
      selFiltro.appendChild(opt1);
      selForm.appendChild(opt2);
    });
  } catch(_) {}
}

/* ══════════════════════════════════════════════════════════
   RESPONSÁVEIS (cadastro rápido)
══════════════════════════════════════════════════════════ */
async function carregarResponsaveis() {
  try {
    const r = await fetch(`${API}/rdo/responsaveis`, { headers: authH() });
    const data = await r.json();
    responsaveisCadastrados = Array.isArray(data) ? data : [];
    preencherSelectResponsavel();
  } catch(_) { responsaveisCadastrados = []; }
}

function preencherSelectResponsavel(valorAtual = '') {
  const sel = document.getElementById('rdoResponsavel');
  if (!sel) return;
  const cur = valorAtual || sel.value;
  sel.innerHTML = '<option value="">Selecione o responsável...</option>' +
    responsaveisCadastrados.map(r =>
      `<option value="${r.nome}" data-cargo="${r.cargo || ''}">${r.nome}</option>`
    ).join('');
  if (cur) sel.value = cur;
}

async function abrirModalResponsaveis() {
  abrirModal('modalResponsaveis');
  await carregarResponsaveis();
  renderResponsaveisList();
}

function renderResponsaveisList() {
  const el = document.getElementById('responsaveisList');
  if (!responsaveisCadastrados.length) {
    el.innerHTML = '<p style="text-align:center;color:#94a3b8;font-size:.85rem">Nenhum responsável cadastrado ainda.</p>';
    return;
  }
  el.innerHTML = responsaveisCadastrados.map(r => `
    <div class="funcao-item">
      <span><i class="fas fa-user" style="color:#2563eb;margin-right:8px"></i>${r.nome}${r.cargo ? ' <small style="color:#94a3b8">— ' + r.cargo + '</small>' : ''}</span>
      <button onclick="removerResponsavel(${r.id})" title="Remover"><i class="fas fa-times"></i></button>
    </div>`).join('');
}

async function salvarResponsavel() {
  const nome  = document.getElementById('inputNovoResponsavel').value.trim();
  const cargo = document.getElementById('inputNovoResponsavelCargo').value.trim();
  if (!nome) return;
  try {
    const r = await fetch(`${API}/rdo/responsaveis`, {
      method: 'POST', headers: { ...authH(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, cargo })
    });
    if (!r.ok) { const e = await r.json(); toast(e.message, 'error'); return; }
    document.getElementById('inputNovoResponsavel').value = '';
    document.getElementById('inputNovoResponsavelCargo').value = '';
    await carregarResponsaveis();
    renderResponsaveisList();
    toast('Responsável adicionado!', 'success');
  } catch(_) { toast('Erro ao salvar.', 'error'); }
}

async function removerResponsavel(id) {
  try {
    await fetch(`${API}/rdo/responsaveis/${id}`, { method: 'DELETE', headers: authH() });
    await carregarResponsaveis();
    renderResponsaveisList();
  } catch(_) { toast('Erro ao remover.', 'error'); }
}

/* ══════════════════════════════════════════════════════════
   CARREGAR RDOs
══════════════════════════════════════════════════════════ */
async function carregar() {
  const obraId = document.getElementById('filtroObra').value;
  const mes    = document.getElementById('filtroMes').value; // yyyy-MM

  let url = `${API}/rdo?`;
  if (obraId) url += `obra_id=${obraId}&`;
  if (mes) {
    const [ano, m] = mes.split('-');
    url += `ano=${ano}&mes=${m}`;
  }

  try {
    const r = await fetch(url, { headers: authH() });
    rdos = await r.json();
    renderLista();
    atualizarStats();
  } catch(e) {
    document.getElementById('rdoList').innerHTML =
      '<div class="rdo-empty"><i class="fas fa-exclamation-circle"></i><p>Erro ao carregar registros.</p></div>';
  }
}

function bindFiltros() {
  document.getElementById('filtroObra').addEventListener('change', carregar);
  document.getElementById('filtroMes').addEventListener('change', carregar);
  // Quando muda a obra no formulário, recarrega etapas
  document.getElementById('rdoObra').addEventListener('change', e => {
    carregarEtapasObra(e.target.value);
  });
  // Ao selecionar responsável, preenche cargo automaticamente
  document.getElementById('rdoResponsavel').addEventListener('change', e => {
    const opt = e.target.selectedOptions[0];
    const cargo = opt?.dataset?.cargo || '';
    if (cargo) document.getElementById('rdoCargo').value = cargo;
  });
}

/* ══════════════════════════════════════════════════════════
   STATS
══════════════════════════════════════════════════════════ */
function atualizarStats() {
  document.getElementById('statTotal').textContent      = rdos.length;
  document.getElementById('statFinalizado').textContent = rdos.filter(r=>r.status==='finalizado').length;
  document.getElementById('statRascunho').textContent   = rdos.filter(r=>r.status==='rascunho').length;
  document.getElementById('statAnexos').textContent     = rdos.reduce((s,r)=>s+(+r.total_anexos||0),0);
}

/* ══════════════════════════════════════════════════════════
   RENDER LISTA
══════════════════════════════════════════════════════════ */
/* ── Toggle view ──────────────────────────────────────────── */
function setView(mode, silent = false) {
  viewMode = mode;
  if (!silent) localStorage.setItem('rdo_view', mode);
  document.getElementById('btnViewCard').classList.toggle('active', mode === 'card');
  document.getElementById('btnViewList').classList.toggle('active', mode === 'list');
  renderLista();
}

function renderLista() {
  const el = document.getElementById('rdoList');
  if (!rdos.length) {
    el.className = '';
    el.innerHTML = '<div class="rdo-empty"><i class="fas fa-book-open"></i><p>Nenhum registro encontrado para o período.</p></div>';
    return;
  }

  if (viewMode === 'list') {
    el.className = 'rdo-table-wrap';
    el.innerHTML = `
      <table class="rdo-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Obra</th>
            <th>Responsável</th>
            <th>Clima</th>
            <th>Mão de Obra</th>
            <th>Anexos</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rdos.map(r => {
            const dataStr = (r.data||'').toString().slice(0,10);
            const badge = r.status === 'finalizado'
              ? '<span class="rdo-badge finalizado">Finalizado</span>'
              : '<span class="rdo-badge rascunho">Rascunho</span>';
            return `
            <tr onclick="verRdo(${r.id})">
              <td><strong>${formatData(r.data)}</strong></td>
              <td>${r.obra_nome}</td>
              <td>${r.responsavel || '—'}</td>
              <td>${climaEmoji(r.clima_manha)} ${climaEmoji(r.clima_tarde)}</td>
              <td>${r.total_funcoes || 0} função(ões)</td>
              <td>${r.total_anexos || 0}</td>
              <td>${badge}</td>
              <td onclick="event.stopPropagation()">
                <div class="td-actions">
                  <button class="btn-edit-rdo" title="Editar" onclick="editarRdo(${r.id})"><i class="fas fa-edit"></i></button>
                  <button class="btn-del-rdo"  title="Excluir" onclick="excluirRdo(${r.id})"><i class="fas fa-trash"></i></button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
    return;
  }

  // modo card
  el.className = 'rdo-list';
  el.innerHTML = rdos.map(r => {
    const dataStr = (r.data || '').toString().slice(0, 10); // garante YYYY-MM-DD
    const d   = new Date(dataStr + 'T12:00:00');
    const dia = isNaN(d) ? '--' : String(d.getDate()).padStart(2,'0');
    const mes = isNaN(d) ? '---' : d.toLocaleString('pt-BR',{month:'short'}).replace('.','');
    const badge = r.status === 'finalizado'
      ? '<span class="rdo-badge finalizado">Finalizado</span>'
      : '<span class="rdo-badge rascunho">Rascunho</span>';

    const climaM = climaEmoji(r.clima_manha);
    const climaT = climaEmoji(r.clima_tarde);
    const temp   = r.temperatura ? `${r.temperatura}°C` : '—';

    return `
    <div class="rdo-card" onclick="verRdo(${r.id})">
      <div class="rdo-card-header">
        <div class="rdo-card-date">
          <div class="rdo-date-box">
            <div class="day">${dia}</div>
            <div class="mon">${mes}</div>
          </div>
          <div>
            <div class="rdo-card-title">${r.obra_nome}</div>
            <div class="rdo-card-obra">${r.responsavel || 'Sem responsável'}</div>
          </div>
        </div>
        ${badge}
      </div>
      <div class="rdo-card-body">
        <div class="rdo-clima-row">
          <div class="rdo-clima-item">${climaM} Manhã</div>
          <div class="rdo-clima-item">${climaT} Tarde</div>
          <div class="rdo-clima-item"><i class="fas fa-thermometer-half" style="color:#ef4444"></i> ${temp}</div>
        </div>
        <div class="rdo-info-row">
          <span><i class="fas fa-hard-hat"></i> ${r.total_funcoes || 0} função(ões)</span>
          <span><i class="fas fa-project-diagram"></i> ${r.total_etapas || 0} etapa(s)</span>
          <span><i class="fas fa-paperclip"></i> ${r.total_anexos || 0} anexo(s)</span>
        </div>
      </div>
      <div class="rdo-card-footer">
        <span style="font-size:11px;color:#94a3b8">${formatData(r.data)}</span>
        <div class="rdo-actions" onclick="event.stopPropagation()">
          <button class="btn-edit-rdo" title="Editar" onclick="editarRdo(${r.id})"><i class="fas fa-edit"></i></button>
          <button class="btn-del-rdo"  title="Excluir" onclick="excluirRdo(${r.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function climaEmoji(c) {
  const map = { sol:'☀️', nublado:'⛅', chuva:'🌧️', garoa:'🌦️', tempestade:'⛈️' };
  return map[c] || '☀️';
}

function formatData(d) {
  if (!d) return '—';
  const dt = new Date(d.toString().slice(0, 10) + 'T12:00:00');
  return isNaN(dt) ? '—' : dt.toLocaleDateString('pt-BR');
}

/* ══════════════════════════════════════════════════════════
   MODAL NOVO / EDITAR
══════════════════════════════════════════════════════════ */
function abrirModalNovo() {
  rdoAtual = null;
  novosArquivos = [];
  document.getElementById('rdoId').value        = '';
  document.getElementById('rdoObra').value      = '';
  document.getElementById('rdoData').value      = new Date().toISOString().slice(0,10);
  preencherSelectResponsavel('');
  document.getElementById('rdoCargo').value     = '';
  document.getElementById('rdoServicos').value  = '';
  document.getElementById('rdoOcorrencias').value = '';
  document.getElementById('rdoStatus').value    = 'rascunho';
  document.getElementById('rdoTemperatura').value = '';
  document.getElementById('modalRdoTitulo').textContent = 'Novo Registro';
  setClima('climaManha', 'sol');
  setClima('climaTarde', 'sol');
  renderMoList([]);
  carregarEtapasObra('');
  document.getElementById('novosAnexosPreview').innerHTML = '';
  document.getElementById('anexosExistentes').style.display = 'none';
  document.getElementById('anexosExistentes').innerHTML = '';
  document.getElementById('inputAnexos').value = '';
  abrirModal('modalRdo');
}

async function editarRdo(id) {
  try {
    const r   = await fetch(`${API}/rdo/${id}`, { headers: authH() });
    const rdo = await r.json();
    rdoAtual  = rdo;
    novosArquivos = [];

    document.getElementById('rdoId').value          = rdo.id;
    document.getElementById('rdoObra').value         = rdo.obra_id;
    document.getElementById('rdoData').value         = (rdo.data||'').toString().slice(0,10);
    preencherSelectResponsavel(rdo.responsavel || '');
    document.getElementById('rdoCargo').value        = rdo.cargo || '';
    document.getElementById('rdoServicos').value     = rdo.servicos || '';
    document.getElementById('rdoOcorrencias').value  = rdo.ocorrencias || '';
    document.getElementById('rdoStatus').value       = rdo.status || 'rascunho';
    document.getElementById('rdoTemperatura').value  = rdo.temperatura || '';
    document.getElementById('modalRdoTitulo').textContent = `Editar — ${formatData(rdo.data)}`;

    setClima('climaManha', rdo.clima_manha || 'sol');
    setClima('climaTarde', rdo.clima_tarde || 'sol');
    renderMoList(rdo.mao_obra || []);
    const etapaIds = (rdo.etapas || []).map(e => e.etapa_id);
    await carregarEtapasObra(rdo.obra_id, etapaIds);
    renderAnexosExistentes(rdo.anexos || []);
    document.getElementById('novosAnexosPreview').innerHTML = '';
    document.getElementById('inputAnexos').value = '';
    abrirModal('modalRdo');
    fecharModal('modalVer');
  } catch(e) {
    toast('Erro ao carregar RDO.', 'error');
  }
}

function editarDoVer() {
  if (rdoAtual) editarRdo(rdoAtual.id);
}

/* ── Clima buttons ────────────────────────────────────────── */
function setClima(grupoId, valor) {
  document.querySelectorAll(`#${grupoId} .clima-btn`).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.v === valor);
  });
}

function getClima(grupoId) {
  const active = document.querySelector(`#${grupoId} .clima-btn.active`);
  return active ? active.dataset.v : 'sol';
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.clima-btn');
  if (!btn) return;
  const grupo = btn.closest('.clima-options');
  if (!grupo) return;
  grupo.querySelectorAll('.clima-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
});

/* ══════════════════════════════════════════════════════════
   ETAPAS DA OBRA
══════════════════════════════════════════════════════════ */
let etapasObra = []; // etapas da obra selecionada

async function carregarEtapasObra(obraId, etapasSelecionadas = []) {
  const el = document.getElementById('etapasCheckList');
  if (!obraId) {
    el.innerHTML = '<p style="color:#94a3b8;font-size:.85rem">Selecione uma obra para ver as etapas.</p>';
    etapasObra = [];
    return;
  }
  try {
    const r = await fetch(`${API}/etapas?obra_id=${obraId}&status=em_andamento`, { headers: authH() });
    const data = await r.json();
    etapasObra = Array.isArray(data) ? data : (data.etapas || []);
    renderEtapasCheck(etapasSelecionadas);
  } catch(_) {
    el.innerHTML = '<p style="color:#94a3b8;font-size:.85rem">Erro ao carregar etapas.</p>';
  }
}

function pctColor(pct) {
  if (pct <= 60)  return '#ef4444'; // vermelho
  if (pct <= 85)  return '#f59e0b'; // amarelo
  return '#22c55e';                  // verde
}

function renderEtapasCheck(selecionadas = []) {
  const el = document.getElementById('etapasCheckList');
  if (!etapasObra.length) {
    el.innerHTML = '<p style="color:#94a3b8;font-size:.85rem">Nenhuma etapa em andamento para esta obra.</p>';
    return;
  }
  const ids = selecionadas.map(Number);
  el.innerHTML = etapasObra.map(e => {
    const checked = ids.includes(e.id);
    const st  = e.status || 'pendente';
    const pct = parseInt(e.percentual) || 0;
    const cor = pctColor(pct);
    const stLabel = { pendente:'Pendente', em_andamento:'Em andamento', concluida:'Concluída', atrasada:'Atrasada' }[st] || st;
    return `
    <label class="etapa-check-item ${checked ? 'checked' : ''}" onclick="toggleEtapa(this, ${e.id})">
      <input type="checkbox" value="${e.id}" ${checked ? 'checked' : ''} />
      <div class="etapa-check-box"></div>
      <div class="etapa-check-info">
        <div class="etapa-check-nome" title="${e.nome}">${e.nome}</div>
        <div class="etapa-check-footer">
          <span class="etapa-check-status ${st}">${stLabel}</span>
          <span class="etapa-check-pct" style="color:${cor}">${pct}%</span>
        </div>
        <div class="etapa-progress-bar"><div class="etapa-progress-fill" style="width:${pct}%;background:${cor}"></div></div>
      </div>
    </label>`;
  }).join('');
}

function toggleEtapa(label, etapaId) {
  const cb = label.querySelector('input[type="checkbox"]');
  cb.checked = !cb.checked;
  label.classList.toggle('checked', cb.checked);
}

function getEtapasSelecionadas() {
  return [...document.querySelectorAll('#etapasCheckList input[type="checkbox"]:checked')]
    .map(cb => parseInt(cb.value));
}

/* ── Funções da equipe ────────────────────────────────────── */
let funcoesCadastradas = [];

async function carregarFuncoes() {
  try {
    const r    = await fetch(`${API}/rdo/funcoes`, { headers: authH() });
    const data = await r.json();
    funcoesCadastradas = Array.isArray(data) ? data : [];
  } catch(_) { funcoesCadastradas = []; }
}

/* ── Modal gerenciar funções ──────────────────────────────── */
async function abrirModalFuncoes() {
  abrirModal('modalFuncoes');
  await carregarFuncoes();
  renderFuncoesList();
}

function renderFuncoesList() {
  const el = document.getElementById('funcoesList');
  if (!funcoesCadastradas.length) {
    el.innerHTML = '<p style="text-align:center;color:#94a3b8;font-size:.85rem">Nenhuma função cadastrada ainda.</p>';
    return;
  }
  el.innerHTML = funcoesCadastradas.map(f => `
    <div class="funcao-item">
      <span><i class="fas fa-hard-hat" style="color:#2563eb;margin-right:8px"></i>${f.funcao}</span>
      <button onclick="removerFuncao(${f.id})" title="Remover"><i class="fas fa-times"></i></button>
    </div>`).join('');
}

async function salvarFuncao() {
  const input = document.getElementById('inputNovaFuncao');
  const funcao = input.value.trim();
  if (!funcao) return;
  try {
    const r = await fetch(`${API}/rdo/funcoes`, {
      method: 'POST', headers: { ...authH(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ funcao })
    });
    if (!r.ok) { const e = await r.json(); toast(e.message, 'error'); return; }
    input.value = '';
    await carregarFuncoes();
    renderFuncoesList();
    atualizarTodosSelects();
    toast('Função adicionada!', 'success');
  } catch(_) { toast('Erro ao salvar.', 'error'); }
}

async function removerFuncao(id) {
  try {
    await fetch(`${API}/rdo/funcoes/${id}`, { method: 'DELETE', headers: authH() });
    await carregarFuncoes();
    renderFuncoesList();
    atualizarTodosSelects();
  } catch(_) { toast('Erro ao remover.', 'error'); }
}

function atualizarOpcoesSelect(sel, valorAtual) {
  const opcoes = funcoesCadastradas.map(f =>
    `<option value="${f.funcao}" ${f.funcao === valorAtual ? 'selected' : ''}>${f.funcao}</option>`
  ).join('');
  sel.innerHTML = `<option value="">Selecione uma função...</option>${opcoes}`;
  if (valorAtual) sel.value = valorAtual;
}

function atualizarTodosSelects() {
  // Coleta valores atuais antes de atualizar
  const valores = [...document.querySelectorAll('.mo-row')].map(row => {
    const sel = row.querySelector('.mo-funcao-sel');
    const inp = row.querySelector('.mo-funcao');
    return sel?.value || inp?.value || '';
  });
  // Re-renderiza com os valores preservados
  const moAtual = getMaoObra();
  if (moAtual.length) renderMoList(moAtual);
  else document.querySelectorAll('.mo-funcao-sel').forEach((sel, i) => atualizarOpcoesSelect(sel, valores[i] || ''));
}

/* ── Mão de obra ──────────────────────────────────────────── */
function renderMoList(items) {
  const list = document.getElementById('moList');
  list.innerHTML = '';
  if (items.length) {
    items.forEach(item => addMoRow(item.funcao, item.qtd));
  } else {
    addMoRow();
  }
}

function addMoRow(funcao = '', qtd = 1) {
  const list = document.getElementById('moList');
  const row  = document.createElement('div');
  row.className = 'mo-row';

  const opcoes = funcoesCadastradas.map(f =>
    `<option value="${f.funcao}" ${f.funcao === funcao ? 'selected' : ''}>${f.funcao}</option>`
  ).join('');

  row.innerHTML = `
    <select class="mo-funcao-sel">
      <option value="">Selecione uma função...</option>
      ${opcoes}
    </select>
    <input type="text" class="mo-funcao" placeholder="Ou digite aqui" value="${funcao}" style="display:none" />
    <input type="number" class="mo-qtd qtd" placeholder="Qtd" min="1" max="999" value="${qtd}" />
    <button type="button" class="btn-rem-mo" onclick="this.closest('.mo-row').remove()">
      <i class="fas fa-times"></i>
    </button>`;

  // Quando seleciona no dropdown, preenche o input oculto
  const sel = row.querySelector('.mo-funcao-sel');
  const inp = row.querySelector('.mo-funcao');

  // Se funcao já veio preenchida, mostra no select ou no input
  if (funcao) {
    const existe = funcoesCadastradas.find(f => f.funcao === funcao);
    if (!existe) {
      // função digitada manualmente — mostra input de texto
      sel.style.display = 'none';
      inp.style.display = '';
    }
  }

  sel.addEventListener('change', () => { inp.value = sel.value; });

  list.appendChild(row);
}

function getMaoObra() {
  return [...document.querySelectorAll('.mo-row')].map(row => {
    const sel = row.querySelector('.mo-funcao-sel');
    const inp = row.querySelector('.mo-funcao');
    const funcao = (sel?.value || inp?.value || '').trim();
    return { funcao, qtd: parseInt(row.querySelector('.mo-qtd').value) || 1 };
  }).filter(i => i.funcao);
}

/* ── Anexos existentes (edição) ───────────────────────────── */
function renderAnexosExistentes(anexos) {
  const el = document.getElementById('anexosExistentes');
  if (!anexos.length) { el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = 'grid';
  el.innerHTML = anexos.map(a => {
    const icon = a.tipo === 'foto'
      ? `<img src="${a.url}" alt="${a.nome_orig}" />`
      : a.tipo === 'video'
        ? `<div class="galeria-doc"><i class="fas fa-film"></i><span>${a.nome_orig}</span></div>`
        : `<div class="galeria-doc"><i class="fas fa-file-alt"></i><span>${a.nome_orig}</span></div>`;
    return `
      <div class="galeria-item" style="position:relative">
        ${icon}
        <button type="button" class="btn-rem-anexo"
          onclick="removerAnexoExistente(${rdoAtual?.id}, ${a.id}, this)"
          title="Remover">×</button>
      </div>`;
  }).join('');
}

async function removerAnexoExistente(rdoId, anexoId, btn) {
  if (!confirm('Remover este anexo?')) return;
  try {
    await fetch(`${API}/rdo/${rdoId}/anexos/${anexoId}`, {
      method: 'DELETE', headers: authH()
    });
    btn.closest('.galeria-item').remove();
    toast('Anexo removido.', 'success');
  } catch(_) { toast('Erro ao remover anexo.', 'error'); }
}

/* ── Upload de novos arquivos ─────────────────────────────── */
function bindUpload() {
  const zone  = document.getElementById('uploadZone');
  const input = document.getElementById('inputAnexos');

  input.addEventListener('change', () => {
    adicionarArquivos(input.files);
    input.value = '';
  });

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    adicionarArquivos(e.dataTransfer.files);
  });
}

function adicionarArquivos(files) {
  [...files].forEach(f => {
    novosArquivos.push(f);
    renderThumb(f, novosArquivos.length - 1);
  });
}

function renderThumb(file, idx) {
  const preview = document.getElementById('novosAnexosPreview');
  const thumb   = document.createElement('div');
  thumb.className = 'anexo-thumb';
  thumb.id = `thumb_${idx}`;

  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    thumb.appendChild(img);
  } else {
    const iconMap = { 'video': 'fa-film', 'application/pdf': 'fa-file-pdf' };
    const ico = file.type.startsWith('video') ? 'fa-film'
      : file.type.includes('pdf') ? 'fa-file-pdf'
      : file.type.includes('word') ? 'fa-file-word'
      : file.type.includes('excel') || file.type.includes('sheet') ? 'fa-file-excel'
      : 'fa-file';
    const ext = file.name.split('.').pop().toUpperCase();
    thumb.innerHTML = `<div class="anexo-icon"><i class="fas ${ico}"></i><span>${ext}</span></div>`;
  }

  const remBtn = document.createElement('button');
  remBtn.className = 'btn-rem-anexo';
  remBtn.type = 'button';
  remBtn.textContent = '×';
  remBtn.onclick = () => {
    novosArquivos.splice(idx, 1);
    thumb.remove();
  };
  thumb.appendChild(remBtn);
  preview.appendChild(thumb);
}

/* ══════════════════════════════════════════════════════════
   SALVAR RDO
══════════════════════════════════════════════════════════ */
async function salvarRdo() {
  const obraId = document.getElementById('rdoObra').value;
  const data   = document.getElementById('rdoData').value;
  if (!obraId || !data) { toast('Obra e data são obrigatórios.', 'error'); return; }

  const btn = document.getElementById('btnSalvarRdo');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  const fd = new FormData();
  fd.append('obra_id',      obraId);
  fd.append('data',         data);
  fd.append('clima_manha',  getClima('climaManha'));
  fd.append('clima_tarde',  getClima('climaTarde'));
  fd.append('temperatura',  document.getElementById('rdoTemperatura').value);
  fd.append('responsavel',  document.getElementById('rdoResponsavel').value);
  fd.append('cargo',        document.getElementById('rdoCargo').value);
  fd.append('servicos',     document.getElementById('rdoServicos').value);
  fd.append('ocorrencias',  document.getElementById('rdoOcorrencias').value);
  fd.append('status',       document.getElementById('rdoStatus').value);
  fd.append('mao_obra',    JSON.stringify(getMaoObra()));
  fd.append('etapas_ids', JSON.stringify(getEtapasSelecionadas()));

  novosArquivos.forEach(f => fd.append('anexos', f));

  const id     = document.getElementById('rdoId').value;
  const method = id ? 'PUT' : 'POST';
  const url    = id ? `${API}/rdo/${id}` : `${API}/rdo`;

  try {
    const r   = await fetch(url, { method, headers: authH(), body: fd });
    const res = await r.json();

    if (!r.ok) {
      if (r.status === 409) {
        toast('Já existe um RDO para esta obra nesta data.', 'error');
      } else {
        toast(res.message || 'Erro ao salvar.', 'error');
      }
      return;
    }

    toast(id ? 'Registro atualizado!' : 'Registro criado!', 'success');
    fecharModal('modalRdo');
    await carregar();
  } catch(e) {
    toast('Erro de conexão.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Salvar Registro';
  }
}

/* ══════════════════════════════════════════════════════════
   VISUALIZAR RDO
══════════════════════════════════════════════════════════ */
async function verRdo(id) {
  try {
    const r   = await fetch(`${API}/rdo/${id}`, { headers: authH() });
    const rdo = await r.json();
    rdoAtual  = rdo;

    document.getElementById('verTitulo').textContent =
      `${rdo.obra_nome} — ${formatData(rdo.data)}`;

    const badge = rdo.status === 'finalizado'
      ? '<span class="rdo-badge finalizado">Finalizado</span>'
      : '<span class="rdo-badge rascunho">Rascunho</span>';

    const etapasHtml = (rdo.etapas||[]).length
      ? `<div class="etapas-check-list" style="pointer-events:none">
          ${rdo.etapas.map(e => {
            const st  = e.status || 'pendente';
            const pct = parseInt(e.percentual) || 0;
            const cor = pctColor(pct);
            const stLabel = {pendente:'Pendente',em_andamento:'Em andamento',concluida:'Concluída',atrasada:'Atrasada'}[st]||st;
            return `<div class="etapa-check-item checked">
              <div class="etapa-check-box"></div>
              <div class="etapa-check-info">
                <div class="etapa-check-nome">${e.nome}</div>
                <div class="etapa-check-footer">
                  <span class="etapa-check-status ${st}">${stLabel}</span>
                  <span class="etapa-check-pct" style="color:${cor}">${pct}%</span>
                </div>
                <div class="etapa-progress-bar"><div class="etapa-progress-fill" style="width:${pct}%;background:${cor}"></div></div>
              </div>
            </div>`;
          }).join('')}
        </div>`
      : '<p style="color:#94a3b8;font-size:13px">Nenhuma etapa vinculada.</p>';

    const moHtml = (rdo.mao_obra||[]).length
      ? `<table style="width:100%;font-size:13px;border-collapse:collapse">
          <tr style="background:#f8fafc"><th style="padding:6px 10px;text-align:left">Função</th><th style="padding:6px 10px;text-align:center">Qtd</th></tr>
          ${rdo.mao_obra.map(m=>`<tr><td style="padding:6px 10px;border-bottom:1px solid #f1f5f9">${m.funcao}</td><td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f1f5f9">${m.qtd}</td></tr>`).join('')}
         </table>`
      : '<p style="color:#94a3b8;font-size:13px">Nenhum registro de mão de obra.</p>';

    const galeriaHtml = (rdo.anexos||[]).length
      ? `<div class="anexos-galeria">${rdo.anexos.map(a => _galItem(a)).join('')}</div>`
      : '<p style="color:#94a3b8;font-size:13px">Nenhum anexo.</p>';

    document.getElementById('verBody').innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap">
        ${badge}
        <span style="font-size:13px;color:#64748b">
          <i class="fas fa-user" style="color:#2563eb"></i>
          ${rdo.responsavel || '—'} ${rdo.cargo ? '· '+rdo.cargo : ''}
        </span>
      </div>

      <div class="rdo-section">
        <div class="rdo-section-title"><i class="fas fa-cloud-sun"></i> Clima</div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;font-size:14px">
          <span>${climaEmoji(rdo.clima_manha)} Manhã: <strong>${rdo.clima_manha}</strong></span>
          <span>${climaEmoji(rdo.clima_tarde)} Tarde: <strong>${rdo.clima_tarde}</strong></span>
          ${rdo.temperatura ? `<span>🌡️ <strong>${rdo.temperatura}°C</strong></span>` : ''}
        </div>
      </div>

      <div class="rdo-section">
        <div class="rdo-section-title"><i class="fas fa-project-diagram"></i> Etapas em Execução</div>
        ${etapasHtml}
      </div>

      <div class="rdo-section">
        <div class="rdo-section-title"><i class="fas fa-hard-hat"></i> Mão de Obra</div>
        ${moHtml}
      </div>

      ${rdo.servicos ? `
      <div class="rdo-section">
        <div class="rdo-section-title"><i class="fas fa-tools"></i> Serviços Executados</div>
        <p style="font-size:14px;color:#334155;white-space:pre-wrap">${rdo.servicos}</p>
      </div>` : ''}

      ${rdo.ocorrencias ? `
      <div class="rdo-section">
        <div class="rdo-section-title"><i class="fas fa-exclamation-triangle"></i> Ocorrências</div>
        <p style="font-size:14px;color:#334155;white-space:pre-wrap">${rdo.ocorrencias}</p>
      </div>` : ''}

      <div class="rdo-section">
        <div class="rdo-section-title"><i class="fas fa-paperclip"></i> Anexos (${(rdo.anexos||[]).length})</div>
        ${galeriaHtml}
      </div>
    `;

    abrirModal('modalVer');
  } catch(e) {
    toast('Erro ao carregar detalhes.', 'error');
  }
}

function _galItem(a) {
  if (a.tipo === 'foto') {
    return `<div class="galeria-item" onclick="abrirLightbox('${a.url}','img','${a.nome_orig}')">
      <img src="${a.url}" alt="${a.nome_orig}" loading="lazy" />
    </div>`;
  }
  if (a.tipo === 'video') {
    return `<div class="galeria-item" onclick="abrirLightbox('${a.url}','video','${a.nome_orig}')">
      <div class="galeria-doc"><i class="fas fa-film"></i><span>${a.nome_orig}</span></div>
    </div>`;
  }
  const ico = a.nome_orig.endsWith('.pdf') ? 'fa-file-pdf'
    : a.nome_orig.match(/\.(doc|docx)$/) ? 'fa-file-word'
    : a.nome_orig.match(/\.(xls|xlsx)$/) ? 'fa-file-excel'
    : 'fa-file-alt';
  return `<div class="galeria-item" onclick="window.open('${a.url}','_blank')">
    <div class="galeria-doc"><i class="fas ${ico}"></i><span>${a.nome_orig}</span></div>
  </div>`;
}

/* ══════════════════════════════════════════════════════════
   EXCLUIR RDO
══════════════════════════════════════════════════════════ */
async function excluirRdo(id) {
  const rdo = rdos.find(r => r.id === id);
  if (!confirm(`Excluir o registro de ${rdo ? formatData(rdo.data) : 'esta data'}? Esta ação não pode ser desfeita.`)) return;
  try {
    const r = await fetch(`${API}/rdo/${id}`, { method: 'DELETE', headers: authH() });
    if (!r.ok) { toast('Erro ao excluir.', 'error'); return; }
    toast('Registro excluído.', 'success');
    await carregar();
  } catch(_) { toast('Erro de conexão.', 'error'); }
}

/* ══════════════════════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════════════════════ */
function abrirLightbox(url, tipo, caption) {
  const lb = document.getElementById('lightbox');
  const ct = document.getElementById('lbContent');
  document.getElementById('lbCaption').textContent = caption || '';

  if (tipo === 'img') {
    ct.innerHTML = `<img src="${url}" alt="${caption}" />`;
  } else if (tipo === 'video') {
    ct.innerHTML = `<video controls autoplay style="max-width:95vw;max-height:80vh;border-radius:8px">
      <source src="${url}" />Seu browser não suporta vídeo.
    </video>`;
  }
  lb.style.display = 'flex';
}

function fecharLightbox() {
  const lb = document.getElementById('lightbox');
  lb.style.display = 'none';
  document.getElementById('lbContent').innerHTML = '';
}

document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target === document.getElementById('lightbox')) fecharLightbox();
});

/* ══════════════════════════════════════════════════════════
   UTILITÁRIOS
══════════════════════════════════════════════════════════ */
function filtrarLista(q) {
  const termo = q.toLowerCase();
  document.querySelectorAll('.rdo-card').forEach(card => {
    const txt = card.textContent.toLowerCase();
    card.style.display = txt.includes(termo) ? '' : 'none';
  });
}

function abrirModal(id)  { document.getElementById(id).classList.remove('hidden'); }
function fecharModal(id) { document.getElementById(id).classList.add('hidden'); }

function toggleUserMenu() {
  document.getElementById('userDropdown')?.classList.toggle('hidden');
}

function handleLogout() {
  localStorage.removeItem('sis_token');
  localStorage.removeItem('sis_user');
  sessionStorage.removeItem('sis_token');
  sessionStorage.removeItem('sis_user');
  window.location.href = '../index.html';
}

function toast(msg, tipo = 'info') {
  const ct  = document.getElementById('toastContainer');
  const el  = document.createElement('div');
  el.className = `toast ${tipo}`;
  const icon = tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle';
  el.innerHTML = `<i class="fas fa-${icon}"></i> ${msg}`;
  ct.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
