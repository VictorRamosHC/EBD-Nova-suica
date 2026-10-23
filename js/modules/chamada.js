/**
 * ============================================================================
 * EBD NOVA SUÍÇA — MODULE: CHAMADA
 * Lista de chamada, filtros, marcação de presença (P/A/V), pontos e ofertas.
 * ============================================================================
 */

import { Store } from '../core/store.js';
import { Haptics } from '../core/haptics.js';

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const Chamada = {
  filterText: '',
  filterStatus: 'todos',
  dataAula: '',
  miniChartInstance: null,
  freqChartInstance: null,

  init() {
    this.initDataAula();
    this.initMiniChart();
    this.render();

    // Re-renderiza quando presenças ou db mudarem
    Store.on('presencas_changed', () => {
      this.updateStats();
    });

    Store.on('db_changed', () => {
      this.render();
    });
  },

  initDataAula() {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    this.dataAula = `${dia}/${mes}/${ano}`;

    const dateLabel = document.getElementById('data-label');
    if (dateLabel) dateLabel.textContent = this.dataAula;

    const inputData = document.getElementById('input-data');
    if (inputData) inputData.value = `${ano}-${mes}-${dia}`;
  },

  abrirDatePicker() {
    Haptics.selection();
    const inputData = document.getElementById('input-data');
    if (!inputData) return;
    if (typeof inputData.showPicker === 'function') {
      try {
        inputData.showPicker();
        return;
      } catch (e) {
        // Fallback para dispositivos onde showPicker exige ativação direta
      }
    }
    try {
      inputData.focus();
      inputData.click();
    } catch (e) {}
  },

  mudarData(val) {
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      this.dataAula = `${parts[2]}/${parts[1]}/${parts[0]}`;
      const dateLabel = document.getElementById('data-label');
      if (dateLabel) dateLabel.textContent = this.dataAula;
    }
  },

  capitalize(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  },

  getInitials(name) {
    if (!name) return 'E';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  },

  setFilterStatus(status, el) {
    this.filterStatus = status;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (el) el.classList.add('active');
    Haptics.selection();
    this.render();
  },

  setFilterText(text) {
    this.filterText = (text || '').toLowerCase().trim();
    this.render();
  },

  setStatus(nome, status) {
    if (!nome) return;
    Haptics.light();
    const presencas = Store.getPresencas();
    if (!presencas[nome]) {
      presencas[nome] = { status: 'A', perguntas: 0, ofertou: false };
    }
    presencas[nome].status = status;
    Store.setPresencas(presencas);
    this.updateCardUi(nome, presencas[nome]);
    this.updateStats();
  },

  toggleOferta(nome) {
    if (!nome) return;
    Haptics.medium();
    const presencas = Store.getPresencas();
    if (!presencas[nome]) {
      presencas[nome] = { status: 'A', perguntas: 0, ofertou: false };
    }
    presencas[nome].ofertou = !presencas[nome].ofertou;
    Store.setPresencas(presencas);
    this.updateCardUi(nome, presencas[nome]);
  },

  addPerguntas(nome, delta) {
    if (!nome) return;
    Haptics.selection();
    const presencas = Store.getPresencas();
    if (!presencas[nome]) {
      presencas[nome] = { status: 'A', perguntas: 0, ofertou: false };
    }
    presencas[nome].perguntas = Math.max(0, (presencas[nome].perguntas || 0) + delta);
    Store.setPresencas(presencas);
    this.updateCardUi(nome, presencas[nome]);
  },

  updateCardUi(nome, presenca) {
    let cardEl = null;
    const cards = document.querySelectorAll('.aluno-card');
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].dataset.aluno === nome) {
        cardEl = cards[i];
        break;
      }
    }

    if (!cardEl) {
      this.render();
      return;
    }

    const st = presenca.status || 'A';
    cardEl.classList.remove('status-p', 'status-a', 'status-v');
    cardEl.classList.add(st === 'P' ? 'status-p' : (st === 'V' ? 'status-v' : 'status-a'));

    // Atualiza pills
    const pillP = cardEl.querySelector('.pill-p');
    const pillA = cardEl.querySelector('.pill-a');
    const pillV = cardEl.querySelector('.pill-v');
    if (pillP) pillP.classList.toggle('active', st === 'P');
    if (pillA) pillA.classList.toggle('active', st === 'A');
    if (pillV) pillV.classList.toggle('active', st === 'V');

    // Atualiza pontos
    const counterVal = cardEl.querySelector('.counter-value');
    if (counterVal) counterVal.textContent = `${presenca.perguntas || 0} pt`;

    // Atualiza oferta
    const btnOferta = cardEl.querySelector('.btn-oferta');
    if (btnOferta) btnOferta.classList.toggle('ativo', !!presenca.ofertou);
  },

  render() {
    const container = document.getElementById('lista-alunos');
    if (!container) return;

    const db = Store.getDb();
    const presencas = Store.getPresencas();
    const query = this.filterText;

    let list = db.filter(m => !m.oculto);

    if (query) {
      list = list.filter(m => 
        m.nome.toLowerCase().includes(query) || 
        (m.apelido && m.apelido.toLowerCase().includes(query))
      );
    }

    if (this.filterStatus === 'presentes') {
      list = list.filter(m => presencas[m.nome]?.status === 'P');
    } else if (this.filterStatus === 'ausentes') {
      list = list.filter(m => !presencas[m.nome] || presencas[m.nome].status === 'A');
    } else if (this.filterStatus === 'visitantes') {
      list = list.filter(m => presencas[m.nome]?.status === 'V');
    }

    list.sort((a, b) => a.nome.localeCompare(b.nome));

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <p class="empty-state-text">Nenhum aluno encontrado com o filtro atual.</p>
        </div>`;
      this.updateStats();
      return;
    }

    container.innerHTML = list.map(m => {
      const p = presencas[m.nome] || { status: 'A', perguntas: 0, ofertou: false };
      const statusClass = p.status === 'P' ? 'status-p' : (p.status === 'V' ? 'status-v' : 'status-a');
      const initials = escapeHtml(this.getInitials(m.nome));
      const escapedNome = escapeHtml(m.nome);
      const capitalizedNome = escapeHtml(this.capitalize(m.nome));
      const escapedApelido = escapeHtml(m.apelido || 'Membro');

      return `
        <div class="aluno-card ${statusClass}" data-aluno="${escapedNome}">
          <div class="aluno-card-top">
            <div class="aluno-info-wrap">
              <div class="aluno-avatar">${initials}</div>
              <div class="aluno-details">
                <div class="aluno-name">${capitalizedNome}</div>
                <div class="aluno-sub">${escapedApelido}</div>
              </div>
            </div>
            <button class="btn-oferta ${p.ofertou ? 'ativo' : ''}" 
                    onclick="Chamada.toggleOferta(this.closest('.aluno-card').dataset.aluno)" 
                    title="Oferta" 
                    aria-label="Registrar oferta de ${capitalizedNome}">💰</button>
          </div>
          
          <div class="aluno-card-actions">
            <div class="status-pills">
              <button class="pill-btn pill-p ${p.status === 'P' ? 'active' : ''}" 
                      onclick="Chamada.setStatus(this.closest('.aluno-card').dataset.aluno, 'P')" 
                      aria-label="Marcar presente">P</button>
              <button class="pill-btn pill-a ${p.status === 'A' ? 'active' : ''}" 
                      onclick="Chamada.setStatus(this.closest('.aluno-card').dataset.aluno, 'A')" 
                      aria-label="Marcar falta">F</button>
              <button class="pill-btn pill-v ${p.status === 'V' ? 'active' : ''}" 
                      onclick="Chamada.setStatus(this.closest('.aluno-card').dataset.aluno, 'V')" 
                      aria-label="Marcar visitante">V</button>
            </div>
            <div class="counter-group">
              <button class="counter-btn" onclick="Chamada.addPerguntas(this.closest('.aluno-card').dataset.aluno, -1)" aria-label="Diminuir ponto">-</button>
              <span class="counter-value">${p.perguntas || 0} pt</span>
              <button class="counter-btn" onclick="Chamada.addPerguntas(this.closest('.aluno-card').dataset.aluno, 1)" aria-label="Aumentar ponto">+</button>
            </div>
          </div>
        </div>`;
    }).join('');

    this.updateStats();
  },

  updateStats() {
    const db = Store.getDb().filter(m => !m.oculto);
    const presencas = Store.getPresencas();

    const total = db.length;
    let p = 0;
    let v = 0;

    // Computa estatísticas estritamente para membros ativos/visíveis
    db.forEach(m => {
      const st = presencas[m.nome]?.status || 'A';
      if (st === 'P') p++;
      else if (st === 'V') v++;
    });

    const a = Math.max(0, total - p - v);
    const pct = total > 0 ? Math.round((p / total) * 100) : 0;

    const statPEl = document.getElementById('stat-p');
    const statAEl = document.getElementById('stat-a');
    const statVEl = document.getElementById('stat-v');
    const progTxt = document.getElementById('prog-txt');
    const progFill = document.getElementById('prog-fill');

    if (statPEl) statPEl.textContent = p;
    if (statAEl) statAEl.textContent = a;
    if (statVEl) statVEl.textContent = v;
    if (progTxt) progTxt.textContent = `${pct}%`;
    if (progFill && progFill.style) progFill.style.width = `${pct}%`;

    this.updateCharts(p, a, v);
  },

  initMiniChart() {
    const canvas = document.getElementById('miniChart');
    if (!canvas || typeof Chart === 'undefined') return;

    try {
      this.miniChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
            borderWidth: 0
          }]
        },
        options: {
          cutout: '70%',
          responsive: false,
          maintainAspectRatio: true,
          plugins: { legend: { display: false }, tooltip: { enabled: false } }
        }
      });
    } catch (e) {
      console.warn('[Chamada] Falha ao criar miniChart', e);
    }
  },

  updateCharts(p, a, v) {
    if (this.miniChartInstance) {
      this.miniChartInstance.data.datasets[0].data = [p, a, v];
      this.miniChartInstance.update();
    }

    const freqCtx = document.getElementById('freqChart');
    if (!freqCtx || typeof Chart === 'undefined') return;

    if (this.freqChartInstance) {
      this.freqChartInstance.data.datasets[0].data = [p, a, v];
      this.freqChartInstance.update();
      return;
    }

    try {
      this.freqChartInstance = new Chart(freqCtx, {
        type: 'doughnut',
        data: {
          labels: ['Presentes', 'Ausentes', 'Visitantes'],
          datasets: [{
            data: [p, a, v],
            backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
            borderWidth: 0,
            borderRadius: 6
          }]
        },
        options: {
          cutout: '68%',
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 1.5,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                padding: 12,
                color: '#94A3B8',
                font: { size: 11, family: 'inherit', weight: 600 },
                usePointStyle: true,
                pointStyle: 'circle'
              }
            }
          }
        }
      });
    } catch (e) {
      console.warn('[Chamada] Erro ao instanciar freqChart', e);
    }
  }
};

if (typeof window !== 'undefined') {
  window.Chamada = Chamada;
}
