/* ═══════════════════════════════════════════════════════════
   SISENG — Controller: RDO (Relatório Diário de Obra)
═══════════════════════════════════════════════════════════ */
const pool   = require('../config/database');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

/* ── Pasta de uploads ─────────────────────────────────────── */
const UPLOAD_BASE = path.join(__dirname, '../../../frontend/public/uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/* ── Multer storage dinâmico por obra/data ───────────────── */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const obraId = req.params.obraId || req.body.obra_id || 'geral';
    const hoje   = new Date().toISOString().slice(0, 10);
    const tipo   = _tipoDir(file.mimetype);
    const dir    = path.join(UPLOAD_BASE, 'obras', String(obraId), 'rdo', hoje, tipo);
    ensureDir(dir);
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

function _tipoDir(mimetype) {
  if (mimetype.startsWith('image/'))  return 'fotos';
  if (mimetype.startsWith('video/'))  return 'videos';
  return 'documentos';
}

function _tipoAnexo(mimetype) {
  if (mimetype.startsWith('image/'))  return 'foto';
  if (mimetype.startsWith('video/'))  return 'video';
  return 'documento';
}

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter(req, file, cb) {
    const allowed = [
      'image/jpeg','image/png','image/webp','image/gif',
      'video/mp4','video/quicktime','video/avi','video/x-msvideo',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
  }
}).array('anexos', 20);

/* ── URL pública do arquivo ───────────────────────────────── */
function urlPublica(filePath) {
  // Converte caminho absoluto em URL relativa ao public/
  const rel = filePath.replace(/\\/g, '/').split('frontend/public/')[1];
  return `/${rel}`;
}

