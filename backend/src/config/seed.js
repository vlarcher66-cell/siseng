/* ═══════════════════════════════════════════════
   SISENG — Seed: dados iniciais
   Execute: npm run db:seed
═══════════════════════════════════════════════ */
require('dotenv').config();
const pool   = require('./database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  console.log('🌱 Inserindo dados iniciais...');

  // Planos
  await pool.query(`
    INSERT IGNORE INTO planos (nome, slug, preco, max_obras, max_usuarios) VALUES
    ('Starter',       'starter',    197.00,  5,  10),
    ('Profissional',  'pro',        397.00,  0,   0),
    ('Enterprise',    'enterprise', 797.00,  0,   0)
  `);
  console.log('✅ Planos inseridos');

  // Empresa demo
  const empresaUuid = uuidv4();
  const trialExpira = new Date();
  trialExpira.setDate(trialExpira.getDate() + 15);

  const [[planRow]] = await pool.query("SELECT id FROM planos WHERE slug = 'pro'");

  const [empresaRes] = await pool.query(`
    INSERT IGNORE INTO empresas (uuid, razao_social, email, plano_id, status, trial_expira)
    VALUES (?, 'Empresa Demo Ltda', 'demo@siseng.com.br', ?, 'ativo', ?)
  `, [empresaUuid, planRow.id, trialExpira.toISOString().split('T')[0]]);

  const empresaId = empresaRes.insertId;

  if (empresaId > 0) {
    const senhaHash = await bcrypt.hash('demo1234', 12);
    await pool.query(`
      INSERT IGNORE INTO usuarios (uuid, empresa_id, nome, email, senha_hash, perfil)
      VALUES (?, ?, 'Admin Demo', 'demo@siseng.com.br', ?, 'admin')
    `, [uuidv4(), empresaId, senhaHash]);
    console.log('✅ Usuário demo criado: demo@siseng.com.br / demo1234');
  }

  console.log('\n🎉 Seed concluído!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
