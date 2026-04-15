const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.MAIL_PORT || '587'),
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const FROM = process.env.MAIL_FROM || '"SISENG" <noreply@siseng.com.br>';
const BASE = process.env.FRONTEND_URL || 'http://localhost:3000';
const YEAR = new Date().getFullYear();

/* ── Template base ──────────────────────────────────────── */
function baseTemplate(titulo, corTopo = '#1e3a5f', corpo) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)">
        <!-- HEADER -->
        <tr>
          <td style="background:${corTopo};padding:28px 36px">
            <table width="100%"><tr>
              <td>
                <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-1px">SIS</span>
                <span style="font-size:22px;font-weight:900;color:#f97316;letter-spacing:-1px">ENG</span>
              </td>
              <td align="right">
                <span style="font-size:11px;color:rgba(255,255,255,.6);font-weight:500">Sistema de Gestão de Obras</span>
              </td>
            </tr></table>
            <div style="height:3px;background:#f97316;border-radius:99px;margin-top:16px"></div>
          </td>
        </tr>
        <!-- CORPO -->
        <tr>
          <td style="background:#ffffff;padding:36px 36px 28px">
            ${corpo}
          </td>
        </tr>
        <!-- FOOTER -->
        <tr>
          <td style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center">
              © ${YEAR} SISENG — Sistema de Gestão de Obras<br/>
              Este é um e-mail automático, não responda a esta mensagem.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btnPrimario(href, texto) {
  return `<a href="${href}" style="display:inline-block;margin:20px 0;padding:14px 32px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border-radius:50px;font-weight:700;font-size:15px;text-decoration:none;box-shadow:0 4px 16px rgba(249,115,22,.4)">${texto}</a>`;
}

function saudacao(nome) {
  return `<p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#0f172a">Olá, ${nome}! 👋</p>`;
}

/* ── Boas-vindas (trial) ─────────────────────────────────── */
async function sendWelcomeEmail(email, nome, empresa) {
  const corpo = `
    ${saudacao(nome)}
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:12px 0">
      Sua conta na empresa <strong style="color:#1e3a5f">${empresa}</strong> foi criada com sucesso no SISENG!
      Seu período de teste gratuito de <strong>15 dias</strong> já começou.
    </p>
    <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:20px;margin:20px 0">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">O que você pode fazer agora</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:5px 0;font-size:13px;color:#1e293b">✅ Cadastrar suas obras e etapas</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#1e293b">✅ Registrar medições e acompanhar progresso</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#1e293b">✅ Gerar relatórios e gráfico de Gantt</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#1e293b">✅ Controlar equipe, compras e financeiro</td></tr>
      </table>
    </div>
    <div style="text-align:center">${btnPrimario(BASE, '🚀 Acessar o SISENG')}</div>
    <p style="font-size:12px;color:#94a3b8;margin:16px 0 0">Dúvidas? Entre em contato respondendo este e-mail.</p>
  `;
  await transporter.sendMail({
    from: FROM, to: email,
    subject: `Bem-vindo ao SISENG, ${nome}! Seu trial começou 🚀`,
    html: baseTemplate('Bem-vindo ao SISENG', '#1e3a5f', corpo),
  });
}

/* ── Redefinição de senha ────────────────────────────────── */
async function sendResetEmail(email, nome, token) {
  const link = `${BASE}/app/reset-password.html?token=${token}`;
  const corpo = `
    ${saudacao(nome)}
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:12px 0">
      Recebemos uma solicitação para <strong>redefinir a senha</strong> da sua conta no SISENG.
    </p>
    <div style="text-align:center">${btnPrimario(link, '🔒 Redefinir minha senha')}</div>
    <div style="background:#fef3c7;border:1.5px solid #fcd34d;border-radius:10px;padding:14px 18px;margin:20px 0">
      <p style="margin:0;font-size:12px;color:#92400e">
        ⚠️ Este link expira em <strong>2 horas</strong>. Se você não solicitou, ignore este e-mail.
      </p>
    </div>
    <p style="font-size:12px;color:#94a3b8;margin:0">
      Se o botão não funcionar, copie o link:<br/>
      <span style="color:#2563eb;word-break:break-all">${link}</span>
    </p>
  `;
  await transporter.sendMail({
    from: FROM, to: email,
    subject: 'Redefinição de senha — SISENG',
    html: baseTemplate('Redefinição de senha', '#1e3a5f', corpo),
  });
}

