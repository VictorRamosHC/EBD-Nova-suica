/**
 * ============================================================================
 * EBD NOVA SUÍÇA — CORE STORE (LOCAL-FIRST STATE MANAGER)
 * Gerenciamento centralizado de estado reativo e persistência no LocalStorage.
 * Chaves retrocompatíveis: ebd_db_v36, ebd_hoje_v36, ebd_caixa_local, etc.
 * ============================================================================
 */

export const DEFAULT_MEMBERS = [
  { nome: "ADONIAS QUEIROZ DO MONTE", apelido: "Adonias", oculto: false },
  { nome: "ALAN QUEIROZ DO MONTE", apelido: "Membro", oculto: false },
  { nome: "ANTONIA APARECIDA FUZATO", apelido: "Irmã Tânia", oculto: false },
  { nome: "APARECIDA GRANADA", apelido: "Irmã Cida (Edirlei)", oculto: false },
  { nome: "CREUZA QUINTELA DA SILVA", apelido: "Membro", oculto: false },
  { nome: "CRISTINA", apelido: "Membro", oculto: false },
  { nome: "EDERLEI APARECIDO", apelido: "Membro", oculto: false },
  { nome: "ELISANGELA SILVEIRA", apelido: "Membro", oculto: false },
  { nome: "ELZA MENEZES", apelido: "Membro", oculto: false },
  { nome: "ENZO GABRIEL", apelido: "Membro", oculto: false },
  { nome: "FERNANDA DE OLIVEIRA", apelido: "Membro", oculto: false },
  { nome: "GINAUSIO CORREIA MENEZES", apelido: "Membro", oculto: false },
  { nome: "ISABELLE GRANADA", apelido: "Membro", oculto: false },
  { nome: "ISAQUE GRANADA", apelido: "Membro", oculto: false },
  { nome: "JANAINA", apelido: "Membro", oculto: false },
  { nome: "JEFERSON BATISTA", apelido: "Membro", oculto: false },
  { nome: "JENIFER MONIQUE", apelido: "Membro", oculto: false },
  { nome: "JOSE GERISMAR ONIAS", apelido: "Pastor", oculto: false },
  { nome: "JOSELMA QUEIROZ DO MONTE", apelido: "Membro", oculto: false },
  { nome: "JUNIOR DE OLIVEIRA", apelido: "Membro", oculto: false },
  { nome: "LUCAS HENRIQUE", apelido: "Membro", oculto: false },
  { nome: "LUIZ CARLOS SABINO", apelido: "Irmão Luiz", oculto: false },
  { nome: "MANOELINA FUZATO", apelido: "Irmã Nela", oculto: false },
  { nome: "MARIA DA CRUZ CONCEIÇÃO", apelido: "Membro", oculto: false },
  { nome: "MARIANA", apelido: "Membro", oculto: false },
  { nome: "MAYCON APARECIDO CARVALHO", apelido: "Membro", oculto: false },
  { nome: "NATALINO GERMANO", apelido: "Membro", oculto: false },
  { nome: "OZIEL DA FONSECA", apelido: "Membro", oculto: false },
  { nome: "PEDRO HENRIQUE", apelido: "Membro", oculto: false },
  { nome: "VICTOR HUGO", apelido: "Membro", oculto: false },
  { nome: "GERALDO", apelido: "Membro", oculto: false },
  { nome: "VIRGÍNIA", apelido: "Membro", oculto: false }
];

class StoreManager {
  constructor() {
    this.prefix = 'ebd_';
    this.listeners = new Map();
  }

