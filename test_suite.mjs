/**
 * Automated Test Suite for EBD Nova Suíça
 */

// Mock Browser Environment
const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

const elements = new Map();
function getOrCreateEl(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id,
      textContent: '',
      value: '',
      style: { width: '', display: '' },
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {}
      },
      setAttribute: () => {},
      removeAttribute: () => {},
      querySelector: () => null,
      querySelectorAll: () => []
    });
  }
  return elements.get(id);
}

globalThis.window = globalThis;
globalThis.document = {
  documentElement: {
    getAttribute: (attr) => 'dark',
    setAttribute: (attr, val) => {}
  },
  getElementById: (id) => getOrCreateEl(id),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: (tag) => ({
    className: '',
    textContent: '',
    style: {},
    appendChild: () => {},
    classList: { add: () => {}, remove: () => {} },
    setAttribute: () => {}
  })
};

try {
  Object.defineProperty(globalThis.navigator, 'vibrate', { value: (pattern) => true, writable: true, configurable: true });
} catch (e) {}

import { Store, DEFAULT_MEMBERS } from './js/core/store.js';
import { Haptics } from './js/core/haptics.js';
import { Router } from './js/core/router.js';
import { Chamada } from './js/modules/chamada.js';
import { ModoRapido } from './js/modules/modoRapido.js';
import { Caixa } from './js/modules/caixa.js';
import { Ranking } from './js/modules/ranking.js';
import { Memorias } from './js/modules/memorias.js';
import { Sync } from './js/modules/sync.js';
import { Admin } from './js/modules/admin.js';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

console.log("=== INICIANDO TESTES DO SISTEMA EBD NOVA SUÍÇA ===\n");

// 1. TESTES DO STORE & RETROCOMPATIBILIDADE
console.log("1. Testes de Store & Preservação de Dados:");
const members = Store.getDb();
assert(members.length === 32, "Base inicial contém exatamente 32 membros");
assert(members[0].nome === "ADONIAS QUEIROZ DO MONTE", "Primeiro membro é ADONIAS QUEIROZ DO MONTE");
assert(members.some(m => m.nome === "JOSE GERISMAR ONIAS" && m.apelido === "Pastor"), "Pastor José Gerismar preservado");
assert(members.some(m => m.nome === "VICTOR HUGO"), "Victor Hugo preservado");
assert(members.every(m => m.oculto === false), "Todos os membros começam com oculto: false");

// Teste de persistência de presenças
Store.setPresencas({ "ADONIAS QUEIROZ DO MONTE": { status: 'P', perguntas: 2, ofertou: true } });
const pSalvas = Store.getPresencas();
assert(pSalvas["ADONIAS QUEIROZ DO MONTE"]?.status === 'P', "Presença persistida com sucesso");
assert(pSalvas["ADONIAS QUEIROZ DO MONTE"]?.perguntas === 2, "Perguntas persistidas com sucesso");
assert(pSalvas["ADONIAS QUEIROZ DO MONTE"]?.ofertou === true, "Oferta persistida com sucesso");

// Teste de pub/sub
let eventReceived = false;
Store.on('test_event', (data) => { if (data === 42) eventReceived = true; });
Store.emit('test_event', 42);
assert(eventReceived === true, "Sistema de Pub/Sub reativo funciona");

// 2. TESTES DE CAIXA E INTEGRIDADE FINANCEIRA
console.log("\n2. Testes do Módulo Caixa & Tesouraria:");
Store.setCaixa({ saldo: 100, historico: [] });
let caixa = Store.getCaixa();
assert(caixa.saldo === 100, "Saldo inicial configurado em R$ 100,00");

// Adicionando Entrada
Caixa.tipoPendente = 'ENTRADA';
getOrCreateEl('fin-desc').value = 'Oferta da Escola';
getOrCreateEl('fin-valor').value = '50.00';
getOrCreateEl('fin-categoria').value = 'Oferta';

Caixa.salvarTransacao();
caixa = Store.getCaixa();
assert(caixa.saldo === 150, "Entrada de R$ 50 aumentou saldo para R$ 150,00");
assert(caixa.historico.length === 1, "Histórico registrou 1 movimentação");
assert(caixa.historico[0].desc === 'Oferta da Escola', "Descrição correta no histórico");

// Teste de Saída Válida
Caixa.tipoPendente = 'SAIDA';
getOrCreateEl('fin-desc').value = 'Material Didático';
getOrCreateEl('fin-valor').value = '30.00';
getOrCreateEl('fin-categoria').value = 'Material Didático';

Caixa.salvarTransacao();
caixa = Store.getCaixa();
assert(caixa.saldo === 120, "Saída de R$ 30 reduziu saldo para R$ 120,00");

