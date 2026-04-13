/* ═══════════════════════════════════════════════════════════
   SISENG — Sidebar dinâmica centralizada
   Inclua este script em todas as páginas do app e chame:
     renderSidebar('nome-da-pagina-ativa')
   Ex: renderSidebar('cotacoes')
═══════════════════════════════════════════════════════════ */

const SIDEBAR_MENU = [
  {
    section: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', href: 'dashboard.html' },
    ]
  },
  {
    section: 'Cadastros',
    group: 'cadastros',
    icon: 'fa-database',
    label: 'Cadastros',
    items: [
      { id: 'obras',        label: 'Obras',           icon: 'fa-hard-hat',    href: 'obras.html' },
      { id: 'fornecedores', label: 'Fornecedores',    icon: 'fa-truck',       href: 'fornecedores.html' },
      { id: 'modelos',      label: 'Modelos de Etapa',icon: 'fa-list-check',  href: 'modelos-etapa.html' },
      { id: 'grupos',       label: 'Grupos',          icon: 'fa-layer-group', href: 'grupos-item.html' },
      { id: 'subgrupos',    label: 'Subgrupos',       icon: 'fa-sitemap',     href: 'subgrupos-item.html' },
      { id: 'itens',        label: 'Itens',           icon: 'fa-box',         href: 'itens-compra.html' },
    ]
  },
  {
    section: 'Operacional',
    items: [
      { id: 'diario', label: 'Diário de Obras', icon: 'fa-book-open', href: 'diario.html' },
    ]
  },
  {
    group: 'cronograma',
    icon: 'fa-calendar-alt',
    label: 'Cronograma',
    items: [
      { id: 'etapas',    label: 'Planejamento', icon: 'fa-project-diagram', href: 'etapas.html' },
      { id: 'medicao',   label: 'Medição',      icon: 'fa-ruler-combined',  href: 'medicao.html' },
      { id: 'analise',   label: 'Análise',      icon: 'fa-chart-line',      href: 'analise-cronograma.html' },
    ]
  },
  {
    group: 'compras',
    icon: 'fa-shopping-cart',
    label: 'Compras',
    items: [
      { id: 'cotacoes', label: 'Cotações',       icon: 'fa-file-invoice', href: 'cotacao.html' },
      { id: 'mapa',     label: 'Mapa de Cotação',icon: 'fa-table',        href: 'mapa-cotacao.html' },
    ]
  },
  {
    section: 'Sistema',
    items: [
      { id: 'financeiro',  label: 'Financeiro',  icon: 'fa-dollar-sign',  href: 'financeiro.html' },
      { id: 'equipe',      label: 'Equipe',      icon: 'fa-users',        href: 'equipe.html' },
      { id: 'documentos',  label: 'Documentos',  icon: 'fa-folder-open',  href: 'documentos.html' },
    ]
  },
];

function renderSidebar(activeId) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Detecta grupo ativo para abrir automaticamente
  const activeGroup = _findActiveGroup(activeId);

  let nav = '<nav class="sidebar-nav">';

  for (const block of SIDEBAR_MENU) {
    // Section label
    if (block.section) {
      nav += `<div class="nav-section-label">${block.section}</div>`;
    }

    // Grupo colapsável
    if (block.group) {
      const isOpen = block.group === activeGroup;
      nav += `
        <div class="nav-group ${isOpen ? 'open' : ''}" id="navGroup_${block.group}">
          <div class="nav-item nav-group-trigger" onclick="toggleNavGroup('navGroup_${block.group}')">
            <i class="fas ${block.icon}"></i><span>${block.label}</span>
            <i class="fas fa-chevron-down nav-group-arrow"></i>
          </div>
          <div class="nav-submenu">
            ${block.items.map(item => `
              <a href="${item.href}" class="nav-item nav-sub-item${item.id === activeId ? ' active' : ''}">
                <i class="fas ${item.icon}"></i><span>${item.label}</span>
              </a>`).join('')}
          </div>
        </div>`;
    } else {
      // Itens simples
      for (const item of block.items) {
        nav += `
          <a href="${item.href}" class="nav-item${item.id === activeId ? ' active' : ''}">
            <i class="fas ${item.icon}"></i><span>${item.label}</span>
          </a>`;
      }
    }
  }

  nav += '</nav>';

  // Substitui apenas o nav (mantém header, user, footer)
  const existing = sidebar.querySelector('nav.sidebar-nav');
  if (existing) {
    existing.outerHTML = nav;
  } else {
    sidebar.innerHTML += nav;
  }
}

function _findActiveGroup(activeId) {
  for (const block of SIDEBAR_MENU) {
    if (block.group && block.items.some(i => i.id === activeId)) return block.group;
  }
  return null;
}

// Expõe toggleNavGroup globalmente (caso ainda não esteja definido)
if (typeof window.toggleNavGroup === 'undefined') {
  window.toggleNavGroup = function(id) {
    document.getElementById(id)?.classList.toggle('open');
  };
}
