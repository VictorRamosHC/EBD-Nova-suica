/**
 * ============================================================================
 * EBD NOVA SUÍÇA — MAIN BOOTSTRAP (APP.JS)
 * Ponto de entrada modular, orquestração de módulos, PWA e eventos globais.
 * ============================================================================
 */

import { Store } from './core/store.js';
import { Router } from './core/router.js';
import { Haptics } from './core/haptics.js';
import { Chamada } from './modules/chamada.js';
import { ModoRapido } from './modules/modoRapido.js';
import { Caixa } from './modules/caixa.js';
import { Ranking } from './modules/ranking.js';
import { Memorias } from './modules/memorias.js';
import { Sync } from './modules/sync.js';
import { Admin } from './modules/admin.js';

// --- TOAST NOTIFICATIONS ---
export function showToast(msg) {
  let toastEl = document.getElementById('toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'toast';
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }

  toastEl.textContent = msg;
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  toastEl.classList.add('active');

  if (window._toastTimeout) clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toastEl.classList.remove('active');
  }, 2600);
}

// --- TEMA (DARK / LIGHT) ---
export function toggleTheme() {
  Haptics.selection();
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  Store.setTheme(newTheme);
}

// --- EXPORTAÇÃO GLOBAL PARA EVENT HANDLERS ---
if (typeof window !== 'undefined') {
  window.Store = Store;
  window.Router = Router;
  window.Haptics = Haptics;
  window.Chamada = Chamada;
  window.ModoRapido = ModoRapido;
  window.Caixa = Caixa;
  window.Ranking = Ranking;
  window.Memorias = Memorias;
  window.Sync = Sync;
  window.Admin = Admin;
  window.showToast = showToast;
  window.toggleTheme = toggleTheme;
  window.abrirModoRapido = () => ModoRapido.open();
  window.fecharModoRapido = () => ModoRapido.close();
}

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
function bootstrap() {
  // 1. Aplica tema persistido
  const savedTheme = Store.getTheme();
  document.documentElement.setAttribute('data-theme', savedTheme);

  // 2. Registra hooks de ciclo de vida no Router
  Router.registerHook('chamada', () => Chamada.render());
  Router.registerHook('caixa', () => Caixa.render());
  Router.registerHook('ranking', () => Ranking.render());
  Router.registerHook('memorias', () => Memorias.render());
  Router.registerHook('historico', () => Sync.renderHistorico());

  // 3. Inicializa módulos
  Admin.init();
  Chamada.init();

  // 4. Configura overlay de modais para fechar ao clicar no backdrop
  const overlay = document.getElementById('modalOverlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        Admin.fecharModais();
        Caixa.fecharModal();
      }
    });
  }

  // 5. Registra o Service Worker para suporte PWA offline
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('[PWA] Service Worker registrado com sucesso.'))
        .catch((err) => console.warn('[PWA] Falha no registro do Service Worker:', err));
    });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}