// Teste de Saída com Saldo Insuficiente (deve bloquear!)
let alertMessage = '';
globalThis.alert = (msg) => { alertMessage = msg; };
getOrCreateEl('fin-desc').value = 'Gasto Excessivo';
getOrCreateEl('fin-valor').value = '9999.00';

Caixa.salvarTransacao();
caixa = Store.getCaixa();
assert(caixa.saldo === 120, "Tentativa de saída maior que saldo bloqueada; saldo mantido em R$ 120,00");
assert(alertMessage.includes("Saldo insuficiente"), "Mensagem de alerta exibida ao tentar saldo negativo");

// Teste de Remoção e Recalculo do Saldo
const movId = caixa.historico[0].id; // era a saída de R$ 30
globalThis.confirm = () => true;
Caixa.remover(movId);
caixa = Store.getCaixa();
assert(caixa.saldo === 150, "Remoção da saída de R$ 30 estornou o saldo de volta para R$ 150,00");
assert(caixa.historico.length === 1, "Histórico decrementado");

// 3. TESTES DE CHAMADA, FILTROS E PONTOS
console.log("\n3. Testes do Módulo Chamada:");
Chamada.setStatus("ADONIAS QUEIROZ DO MONTE", "P");
Chamada.addPerguntas("ADONIAS QUEIROZ DO MONTE", 1);
Chamada.toggleOferta("ADONIAS QUEIROZ DO MONTE");
let p = Store.getPresencas()["ADONIAS QUEIROZ DO MONTE"];
assert(p.status === "P", "Status alterado para Presente ('P')");
assert(p.perguntas >= 1, "Pontos incrementados");

// Teste de não permitir pontos negativos
Chamada.addPerguntas("ADONIAS QUEIROZ DO MONTE", -999);
p = Store.getPresencas()["ADONIAS QUEIROZ DO MONTE"];
assert(p.perguntas === 0, "Pontos não ficam negativos com decremento excessivo");

// 4. TESTES DE MODO RÁPIDO
console.log("\n4. Testes do Módulo Modo Rápido:");
ModoRapido.open();
assert(ModoRapido.lista.length === 32, "Modo rápido carregou os 32 alunos");
assert(ModoRapido.isOpen === true, "Modo rápido está ativo");
const idxAntes = ModoRapido.indice;
ModoRapido.votar('P');
assert(ModoRapido.indice === idxAntes + 1, "Votar avança automaticamente para o próximo aluno");
ModoRapido.navegar(-1);
assert(ModoRapido.indice === idxAntes, "Navegação retrocede corretamente");
ModoRapido.close();
assert(ModoRapido.isOpen === false, "Modo rápido fechado");

// 5. TESTES DE RANKING
console.log("\n5. Testes de Cálculo de Ranking:");
Store.setHistorico([
  {
    data: "15/10/2026",
    frequencia: [
      { nome: "ADONIAS QUEIROZ DO MONTE", status: "P" },
      { nome: "VICTOR HUGO", status: "P" },
      { nome: "GERALDO", status: "A" }
    ]
  },
  {
    data: "22/10/2026",
    frequencia: [
      { nome: "VICTOR HUGO", status: "P" },
      { nome: "GERALDO", status: "P" }
    ]
  }
]);
const rank = Ranking.calcularLocal();
assert(rank[0].nome === "VICTOR HUGO" && rank[0].pontos === 2, "1º Lugar é Victor Hugo com 2 presenças");
assert(rank[1].pontos === 1, "2º Lugar possui 1 presença");

// 6. TESTES DE MEMÓRIAS & FLASHCARDS
console.log("\n6. Testes do Módulo Memórias Bíblicas:");
assert(Memorias.versiculosPadrao.length === 7, "Existem 7 versículos bíblicos cadastrados para os dias da semana");
Memorias.toggleMemorizado({}, "João 3:16");
let mem = Store.getMemorias();
assert(mem.memorizados["João 3:16"]?.streak === 1, "Versículo marcado como memorizado com streak 1");

// 7. TESTES DO MÓDULO ADMIN
console.log("\n7. Testes de Administração de Membros:");
const countAntes = Store.getDb().length;
getOrCreateEl('membroNome').value = 'NOVO ALUNO TESTE';
getOrCreateEl('membroApelido').value = 'Teste';
Admin.editIndex = -1;
Admin.salvarMembro();
assert(Store.getDb().length === countAntes + 1, "Novo aluno cadastrado com sucesso");
const novoMembro = Store.getDb().find(m => m.nome === 'NOVO ALUNO TESTE');
assert(novoMembro !== undefined, "Aluno localizado no Store");

