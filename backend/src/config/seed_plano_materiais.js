/* ═══════════════════════════════════════════════════════════
   SISENG — Seed: Plano de Materiais para Cotação
   Executar: node src/config/seed_plano_materiais.js
═══════════════════════════════════════════════════════════ */
require('dotenv').config();
const pool = require('./database');

const PLANO = [
  {
    grupo: 'Estrutura',
    subgrupos: [
      'Cimento',
      'Areia e Brita',
      'Aço e Ferragem',
      'Madeira para Forma',
      'Blocos e Tijolos',
      'Concreto Usinado',
    ]
  },
  {
    grupo: 'Alvenaria e Revestimento',
    subgrupos: [
      'Argamassa e Rejunte',
      'Cerâmica e Porcelanato',
      'Gesso e Drywall',
      'Pintura (tinta, massa, fundo)',
      'Pastilha e Pedras Naturais',
    ]
  },
  {
    grupo: 'Cobertura e Impermeabilização',
    subgrupos: [
      'Telhas',
      'Estrutura Metálica / Madeiramento',
      'Impermeabilizantes',
      'Calhas e Rufos',
    ]
  },
  {
    grupo: 'Instalações Hidráulicas',
    subgrupos: [
      'Tubos e Conexões (água fria)',
      'Tubos e Conexões (esgoto)',
      'Caixas d\'água e Reservatórios',
      'Registros e Válvulas',
    ]
  },
  {
    grupo: 'Instalações Elétricas',
    subgrupos: [
      'Fios e Cabos',
      'Eletrodutos e Perfilados',
      'Quadros e Disjuntores',
      'Tomadas, Interruptores e Espelhos',
    ]
  },
  {
    grupo: 'Esquadrias',
    subgrupos: [
      'Portas de Madeira',
      'Portas de Alumínio / Ferro',
      'Janelas de Alumínio / Ferro',
      'Vidros e Espelhos',
      'Portões',
    ]
  },
  {
    grupo: 'Louças e Metais',
    subgrupos: [
      'Bacias e Caixas Acopladas',
      'Pias e Cubas',
      'Torneiras e Misturadores',
      'Chuveiros e Duchas',
      'Acessórios de Banheiro',
    ]
  },
  {
    grupo: 'Acabamentos Gerais',
    subgrupos: [
      'Rodapé e Soleira',
      'Forro (PVC, gesso, madeira)',
      'Escadas e Corrimão',
      'Divisórias',
    ]
  },
  {
    grupo: 'Materiais Diversos',
    subgrupos: [
      'Parafusos, Buchas e Fixadores',
      'Selantes e Adesivos',
      'Telas e Telas Metálicas',
      'Materiais de Limpeza da Obra',
    ]
  },
];

async function seedPlanoMateriais() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[empresa]] = await conn.query('SELECT id FROM empresas LIMIT 1');
    if (!empresa) throw new Error('Nenhuma empresa encontrada. Rode npm run db:seed primeiro.');
    const eid = empresa.id;

    console.log(`\n🌱 Inserindo plano de materiais para empresa_id=${eid}...\n`);

    let totalGrupos = 0, totalSubgrupos = 0;

    for (const g of PLANO) {
      const [[existing]] = await conn.query(
        'SELECT id FROM grupos_item WHERE empresa_id=? AND descricao=?', [eid, g.grupo]
      );

      let grupoId;
      if (existing) {
        grupoId = existing.id;
        console.log(`  ⏭  Grupo já existe: ${g.grupo}`);
      } else {
        const [r] = await conn.query(
          'INSERT INTO grupos_item (empresa_id, descricao) VALUES (?, ?)', [eid, g.grupo]
        );
        grupoId = r.insertId;
        totalGrupos++;
        console.log(`  ✅ Grupo: ${g.grupo}`);
      }

      for (const subDescricao of g.subgrupos) {
        const [[existingSub]] = await conn.query(
          'SELECT id FROM subgrupos_item WHERE empresa_id=? AND id_grupo=? AND descricao=?',
          [eid, grupoId, subDescricao]
        );

        if (existingSub) {
          console.log(`     ⏭  Subgrupo já existe: ${subDescricao}`);
        } else {
          await conn.query(
            'INSERT INTO subgrupos_item (empresa_id, id_grupo, descricao) VALUES (?, ?, ?)',
            [eid, grupoId, subDescricao]
          );
          totalSubgrupos++;
          console.log(`     ✅ Subgrupo: ${subDescricao}`);
        }
      }
    }

    await conn.commit();
    console.log(`\n🎉 Plano de materiais inserido com sucesso!`);
    console.log(`   Grupos:    ${totalGrupos}`);
    console.log(`   Subgrupos: ${totalSubgrupos}\n`);

  } catch (err) {
    await conn.rollback();
    console.error('\n❌ Erro:', err.message);
    throw err;
  } finally {
    conn.release();
  }
}

seedPlanoMateriais()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
