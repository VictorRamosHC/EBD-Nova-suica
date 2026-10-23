// Shim de retrocompatibilidade para AppRouter
var AppRouter = (typeof window !== 'undefined' ? window.Router : null) || {
  current: 'chamada',
  switch: function(tabId) { if (typeof window !== 'undefined' && window.Router) window.Router.switch(tabId); }
};
if (typeof window !== 'undefined') window.AppRouter = AppRouter;