/* ══════════════════════════════════════════════════════════
   MIGRATION — cria tabelas se não existirem
══════════════════════════════════════════════════════════ */
async function migrateRdo() {
  const sqls = [
    `CREATE TABLE IF NOT EXISTS rdo (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      empresa_id    INT NOT NULL,
      obra_id       INT NOT NULL,
      data          DATE NOT NULL,
      clima_manha   ENUM('sol','nublado','chuva','garoa','tempestade') DEFAULT 'sol',
      clima_tarde   ENUM('sol','nublado','chuva','garoa','tempestade') DEFAULT 'sol',
      temperatura   TINYINT NULL,
      servicos      TEXT NULL COMMENT 'Serviços executados no dia',
      ocorrencias   TEXT NULL COMMENT 'Ocorrências, problemas, observações',
      responsavel   VARCHAR(150) NULL,
      cargo         VARCHAR(100) NULL,
      status        ENUM('rascunho','finalizado') DEFAULT 'rascunho',
      criado_por    INT NULL,
      criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_rdo_obra_data (obra_id, data),
      INDEX idx_rdo_empresa (empresa_id),
      INDEX idx_rdo_obra    (obra_id),
      INDEX idx_rdo_data    (data)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS rdo_mao_obra (
      id       INT AUTO_INCREMENT PRIMARY KEY,
      rdo_id   INT NOT NULL,
      funcao   VARCHAR(100) NOT NULL,
      qtd      TINYINT NOT NULL DEFAULT 1,
      INDEX idx_rdom_rdo (rdo_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS rdo_etapas (
      id       INT AUTO_INCREMENT PRIMARY KEY,
      rdo_id   INT NOT NULL,
      etapa_id INT NOT NULL,
      UNIQUE KEY uk_rdo_etapa (rdo_id, etapa_id),
      INDEX idx_rdoet_rdo   (rdo_id),
      INDEX idx_rdoet_etapa (etapa_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS rdo_funcoes (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      empresa_id INT NOT NULL,
      funcao     VARCHAR(100) NOT NULL,
      ativo      TINYINT DEFAULT 1,
      UNIQUE KEY uk_funcao_empresa (empresa_id, funcao),
      INDEX idx_rfunc_empresa (empresa_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS rdo_responsaveis (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      empresa_id INT NOT NULL,
      nome       VARCHAR(120) NOT NULL,
      cargo      VARCHAR(100) NULL,
      ativo      TINYINT DEFAULT 1,
      UNIQUE KEY uk_resp_empresa (empresa_id, nome),
      INDEX idx_rresp_empresa (empresa_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS rdo_anexos (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      rdo_id       INT NOT NULL,
      tipo         ENUM('foto','video','documento') NOT NULL,
      categoria    VARCHAR(80) NULL COMMENT 'Ex: nota_fiscal, contrato, medicao',
      descricao    VARCHAR(255) NULL,
      nome_orig    VARCHAR(255) NOT NULL,
      url          VARCHAR(500) NOT NULL,
      tamanho      INT NULL COMMENT 'bytes',
      criado_em    DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_rdoa_rdo (rdo_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];

  for (const sql of sqls) {
    try { await pool.query(sql); } catch (e) { console.warn('RDO migrate:', e.message); }
  }
}
migrateRdo();

/* ══════════════════════════════════════════════════════════
   LISTAR RDOs
══════════════════════════════════════════════════════════ */
async function listar(req, res) {
  const { obra_id, mes, ano } = req.query;
  try {
    let where = 'WHERE r.empresa_id = ?';
    const params = [req.user.empresa_id];

    if (obra_id) { where += ' AND r.obra_id = ?'; params.push(obra_id); }
    if (ano)     { where += ' AND YEAR(r.data) = ?';  params.push(ano); }
    if (mes)     { where += ' AND MONTH(r.data) = ?'; params.push(mes); }

    const [rows] = await pool.query(`
      SELECT
        r.id, r.obra_id, r.data, r.clima_manha, r.clima_tarde,
        r.temperatura, r.responsavel, r.status, r.criado_em,
        o.nome AS obra_nome,
        (SELECT COUNT(*) FROM rdo_anexos  a WHERE a.rdo_id = r.id) AS total_anexos,
        (SELECT COUNT(*) FROM rdo_mao_obra m WHERE m.rdo_id = r.id) AS total_funcoes,
        (SELECT COUNT(*) FROM rdo_etapas  e WHERE e.rdo_id = r.id) AS total_etapas
      FROM rdo r
      JOIN obras o ON o.id = r.obra_id
      ${where}
      ORDER BY r.data DESC
      LIMIT 200
    `, params);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar RDOs.', error: err.message });
  }
}

/* ══════════════════════════════════════════════════════════
   OBTER RDO (detalhe completo)
══════════════════════════════════════════════════════════ */
async function obter(req, res) {
  const { id } = req.params;
  try {
    const [[rdo]] = await pool.query(`
      SELECT r.*, o.nome AS obra_nome
      FROM rdo r
      JOIN obras o ON o.id = r.obra_id
      WHERE r.id = ? AND r.empresa_id = ?
    `, [id, req.user.empresa_id]);

    if (!rdo) return res.status(404).json({ message: 'RDO não encontrado.' });

    const [maoObra] = await pool.query(
      'SELECT * FROM rdo_mao_obra WHERE rdo_id = ? ORDER BY funcao', [id]
    );
    const [anexos] = await pool.query(
      'SELECT * FROM rdo_anexos WHERE rdo_id = ? ORDER BY criado_em', [id]
    );
    const [etapas] = await pool.query(`
      SELECT e.id AS etapa_id, e.nome, e.status, e.percentual
      FROM rdo_etapas re
      JOIN etapas e ON e.id = re.etapa_id
      WHERE re.rdo_id = ?
      ORDER BY e.ordem, e.nome
    `, [id]);

    res.json({ ...rdo, mao_obra: maoObra, anexos, etapas });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter RDO.', error: err.message });
  }
}

/* ══════════════════════════════════════════════════════════
   CRIAR RDO
══════════════════════════════════════════════════════════ */
async function criar(req, res) {
  const {
    obra_id, data, clima_manha, clima_tarde, temperatura,
    servicos, ocorrencias, responsavel, cargo, status,
    mao_obra,  // JSON string: [{funcao, qtd}]
    etapas_ids // JSON string: [1, 2, 3]
  } = req.body;

  if (!obra_id || !data) return res.status(400).json({ message: 'Obra e data são obrigatórios.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verifica se já existe RDO nessa obra/data
    const [[existe]] = await conn.query(
      'SELECT id FROM rdo WHERE obra_id = ? AND data = ? AND empresa_id = ?',
      [obra_id, data, req.user.empresa_id]
    );
    if (existe) {
      await conn.rollback();
      conn.release();
      return res.status(409).json({ message: 'Já existe um RDO para esta obra nesta data.', id: existe.id });
    }

    const [r] = await conn.query(`
      INSERT INTO rdo
        (empresa_id, obra_id, data, clima_manha, clima_tarde, temperatura,
         servicos, ocorrencias, responsavel, cargo, status, criado_por)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      req.user.empresa_id, obra_id, data,
      clima_manha || 'sol', clima_tarde || 'sol',
      temperatura || null, servicos || null, ocorrencias || null,
      responsavel || null, cargo || null,
      status || 'rascunho', req.user.id
    ]);

    const rdoId = r.insertId;

    // Mão de obra
    const mo = _parseMaoObra(mao_obra);
    for (const item of mo) {
      if (item.funcao && item.qtd > 0) {
        await conn.query(
          'INSERT INTO rdo_mao_obra (rdo_id, funcao, qtd) VALUES (?,?,?)',
          [rdoId, item.funcao, item.qtd]
        );
      }
    }

    // Anexos (arquivos enviados)
    if (req.files && req.files.length > 0) {
      const categorias = _parseArray(req.body.categorias);
      const descricoes = _parseArray(req.body.descricoes);
      for (let i = 0; i < req.files.length; i++) {
        const f = req.files[i];
        await conn.query(`
          INSERT INTO rdo_anexos (rdo_id, tipo, categoria, descricao, nome_orig, url, tamanho)
          VALUES (?,?,?,?,?,?,?)
        `, [
          rdoId, _tipoAnexo(f.mimetype),
          categorias[i] || null, descricoes[i] || null,
          f.originalname, urlPublica(f.path), f.size
        ]);
      }
    }

    // Etapas vinculadas
    const eIds = _parseIds(etapas_ids);
    for (const etapaId of eIds) {
      await conn.query(
        'INSERT IGNORE INTO rdo_etapas (rdo_id, etapa_id) VALUES (?,?)',
        [rdoId, etapaId]
      );
    }

    await conn.commit();
    res.status(201).json({ id: rdoId, message: 'RDO criado com sucesso.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Erro ao criar RDO.', error: err.message });
  } finally {
    conn.release();
  }
}

