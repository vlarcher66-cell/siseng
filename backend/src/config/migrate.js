/* ═══════════════════════════════════════════════
   SISENG — Migração do banco de dados MySQL
   Execute: npm run db:migrate
═══════════════════════════════════════════════ */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     process.env.DB_PORT || 3306,
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    multipleStatements: true
  });

  console.log('🔄 Criando banco de dados...');
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'siseng'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${process.env.DB_NAME || 'siseng'}\``);

  const sql = `
  -- ── Planos de assinatura ───────────────────────
  CREATE TABLE IF NOT EXISTS planos (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(50)     NOT NULL,
    slug        VARCHAR(30)     NOT NULL UNIQUE,
    preco       DECIMAL(10,2)   NOT NULL,
    max_obras   SMALLINT        DEFAULT 0 COMMENT '0 = ilimitado',
    max_usuarios SMALLINT       DEFAULT 0,
    ativo       TINYINT(1)      DEFAULT 1,
    criado_em   DATETIME        DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;

  -- ── Empresas (tenants) ────────────────────────
  CREATE TABLE IF NOT EXISTS empresas (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)        NOT NULL UNIQUE,
    razao_social  VARCHAR(150)    NOT NULL,
    nome_fantasia VARCHAR(100),
    cnpj          VARCHAR(18),
    email         VARCHAR(150)    NOT NULL UNIQUE,
    telefone      VARCHAR(20),
    logo_url      VARCHAR(255),
    plano_id      INT UNSIGNED,
    status        ENUM('trial','ativo','suspenso','cancelado') DEFAULT 'trial',
    trial_expira  DATE,
    criado_em     DATETIME        DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plano_id) REFERENCES planos(id) ON DELETE SET NULL
  ) ENGINE=InnoDB;

  -- ── Usuários ──────────────────────────────────
  CREATE TABLE IF NOT EXISTS usuarios (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)        NOT NULL UNIQUE,
    empresa_id    INT UNSIGNED    NOT NULL,
    nome          VARCHAR(100)    NOT NULL,
    email         VARCHAR(150)    NOT NULL,
    senha_hash    VARCHAR(255)    NOT NULL,
    perfil        ENUM('admin','gerente','engenheiro','mestre','financeiro','leitura') DEFAULT 'engenheiro',
    avatar_url    VARCHAR(255),
    ativo         TINYINT(1)      DEFAULT 1,
    ultimo_acesso DATETIME,
    reset_token   VARCHAR(255),
    reset_expira  DATETIME,
    criado_em     DATETIME        DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_empresa_email (empresa_id, email),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;

  -- ── Obras ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS obras (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)        NOT NULL UNIQUE,
    empresa_id    INT UNSIGNED    NOT NULL,
    nome          VARCHAR(150)    NOT NULL,
    descricao     TEXT,
    endereco      VARCHAR(255),
    cidade        VARCHAR(80),
    estado        CHAR(2),
    cep           VARCHAR(9),
    cliente       VARCHAR(150),
    responsavel_id INT UNSIGNED,
    status        ENUM('planejamento','em_andamento','pausada','concluida','cancelada') DEFAULT 'planejamento',
    data_inicio   DATE,
    data_prevista DATE,
    data_conclusao DATE,
    orcamento     DECIMAL(15,2)   DEFAULT 0,
    custo_real    DECIMAL(15,2)   DEFAULT 0,
    percentual    TINYINT UNSIGNED DEFAULT 0,
    foto_url      VARCHAR(255),
    criado_em     DATETIME        DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id)    REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_empresa (empresa_id),
    INDEX idx_status  (status)
  ) ENGINE=InnoDB;

  -- ── Etapas das obras ──────────────────────────
  CREATE TABLE IF NOT EXISTS etapas (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id  INT UNSIGNED NOT NULL,
    obra_id     INT UNSIGNED NOT NULL,
    nome        VARCHAR(150) NOT NULL,
    descricao   TEXT,
    ordem       SMALLINT     DEFAULT 1,
    status      ENUM('pendente','em_andamento','concluida','atrasada') DEFAULT 'pendente',
    data_inicio DATE,
    data_fim    DATE,
    percentual  TINYINT UNSIGNED DEFAULT 0,
    criado_em   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (obra_id)    REFERENCES obras(id)    ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_obra (obra_id)
  ) ENGINE=InnoDB;

  -- ── Diário de obra ────────────────────────────
  CREATE TABLE IF NOT EXISTS diario_obra (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id  INT UNSIGNED NOT NULL,
    obra_id     INT UNSIGNED NOT NULL,
    usuario_id  INT UNSIGNED NOT NULL,
    data        DATE         NOT NULL,
    clima       ENUM('sol','nublado','chuva','vento') DEFAULT 'sol',
    descricao   TEXT         NOT NULL,
    ocorrencias TEXT,
    criado_em   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (obra_id)    REFERENCES obras(id)    ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;

  -- ── Fornecedores ──────────────────────────────
  CREATE TABLE IF NOT EXISTS fornecedores (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id  INT UNSIGNED NOT NULL,
    nome        VARCHAR(150) NOT NULL,
    cnpj_cpf    VARCHAR(18),
    email       VARCHAR(150),
    telefone    VARCHAR(20),
    categoria   VARCHAR(80),
    ativo       TINYINT(1)   DEFAULT 1,
    criado_em   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;

  -- ── Lançamentos financeiros ───────────────────
  CREATE TABLE IF NOT EXISTS financeiro (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id     INT UNSIGNED NOT NULL,
    obra_id        INT UNSIGNED,
    fornecedor_id  INT UNSIGNED,
    usuario_id     INT UNSIGNED,
    tipo           ENUM('receita','despesa') NOT NULL,
    categoria      VARCHAR(80),
    descricao      VARCHAR(255) NOT NULL,
    valor          DECIMAL(15,2) NOT NULL,
    data_lancamento DATE NOT NULL,
    data_pagamento  DATE,
    status         ENUM('pendente','pago','cancelado') DEFAULT 'pendente',
    comprovante_url VARCHAR(255),
    criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id)    REFERENCES empresas(id)    ON DELETE CASCADE,
    FOREIGN KEY (obra_id)       REFERENCES obras(id)       ON DELETE SET NULL,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id)    REFERENCES usuarios(id)    ON DELETE SET NULL,
    INDEX idx_empresa_obra (empresa_id, obra_id)
  ) ENGINE=InnoDB;

  -- ── Documentos ────────────────────────────────
  CREATE TABLE IF NOT EXISTS documentos (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    empresa_id  INT UNSIGNED NOT NULL,
    obra_id     INT UNSIGNED,
    usuario_id  INT UNSIGNED,
    nome        VARCHAR(150) NOT NULL,
    tipo        VARCHAR(50),
    arquivo_url VARCHAR(255) NOT NULL,
    tamanho_kb  INT,
    criado_em   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (obra_id)    REFERENCES obras(id)    ON DELETE SET NULL
  ) ENGINE=InnoDB;
  `;

  await conn.query(sql);
  await conn.end();

  console.log('✅ Migração concluída com sucesso!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Erro na migração:', err);
  process.exit(1);
});
