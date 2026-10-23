/**
 * ============================================================================
 * EBD NOVA SUÍÇA — MODULE: CAIXA / TESOURARIA
 * Gestão de saldo e fluxo financeiro local (Entradas/Saídas com integridade).
 * Chave de armazenamento: ebd_caixa_local
 * ============================================================================
 */

import { Store } from '../core/store.js';
import { Haptics } from '../core/haptics.js';
import { escapeHtml } from './chamada.js';

function roundMoeda(val) {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}

export const Caixa = {
  tipoPendente: 'ENTRADA',

  init() {
    this.render();
    Store.on('caixa_changed', () => this.render());
  },

  formatMoeda(val) {
    const num = roundMoeda(val);
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  render() {
    const data = Store.getCaixa();
    const saldoEl = document.getElementById('caixa-saldo');
    const container = document.getElementById('caixa-historico');

    if (saldoEl) {
      saldoEl.textContent = this.formatMoeda(data.saldo || 0);
    }

    if (!container) return;

    const historico = data.historico || [];
    if (historico.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💰</div>
          <p class="empty-state-text">Nenhum lançamento no caixa até o momento.<br>Use os botões acima para registrar entradas ou saídas.</p>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="mov-list-title">
        <span>Extrato Recente</span>
        <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal">(${historico.length} registros)</span>
      </div>
      ${historico.map(h => {
        const isEntrada = h.tipo === 'ENTRADA';
        const icon = isEntrada ? '⬇️' : '⬆️';
        const sinal = isEntrada ? '+' : '-';
        const escapedId = escapeHtml(h.id);
        const descText = escapeHtml(h.desc || (isEntrada ? 'Entrada' : 'Saída'));
        const dateCatText = `${escapeHtml(h.data || 'Hoje')} · ${escapeHtml(h.categoria || 'Geral')}`;

        return `
          <div class="mov-item-card" data-mov-id="${escapedId}">
            <div class="mov-category-icon ${isEntrada ? 'entrada' : 'saida'}">${icon}</div>
            <div class="mov-main-info">
              <div class="mov-desc-text">${descText}</div>
              <div class="mov-date-sub">${dateCatText}</div>
            </div>
            <div class="mov-valor-text ${isEntrada ? 'entrada' : 'saida'}">
              ${sinal} ${this.formatMoeda(h.valor)}
            </div>
            <button class="btn-remove-mov" data-id="${escapedId}" onclick="Caixa.remover(this.dataset.id)" title="Excluir lançamento" aria-label="Excluir lançamento">
              ✕
            </button>
          </div>`;
      }).join('')}`;
  },

  abrirModal(tipo) {
    this.tipoPendente = tipo;
    Haptics.medium();

    const modal = document.getElementById('modalFin');
    const overlay = document.getElementById('modalOverlay');
    const titulo = document.getElementById('fin-titulo');
    const btn = document.getElementById('btnConfirmarFin');
    const inputDesc = document.getElementById('fin-desc');
    const inputValor = document.getElementById('fin-valor');

    if (titulo) {
      titulo.textContent = tipo === 'ENTRADA' ? '➕ Adicionar Entrada' : '➖ Retirar Dinheiro (Saída)';
    }

    if (btn) {
      btn.textContent = tipo === 'ENTRADA' ? 'CONFIRMAR ENTRADA' : 'CONFIRMAR SAÍDA';
      btn.className = `btn-tool ${tipo === 'ENTRADA' ? 'btn-success' : 'btn-tool'}`;
      if (tipo === 'SAIDA') {
        btn.style.background = 'var(--status-ausente)';
        btn.style.color = '#FFFFFF';
      } else {
        btn.style.background = '';
        btn.style.color = '';
      }
    }

    if (inputDesc) inputDesc.value = '';
    if (inputValor) inputValor.value = '';

    if (modal && overlay) {
      overlay.classList.add('active');
      modal.classList.add('active');
      if (document.body) document.body.classList.add('modal-open');
    }
  },

  salvarTransacao() {
    const inputDesc = document.getElementById('fin-desc');
    const inputValor = document.getElementById('fin-valor');
    const selectCat = document.getElementById('fin-categoria');

    const desc = inputDesc ? inputDesc.value.trim() : '';
    const valor = inputValor ? roundMoeda(parseFloat(inputValor.value.replace(',', '.'))) : 0;
    const categoria = selectCat ? selectCat.value : 'Geral';

    if (!desc) {
      alert("Por favor, digite a descrição do lançamento.");
      return;
    }

    if (isNaN(valor) || valor <= 0) {
      alert("Por favor, digite um valor monetário válido acima de zero.");
      return;
    }

    const data = Store.getCaixa();
    const saldoAtual = roundMoeda(data.saldo || 0);

    // Regra de Integridade Financeira: Saída não pode estourar saldo
    if (this.tipoPendente === 'SAIDA' && valor > saldoAtual) {
      alert(`Saldo insuficiente! O caixa possui ${this.formatMoeda(saldoAtual)}.`);
      return;
    }

    const novoSaldo = this.tipoPendente === 'ENTRADA' 
      ? roundMoeda(saldoAtual + valor) 
      : roundMoeda(saldoAtual - valor);

    const id = Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const dataHoje = new Date().toLocaleDateString('pt-BR');

    data.historico.unshift({
      id,
      data: dataHoje,
      tipo: this.tipoPendente,
      categoria,
      desc,
      valor,
      saldo: novoSaldo
    });
    data.saldo = novoSaldo;

    Store.setCaixa(data);
    Haptics.success();

    if (window.showToast) {
      window.showToast(this.tipoPendente === 'ENTRADA' ? '✓ Entrada registrada no caixa!' : '✓ Saída registrada no caixa!');
    }

    this.fecharModal();
    this.render();
  },

  remover(id) {
    const data = Store.getCaixa();
    const item = (data.historico || []).find(x => String(x.id) === String(id));
    if (!item) return;

    if (!confirm(`Remover esta movimentação "${item.desc}" de ${this.formatMoeda(item.valor)}? O saldo será recalculado.`)) {
      return;
    }

    const ajuste = item.tipo === 'ENTRADA' ? -item.valor : +item.valor;
    data.saldo = Math.max(0, roundMoeda((Number(data.saldo) || 0) + ajuste));
    data.historico = data.historico.filter(x => String(x.id) !== String(id));

    Store.setCaixa(data);
    Haptics.warning();

    if (window.showToast) {
      window.showToast('✓ Movimentação removida!');
    }

    this.render();
  },

  fecharModal() {
    const modal = document.getElementById('modalFin');
    const overlay = document.getElementById('modalOverlay');
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    if (document.body) document.body.classList.remove('modal-open');
  }
};

if (typeof window !== 'undefined') {
  window.Caixa = Caixa;
  window.fetchCaixa = () => Caixa.render();
  window.abrirFinanceiro = (tipo) => Caixa.abrirModal(tipo);
  window.removerMovCaixa = (id) => Caixa.remover(id);
}
