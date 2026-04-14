/* ═══════════════════════════════════════════════════════════
   SISENG — Dashboard JS  v2.0
   Gráficos SVG, contadores, tabela, atividade, sidebar
═══════════════════════════════════════════════════════════ */

const API_URL = (typeof API_BASE !== 'undefined') ? API_BASE : '/api';

/* ══════════════════════════════════════════════════════════
   DADOS MOCK (substituir por fetch quando API estiver pronta)
══════════════════════════════════════════════════════════ */
const OBRAS = [
  { id:1, nome:'Residencial das Palmeiras', cliente:'João Alves',  resp:'Carlos M.',  pct:72, orc:850000,  gasto:612000, prazo:'2026-05-15', status:'ativo' },
  { id:2, nome:'Edifício Aurora Comercial', cliente:'Grupo Aurora', resp:'Ana Lima',   pct:45, orc:2200000, gasto:990000, prazo:'2026-08-30', status:'ativo' },
  { id:3, nome:'Condomínio Verde Norte',   cliente:'VN Holdings', resp:'Pedro S.',    pct:88, orc:640000,  gasto:563200, prazo:'2026-04-10', status:'atrasado' },
  { id:4, nome:'Galpão Industrial BrasFab',cliente:'BrasFab S.A.', resp:'Mariana R.', pct:25, orc:420000,  gasto:105000, prazo:'2026-12-01', status:'ativo' },
  { id:5, nome:'Reforma Hotel Meridian',   cliente:'HM Invest.',  resp:'Lucas T.',    pct:60, orc:310000,  gasto:186000, prazo:'2026-06-20', status:'pausada' },
  { id:6, nome:'Loteamento Parque Sereno', cliente:'MRV Part.',   resp:'Carlos M.',   pct:10, orc:1580000, gasto:158000, prazo:'2027-03-15', status:'plano' },
];

const ATIVIDADES = [
  { icon:'fa-check-circle', cor:'kpi-green',  texto:'<strong>Fundação concluída</strong> — Ed. Aurora foi marcada como concluída por Ana Lima.',       tempo:'5 min atrás' },
  { icon:'fa-dollar-sign',  cor:'kpi-blue',   texto:'<strong>Lançamento</strong> — R$ 28.400 adicionados ao Residencial das Palmeiras.',               tempo:'42 min atrás' },
  { icon:'fa-exclamation-triangle', cor:'kpi-red', texto:'<strong>Alerta de desvio</strong> — Condomínio Verde Norte ultrapassou orçamento em 8%.',   tempo:'2h atrás' },
  { icon:'fa-upload',       cor:'kpi-orange', texto:'<strong>Documento enviado</strong> — ART Estrutural do Galpão BrasFab foi anexada.',              tempo:'3h atrás' },
  { icon:'fa-user-plus',    cor:'kpi-blue',   texto:'<strong>Novo usuário</strong> — Mariana Rocha adicionada como Engenheira no sistema.',            tempo:'1 dia atrás' },
  { icon:'fa-calendar-check', cor:'kpi-green',texto:'<strong>Etapa agendada</strong> — Estrutura do Hotel Meridian prevista para 20/04/2026.',         tempo:'1 dia atrás' },
  { icon:'fa-file-contract',cor:'kpi-orange', texto:'<strong>Contrato renovado</strong> — Fornecedor Aço Norte teve contrato prorrogado por 90 dias.', tempo:'2 dias atrás' },
];

const FINANCEIRO = {
  meses:    ['Out','Nov','Dez','Jan','Fev','Mar'],
  orcado:   [680, 720, 750, 810, 850, 890],
  real:     [510, 590, 630, 700, 740, 780]
};

const STATUS_DONUT = [
  { label:'Em Andamento', count:7, cor:'#f97316' },
  { label:'Atrasada',     count:2, cor:'#ef4444' },
  { label:'Pausada',      count:1, cor:'#f59e0b' },
  { label:'Planejamento', count:2, cor:'#3b82f6' },
];