/* ══════════════════════════════════════════════════════════
   ATUALIZAR RDO
══════════════════════════════════════════════════════════ */
async function atualizar(req, res) {
  const { id } = req.params;
  const {
    clima_manha, clima_tarde, temperatura,
    servicos, ocorrencias, responsavel, cargo, status, mao_obra, etapas_ids
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[rdo]] = await conn.query(
      'SELECT id FROM rdo WHERE id = ? AND empresa_id = ?',
      [id, req.user.empresa_id]
    );
    if (!rdo) { await conn.rollback(); conn.release(); return res.status(404).json({ message: 'RDO não encontrado.' }); }

    await conn.query(`
      UPDATE rdo SET
        clima_manha=?, clima_tarde=?, temperatura=?,
        servicos=?, ocorrencias=?, responsavel=?, cargo=?, status=?
      WHERE id = ?
    `, [
      clima_manha, clima_tarde, temperatura || null,
      servicos, ocorrencias, responsavel, cargo,
      status || 'rascunho', id
    ]);

    // Recria mão de obra
    await conn.query('DELETE FROM rdo_mao_obra WHERE rdo_id = ?', [id]);
    const mo = _parseMaoObra(mao_obra);
    for (const item of mo) {
      if (item.funcao && item.qtd > 0) {
        await conn.query(
          'INSERT INTO rdo_mao_obra (rdo_id, funcao, qtd) VALUES (?,?,?)',
          [id, item.funcao, item.qtd]
        );
      }
    }

    // Novos anexos
    if (req.files && req.files.length > 0) {
      const categorias = _parseArray(req.body.categorias);
      const descricoes = _parseArray(req.body.descricoes);
      for (let i = 0; i < req.files.length; i++) {
        const f = req.files[i];
        await conn.query(`
          INSERT INTO rdo_anexos (rdo_id, tipo, categoria, descricao, nome_orig, url, tamanho)
          VALUES (?,?,?,?,?,?,?)
        `, [
          id, _tipoAnexo(f.mimetype),
          categorias[i] || null, descricoes[i] || null,
          f.originalname, urlPublica(f.path), f.size
        ]);
      }
    }

    // Recria etapas vinculadas
    await conn.query('DELETE FROM rdo_etapas WHERE rdo_id = ?', [id]);
    const eIds = _parseIds(etapas_ids);
    for (const etapaId of eIds) {
      await conn.query(
        'INSERT IGNORE INTO rdo_etapas (rdo_id, etapa_id) VALUES (?,?)',
        [id, etapaId]
      );
    }

    await conn.commit();
    res.json({ message: 'RDO atualizado.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Erro ao atualizar RDO.', error: err.message });
  } finally {
    conn.release();
  }
}

