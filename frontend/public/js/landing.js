/* ═══════════════════════════════════════════════════════════
   SISENG — Landing Page JS  v2.0
   Animações, contadores, scroll reveal, interações
═══════════════════════════════════════════════════════════ */

const API_URL = '/api';

/* ── Scroll Reveal ──────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* Adiciona reveal dinamicamente a cards e seções */
const revealSelectors = [
  '.feature-card', '.plan-card', '.testimonial-card',
  '.step', '.contact-card', '.section-header',
  '.trial-content', '.trial-form-wrap'
];
revealSelectors.forEach(sel => {
  document.querySelectorAll(sel).forEach((el, i) => {
    el.classList.add('reveal');
    if (i > 0) el.classList.add(`reveal-delay-${Math.min(i, 4)}`);
    revealObserver.observe(el);
  });
});

/* ── Navbar scroll ──────────────────────────────────────── */
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const curr = window.scrollY;
  navbar.classList.toggle('scrolled', curr > 40);
  lastScroll = curr;
}, { passive: true });

/* ── Menu mobile ───────────────────────────────────────── */
const navToggle   = document.getElementById('navToggle');
const navLinks    = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.innerHTML = open
    ? '<i class="fas fa-times"></i>'
    : '<i class="fas fa-bars"></i>';
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.innerHTML = '<i class="fas fa-bars"></i>';
  });
});

/* Fecha menu ao clicar fora */
document.addEventListener('click', e => {
  if (!navbar.contains(e.target)) {
    navLinks.classList.remove('open');
    navToggle.innerHTML = '<i class="fas fa-bars"></i>';
  }
});

/* ── Contadores animados ─────────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.counter, 10);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = 1800;
  const start = performance.now();

  const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

  const step = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.round(easeOutExpo(progress) * target);
    el.textContent = prefix + current.toLocaleString('pt-BR') + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-counter]').forEach(el => counterObserver.observe(el));

/* ── Scroll to sections ──────────────────────────────────── */
function scrollToTrial() {
  document.getElementById('trial').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openDemo() {
  showAlert('loginAlert', 'info', '<i class="fas fa-info-circle"></i> Demonstração em breve! Cadastre-se para o teste grátis.');
}

/* ── Toggle senha ────────────────────────────────────────── */
function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon  = btn.querySelector('i');
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
}

/* ── Alert helper ────────────────────────────────────────── */
function showAlert(containerId, type, message) {
  const el = document.getElementById(containerId);
  el.className = `alert ${type}`;
  el.innerHTML = message;
  el.classList.remove('hidden');
  if (type === 'success') setTimeout(() => el.classList.add('hidden'), 6000);
}
function hideAlert(id) {
  document.getElementById(id).classList.add('hidden');
}

/* ── Loading button ──────────────────────────────────────── */
function setLoading(btnId, loading) {
  const btn  = document.getElementById(btnId);
  const text = btn.querySelector('.btn-text');
  const spin = btn.querySelector('.btn-loading');
  btn.disabled = loading;
  text.classList.toggle('hidden', loading);
  spin.classList.toggle('hidden', !loading);
}

/* ══════════════════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════════════════ */
async function handleLogin(event) {
  event.preventDefault();
  hideAlert('loginAlert');

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;
  const remember = document.getElementById('rememberMe').checked;

  if (!email || !password) {
    showAlert('loginAlert', 'error', '<i class="fas fa-exclamation-circle"></i> Preencha e-mail e senha.');
    return;
  }

  setLoading('loginBtn', true);

  /* ── MODO DEMO: acesso direto sem backend ── */
  try {
    const res  = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, remember })
    });
    const data = await res.json();

    if (res.ok && data.token) {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('sis_token', data.token);
      storage.setItem('sis_user', JSON.stringify(data.user));
      showAlert('loginAlert', 'success', '<i class="fas fa-check-circle"></i> Login realizado! Redirecionando...');
      setTimeout(() => { window.location.href = 'app/dashboard.html'; }, 1000);
    } else {
      showAlert('loginAlert', 'error', `[${res.status}] ${data.message || 'E-mail ou senha incorretos.'}`);
    }
  } catch (err) {
    showAlert('loginAlert', 'error', `Erro: ${err.message}`);
  } finally {
    setLoading('loginBtn', false);
  }
}

/* ══════════════════════════════════════════════════════════
   TRIAL — CADASTRO
══════════════════════════════════════════════════════════ */
function startTrial(plan) {
  document.getElementById('trialPlan').value = plan;
  scrollToTrial();
}