/* ══════════════════════════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadUser();
  setDate();
  renderTable();
  renderActivity();
  renderBarChart();
  renderDonut();
  initReveal();
  initCounters();
  initSidebar();

  renderSidebar('dashboard');
  initSearch();
  initKeyboard();
  loadObrasCount();
});

/* ── Usuário ───────────────────────────────────────────── */
function loadUser() {
  const raw  = localStorage.getItem('sis_user') || sessionStorage.getItem('sis_user');
  const user = raw ? JSON.parse(raw) : { nome: 'Admin Demo', email: 'demo@siseng.com.br', empresa: 'Empresa Demo' };

  const initials = user.nome.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();

  ['sidebarAvatar','headerAvatar','dropAvatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = initials;
  });
  ['sidebarName','headerName'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = user.nome;
  });
  const dropName    = document.getElementById('dropName');    if (dropName) dropName.textContent = user.nome;
  const dropEmail   = document.getElementById('dropEmail');   if (dropEmail) dropEmail.textContent = user.email;
  const headerComp  = document.getElementById('headerCompany'); if (headerComp) headerComp.textContent = user.empresa || 'SISENG';

  if (user.trialExpira) {
    const dias = Math.ceil((new Date(user.trialExpira) - new Date()) / 86400000);
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

/* ── Data ──────────────────────────────────────────────── */
function setDate() {
  const now  = new Date();
  const opts = { weekday:'long', day:'numeric', month:'long', year:'numeric' };
  const str  = now.toLocaleDateString('pt-BR', opts);
  const el   = document.getElementById('dateDisplay');
  if (el) el.textContent = str.charAt(0).toUpperCase() + str.slice(1);
}

/* ══════════════════════════════════════════════════════════
   TABELA DE OBRAS
══════════════════════════════════════════════════════════ */
function renderTable(filter = '') {
  const tbody = document.getElementById('obrasBody');
  const count = document.getElementById('tableCount');
  if (!tbody) return;

  const filtered = OBRAS.filter(o =>
    o.nome.toLowerCase().includes(filter.toLowerCase()) ||
    o.cliente.toLowerCase().includes(filter.toLowerCase())
  );

  tbody.innerHTML = filtered.map(o => {
    const pct   = o.pct;
    const usado = ((o.gasto / o.orc) * 100).toFixed(0);

    const hoje     = new Date();
    const prazo    = new Date(o.prazo);
    const diffDias = Math.round((prazo - hoje) / 86400000);
    const prazoClass = diffDias < 0 ? 'prazo-late' : diffDias < 30 ? 'prazo-warn' : 'prazo-ok';
    const prazoText  = diffDias < 0
      ? `${Math.abs(diffDias)}d atrasado`
      : diffDias === 0 ? 'Hoje!'
      : `${diffDias}d restantes`;

    const statusMap = {
      ativo:    { cls:'sb-ativo',    label:'Ativo' },
      atrasado: { cls:'sb-atrasado', label:'Atrasado' },
      pausada:  { cls:'sb-pausada',  label:'Pausada' },
      plano:    { cls:'sb-plano',    label:'Planejamento' },
    };
    const s = statusMap[o.status] || statusMap.ativo;
    const respInit = o.resp.split(' ').map(n=>n[0]).slice(0,2).join('');

    return `<tr>
      <td>
        <div class="obra-name">${o.nome}</div>
        <div class="obra-client">${o.cliente}</div>
      </td>
      <td>
        <div class="responsavel">
          <div class="resp-avatar">${respInit}</div>
          <span class="resp-name">${o.resp}</span>
        </div>
      </td>
      <td>
        <div class="progress-wrap">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
          <span class="progress-pct">${pct}%</span>
        </div>
      </td>
      <td>
        <div class="orcamento-val">R$ ${formatCurrency(o.orc)}</div>
        <div class="orcamento-uso">${usado}% utilizado</div>
      </td>
      <td>
        <div class="prazo-date">${prazo.toLocaleDateString('pt-BR')}</div>
        <div class="prazo-dias ${prazoClass}">${prazoText}</div>
      </td>
      <td><span class="status-badge ${s.cls}"><span class="sb-dot"></span>${s.label}</span></td>
      <td>
        <button class="action-btn" onclick="viewObra(${o.id})" title="Ver detalhes">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    </tr>`;
  }).join('');

  if (count) count.textContent = `Mostrando ${filtered.length} de ${OBRAS.length} obras`;
}

function filterTable(val) {
  renderTable(val);
}
function viewObra(id) {
  window.location.href = `obras.html?id=${id}`;
}

/* ══════════════════════════════════════════════════════════
   FEED DE ATIVIDADE
══════════════════════════════════════════════════════════ */
function renderActivity() {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;

  feed.innerHTML = ATIVIDADES.map(a => `
    <div class="activity-item">
      <div class="act-icon ${a.cor}">
        <i class="fas ${a.icon}"></i>
      </div>
      <div class="act-body">
        <p>${a.texto}</p>
        <time>${a.tempo}</time>
      </div>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════════════════
   GRÁFICO DE BARRAS — SVG
══════════════════════════════════════════════════════════ */
function renderBarChart() {
  const chart  = document.getElementById('financeChart');
  const labels = document.getElementById('financeLabels');
  if (!chart || !labels) return;

  const maxVal = Math.max(...FINANCEIRO.orcado, ...FINANCEIRO.real);

  FINANCEIRO.meses.forEach((mes, i) => {
    const hOrc  = Math.round((FINANCEIRO.orcado[i] / maxVal) * 140);
    const hReal = Math.round((FINANCEIRO.real[i]   / maxVal) * 140);

    const group = document.createElement('div');
    group.className = 'bar-group';
    group.innerHTML = `
      <div class="bar bar-blue"  style="height:0" data-h="${hOrc}"  title="Orçado: R$ ${FINANCEIRO.orcado[i]}K"></div>
      <div class="bar bar-orange"style="height:0" data-h="${hReal}" title="Real: R$ ${FINANCEIRO.real[i]}K"></div>
    `;
    chart.appendChild(group);

    const lbl = document.createElement('div');
    lbl.className = 'bar-label';
    lbl.textContent = mes;
    labels.appendChild(lbl);
  });

  /* Anima barras com delay */
  setTimeout(() => {
    chart.querySelectorAll('.bar').forEach((bar, i) => {
      setTimeout(() => {
        bar.style.height = bar.dataset.h + 'px';
      }, i * 60);
    });
  }, 300);
}

/* ══════════════════════════════════════════════════════════
   GRÁFICO DONUT — SVG
══════════════════════════════════════════════════════════ */
function renderDonut() {
  const svg    = document.getElementById('donutChart');
  const legend = document.getElementById('donutLegend');
  if (!svg || !legend) return;

  const total  = STATUS_DONUT.reduce((s, d) => s + d.count, 0);
  const r      = 46;
  const cx     = 60; const cy = 60;
  const stroke = 16;
  const circ   = 2 * Math.PI * r;

  let offset = 0;
  let paths  = '';

  STATUS_DONUT.forEach(d => {
    const pct  = d.count / total;
    const dash = pct * circ;
    const gap  = circ - dash;
    paths += `<circle
      cx="${cx}" cy="${cy}" r="${r}"
      fill="none"
      stroke="${d.cor}"
      stroke-width="${stroke}"
      stroke-dasharray="${dash} ${gap}"
      stroke-dashoffset="${-offset}"
      stroke-linecap="round"
      style="transition: stroke-dasharray .8s cubic-bezier(.34,1.56,.64,1)"
    />`;
    offset += dash;
  });

  /* Círculo de fundo */
  svg.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${stroke}"/>
    ${paths}
  `;

  /* Legenda */
  legend.innerHTML = STATUS_DONUT.map(d => `
    <div class="donut-legend-item">
      <span class="dl-left">
        <span class="dl-dot" style="background:${d.cor}"></span>
        ${d.label}
      </span>
      <span class="dl-count">${d.count}</span>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════════════════
   CONTADORES ANIMADOS
══════════════════════════════════════════════════════════ */
function initCounters() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.counter, 10);
      const format = el.dataset.format;
      const prefix = el.dataset.prefix || '';

      animateCount(el, 0, target, 1600, (val) => {
        if (format === 'currency') {
          if (val >= 1000000) el.textContent = prefix + (val/1000000).toFixed(2).replace('.',',') + 'M';
          else el.textContent = prefix + formatCurrency(val);
        } else {
          el.textContent = val.toLocaleString('pt-BR');
        }
      });
      obs.unobserve(el);
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('[data-counter]').forEach(el => obs.observe(el));
}

function animateCount(el, from, to, dur, cb) {
  const start = performance.now();
  const ease  = t => 1 - Math.pow(1 - t, 3);
  const step  = now => {
    const t   = Math.min((now - start) / dur, 1);
    const val = Math.round(ease(t) * (to - from) + from);
    cb(val);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ══════════════════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════════════════ */
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ══════════════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════════════ */
function toggleNavGroup(groupId) {
  const group = document.getElementById(groupId);
  if (group) group.classList.toggle('open');
}

function initSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const wrapper  = document.getElementById('mainWrapper');
  const toggle   = document.getElementById('sidebarToggle');
  const menuBtn  = document.getElementById('menuBtn');
  const overlay  = document.getElementById('sidebarOverlay');
  let collapsed  = false;

  if (toggle) {
    toggle.addEventListener('click', () => {
      if (window.innerWidth > 900) {
        collapsed = !collapsed;
        sidebar.classList.toggle('collapsed', collapsed);
        wrapper.classList.toggle('expanded',  collapsed);
      }
    });
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');
      } else {
        collapsed = !collapsed;
        sidebar.classList.toggle('collapsed', collapsed);
        wrapper.classList.toggle('expanded',  collapsed);
      }
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    });
  }
}

/* ══════════════════════════════════════════════════════════
   NOTIFICAÇÕES & USER MENU
══════════════════════════════════════════════════════════ */
function toggleNotifications() {
  const panel   = document.getElementById('notifPanel');
  const dropdown = document.getElementById('userDropdown');
  dropdown.classList.add('hidden');
  panel.classList.toggle('hidden');
}

function toggleUserMenu() {
  const dropdown = document.getElementById('userDropdown');
  const panel    = document.getElementById('notifPanel');
  panel.classList.add('hidden');
  dropdown.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('userDropdown');
  const panel    = document.getElementById('notifPanel');
  if (!e.target.closest('.header-user') && !e.target.closest('.user-dropdown')) {
    dropdown?.classList.add('hidden');
  }
  if (!e.target.closest('.header-btn') && !e.target.closest('.notif-panel')) {
    panel?.classList.add('hidden');
  }
});

function markAllRead() {
  document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
  const badge = document.querySelector('.header-badge');
  if (badge) badge.style.display = 'none';
}

/* ══════════════════════════════════════════════════════════
   LOGOUT
══════════════════════════════════════════════════════════ */
function handleLogout() {
  localStorage.removeItem('sis_token');
  localStorage.removeItem('sis_user');
  sessionStorage.removeItem('sis_token');
  sessionStorage.removeItem('sis_user');
  window.location.href = '../index.html';
}

/* ══════════════════════════════════════════════════════════
   MODAL NOVA OBRA
══════════════════════════════════════════════════════════ */
function openNovaObra() {
  document.getElementById('novaObraModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeNovaObra() {
  document.getElementById('novaObraModal').classList.add('hidden');
  document.body.style.overflow = '';
}
function saveNovaObra() {
  // TODO: conectar à API
  closeNovaObra();
  showToast('Obra criada com sucesso!', 'success');
}

document.getElementById('novaObraModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeNovaObra();
});

/* ══════════════════════════════════════════════════════════
   TOAST NOTIFICATION
══════════════════════════════════════════════════════════ */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
    ${message}
  `;
  toast.style.cssText = `
    position:fixed; bottom:28px; right:28px; z-index:9999;
    display:flex; align-items:center; gap:10px;
    background:${type==='success'?'#22c55e':'#ef4444'};
    color:#fff; padding:14px 20px; border-radius:12px;
    font-size:.875rem; font-weight:700;
    box-shadow:0 8px 28px rgba(0,0,0,.2);
    animation:slideUp .3s cubic-bezier(.34,1.56,.64,1);
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

/* ══════════════════════════════════════════════════════════
   EXPORT PDF (placeholder)
══════════════════════════════════════════════════════════ */
function exportReport() {
  showToast('Gerando relatório... você receberá por e-mail.', 'success');
}

/* ══════════════════════════════════════════════════════════
   BUSCA GLOBAL
══════════════════════════════════════════════════════════ */
function initSearch() {
  const input = document.getElementById('globalSearch');
  if (!input) return;
  input.addEventListener('input', e => {
    // TODO: busca global na API
  });
}

function initKeyboard() {
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('globalSearch')?.focus();
    }
    if (e.key === 'Escape') {
      closeNovaObra();
      document.getElementById('userDropdown')?.classList.add('hidden');
      document.getElementById('notifPanel')?.classList.add('hidden');
    }
  });
}

/* ── Helpers ───────────────────────────────────────────── */
function formatCurrency(val) {
  return val >= 1000000
    ? (val/1000000).toFixed(2).replace('.',',') + 'M'
    : val.toLocaleString('pt-BR');
}