/* ── Convite de usuário ──────────────────────────────────── */
async function sendUserInviteEmail(email, nome, empresa, password) {
  const corpo = `
    ${saudacao(nome)}
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:12px 0">
      Você foi adicionado à empresa <strong style="color:#1e3a5f">${empresa}</strong> no SISENG.
    </p>
    <div style="background:#f8fafc;border:2px solid #2563eb;border-radius:12px;padding:20px 24px;margin:20px 0">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:.06em">Suas credenciais</p>
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#64748b;padding:4px 12px 4px 0;width:70px">E-mail:</td>
          <td style="font-size:13px;color:#0f172a;font-weight:700">${email}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#64748b;padding:4px 12px 4px 0">Senha:</td>
          <td style="font-size:13px;color:#0f172a;font-weight:700;letter-spacing:2px">${password}</td>
        </tr>
      </table>
    </div>
    <div style="text-align:center">${btnPrimario(BASE, '🏗️ Acessar o SISENG')}</div>
    <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:14px 18px;margin:20px 0">
      <p style="margin:0;font-size:12px;color:#166534">🔐 Recomendamos <strong>alterar sua senha</strong> após o primeiro acesso.</p>
    </div>
  `;
  await transporter.sendMail({
    from: FROM, to: email,
    subject: `Você foi adicionado ao SISENG — ${empresa}`,
    html: baseTemplate('Acesso ao SISENG', '#1e3a5f', corpo),
  });
}

/* ── Aviso de trial expirando ────────────────────────────── */
async function sendTrialExpiringEmail(email, nome, empresa, diasRestantes) {
  const corpo = `
    ${saudacao(nome)}
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:12px 0">
      Seu período de teste gratuito na empresa <strong style="color:#1e3a5f">${empresa}</strong> está prestes a expirar.
    </p>
    <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:12px;padding:20px 24px;margin:20px 0;text-align:center">
      <p style="margin:0;font-size:40px;font-weight:900;color:#b45309">${diasRestantes}</p>
      <p style="margin:4px 0 0;font-size:14px;color:#92400e;font-weight:600">dia${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}</p>
    </div>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:12px 0">
      Assine um plano para continuar usando o SISENG sem interrupções.
    </p>
    <div style="text-align:center">${btnPrimario(`https://wa.me/5573999143401?text=Ol%C3%A1%2C+quero+assinar+o+SISENG+%28${encodeURIComponent(empresa)}%29`, '💬 Falar no WhatsApp e assinar')}</div>
  `;
  await transporter.sendMail({
    from: FROM, to: email,
    subject: `⚠️ Seu trial expira em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''} — SISENG`,
    html: baseTemplate('Trial expirando', '#92400e', corpo),
  });
}

/* ── Trial expirado — e-mail de recuperação ──────────────── */
async function sendTrialExpiredEmail(email, nome, empresa) {
  const corpo = `
    ${saudacao(nome)}
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:12px 0">
      O período de teste gratuito da empresa <strong style="color:#1e3a5f">${empresa}</strong> encerrou e o acesso foi <strong style="color:#dc2626">suspenso temporariamente</strong>.
    </p>
    <div style="background:#fef2f2;border:2px solid #fca5a5;border-radius:12px;padding:20px 24px;margin:20px 0;text-align:center">
      <p style="margin:0;font-size:28px">🔒</p>
      <p style="margin:8px 0 0;font-size:14px;color:#991b1b;font-weight:700">Acesso suspenso</p>
      <p style="margin:6px 0 0;font-size:13px;color:#b91c1c">Seus dados estão seguros e preservados.</p>
    </div>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:12px 0">
      Reative sua conta agora e continue de onde parou. Nenhum dado foi perdido.
    </p>
    <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:18px 24px;margin:20px 0">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.06em">O que você não vai perder</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="padding:4px 0;font-size:13px;color:#166534">✅ Todas as obras cadastradas</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#166534">✅ Etapas, medições e relatórios</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#166534">✅ Histórico de compras e cotações</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#166534">✅ Usuários e permissões</td></tr>
      </table>
    </div>
    <div style="text-align:center">${btnPrimario(`https://wa.me/5573999143401?text=Ol%C3%A1%2C+quero+reativar+minha+conta+no+SISENG+%28${encodeURIComponent(empresa)}%29`, '💬 Falar no WhatsApp e reativar')}</div>
    <p style="font-size:12px;color:#94a3b8;margin:16px 0 0;text-align:center">
      Nosso time responde rapidamente e vai reativar sua conta na hora.
    </p>
  `;
  await transporter.sendMail({
    from: FROM, to: email,
    subject: `Seu acesso ao SISENG foi suspenso — Reative agora 🔒`,
    html: baseTemplate('Acesso suspenso — SISENG', '#991b1b', corpo),
  });
}

module.exports = { sendResetEmail, sendWelcomeEmail, sendUserInviteEmail, sendTrialExpiringEmail, sendTrialExpiredEmail };
