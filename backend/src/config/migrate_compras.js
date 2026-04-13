/* ═══════════════════════════════════════════════════════════
   SISENG — Migração: Módulo Compras/Cotação
   Executar: node src/config/migrate_compras.js
═══════════════════════════════════════════════════════════ */
require('dotenv').config();
const pool = require('./database');

async function migrateCompras() {
  const conn = await pool.getConnection();
  try {
    console.log('\n📦 Criando tabelas do módulo Compras...\n');

    // ── Grupos de itens ──────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS grupos_item (
        id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        empresa_id  INT UNSIGNED NOT NULL,
        descricao   VARCHAR(100) NOT NULL,
        status      ENUM('ativo','inativo') DEFAULT 'ativo',
        criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_empresa (empresa_id),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ grupos_item');

    // ── Subgrupos de itens ───────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS subgrupos_item (
        id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        empresa_id  INT UNSIGNED NOT NULL,
        id_grupo    INT UNSIGNED NOT NULL,
        descricao   VARCHAR(100) NOT NULL,
        status      ENUM('ativo','inativo') DEFAULT 'ativo',
        criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_empresa (empresa_id),
        INDEX idx_grupo   (id_grupo),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        FOREIGN KEY (id_grupo)   REFERENCES grupos_item(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ subgrupos_item');

    // ── Itens para cotação ────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS itens_compra (
        id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        empresa_id    INT UNSIGNED NOT NULL,
        id_grupo      INT UNSIGNED,
        id_subgrupo   INT UNSIGNED,
        descricao     VARCHAR(200) NOT NULL,
        unidade       VARCHAR(20)  NOT NULL,
        especificacao TEXT,
        status        ENUM('ativo','inativo') DEFAULT 'ativo',
        criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_empresa   (empresa_id),
        INDEX idx_grupo     (id_grupo),
        INDEX idx_subgrupo  (id_subgrupo),
        FOREIGN KEY (empresa_id)  REFERENCES empresas(id)       ON DELETE CASCADE,
        FOREIGN KEY (id_grupo)    REFERENCES grupos_item(id)    ON DELETE SET NULL,
        FOREIGN KEY (id_subgrupo) REFERENCES subgrupos_item(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ itens_compra');

    // ── Cotações ─────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS cotacoes (
        id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        empresa_id    INT UNSIGNED NOT NULL,
        numero        VARCHAR(30) NOT NULL,
        titulo        VARCHAR(200),
        data_criacao  DATE NOT NULL,
        data_validade DATE,
        id_usuario    INT UNSIGNED NOT NULL,
        status        ENUM('aberta','enviada','respondida','finalizada') DEFAULT 'aberta',
        observacoes   TEXT,
        criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_empresa (empresa_id),
        INDEX idx_status  (status),
        UNIQUE KEY uk_numero (empresa_id, numero),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)  ON DELETE CASCADE,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id)  ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ cotacoes');

    // ── Itens da cotação ──────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS cotacao_itens (
        id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        id_cotacao   INT UNSIGNED NOT NULL,
        id_item      INT UNSIGNED NOT NULL,
        quantidade   DECIMAL(10,3) NOT NULL,
        justificativa TEXT,
        INDEX idx_cotacao (id_cotacao),
        FOREIGN KEY (id_cotacao) REFERENCES cotacoes(id)     ON DELETE CASCADE,
        FOREIGN KEY (id_item)    REFERENCES itens_compra(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ cotacao_itens');

    // ── Envios para fornecedores ──────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS cotacao_fornecedores (
        id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        id_cotacao      INT UNSIGNED NOT NULL,
        id_fornecedor   INT UNSIGNED NOT NULL,
        token           VARCHAR(64) NOT NULL,
        enviado_em      DATETIME DEFAULT CURRENT_TIMESTAMP,
        respondido_em   DATETIME,
        status          ENUM('pendente','respondido','recusado') DEFAULT 'pendente',
        INDEX idx_cotacao (id_cotacao),
        UNIQUE KEY uk_token (token),
        FOREIGN KEY (id_cotacao)    REFERENCES cotacoes(id)    ON DELETE CASCADE,
        FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ cotacao_fornecedores');

    // ── Respostas dos fornecedores ────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS respostas_cotacao (
        id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        id_cotacao            INT UNSIGNED NOT NULL,
        id_fornecedor         INT UNSIGNED NOT NULL,
        id_cotacao_fornecedor INT UNSIGNED NOT NULL,
        data_resposta         DATETIME DEFAULT CURRENT_TIMESTAMP,
        observacoes           TEXT,
        UNIQUE KEY uk_resp (id_cotacao, id_fornecedor),
        INDEX idx_cotacao (id_cotacao),
        FOREIGN KEY (id_cotacao)            REFERENCES cotacoes(id)             ON DELETE CASCADE,
        FOREIGN KEY (id_fornecedor)         REFERENCES fornecedores(id)         ON DELETE CASCADE,
        FOREIGN KEY (id_cotacao_fornecedor) REFERENCES cotacao_fornecedores(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ respostas_cotacao');

    // ── Itens da resposta ─────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS resposta_itens (
        id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        id_resposta      INT UNSIGNED NOT NULL,
        id_cotacao_item  INT UNSIGNED NOT NULL,
        valor_unitario   DECIMAL(15,4) NOT NULL,
        marca            VARCHAR(100),
        observacao       TEXT,
        INDEX idx_resposta (id_resposta),
        FOREIGN KEY (id_resposta)     REFERENCES respostas_cotacao(id) ON DELETE CASCADE,
        FOREIGN KEY (id_cotacao_item) REFERENCES cotacao_itens(id)     ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ resposta_itens');

    // ── Mapa de cotação (vencedores) ──────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS mapa_cotacao (
        id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        id_cotacao             INT UNSIGNED NOT NULL,
        id_cotacao_item        INT UNSIGNED NOT NULL,
        id_fornecedor_vencedor INT UNSIGNED NOT NULL,
        valor_vencedor        DECIMAL(15,4) NOT NULL,
        eh_menor_preco        TINYINT(1) DEFAULT 1,
        justificativa         TEXT,
        selecionado_em        DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_item (id_cotacao_item),
        INDEX idx_cotacao (id_cotacao),
        FOREIGN KEY (id_cotacao)             REFERENCES cotacoes(id)    ON DELETE CASCADE,
        FOREIGN KEY (id_cotacao_item)        REFERENCES cotacao_itens(id) ON DELETE CASCADE,
        FOREIGN KEY (id_fornecedor_vencedor) REFERENCES fornecedores(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ mapa_cotacao');

    // ── Pedidos de compra ─────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS pedidos_compra (
        id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        empresa_id     INT UNSIGNED NOT NULL,
        numero         VARCHAR(30) NOT NULL,
        id_cotacao     INT UNSIGNED NOT NULL,
        id_fornecedor  INT UNSIGNED NOT NULL,
        data_pedido    DATE NOT NULL,
        valor_total    DECIMAL(15,2) NOT NULL,
        status         ENUM('rascunho','enviado','confirmado','cancelado') DEFAULT 'rascunho',
        observacoes    TEXT,
        criado_em      DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_empresa (empresa_id),
        FOREIGN KEY (empresa_id)    REFERENCES empresas(id)    ON DELETE CASCADE,
        FOREIGN KEY (id_cotacao)    REFERENCES cotacoes(id)    ON DELETE RESTRICT,
        FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ pedidos_compra');

    // ── Itens do pedido ───────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS pedido_itens (
        id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        id_pedido        INT UNSIGNED NOT NULL,
        id_cotacao_item  INT UNSIGNED NOT NULL,
        quantidade       DECIMAL(10,3) NOT NULL,
        valor_unitario   DECIMAL(15,4) NOT NULL,
        valor_total      DECIMAL(15,2) NOT NULL,
        INDEX idx_pedido (id_pedido),
        FOREIGN KEY (id_pedido)       REFERENCES pedidos_compra(id) ON DELETE CASCADE,
        FOREIGN KEY (id_cotacao_item) REFERENCES cotacao_itens(id)  ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ pedido_itens');

    console.log('\n🎉 Módulo Compras migrado com sucesso!\n');
  } catch (err) {
    console.error('\n❌ Erro na migração de Compras:', err.message);
    throw err;
  } finally {
    conn.release();
  }
}

migrateCompras()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
