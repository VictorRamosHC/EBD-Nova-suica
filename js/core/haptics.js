/**
 * ============================================================================
 * EBD NOVA SUÍÇA — CORE HAPTICS
 * Feedback tátil de vibração para dispositivos móveis
 * ============================================================================
 */

export const Haptics = {
  patterns: {
    selection: 8,
    light: 12,
    medium: 25,
    heavy: 45,
    success: [20, 50, 25],
    warning: [30, 40, 30],
    error: [50, 50, 50, 50]
  },

  vibrate(type = 'light') {
    if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
      return false;
    }
    try {
      const pattern = this.patterns[type] !== undefined ? this.patterns[type] : (typeof type === 'number' || Array.isArray(type) ? type : 12);
      return window.navigator.vibrate(pattern);
    } catch (e) {
      return false;
    }
  },

  light() { return this.vibrate('light'); },
  medium() { return this.vibrate('medium'); },
  heavy() { return this.vibrate('heavy'); },
  success() { return this.vibrate('success'); },
  warning() { return this.vibrate('warning'); },
  error() { return this.vibrate('error'); },
  selection() { return this.vibrate('selection'); }
};

if (typeof window !== 'undefined') {
  window.Haptics = Haptics;
  window.haptic = (type) => Haptics.vibrate(type);
}
