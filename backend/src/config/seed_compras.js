/* ═══════════════════════════════════════════════════════════
   SISENG — Seed: Plano de Contas de Compras
   Executar: node src/config/seed_compras.js
═══════════════════════════════════════════════════════════ */
require('dotenv').config();
const pool = require('./database');

const PLANO = [
  {
    grupo: 'Materiais de Construção',
    subgrupos: [
      {
        nome: 'Cimento e Argamassa',
        itens: [
          { descricao: 'Cimento CP-II 50kg',        unidade: 'sc' },
          { descricao: 'Cimento CP-V 50kg',          unidade: 'sc' },
          { descricao: 'Argamassa AC-II 20kg',       unidade: 'sc' },
          { descricao: 'Argamassa de Reboco 20kg',   unidade: 'sc' },
          { descricao: 'Cal Hidratada 20kg',         unidade: 'sc' },
        ]
      },
      {
        nome: 'Aço e Ferragens',
        itens: [
          { descricao: 'Aço CA-50 6,3mm',   unidade: 'kg' },
          { descricao: 'Aço CA-50 8mm',     unidade: 'kg' },
          { descricao: 'Aço CA-50 10mm',    unidade: 'kg' },
          { descricao: 'Aço CA-50 12,5mm',  unidade: 'kg' },
          { descricao: 'Tela Soldada Q-92', unidade: 'm²' },
        ]
      },
      {
        nome: 'Blocos e Tijolos',
        itens: [
          { descricao: 'Bloco Cerâmico 9x19x19',      unidade: 'un' },
          { descricao: 'Bloco de Concreto 14x19x39',  unidade: 'un' },
          { descricao: 'Tijolo Maciço 5x10x20',       unidade: 'un' },
          { descricao: 'Bloco Estrutural 14x19x39',   unidade: 'un' },
        ]
      },
      {
        nome: 'Areia e Brita',
        itens: [
          { descricao: 'Areia Média',   unidade: 'm³' },
          { descricao: 'Areia Grossa',  unidade: 'm³' },
          { descricao: 'Brita 0',       unidade: 'm³' },
          { descricao: 'Brita 1',       unidade: 'm³' },
          { descricao: 'Pedrisco',      unidade: 'm³' },
        ]
      },
      {
        nome: 'Madeira e Compensado',
        itens: [
          { descricao: 'Compensado Resinado 12mm', unidade: 'm²' },
          { descricao: 'Pontalete 3x3"',           unidade: 'm'  },
          { descricao: 'Tábua Pinus 1"x12"',       unidade: 'm'  },
          { descricao: 'Sarrafo 2,5x5cm',          unidade: 'm'  },
        ]
      },
    ]
  },
  {
    grupo: 'Instalações Elétricas',
    subgrupos: [
      {
        nome: 'Fios e Cabos',
        itens: [
          { descricao: 'Fio 1,5mm² Flexível',  unidade: 'm' },
          { descricao: 'Fio 2,5mm² Flexível',  unidade: 'm' },
          { descricao: 'Fio 4mm² Flexível',    unidade: 'm' },
          { descricao: 'Cabo PP 2x1,5mm²',     unidade: 'm' },
        ]
      },
      {
        nome: 'Eletrodutos e Conexões',
        itens: [
          { descricao: 'Eletroduto Flexível 3/4"', unidade: 'm'  },
          { descricao: 'Eletroduto Rígido 3/4"',   unidade: 'm'  },
          { descricao: 'Caixa de Luz 4x2"',        unidade: 'un' },
          { descricao: 'Caixa de Luz 4x4"',        unidade: 'un' },
        ]
      },
      {
        nome: 'Quadros e Disjuntores',
        itens: [
          { descricao: 'Disjuntor Mono 10A',                  unidade: 'un' },
          { descricao: 'Disjuntor Mono 20A',                  unidade: 'un' },
          { descricao: 'Disjuntor Bipolar 40A',               unidade: 'un' },
          { descricao: 'Quadro de Distribuição 12 Disjuntores', unidade: 'un' },
          { descricao: 'DR 25A 30mA',                         unidade: 'un' },
        ]
      },
    ]
  },
  {
    grupo: 'Instalações Hidráulicas',
    subgrupos: [
      {
        nome: 'Tubos e Conexões PVC',
        itens: [
          { descricao: 'Tubo PVC 25mm',     unidade: 'm'  },
          { descricao: 'Tubo PVC 32mm',     unidade: 'm'  },
          { descricao: 'Tubo PVC 50mm',     unidade: 'm'  },
          { descricao: 'Tubo PVC 100mm',    unidade: 'm'  },
          { descricao: 'Joelho 90° 25mm',   unidade: 'un' },
          { descricao: 'Tê 25mm',           unidade: 'un' },
        ]
      },
      {
        nome: 'Metais e Louças',
        itens: [
          { descricao: 'Vaso Sanitário com Caixa Acoplada', unidade: 'un' },
          { descricao: 'Pia de Cozinha Inox',               unidade: 'un' },
          { descricao: 'Cuba de Embutir',                   unidade: 'un' },
          { descricao: 'Torneira de Parede',                unidade: 'un' },
          { descricao: 'Ducha Higiênica',                   unidade: 'un' },
          { descricao: 'Registro de Gaveta 3/4"',           unidade: 'un' },
        ]
      },
      {
        nome: 'Caixas e Reservatórios',
        itens: [
          { descricao: 'Caixa d\'Água 500L',   unidade: 'un' },
          { descricao: 'Caixa d\'Água 1.000L', unidade: 'un' },
          { descricao: 'Caixa de Inspeção',    unidade: 'un' },
        ]
      },
    ]
  },
  {
    grupo: 'Esquadrias e Vidros',
    subgrupos: [
      {
        nome: 'Portas',
        itens: [
          { descricao: 'Porta de Madeira 80cm', unidade: 'un' },
          { descricao: 'Porta de Madeira 90cm', unidade: 'un' },
          { descricao: 'Porta Metálica',        unidade: 'un' },
          { descricao: 'Marco e Alizares',      unidade: 'jg' },
        ]
      },
      {
        nome: 'Janelas',
        itens: [
          { descricao: 'Janela de Alumínio 100x100', unidade: 'un' },
          { descricao: 'Janela de Alumínio 150x100', unidade: 'un' },
          { descricao: 'Janela Basculante 60x60',    unidade: 'un' },
        ]
      },
      {
        nome: 'Vidros',
        itens: [
          { descricao: 'Vidro Liso 4mm',        unidade: 'm²' },
          { descricao: 'Vidro Temperado 8mm',   unidade: 'm²' },
        ]
      },
    ]
  },
  {
    grupo: 'Acabamentos',
    subgrupos: [
      {
        nome: 'Revestimentos Cerâmicos',
        itens: [
          { descricao: 'Piso Cerâmico',          unidade: 'm²' },
          { descricao: 'Azulejo',                unidade: 'm²' },
          { descricao: 'Porcelanato',            unidade: 'm²' },
          { descricao: 'Rejunte',                unidade: 'kg' },
          { descricao: 'Cola para Cerâmica',     unidade: 'sc' },
        ]
      },
      {
        nome: 'Pinturas',
        itens: [
          { descricao: 'Tinta Látex PVA',    unidade: 'l'  },
          { descricao: 'Tinta Acrílica',     unidade: 'l'  },
          { descricao: 'Massa Corrida PVA',  unidade: 'l'  },
          { descricao: 'Selador Acrílico',   unidade: 'l'  },
          { descricao: 'Lixa para Parede',   unidade: 'un' },
        ]
      },
      {
        nome: 'Forros e Pisos',
        itens: [
          { descricao: 'Forro de Gesso',   unidade: 'm²' },
          { descricao: 'Forro PVC',        unidade: 'm²' },
          { descricao: 'Piso Laminado',    unidade: 'm²' },
          { descricao: 'Rodapé',           unidade: 'm'  },
        ]
      },
    ]
  },
  {
    grupo: 'Cobertura',
    subgrupos: [
      {
        nome: 'Estrutura de Cobertura',
        itens: [
          { descricao: 'Tesoura de Madeira', unidade: 'un' },
          { descricao: 'Caibro 5x5cm',       unidade: 'm'  },
          { descricao: 'Ripa 2,5x5cm',       unidade: 'm'  },
        ]
      },
      {
        nome: 'Telhas e Calhas',
        itens: [
          { descricao: 'Telha Cerâmica',     unidade: 'm²' },
          { descricao: 'Telha Metálica',     unidade: 'm²' },
          { descricao: 'Telha Fibrocimento', unidade: 'm²' },
          { descricao: 'Cumeeira',           unidade: 'm'  },
          { descricao: 'Calha PVC',          unidade: 'm'  },
        ]
      },
    ]
  },
  {
    grupo: 'Serviços e Mão de Obra',
    subgrupos: [
      {
        nome: 'Mão de Obra Direta',
        itens: [
          { descricao: 'Pedreiro',    unidade: 'hr' },
          { descricao: 'Servente',    unidade: 'hr' },
          { descricao: 'Eletricista', unidade: 'hr' },
          { descricao: 'Encanador',   unidade: 'hr' },
          { descricao: 'Carpinteiro', unidade: 'hr' },
          { descricao: 'Pintor',      unidade: 'hr' },
        ]
      },
      {
        nome: 'Serviços Terceirizados',
        itens: [
          { descricao: 'Locação de Andaime',    unidade: 'm²' },
          { descricao: 'Locação de Betoneira',  unidade: 'hr' },
          { descricao: 'Aluguel de Compactador',unidade: 'dia'},
          { descricao: 'Caçamba de Entulho',    unidade: 'un' },
        ]
      },
    ]
  },
  {
    grupo: 'Locação de Equipamentos',
    subgrupos: [
      {
        nome: 'Equipamentos',
        itens: [
          { descricao: 'Betoneira 400L',        unidade: 'hr'  },
          { descricao: 'Andaime Metálico',      unidade: 'dia' },
          { descricao: 'Compactador de Solo',   unidade: 'hr'  },
          { descricao: 'Vibrador de Concreto',  unidade: 'hr'  },
          { descricao: 'Grua / Guindaste',      unidade: 'hr'  },
        ]
      },
    ]
  },
];

