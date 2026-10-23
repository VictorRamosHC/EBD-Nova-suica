/**
 * ============================================================================
 * EBD NOVA SUÍÇA — MODULE: RANKING & PÓDIO
 * Computação de assiduidade baseada no histórico local/nuvem e pódio solene.
 * ============================================================================
 */

import { Store } from '../core/store.js';
import { Chamada, escapeHtml } from './chamada.js';

export const Ranking = {
  endpoint: "https://script.google.com/macros/s/AKfycbywWTGLvib-VE8S4u6Dr8SeovdDf6enjJDcYyNPgTJI5StNUF3qpCBQezAQeoK9QWqN/exec",

  init() {
    this.render();
  },

  calcularLocal() {
    const historico = Store.getHistorico();
    const db = Store.getDb().filter(m => !m.oculto);
    const pontosMap = {};

    // Inicializa estritamente os membros ativos com 0
    db.forEach(m => {
      pontosMap[m.nome] = 0;
    });

    // Acumula presenças do histórico local exclusivamente para alunos ativos
    historico.forEach(aula => {
      if (Array.isArray(aula.frequencia)) {
        aula.frequencia.forEach(f => {
          if (f && f.status === 'P' && Object.prototype.hasOwnProperty.call(pontosMap, f.nome)) {
            pontosMap[f.nome] += 1;
          }
        });
      }
    });

    // Transforma em array e ordena decrescente
    const lista = Object.entries(pontosMap).map(([nome, pontos]) => {
      const membro = db.find(m => m.nome === nome);
      return {
        nome,
        apelido: membro ? membro.apelido : 'Membro',
        pontos
      };
    });

    lista.sort((a, b) => b.pontos - a.pontos || a.nome.localeCompare(b.nome));
    return lista;
  },

  async render() {
    const container = document.getElementById('ranking-lista');
    if (!container) return;

    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><p>Calculando assiduidade...</p></div>';

    let rankingData = [];
    let isCloud = false;

    // Tenta obter da nuvem primeiro
    try {
      const response = await fetch(`${this.endpoint}?action=getRanking`, { signal: AbortSignal.timeout(3500) });
      if (response.ok) {
        const cloudData = await response.json();
        if (Array.isArray(cloudData) && cloudData.length > 0) {
          rankingData = cloudData;
          isCloud = true;
        }
      }
    } catch (e) {
      // Fallback gracioso para local
      isCloud = false;
    }

    if (!rankingData || rankingData.length === 0) {
      rankingData = this.calcularLocal();
    }

    const totalAulas = Store.getHistorico().length;
    const temDadosReais = rankingData.some(r => r.pontos > 0);

    if (!temDadosReais && totalAulas === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏆</div>
          <p class="empty-state-text">
            <strong>Nenhum registro de aula finalizado ainda.</strong><br>
            Finalize a chamada do dia para calcular o ranking e formar o pódio de assiduidade.
          </p>
        </div>`;
      return;
    }

    // Separa top 3 para o pódio
    const primeiro = rankingData[0] || { nome: '—', apelido: '—', pontos: 0 };
    const segundo = rankingData[1] || { nome: '—', apelido: '—', pontos: 0 };
    const terceiro = rankingData[2] || { nome: '—', apelido: '—', pontos: 0 };
    const restantes = rankingData.slice(3);

    container.innerHTML = `
      <div style="text-align:center; margin-bottom:14px;">
        <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.8px; color:var(--gold-primary); font-weight:700;">
          ${isCloud ? '🌐 Ranking Oficial (Nuvem)' : '📱 Ranking Baseado no Histórico Local'}
        </span>
      </div>

      <!-- PÓDIO TOP 3 -->
      <div class="podium-container">
        <!-- 2º LUGAR (PRATA) -->
        <div class="podium-column second">
          <div class="podium-avatar-wrap">
            <div class="podium-avatar">${escapeHtml(Chamada.getInitials(segundo.nome))}</div>
          </div>
          <div class="podium-card-step">
            <div class="podium-step-pos" style="color:#CBD5E1">🥈 2º</div>
            <div class="podium-name">${escapeHtml(Chamada.capitalize(segundo.nome))}</div>
            <div class="podium-pts">${Number(segundo.pontos) || 0} pres.</div>
          </div>
        </div>

        <!-- 1º LUGAR (OURO) -->
        <div class="podium-column first">
          <div class="podium-avatar-wrap">
            <div class="podium-crown">👑</div>
            <div class="podium-avatar">${escapeHtml(Chamada.getInitials(primeiro.nome))}</div>
          </div>
          <div class="podium-card-step">
            <div class="podium-step-pos" style="color:var(--gold-light)">🥇 1º</div>
            <div class="podium-name" style="font-weight:800">${escapeHtml(Chamada.capitalize(primeiro.nome))}</div>
            <div class="podium-pts" style="font-weight:700; color:var(--gold-light)">${Number(primeiro.pontos) || 0} pres.</div>
          </div>
        </div>

        <!-- 3º LUGAR (BRONZE) -->
        <div class="podium-column third">
          <div class="podium-avatar-wrap">
            <div class="podium-avatar">${escapeHtml(Chamada.getInitials(terceiro.nome))}</div>
          </div>
          <div class="podium-card-step">
            <div class="podium-step-pos" style="color:#FDBA74">🥉 3º</div>
            <div class="podium-name">${escapeHtml(Chamada.capitalize(terceiro.nome))}</div>
            <div class="podium-pts">${Number(terceiro.pontos) || 0} pres.</div>
          </div>
        </div>
      </div>

      <!-- LISTA 4º LUGAR EM DIANTE -->
      ${restantes.length > 0 ? `
        <div class="mov-list-title" style="margin-top:20px;">Classificação Geral</div>
        ${restantes.map((m, idx) => `
          <div class="rank-item-row">
            <div class="rank-item-pos">${idx + 4}º</div>
            <div class="rank-item-info">
              <div class="rank-item-name">${escapeHtml(Chamada.capitalize(m.nome))}</div>
              <div class="rank-item-sub">${escapeHtml(m.apelido || 'Membro')}</div>
            </div>
            <div class="rank-item-points">${Number(m.pontos) || 0} pres.</div>
          </div>
        `).join('')}
      ` : ''}
    `;
  }
};

if (typeof window !== 'undefined') {
  window.Ranking = Ranking;
  window.fetchRanking = () => Ranking.render();
}
