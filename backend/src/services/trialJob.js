/* ═══════════════════════════════════════════════════════════
   SISENG — Job automático de Trial
   Roda a cada hora via setInterval no index.js

   Ações:
   1. Aviso 3 dias antes do vencimento (e-mail)
   2. Aviso no dia do vencimento (e-mail)
   3. Bloqueia acesso (status → suspenso) ao vencer
   4. E-mail de recuperação ao bloquear
═══════════════════════════════════════════════════════════ */
const pool   = require('../config/database');
const mailer = require('./mailer');

async function runTrialJob() {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // ── 1. Aviso 3 dias antes ────────────────────────────
    const em3dias = new Date(hoje);
    em3dias.setDate(em3dias.getDate() + 3);
    const [aviso3] = await pool.query(`
      SELECT e.id, e.razao_social, e.email, u.nome, u.email AS email_usuario
      FROM empresas e
      JOIN usuarios u ON u.empresa_id = e.id AND u.perfil = 'admin'
      WHERE e.status = 'trial'
        AND DATE(e.trial_expira) = DATE(?)
        AND e.aviso_3d_enviado IS NULL
    `, [em3dias]);

    for (const row of aviso3) {
      try {
        await mailer.sendTrialExpiringEmail(row.email_usuario, row.nome, row.razao_social, 3);
        await pool.query(`UPDATE empresas SET aviso_3d_enviado = NOW() WHERE id = ?`, [row.id]);
        console.log(`[TrialJob] Aviso 3d enviado: ${row.razao_social}`);
      } catch (err) {
        console.warn(`[TrialJob] Erro aviso 3d ${row.razao_social}:`, err.message);
      }
    }

    // ── 2. Aviso no dia do vencimento ────────────────────
    const [aviso0] = await pool.query(`
      SELECT e.id, e.razao_social, e.email, u.nome, u.email AS email_usuario
      FROM empresas e
      JOIN usuarios u ON u.empresa_id = e.id AND u.perfil = 'admin'
      WHERE e.status = 'trial'
        AND DATE(e.trial_expira) = DATE(?)
        AND e.aviso_0d_enviado IS NULL
    `, [hoje]);

    for (const row of aviso0) {
      try {
        await mailer.sendTrialExpiringEmail(row.email_usuario, row.nome, row.razao_social, 0);
        await pool.query(`UPDATE empresas SET aviso_0d_enviado = NOW() WHERE id = ?`, [row.id]);
        console.log(`[TrialJob] Aviso vencimento enviado: ${row.razao_social}`);
      } catch (err) {
        console.warn(`[TrialJob] Erro aviso 0d ${row.razao_social}:`, err.message);
      }
    }

    // ── 3. Bloquear trials vencidos + e-mail recuperação ─
    const [vencidos] = await pool.query(`
      SELECT e.id, e.razao_social, e.email, u.nome, u.email AS email_usuario
      FROM empresas e
      JOIN usuarios u ON u.empresa_id = e.id AND u.perfil = 'admin'
      WHERE e.status = 'trial'
        AND DATE(e.trial_expira) < DATE(?)
    `, [hoje]);

    for (const row of vencidos) {
      try {
        await pool.query(`UPDATE empresas SET status = 'suspenso' WHERE id = ?`, [row.id]);
        await mailer.sendTrialExpiredEmail(row.email_usuario, row.nome, row.razao_social);
        console.log(`[TrialJob] Bloqueado + e-mail recuperacao: ${row.razao_social}`);
      } catch (err) {
        console.warn(`[TrialJob] Erro bloqueio ${row.razao_social}:`, err.message);
      }
    }

    if (aviso3.length + aviso0.length + vencidos.length > 0) {
      console.log(`[TrialJob] ${new Date().toISOString()} — avisos:${aviso3.length+aviso0.length} bloqueios:${vencidos.length}`);
    }
  } catch (err) {
    console.error('[TrialJob] Erro geral:', err.message);
  }
}

/* Inicia o job — roda imediatamente e depois a cada 1h */
function startTrialJob() {
  runTrialJob();
  setInterval(runTrialJob, 60 * 60 * 1000);
  console.log('[TrialJob] Job de trial iniciado (intervalo: 1h)');
}

module.exports = { startTrialJob };
