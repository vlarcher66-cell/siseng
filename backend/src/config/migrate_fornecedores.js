require('dotenv').config();
const pool = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('Alterando tabela fornecedores...');
    await conn.query(`ALTER TABLE fornecedores
      CHANGE nome     razao_social VARCHAR(150) NOT NULL,
      CHANGE cnpj_cpf cnpj         VARCHAR(18),
      CHANGE ativo    status       ENUM('ativo','inativo') DEFAULT 'ativo',
      ADD COLUMN nome_fantasia VARCHAR(100)  AFTER razao_social,
      ADD COLUMN contato       VARCHAR(100)  AFTER email,
      ADD COLUMN endereco      VARCHAR(255)  AFTER contato,
      ADD COLUMN cidade        VARCHAR(80)   AFTER endereco,
      ADD COLUMN estado        CHAR(2)       AFTER cidade,
      ADD COLUMN observacoes   TEXT          AFTER estado,
      ADD COLUMN atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER criado_em
    `);
    console.log('✅ Tabela fornecedores atualizada!');
  } catch (err) {
    if (err.message.includes('Duplicate column') || err.message.includes('razao_social')) {
      console.log('⏭  Tabela já foi migrada.');
    } else {
      console.error('❌ Erro:', err.message);
      throw err;
    }
  } finally {
    conn.release();
  }
}

run().then(() => process.exit(0)).catch(() => process.exit(1));
