// Shim de retrocompatibilidade para Store
var Store = (typeof window !== 'undefined' ? window.Store : null) || {
  get: function(k, fb) { return (typeof window !== 'undefined' && window.Store) ? window.Store.get(k, fb) : fb; },
  set: function(k, v) { if (typeof window !== 'undefined' && window.Store) window.Store.set(k, v); },
  remove: function(k) { if (typeof window !== 'undefined' && window.Store) window.Store.remove(k); }
};
if (typeof window !== 'undefined') window.Store = Store;