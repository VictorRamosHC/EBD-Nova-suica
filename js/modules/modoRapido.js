/**
 * ============================================================================
 * EBD NOVA SUÍÇA — MODULE: MODO RÁPIDO
 * Chamada acelerada aluno por aluno com interface de cartão em destaque e feedback tátil.
 * ============================================================================
 */

import { Store } from '../core/store.js';
import { Chamada, escapeHtml } from './chamada.js';
import { Haptics } from '../core/haptics.js';

export const ModoRapido = {
  lista: [],
  indice: 0,
  isOpen: false,

  open() {
    Haptics.medium();
    const db = Store.getDb();
    this.lista = db.filter(m => !m.oculto).sort((a, b) => a.nome.localeCompare(b.nome));

    if (this.lista.length === 0) {
      alert("Nenhum aluno cadastrado para chamada rápida.");
      return;
    }

    // Tenta posicionar no primeiro aluno ainda não respondido ou começa no 0
    const presencas = Store.getPresencas();
    const primeiroPendente = this.lista.findIndex(m => !presencas[m.nome]);
    this.indice = primeiroPendente !== -1 ? primeiroPendente : 0;
    this.isOpen = true;

    const overlay = document.getElementById('modalModoRapido');
    if (overlay) {
      overlay.classList.add('active');
      if (document.body) document.body.classList.add('modal-open');
    }

    this.bindKeyboard();
    this.render();
  },

  close() {
    this.isOpen = false;
    const overlay = document.getElementById('modalModoRapido');
    if (overlay) {
      overlay.classList.remove('active');
      if (document.body) document.body.classList.remove('modal-open');
    }
    this.unbindKeyboard();
    Chamada.render();
  },

  votar(status) {
    if (this.indice >= this.lista.length) return;
    const aluno = this.lista[this.indice];

    Chamada.setStatus(aluno.nome, status);
    Haptics.light();

    this.indice++;
    this.render();
  },

  navegar(delta) {
    Haptics.selection();
    this.indice = Math.max(0, Math.min(this.lista.length, this.indice + delta));
    this.render();
  },

  render() {
    const badgeEl = document.getElementById('rapidoProgressBadge');
    const container = document.getElementById('rapidoCardContainer');
    if (!container) return;

    // Estado concluído
    if (this.indice >= this.lista.length) {
      if (badgeEl) badgeEl.textContent = `${this.lista.length} de ${this.lista.length} · 100%`;
      container.innerHTML = `
        <div class="rapido-card-surface">
          <div class="rapido-avatar-large">🎉</div>
          <div class="rapido-nome">Chamada Concluída!</div>
          <div class="rapido-apelido">Todos os ${this.lista.length} alunos foram revisados.</div>
          <button class="btn-rapido rapido-p" style="margin-top:16px;" onclick="ModoRapido.close()">
            ✓ Concluir e Voltar
          </button>
          <button class="btn-tool" style="margin-top:10px; width:100%; opacity:0.8;" onclick="ModoRapido.navegar(-1)">
            ← Revisar Último Aluno
          </button>
        </div>`;
      return;
    }

    const aluno = this.lista[this.indice];
    const presencas = Store.getPresencas();
    const presAtual = presencas[aluno.nome]?.status;
    const initials = escapeHtml(Chamada.getInitials(aluno.nome));
    const nomeFormatado = escapeHtml(Chamada.capitalize(aluno.nome));
    const apelidoFormatado = escapeHtml(aluno.apelido || 'Membro');

    if (badgeEl) {
      badgeEl.textContent = `Aluno ${this.indice + 1} de ${this.lista.length}`;
    }

    let statusDestaque = '';
    if (presAtual === 'P') statusDestaque = '<span style="color:var(--status-presente); font-size:0.8rem; font-weight:700;">(Marcado Presente)</span>';
    if (presAtual === 'A') statusDestaque = '<span style="color:var(--status-ausente); font-size:0.8rem; font-weight:700;">(Marcado Ausente)</span>';
    if (presAtual === 'V') statusDestaque = '<span style="color:var(--status-visitante); font-size:0.8rem; font-weight:700;">(Marcado Visitante)</span>';

    container.innerHTML = `
      <div class="rapido-card-surface">
        <div class="rapido-avatar-large">${initials}</div>
        <div class="rapido-nome">${nomeFormatado}</div>
        <div class="rapido-apelido">${apelidoFormatado} ${statusDestaque}</div>
      </div>

      <div class="rapido-actions-stack">
        <button class="btn-rapido rapido-p" onclick="ModoRapido.votar('P')">
          ✓ PRESENTE
        </button>
        <button class="btn-rapido rapido-a" onclick="ModoRapido.votar('A')">
          ✗ AUSENTE
        </button>
        <button class="btn-rapido rapido-v" onclick="ModoRapido.votar('V')">
          👋 VISITANTE
        </button>
      </div>

      <div class="rapido-nav-row">
        <button class="rapido-nav-btn" onclick="ModoRapido.navegar(-1)" aria-label="Aluno Anterior" ${this.indice === 0 ? 'disabled style="opacity:0.4"' : ''}>
          ←
        </button>
        <button class="rapido-nav-btn" onclick="ModoRapido.navegar(1)" aria-label="Próximo Aluno">
          →
        </button>
      </div>`;
  },

  onKeyDown(e) {
    if (!this.isOpen) return;
    if (e.key === 'ArrowRight') { this.navegar(1); }
    else if (e.key === 'ArrowLeft') { this.navegar(-1); }
    else if (e.key === 'p' || e.key === 'P') { this.votar('P'); }
    else if (e.key === 'f' || e.key === 'F' || e.key === 'a' || e.key === 'A') { this.votar('A'); }
    else if (e.key === 'v' || e.key === 'V') { this.votar('V'); }
    else if (e.key === 'Escape') { this.close(); }
  },

  bindKeyboard() {
    this._keyHandler = this.onKeyDown.bind(this);
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('keydown', this._keyHandler);
    }
  },

  unbindKeyboard() {
    if (this._keyHandler) {
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('keydown', this._keyHandler);
      }
      this._keyHandler = null;
    }
  }
};

if (typeof window !== 'undefined') {
  window.ModoRapido = ModoRapido;
}