  // --- PUB/SUB ---
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try { cb(data); } catch (e) { console.error(`[Store] Erro no listener '${event}':`, e); }
      });
    }
  }

  // --- GENERIC GET / SET / REMOVE ---
  get(key, fallback = null) {
    try {
      const fullKey = key.startsWith(this.prefix) ? key : this.prefix + key;
      const val = localStorage.getItem(fullKey);
      if (val === null || val === undefined) return fallback;
      return JSON.parse(val);
    } catch (e) {
      console.warn(`[Store] Falha ao ler '${key}', usando fallback.`, e);
      return fallback;
    }
  }

  set(key, value) {
    try {
      const fullKey = key.startsWith(this.prefix) ? key : this.prefix + key;
      localStorage.setItem(fullKey, JSON.stringify(value));
      this.emit(key, value);
    } catch (e) {
      console.error(`[Store] Falha ao persistir '${key}':`, e);
    }
  }

  remove(key) {
    try {
      const fullKey = key.startsWith(this.prefix) ? key : this.prefix + key;
      localStorage.removeItem(fullKey);
      this.emit(key, null);
    } catch (e) {
      console.error(`[Store] Falha ao remover '${key}':`, e);
    }
  }

  // --- MEMBROS / ALUNOS (ebd_db_v36) ---
  getDb() {
    const data = this.get('db_v36', null);
    if (!data || !Array.isArray(data)) {
      this.set('db_v36', DEFAULT_MEMBERS);
      return [...DEFAULT_MEMBERS];
    }
    return data;
  }

  setDb(members) {
    this.set('db_v36', members);
    this.emit('db_changed', members);
  }

  // --- CHAMADA DO DIA (ebd_hoje_v36) ---
  getPresencas() {
    return this.get('hoje_v36', {});
  }

  setPresencas(presencas) {
    this.set('hoje_v36', presencas);
    this.emit('presencas_changed', presencas);
  }

  limparPresencas() {
    this.remove('hoje_v36');
    this.emit('presencas_changed', {});
  }

  renamePresenca(oldNome, newNome) {
    if (!oldNome || !newNome || oldNome === newNome) return;
    const presencas = this.getPresencas();
    if (presencas[oldNome]) {
      presencas[newNome] = presencas[oldNome];
      delete presencas[oldNome];
      this.setPresencas(presencas);
    }
  }

  removePresenca(nome) {
    if (!nome) return;
    const presencas = this.getPresencas();
    if (presencas[nome]) {
      delete presencas[nome];
      this.setPresencas(presencas);
    }
  }

  // --- CAIXA FINANCEIRO (ebd_caixa_local) ---
  getCaixa() {
    return this.get('caixa_local', { saldo: 0, historico: [] });
  }

  setCaixa(caixaData) {
    this.set('caixa_local', caixaData);
    this.emit('caixa_changed', caixaData);
  }

  // --- HISTÓRICO DE CHAMADAS (ebd_historico_local) ---
  getHistorico() {
    return this.get('historico_local', []);
  }

  setHistorico(hist) {
    this.set('historico_local', hist);
    this.emit('historico_changed', hist);
  }

  addHistorico(entry) {
    const hist = this.getHistorico();
    hist.push(entry);
    this.setHistorico(hist);
  }

  // --- USUÁRIO LOGADO (ebd_user_name) ---
  getUser() {
    try {
      return localStorage.getItem('ebd_user_name') || null;
    } catch (e) {
      return null;
    }
  }

  setUser(name) {
    try {
      if (name) {
        localStorage.setItem('ebd_user_name', name);
      } else {
        localStorage.removeItem('ebd_user_name');
      }
      this.emit('user_changed', name);
    } catch (e) {
      console.error('[Store] Erro ao salvar ebd_user_name', e);
    }
  }

  // --- TEMA (ebd_theme) ---
  getTheme() {
    try {
      return localStorage.getItem('ebd_theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  setTheme(theme) {
    try {
      localStorage.setItem('ebd_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      this.emit('theme_changed', theme);
    } catch (e) {
      console.error('[Store] Erro ao salvar ebd_theme', e);
    }
  }

  // --- MEMÓRIAS (ebd_memorias) ---
  getMemorias() {
    return this.get('memorias', { versiculos: [], memorizados: {} });
  }

  setMemorias(data) {
    this.set('memorias', data);
    this.emit('memorias_changed', data);
  }
}

export const Store = new StoreManager();
if (typeof window !== 'undefined') {
  window.Store = Store;
}