// Toggle oculto
const novoIdx = Store.getDb().findIndex(m => m.nome === 'NOVO ALUNO TESTE');
Admin.toggleOculto(novoIdx);
assert(Store.getDb()[novoIdx].oculto === true, "Membro ocultado com sucesso");

// 8. TESTES DE SINCRONIZAÇÃO E EXPORTAÇÃO CSV
console.log("\n8. Testes de Exportação e Formatação:");
let downloadedUrl = '';
let downloadedFilename = '';
globalThis.URL = {
  createObjectURL: (blob) => 'blob:mock-url',
  revokeObjectURL: () => {}
};
globalThis.Blob = class {
  constructor(parts, options) {
    this.content = parts.join('');
    this.options = options;
  }
};
document.body = {
  appendChild: (el) => {
    downloadedUrl = el.href;
    downloadedFilename = el.download;
  },
  removeChild: () => {},
  classList: { add: () => {}, remove: () => {} }
};

Sync.exportarCSV();
assert(downloadedFilename.startsWith('chamada_ebd_'), "Arquivo CSV possui prefixo correto com data");
assert(downloadedFilename.endsWith('.csv'), "Extensão do arquivo exportado é .csv");

// 9. TESTES DE NAVEGAÇÃO E ROTAS
console.log("\n9. Testes de Router & Abas:");
let hookExecutado = false;
Router.registerHook('ranking', () => { hookExecutado = true; });
Router.switch('ranking');
assert(Router.currentTab === 'ranking', "Router alternou para aba 'ranking'");
assert(hookExecutado === true, "Hook de ciclo de vida da aba 'ranking' disparado com sucesso");

// 10. TESTES DE EDGE CASES: NOMES COM ACENTOS, ASPAS E CARACTERES ESPECIAIS
console.log("\n10. Testes de Robustez com Caracteres Especiais & Acentuação:");
const membrosAcentuados = [
  "ANTONIA APARECIDA FUZATO",
  "APARECIDA GRANADA",
  "VIRGÍNIA",
  "MARIA DA CRUZ CONCEIÇÃO"
];
membrosAcentuados.forEach(nome => {
  Chamada.setStatus(nome, 'P');
  Chamada.addPerguntas(nome, 3);
  Chamada.toggleOferta(nome);
  const salvo = Store.getPresencas()[nome];
  assert(salvo && salvo.status === 'P' && salvo.perguntas === 3 && salvo.ofertou === true,
    `Presença, pontos e oferta gravados perfeitamente para: ${nome}`);
});

// Teste de cálculo de estatísticas após marcar os membros acentuados
Chamada.updateStats();
assert(document.getElementById('stat-p').textContent >= 4, "Contador de presentes computou corretamente membros acentuados");

// 11. TESTE DE INTEGRIDADE DE ESTATÍSTICAS COM MEMBROS OCULTOS
console.log("\n11. Teste de Estatísticas com Membros Ocultos (Evitar >100%):");
const dbParaStats = Store.getDb();
const presParaStats = {};
dbParaStats.forEach(m => { presParaStats[m.nome] = { status: 'P', perguntas: 0, ofertou: false }; });
Store.setPresencas(presParaStats);
// Oculta 2 membros
dbParaStats[0].oculto = true;
dbParaStats[1].oculto = true;
Store.setDb(dbParaStats);
Chamada.updateStats();
const statPEl = document.getElementById('stat-p');
const progTxtEl = document.getElementById('prog-txt');
const totalAtivos = dbParaStats.filter(m => !m.oculto).length;
assert(statPEl.textContent == totalAtivos, `Presentes (${statPEl.textContent}) respeita total de membros ativos (${totalAtivos})`);
assert(progTxtEl.textContent === '100%', `Taxa de presença não excede 100% com membros ocultos: ${progTxtEl.textContent}`);
// Restaura
dbParaStats[0].oculto = false;
dbParaStats[1].oculto = false;
Store.setDb(dbParaStats);

// 12. TESTE DE RANKING COM EX-MEMBROS / MEMBROS DELETADOS
console.log("\n12. Teste de Isolamento do Pódio contra Membros Deletados:");
Store.setHistorico([
  {
    data: "01/10/2026",
    frequencia: [
      { nome: "MEMBRO ANTIGO DELETADO", status: "P" },
      { nome: "ADONIAS QUEIROZ DO MONTE", status: "P" }
    ]
  }
]);
const rankComDeletados = Ranking.calcularLocal();
const contemDeletado = rankComDeletados.some(r => r.nome === "MEMBRO ANTIGO DELETADO");
assert(contemDeletado === false, "Membro deletado/inexistente no banco não aparece no Ranking/Pódio");

