var Store = {
  _key: 'ebd_',
  get: function(k, fallback) {
    try {
      var v = localStorage.getItem(this._key + k);
      return v !== null ? JSON.parse(v) : (fallback !== undefined ? fallback : null);
    } catch (e) { return fallback !== undefined ? fallback : null; }
  },
  set: function(k, v) {
    try { localStorage.setItem(this._key + k, JSON.stringify(v)); } catch (e) { /* quota exceeded etc */ }
  },
  remove: function(k) { try { localStorage.removeItem(this._key + k); } catch (e) {} }
};