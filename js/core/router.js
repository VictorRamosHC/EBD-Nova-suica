/**
 * ============================================================================
 * EBD NOVA SUÍÇA — CORE ROUTER
 * Navegação fluida entre abas principais com ciclo de vida e acessibilidade.
 * ============================================================================
 */

import { Haptics } from './haptics.js';

export const Router = {
  currentTab: 'chamada',
  hooks: {},

  registerHook(tabId, onEnter) {
    this.hooks[tabId] = onEnter;
  },

  switch(tabId) {
    const targetEl = document.getElementById('tab-' + tabId);
    if (!targetEl) return;

    this.currentTab = tabId;
    Haptics.selection();

    // Alterna visualização dos painéis de conteúdo
    document.querySelectorAll('.tab-content').forEach(view => {
      view.classList.remove('active');
    });
    targetEl.classList.add('active');

    // Alterna botões da navegação inferior
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.remove('active');
      btn.removeAttribute('aria-current');
    });

    const activeBtn = document.getElementById('btn-' + tabId);
    if (activeBtn) {
      if (activeBtn.classList) activeBtn.classList.add('active');
      if (activeBtn.setAttribute) activeBtn.setAttribute('aria-current', 'page');
    }

    // Executa hook registrado para o módulo
    if (typeof this.hooks[tabId] === 'function') {
      try {
        this.hooks[tabId]();
      } catch (err) {
        console.error(`[Router] Erro ao executar hook da aba ${tabId}:`, err);
      }
    }

    // Gerenciamento de acessibilidade de foco
    const heading = targetEl.querySelector ? targetEl.querySelector('h1, h2, h3') : null;
    if (heading && heading.setAttribute) {
      heading.setAttribute('tabindex', '-1');
      if (heading.focus) heading.focus({ preventScroll: true });
    } else if (targetEl.setAttribute) {
      targetEl.setAttribute('tabindex', '-1');
      if (targetEl.focus) targetEl.focus({ preventScroll: true });
    }

    // Scroll to top
    if (typeof window !== 'undefined' && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
};

if (typeof window !== 'undefined') {
  window.Router = Router;
  window.AppRouter = Router;
  window.switchTab = (t) => Router.switch(t);
}