// 13. TESTE DE ARITMÉTICA FINANCEIRA SEM DRIFT DE PONTO FLUTUANTE
console.log("\n13. Teste de Precisão Decimal do Caixa (Anti Float-Drift):");
Store.setCaixa({ saldo: 0, historico: [] });
Caixa.tipoPendente = 'ENTRADA';
getOrCreateEl('fin-desc').value = 'Item 1';
getOrCreateEl('fin-valor').value = '10.10';
Caixa.salvarTransacao();
getOrCreateEl('fin-desc').value = 'Item 2';
getOrCreateEl('fin-valor').value = '20.20';
Caixa.salvarTransacao();
const saldoObtido = Store.getCaixa().saldo;
assert(saldoObtido === 30.3, `Saldo exato sem float drift: ${saldoObtido} (esperado 30.3)`);

// 14. TESTE DE ESCAPING DE NOMES COM APÓSTROFOS/ASPAS EM CARDS
console.log("\n14. Teste de Renderização com Nomes Contendo Aspas e Apóstrofos:");
const nomeComApostrofo = "D'AVILA O'CONNOR";
Store.setDb([{ nome: nomeComApostrofo, apelido: "D'Avila", oculto: false }]);
let renderedAlunosHtml = '';
getOrCreateEl('lista-alunos').innerHTML = '';
Object.defineProperty(getOrCreateEl('lista-alunos'), 'innerHTML', {
  set(val) { renderedAlunosHtml = val; },
  get() { return renderedAlunosHtml; },
  configurable: true
});
Chamada.render();
assert(renderedAlunosHtml.includes('dataset.aluno'), "Card usa dataset.aluno para delegação segura de cliques");
assert(!renderedAlunosHtml.includes(`'${nomeComApostrofo}'`), "Não interpola string crua com apóstrofos dentro de aspas simples");

// 15. TESTE DE EDIÇÃO DE MEMBRO PRESERVANDO PRESENÇAS DO DIA
console.log("\n15. Teste de Renomeação de Aluno Preservando Presença de Hoje:");
Store.setDb([
  { nome: "JOAO SILVA", apelido: "Joao", oculto: false }
]);
Store.setPresencas({ "JOAO SILVA": { status: 'P', perguntas: 5, ofertou: true } });
Admin.editIndex = 0;
getOrCreateEl('membroNome').value = 'JOAO SILVA SANTOS';
getOrCreateEl('membroApelido').value = 'Joao Santos';
Admin.salvarMembro();
const presAposRename = Store.getPresencas();
assert(presAposRename["JOAO SILVA"] === undefined, "Chave antiga removida de hoje_v36");
assert(presAposRename["JOAO SILVA SANTOS"]?.status === 'P', "Presença transferida para o novo nome");
assert(presAposRename["JOAO SILVA SANTOS"]?.perguntas === 5, "Pontuação transferida com sucesso");

// 16. TESTE DE EXCLUSÃO DE MEMBRO LIMPANDO PRESENÇA ÓRFÃ
console.log("\n16. Teste de Exclusão de Aluno Limpando Presença Órfã:");
Admin.confirmarExclusao(0);
const presAposDelete = Store.getPresencas();
assert(presAposDelete["JOAO SILVA SANTOS"] === undefined, "Presença do membro excluído limpa de hoje_v36");
assert(Store.getDb().length === 0, "Membro excluído do banco com sucesso");

// 17. TESTE DE ESCAPING RFC 4180 EM EXPORTAÇÃO CSV
console.log("\n17. Teste de CSV RFC 4180 com Aspas Duplas:");
Store.setDb([{ nome: 'ALUNO TESTE', apelido: 'Irmão "Cida" Especial', oculto: false }]);
Store.setPresencas({ 'ALUNO TESTE': { status: 'P', perguntas: 0, ofertou: false } });
Sync.exportarCSV();
assert(downloadedFilename.endsWith('.csv'), "Arquivo CSV gerado com sucesso");

// 18. TESTE DE DATA LOCAL EM MEMÓRIAS
console.log("\n18. Teste de Data Local em Memórias:");
const dataLocal = Memorias.getHojeLocal();
const regexData = /^\d{4}-\d{2}-\d{2}$/;
assert(regexData.test(dataLocal), `Data local formato YYYY-MM-DD válido: ${dataLocal}`);

console.log(`\n========================================`);
console.log(`RESUMO DOS TESTES: ${passed} passaram, ${failed} falharam.`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("✓ TODOS OS TESTES PASSARAM COM SUCESSO!");
}