async function handleTrial(event) {
  event.preventDefault();
  hideAlert('trialAlert');

  const payload = {
    name:     document.getElementById('trialName').value.trim(),
    company:  document.getElementById('trialCompany').value.trim(),
    email:    document.getElementById('trialEmail').value.trim(),
    phone:    document.getElementById('trialPhone').value.trim(),
    password: document.getElementById('trialPass').value,
    plan:     document.getElementById('trialPlan').value
  };

  if (!payload.name || !payload.company || !payload.email || !payload.password) {
    showAlert('trialAlert', 'error', '<i class="fas fa-exclamation-circle"></i> Preencha todos os campos obrigatórios.');
    return;
  }
  if (payload.password.length < 8) {
    showAlert('trialAlert', 'error', '<i class="fas fa-exclamation-circle"></i> A senha deve ter pelo menos 8 caracteres.');
    return;
  }

  setLoading('trialBtn', true);

  try {
    const res  = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      showAlert('trialAlert', 'success',
        '<i class="fas fa-check-circle"></i> Conta criada! Verifique seu e-mail para ativar o acesso. Bem-vindo ao SISENG!');
      document.getElementById('trialForm').reset();
    } else {
      showAlert('trialAlert', 'error',
        `<i class="fas fa-exclamation-circle"></i> ${data.message || 'Erro ao criar conta. Tente novamente.'}`);
    }
  } catch {
    showAlert('trialAlert', 'error', '<i class="fas fa-exclamation-circle"></i> Erro de conexão. Verifique sua internet.');
  } finally {
    setLoading('trialBtn', false);
  }
}

/* ══════════════════════════════════════════════════════════
   ESQUECI SENHA
══════════════════════════════════════════════════════════ */
function openForgotPassword(e) {
  e?.preventDefault();
  const modal = document.getElementById('forgotModal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('forgotEmail')?.focus(), 200);
}

function closeForgotPassword() {
  document.getElementById('forgotModal').classList.add('hidden');
  document.body.style.overflow = '';
  hideAlert('forgotAlert');
}

document.getElementById('forgotModal').addEventListener('click', function(e) {
  if (e.target === this) closeForgotPassword();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeForgotPassword();
});

async function handleForgotPassword(event) {
  event.preventDefault();
  hideAlert('forgotAlert');
  const email = document.getElementById('forgotEmail').value.trim();
  if (!email) { showAlert('forgotAlert', 'error', '<i class="fas fa-exclamation-circle"></i> Informe seu e-mail.'); return; }

  try {
    await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  } catch { /* silencioso por segurança */ }

  showAlert('forgotAlert', 'success',
    '<i class="fas fa-check-circle"></i> Se este e-mail estiver cadastrado, você receberá as instruções em breve.');
  document.getElementById('forgotEmail').value = '';
}

/* ══════════════════════════════════════════════════════════
   PLANOS — TOGGLE MENSAL / ANUAL
══════════════════════════════════════════════════════════ */
let currentPeriod = 'monthly';

function togglePeriod() {
  setPeriod(currentPeriod === 'monthly' ? 'annual' : 'monthly');
}
function setPeriod(period) {
  currentPeriod = period;
  const toggle = document.querySelector('.toggle-switch');
  document.getElementById('lbl-monthly').classList.toggle('active', period === 'monthly');
  document.getElementById('lbl-annual').classList.toggle('active',  period === 'annual');
  toggle.classList.toggle('on', period === 'annual');

  document.querySelectorAll('.price').forEach(el => {
    const val = el.dataset[period];
    if (!val) return;
    el.style.transform = 'scale(1.2)';
    setTimeout(() => {
      el.textContent = parseInt(val).toLocaleString('pt-BR');
      el.style.transform = 'scale(1)';
    }, 150);
  });
}
document.querySelectorAll('.price').forEach(el => {
  el.style.transition = 'transform .2s ease';
});

/* ── Máscara telefone ────────────────────────────────────── */
const phoneInput = document.getElementById('trialPhone');
if (phoneInput) {
  phoneInput.addEventListener('input', function() {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    if      (v.length <= 2)  v = v.replace(/(\d{0,2})/,           '($1');
    else if (v.length <= 6)  v = v.replace(/(\d{2})(\d{0,4})/,    '($1) $2');
    else if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else                     v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    this.value = v;
  });
}

/* ── Verificar token ao carregar ─────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('sis_token') || sessionStorage.getItem('sis_token');
  // Se já logado, pode redirecionar:
  // if (token) window.location.href = '/app/dashboard.html';

  /* Parallax suave no hero */
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const orb1 = document.querySelector('.hero-orb-1');
    const orb2 = document.querySelector('.hero-orb-2');
    if (orb1) orb1.style.transform = `translateY(${scrollY * .15}px)`;
    if (orb2) orb2.style.transform = `translateY(${-scrollY * .1}px)`;
  }, { passive: true });
});
