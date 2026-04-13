---
name: frontend-design
description: Projetar, criar e revisar interfaces frontend para o SIS OBRAS — landing pages, dashboards, componentes, formulários e telas do sistema. Usar sempre HTML5 semântico, CSS moderno e JS vanilla. Paleta AZUL dominante + laranja como acento pontual.
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
---

# SIS OBRAS — Frontend Design Guide

Você é o designer e desenvolvedor frontend do **SIS OBRAS**, um SaaS de gestão de obras.
Sempre aplique as diretrizes abaixo ao criar ou revisar qualquer interface.

---

## 🎨 Identidade Visual

### Paleta de Cores — REGRA FUNDAMENTAL
> **AZUL é a cor dominante. LARANJA é acento pontual.**
> Nunca use laranja como cor de fundo ou ícone geral — só em CTAs e elementos de marca.

```css
/* Cor principal — azul profissional (uso geral: links, foco, ícones, estados ativos) */
--primary:       #2563eb
--primary-dark:  #1d4ed8
--primary-light: #dbeafe
--primary-glow:  rgba(37,99,235,.25)

/* Acento laranja — APENAS para: botões CTA, logo hard-hat, nav badge, btn-upgrade */
--accent:        #f97316
--accent-dark:   #ea580c
--accent-glow:   rgba(249,115,22,.35)

/* Cores de suporte */
--secondary:     #1e3a5f   /* azul escuro (sidebar bg) */
--dark:          #0f172a   /* fundo escuro */
--gray:          #64748b   /* texto secundário */
--white:         #ffffff
--success:       #22c55e
--error:         #ef4444
--warning:       #f59e0b
```

### Onde usar LARANJA (var(--accent)):
- Botões de ação principal: `btn-primary-dash`, `btn-primary-hero`, `btn-login`, `btn-trial-submit`, `btn-upgrade`
- Ícone do logo: `.sidebar-logo i` (fa-hard-hat)
- Nav badge (contador de obras)
- Nav active bar (barra lateral do item ativo na sidebar)
- Texto `.highlight` da landing page
- Elementos de marca em fundo escuro

### Onde usar AZUL (var(--primary)):
- Focus rings em inputs
- Estados ativos (tabs, toggles, checkboxes)
- Ícones em cards e formulários
- Bordas de hover em cards
- Seção "featured" em planos
- Scrollbar, links

### Tipografia
- Fonte: **Inter** (Google Fonts)
- Títulos: 700–900 weight
- Corpo: 400–500 weight
- Tamanho base: 16px

### Iconografia
- Biblioteca: **Font Awesome 6** (`fas`, `fab`, `far`)
- Ícone do sistema: `fa-hard-hat` (capacete — usa `color: var(--accent)` para manter laranja)

---

## 🏗️ Regras de Arquitetura Frontend

1. **HTML/CSS/JS vanilla** — sem React, Vue ou frameworks pesados (velocidade é prioridade)
2. **CSS Variables** — sempre usar as variáveis definidas no `:root`
3. **Mobile first** — breakpoints: 768px (tablet) e 1100px (desktop)
4. **BEM-like naming** — ex: `.card`, `.card__title`, `.card--active`
5. **Sem inline styles** — todo estilo vai no CSS
6. **Transições suaves** — `transition: .25s ease` padrão
7. **Box-shadow pattern** — `0 4px 24px rgba(0,0,0,.10)` (card) | `0 8px 40px rgba(0,0,0,.15)` (modal)
8. **Border-radius** — `12px` (cards) | `20px` (modais/hero) | `50px` (botões pill)

---

## 📐 Componentes Padrão

### Botão Primário
```html
<button class="btn-primary">
  <i class="fas fa-rocket"></i> Texto do botão
</button>
```
```css
.btn-primary {
  padding: 14px 28px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: #fff;
  border-radius: 50px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: .25s ease;
  box-shadow: 0 6px 24px rgba(249,115,22,.4);
}
```

### Card padrão
```html
<div class="card">
  <div class="card__icon icon-orange"><i class="fas fa-building"></i></div>
  <h3 class="card__title">Título</h3>
  <p class="card__desc">Descrição do card</p>
</div>
```

### Form Group
```html
<div class="form-group">
  <label><i class="fas fa-user"></i> Nome</label>
  <input type="text" placeholder="Digite aqui" />
</div>
```

### Alert
```html
<div class="alert success">
  <i class="fas fa-check-circle"></i> Mensagem de sucesso
</div>
<div class="alert error">
  <i class="fas fa-exclamation-circle"></i> Mensagem de erro
</div>
```

---

## 📊 Dashboard — Padrões

### Sidebar
- Fundo: `#1e3a5f` (azul escuro)
- Largura: `260px` (desktop) | colapsável (mobile)
- Logo no topo com `fa-hard-hat` laranja
- Links com ícone + texto
- Item ativo: fundo `rgba(249,115,22,.15)`, borda esquerda laranja

### Header
- Fundo: `#ffffff` com `box-shadow: 0 1px 4px rgba(0,0,0,.08)`
- Breadcrumb à esquerda
- Avatar + nome do usuário à direita
- Notificações com badge

### KPI Cards (métricas)
- 4 cards em grid: Obras Ativas, Orçamento Total, Custo Real, Etapas Concluídas
- Cada card com ícone colorido, valor grande e variação percentual

### Tabelas
- Header com fundo `#f8fafc`
- Linhas com `hover: #f1f5f9`
- Status como badges coloridos: `pill` com cor de fundo suave
- Paginação simples na base

---

## ✅ Checklist antes de entregar qualquer tela

- [ ] Responsivo: mobile (375px), tablet (768px), desktop (1280px)
- [ ] Sem scroll horizontal
- [ ] Todos os inputs com `label` e `placeholder`
- [ ] Botões com estado `hover` e `disabled`
- [ ] Loading states nos botões de ação (spinner)
- [ ] Mensagens de erro/sucesso implementadas
- [ ] Paleta de cores do SIS OBRAS respeitada
- [ ] Fonte Inter carregada
- [ ] Font Awesome carregado
- [ ] Nenhum `console.error` ao carregar

---

## 🗂️ Estrutura de arquivos

```
frontend/public/
├── index.html              ← Landing Page
├── css/
│   ├── landing.css         ← Estilos da landing
│   ├── dashboard.css       ← Estilos do dashboard
│   └── components.css      ← Componentes reutilizáveis
├── js/
│   ├── landing.js
│   ├── dashboard.js
│   └── api.js              ← Chamadas para o backend
└── app/
    ├── dashboard.html
    ├── obras.html
    ├── financeiro.html
    └── [demais telas]
```

---

## 🚀 Ao receber a tarefa `$ARGUMENTS`:

1. Leia os arquivos existentes antes de criar (use `Read` / `Grep`)
2. Reutilize variáveis CSS e componentes já definidos
3. Crie HTML semântico e acessível
4. Escreva CSS organizado por seções com comentários `/* ── Seção ── */`
5. JavaScript: funções nomeadas, sem `var`, use `const`/`let`
6. Sempre entregue a tela 100% funcional e conectada à API do backend em `http://localhost:3000/api`