/* ══════════════════════════════════════════════════════════
   EXCLUIR ANEXO
══════════════════════════════════════════════════════════ */
async function excluirAnexo(req, res) {
  const { rdoId, anexoId } = req.params;
  try {
    const [[a]] = await pool.query(`
      SELECT a.url FROM rdo_anexos a
      JOIN rdo r ON r.id = a.rdo_id
      WHERE a.id = ? AND r.empresa_id = ? AND r.id = ?
    `, [anexoId, req.user.empresa_id, rdoId]);

    if (!a) return res.status(404).json({ message: 'Anexo não encontrado.' });

    // Remove arquivo físico
    try {
      const abs = path.join(__dirname, '../../../frontend/public', a.url);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch (_) {}

    await pool.query('DELETE FROM rdo_anexos WHERE id = ?', [anexoId]);
    res.json({ message: 'Anexo excluído.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir anexo.', error: err.message });
  }
}

/* ══════════════════════════════════════════════════════════
   EXCLUIR RDO
══════════════════════════════════════════════════════════ */
async function excluir(req, res) {
  const { id } = req.params;
  try {
    const [[rdo]] = await pool.query(
      'SELECT id FROM rdo WHERE id = ? AND empresa_id = ?',
      [id, req.user.empresa_id]
    );
    if (!rdo) return res.status(404).json({ message: 'RDO não encontrado.' });

    // Remove arquivos físicos
    const [anexos] = await pool.query('SELECT url FROM rdo_anexos WHERE rdo_id = ?', [id]);
    for (const a of anexos) {
      try {
        const abs = path.join(__dirname, '../../../frontend/public', a.url);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      } catch (_) {}
    }

    await pool.query('DELETE FROM rdo_anexos  WHERE rdo_id = ?', [id]);
    await pool.query('DELETE FROM rdo_mao_obra WHERE rdo_id = ?', [id]);
    await pool.query('DELETE FROM rdo WHERE id = ?', [id]);

    res.json({ message: 'RDO excluído.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir RDO.', error: err.message });
  }
}

/* ── Helpers internos ─────────────────────────────────────── */
function _parseIds(raw) {
  if (!raw) return [];
  try { return (typeof raw === 'string' ? JSON.parse(raw) : raw).map(Number).filter(Boolean); }
  catch { return []; }
}

function _parseMaoObra(raw) {
  if (!raw) return [];
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return []; }
}
function _parseArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return [raw]; }
}

/* ══════════════════════════════════════════════════════════
   FUNÇÕES DA EQUIPE (cadastro rápido)
══════════════════════════════════════════════════════════ */
async function listarFuncoes(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, funcao FROM rdo_funcoes WHERE empresa_id = ? AND ativo = 1 ORDER BY funcao',
      [req.user.empresa_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar funções.', error: err.message });
  }
}

async function criarFuncao(req, res) {
  const { funcao } = req.body;
  if (!funcao?.trim()) return res.status(400).json({ message: 'Nome da função obrigatório.' });
  try {
    const [r] = await pool.query(
      'INSERT INTO rdo_funcoes (empresa_id, funcao) VALUES (?, ?) ON DUPLICATE KEY UPDATE ativo=1',
      [req.user.empresa_id, funcao.trim()]
    );
    const [[row]] = await pool.query(
      'SELECT id, funcao FROM rdo_funcoes WHERE empresa_id = ? AND funcao = ?',
      [req.user.empresa_id, funcao.trim()]
    );
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar função.', error: err.message });
  }
}

async function excluirFuncao(req, res) {
  try {
    await pool.query(
      'UPDATE rdo_funcoes SET ativo = 0 WHERE id = ? AND empresa_id = ?',
      [req.params.id, req.user.empresa_id]
    );
    res.json({ message: 'Função removida.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover função.', error: err.message });
  }
}

/* ══════════════════════════════════════════════════════════
   RESPONSÁVEIS (cadastro rápido)
══════════════════════════════════════════════════════════ */
async function listarResponsaveis(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, cargo FROM rdo_responsaveis WHERE empresa_id = ? AND ativo = 1 ORDER BY nome',
      [req.user.empresa_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar responsáveis.', error: err.message });
  }
}

async function criarResponsavel(req, res) {
  const { nome, cargo } = req.body;
  if (!nome?.trim()) return res.status(400).json({ message: 'Nome do responsável obrigatório.' });
  try {
    await pool.query(
      'INSERT INTO rdo_responsaveis (empresa_id, nome, cargo) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ativo=1, cargo=VALUES(cargo)',
      [req.user.empresa_id, nome.trim(), cargo?.trim() || null]
    );
    const [[row]] = await pool.query(
      'SELECT id, nome, cargo FROM rdo_responsaveis WHERE empresa_id = ? AND nome = ?',
      [req.user.empresa_id, nome.trim()]
    );
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao salvar responsável.', error: err.message });
  }
}

async function excluirResponsavel(req, res) {
  try {
    await pool.query(
      'UPDATE rdo_responsaveis SET ativo = 0 WHERE id = ? AND empresa_id = ?',
      [req.params.id, req.user.empresa_id]
    );
    res.json({ message: 'Responsável removido.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover responsável.', error: err.message });
  }
}

/* ── Exporta middleware de upload também ─────────────────── */
module.exports = { upload, listar, obter, criar, atualizar, excluirAnexo, excluir, listarFuncoes, criarFuncao, excluirFuncao, listarResponsaveis, criarResponsavel, excluirResponsavel };