async function seedCompras() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Pega empresa_id = 1 (demo)
    const [[empresa]] = await conn.query('SELECT id FROM empresas LIMIT 1');
    if (!empresa) throw new Error('Nenhuma empresa encontrada. Rode npm run db:seed primeiro.');
    const eid = empresa.id;

    console.log(`\n🌱 Inserindo plano de contas para empresa_id=${eid}...\n`);

    let totalGrupos = 0, totalSubgrupos = 0, totalItens = 0;

    for (const g of PLANO) {
      // Verifica se grupo já existe
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

      for (const s of g.subgrupos) {
        const [[existingSub]] = await conn.query(
          'SELECT id FROM subgrupos_item WHERE empresa_id=? AND id_grupo=? AND descricao=?',
          [eid, grupoId, s.nome]
        );
        let subId;
        if (existingSub) {
          subId = existingSub.id;
        } else {
          const [r] = await conn.query(
            'INSERT INTO subgrupos_item (empresa_id, id_grupo, descricao) VALUES (?, ?, ?)',
            [eid, grupoId, s.nome]
          );
          subId = r.insertId;
          totalSubgrupos++;
          console.log(`     ✅ Subgrupo: ${s.nome}`);
        }

        for (const item of s.itens) {
          const [[existingItem]] = await conn.query(
            'SELECT id FROM itens_compra WHERE empresa_id=? AND descricao=?',
            [eid, item.descricao]
          );
          if (!existingItem) {
            await conn.query(
              'INSERT INTO itens_compra (empresa_id, id_grupo, id_subgrupo, descricao, unidade) VALUES (?, ?, ?, ?, ?)',
              [eid, grupoId, subId, item.descricao, item.unidade]
            );
            totalItens++;
          }
        }
      }
    }

    await conn.commit();
    console.log(`\n🎉 Plano de contas inserido com sucesso!`);
    console.log(`   Grupos:    ${totalGrupos}`);
    console.log(`   Subgrupos: ${totalSubgrupos}`);
    console.log(`   Itens:     ${totalItens}\n`);

  } catch (err) {
    await conn.rollback();
    console.error('\n❌ Erro:', err.message);
    throw err;
  } finally {
    conn.release();
  }
}

seedCompras()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
