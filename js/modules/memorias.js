/**
 * ============================================================================
 * EBD NOVA SUÍÇA — MODULE: MEMÓRIAS & JORNADA SAGRADA
 * Flashcards 3D de versículos bíblicos da semana, rastreamento de memorização e streak.
 * Chave de armazenamento: ebd_memorias
 * ============================================================================
 */

import { Store } from '../core/store.js';
import { Haptics } from '../core/haptics.js';
import { escapeHtml } from './chamada.js';

export const Memorias = {
  flippedCards: new Set(),

  versiculosPadrao: [
    { ref: 'João 3:16', texto: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.', dia: 'Segunda-feira' },
    { ref: 'Salmos 23:1', texto: 'O Senhor é o meu pastor; de nada terei falta.', dia: 'Terça-feira' },
    { ref: 'Filipenses 4:13', texto: 'Tudo posso naquele que me fortalece.', dia: 'Quarta-feira' },
    { ref: 'Romanos 8:28', texto: 'Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.', dia: 'Quinta-feira' },
    { ref: 'Isaías 41:10', texto: 'Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.', dia: 'Sexta-feira' },
    { ref: 'Provérbios 3:5-6', texto: 'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.', dia: 'Sábado' },
    { ref: 'Mateus 6:33', texto: 'Buscai, pois, em primeiro lugar, o seu reino e a sua justiça, e todas estas coisas vos serão acrescentadas.', dia: 'Domingo' }
  ],

  init() {
    this.render();
  },

  getHojeLocal() {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  },

  flipCard(ref) {
    Haptics.selection();
    if (this.flippedCards.has(ref)) {
      this.flippedCards.delete(ref);
    } else {
      this.flippedCards.add(ref);
    }
    const cardEl = document.querySelector(`[data-verse-scene="${escapeHtml(ref)}"] .flashcard-inner`);
    if (cardEl) {
      cardEl.classList.toggle('is-flipped', this.flippedCards.has(ref));
    }
  },

  toggleMemorizado(e, ref) {
    if (e && e.stopPropagation) e.stopPropagation();
    Haptics.medium();

    const data = Store.getMemorias();
    const hoje = this.getHojeLocal();

    if (!data.memorizados) data.memorizados = {};

    if (!data.memorizados[ref]) {
      data.memorizados[ref] = { data: hoje, streak: 1 };
      if (window.showToast) window.showToast('✅ Versículo gravado no coração!');
    } else {
      const ultima = data.memorizados[ref].data;
      const diffDias = Math.floor((new Date(hoje) - new Date(ultima)) / (1000 * 60 * 60 * 24));

      if (diffDias === 1) {
        data.memorizados[ref].streak = (data.memorizados[ref].streak || 1) + 1;
        if (window.showToast) window.showToast(`🔥 Streak Sagrado: ${data.memorizados[ref].streak} dias seguidos!`);
      } else if (diffDias === 0) {
        // Desmarca se clicou no mesmo dia
        delete data.memorizados[ref];
        if (window.showToast) window.showToast('Versículo desmarcado para revisão.');
      } else {
        data.memorizados[ref].streak = 1;
        if (window.showToast) window.showToast('✅ Versículo memorizado hoje!');
      }

      if (data.memorizados[ref]) {
        data.memorizados[ref].data = hoje;
      }
    }

    Store.setMemorias(data);
    this.render();
  },

  render() {
    const container = document.getElementById('tab-memorias');
    if (!container) return;

    const data = Store.getMemorias();
    const memorizadosMap = data.memorizados || {};

    const lista = this.versiculosPadrao.map(v => {
      const memorizado = !!memorizadosMap[v.ref];
      const streak = memorizado ? (memorizadosMap[v.ref].streak || 1) : 0;
      return { ...v, memorizado, streak };
    });

    const total = lista.length;
    const memorizadosCount = lista.filter(v => v.memorizado).length;
    const progressoPct = total > 0 ? Math.round((memorizadosCount / total) * 100) : 0;

    container.innerHTML = `
      <div class="memorias-intro">
        <div class="memorias-title">📖 Memórias da Palavra</div>
        <div class="memorias-sub">"Guardei no coração a tua palavra para não pecar contra ti." (Sl 119:11)</div>
      </div>

      <!-- Barra de Progresso de Memorização -->
      <div class="progress-card">
        <div class="progress-header">
          <span>Versículos da Semana</span>
          <span class="progress-val">${memorizadosCount} de ${total} (${progressoPct}%)</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${progressoPct}%"></div>
        </div>
      </div>

      <!-- FLASHCARDS 3D -->
      <div class="flashcards-list">
        ${lista.map((v) => {
          const escapedRef = escapeHtml(v.ref);
          const escapedDia = escapeHtml(v.dia);
          const escapedTexto = escapeHtml(v.texto);
          const isFlipped = this.flippedCards.has(v.ref);

          return `
            <div class="flashcard-scene" data-verse-scene="${escapedRef}" onclick="Memorias.flipCard(this.dataset.verseScene)">
              <div class="flashcard-inner ${isFlipped ? 'is-flipped' : ''}">
                <!-- FRENTE DO CARD -->
                <div class="flashcard-face flashcard-front">
                  <div class="fc-tag-row">
                    <span class="fc-day-badge">${escapedDia}</span>
                    <span class="fc-status-badge">
                      ${v.memorizado ? `✅ Memorizado (${v.streak}d)` : '⏳ Em meditação'}
                    </span>
                  </div>
                  <div>
                    <div class="fc-ref-title">${escapedRef}</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:4px;">
                      ${escapeHtml(v.texto.slice(0, 50))}...
                    </div>
                  </div>
                  <div class="fc-prompt-tap">
                    <span>👆 Toque no cartão para virar e ler completo</span>
                  </div>
                </div>

                <!-- VERSO DO CARD (REVELADO AO VIRAR) -->
                <div class="flashcard-face flashcard-back">
                  <div class="fc-tag-row">
                    <span class="fc-day-badge">${escapedDia} · ${escapedRef}</span>
                    <span style="font-size:0.75rem; color:var(--gold-light);">🔄 Toque p/ desvirar</span>
                  </div>
                  <div class="fc-verse-text">
                    "${escapedTexto}"
                  </div>
                  <button class="btn-memorizar-toggle ${v.memorizado ? 'is-memorized' : ''}" 
                          data-ref="${escapedRef}"
                          onclick="Memorias.toggleMemorizado(event, this.dataset.ref)">
                    ${v.memorizado ? `✓ Memorizado (${v.streak} dias) · Clique p/ alternar` : '⭐ Marcar como Memorizado'}
                  </button>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>

      <div style="text-align:center; padding:16px; font-size:0.76rem; color:var(--text-muted); line-height:1.5;">
        💡 <em>Dica:</em> Relembre o versículo ao acordar e ao deitar para fixar permanentemente na memória.
      </div>
    `;
  }
};

if (typeof window !== 'undefined') {
  window.Memorias = Memorias;
}
