var AppRouter = {
  current: 'chamada',
  switch: function(tabId) {
    var target = 'tab-' + tabId;
    var el = document.getElementById(target);
    if (!el) return;
    AppRouter.current = tabId;

    // update both bottom nav and in-page tabs
    document.querySelectorAll('.tab-content').forEach(function(v) { v.classList.remove('active'); });
    el.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    var btn = document.getElementById('btn-' + tabId);
    if (btn) btn.classList.add('active');

    // lifecycle hooks
    if (tabId === 'ranking') { AppBridge.fetchRanking && AppBridge.fetchRanking(); }
    if (tabId === 'historico') { AppBridge.fetchHistorico && AppBridge.fetchHistorico(); }
    if (tabId === 'caixa') { AppBridge.fetchCaixa && AppBridge.fetchCaixa(); }
    if (tabId === 'jornada') { Jornada.init && Jornada.init(); }
    if (tabId === 'memorias') { Memorias.init && Memorias.init(); }

    // focus management: move focus to the tab panel heading
    var heading = el.querySelector('h2');
    if (heading) {
      heading.tabindex = -1;
      heading.focus({ preventScroll: true });
    } else {
      el.tabindex = -1;
      el.focus({ preventScroll: true });
    }
  }
};
