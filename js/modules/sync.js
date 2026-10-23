/**
 * ============================================================================
 * EBD NOVA SUÍÇA — MODULE: SYNC & EXPORTS
 * Sincronização Google Sheets, Fila Offline, Exportação CSV e PDF.
 * ============================================================================
 */

import { Store } from '../core/store.js';
import { Chamada, escapeHtml } from './chamada.js';
import { Haptics } from '../core/haptics.js';

function csvEscape(val) {
  return String(val || '').replace(/"/g, '""');
}

export const Sync = {
  endpoint: "https://script.google.com/macros/s/AKfycbywWTGLvib-VE8S4u6Dr8SeovdDf6enjJDcYyNPgTJI5StNUF3qpCBQezAQeoK9QWqN/exec",

  async syncToSheets() {
    Haptics.medium();
    const db = Store.getDb().filter(m => !m.oculto);
    const presencas = Store.getPresencas();

    if (db.length === 0) {
      if (window.showToast) window.showToast('Nenhum aluno cadastrado para sincronizar.');
      return;
    }

    if (window.showToast) window.showToast('⏳ Sincronizando com Google Sheets...');

    const alunos = db.map(m => ({
      nome: m.nome,
      apelido: m.apelido || '',
      status: presencas[m.nome]?.status || 'A',
      perguntas: presencas[m.nome]?.perguntas || 0,
      ofertou: !!presencas[m.nome]?.ofertou
    }));

    const url = `${this.endpoint}?action=syncChamada`;
    const payload = {
      data: alunos,
      dataAula: Chamada.dataAula || new Date().toLocaleDateString('pt-BR')
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      await response.text();
      Haptics.success();
      if (window.showToast) window.showToast('✓ Sincronizado com Google Sheets!');
    } catch (error) {
      console.warn('[Sync] Falha na sincronização direta, tentando modo no-cors:', error);
      try {
        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(payload)
        });
        Haptics.success();
        if (window.showToast) window.showToast('✓ Dados enviados ao Google Sheets!');
      } catch (err2) {
        console.error('[Sync] Erro crítico ao sincronizar:', err2);
        Haptics.error();
        if (window.showToast) window.showToast('✗ Falha na conexão com Google Sheets.');
      }
    }
  },

  async finalizarChamada(extras = {}) {
    const db = Store.getDb();
    const presencas = Store.getPresencas();
    const responsavel = Store.getUser() || 'Professor';

    const aula = {
      data: Chamada.dataAula || new Date().toLocaleDateString('pt-BR'),
      pA: extras.profA || 'Selecionar',
      pJ: extras.profJ || 'Selecionar',
      bib: extras.bib || 0,
      rev: extras.rev || 0,
      vExtQtd: extras.vExtQtd || 0,
      vExtNomes: extras.vExtNomes || ''
    };

    const frequencia = db.map(m => ({
      nome: m.nome,
      status: presencas[m.nome]?.status || 'A',
      perguntas: presencas[m.nome]?.perguntas || 0,
      ofertou: !!presencas[m.nome]?.ofertou
    }));

    const payload = { aula, responsavel, frequencia };

    // Sempre salva no histórico local (garante zero perda de dados)
    Store.addHistorico({
      data: aula.data,
      pA: aula.pA,
      pJ: aula.pJ,
      vExtQtd: aula.vExtQtd,
      responsavel,
      frequencia
    });

    // Envia para o Google Sheets
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('[Sync] Erro no envio remoto; registro mantido no histórico local.', e);
    }

    // Limpa chamada do dia e atualiza tela
    Store.limparPresencas();
    Haptics.success();
    if (window.showToast) window.showToast('✓ Chamada finalizada e gravada com sucesso!');

    setTimeout(() => {
      Chamada.render();
    }, 800);
  },

  exportarCSV() {
    Haptics.medium();
    const db = Store.getDb().filter(m => !m.oculto);
    const presencas = Store.getPresencas();
    const dataAula = Chamada.dataAula || new Date().toLocaleDateString('pt-BR');

    if (db.length === 0) {
      if (window.showToast) window.showToast('Nenhum aluno para exportar.');
      return;
    }

    const linhas = ['Nome,Apelido,Status,Perguntas,Ofertou,Data'];
    db.forEach(m => {
      const p = presencas[m.nome] || { status: 'A', perguntas: 0, ofertou: false };
      const statusLabel = p.status === 'P' ? 'Presente' : (p.status === 'V' ? 'Visitante' : 'Ausente');
      const ofertouLabel = p.ofertou ? 'Sim' : 'Não';
      linhas.push(`"${csvEscape(m.nome)}","${csvEscape(m.apelido || '')}","${csvEscape(statusLabel)}",${Number(p.perguntas) || 0},"${csvEscape(ofertouLabel)}","${csvEscape(dataAula)}"`);
    });

    const csvContent = '\uFEFF' + linhas.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chamada_ebd_${dataAula.replace(/\//g, '-')}.csv`;
    if (document.body && document.body.appendChild) document.body.appendChild(link);
    if (typeof link.click === 'function') link.click();
    if (document.body && document.body.removeChild) document.body.removeChild(link);
    if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);

    Haptics.success();
    if (window.showToast) window.showToast('✓ Planilha CSV exportada!');
  },

  exportarPDF() {
    Haptics.medium();
    const db = Store.getDb().filter(m => !m.oculto);
    const presencas = Store.getPresencas();
    const dataAula = Chamada.dataAula || new Date().toLocaleDateString('pt-BR');

    if (db.length === 0) {
      if (window.showToast) window.showToast('Nenhum aluno para exportar.');
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("Biblioteca de PDF não disponível offline.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Cabeçalho Solene
    doc.setFillColor(10, 15, 29);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(212, 175, 55);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('EBD NOVA SUÍÇA — RELATÓRIO DE CHAMADA', 14, 14);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data da Aula: ${dataAula}  |  Gerado por: ${Store.getUser() || 'Professor'}`, 14, 22);

    // Contadores
    let pCount = 0, aCount = 0, vCount = 0;
    db.forEach(m => {
      const st = presencas[m.nome]?.status || 'A';
      if (st === 'P') pCount++;
      else if (st === 'V') vCount++;
      else aCount++;
    });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Resumo: ${pCount} Presentes  |  ${aCount} Ausentes  |  ${vCount} Visitantes  |  Total: ${db.length} Alunos`, 14, 38);

    const headers = [['Nome do Aluno', 'Apelido', 'Status', 'Pontos', 'Oferta']];
    const rows = db.map(m => {
      const p = presencas[m.nome] || { status: 'A', perguntas: 0, ofertou: false };
      const statusLabel = p.status === 'P' ? 'Presente' : (p.status === 'V' ? 'Visitante' : 'Ausente');
      return [
        Chamada.capitalize(m.nome),
        m.apelido || '—',
        statusLabel,
        String(p.perguntas || 0),
        p.ofertou ? 'Sim' : 'Não'
      ];
    });

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        head: headers,
        body: rows,
        startY: 44,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [212, 175, 55], fontStyle: 'bold' },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
    } else {
      // Fallback manual sem plugin autotable
      let y = 48;
      rows.forEach(r => {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(`${r[0]} (${r[1]}): ${r[2]} - ${r[3]} pts`, 14, y);
        y += 7;
      });
    }

    doc.save(`chamada_ebd_${dataAula.replace(/\//g, '-')}.pdf`);
    Haptics.success();
    if (window.showToast) window.showToast('✓ Relatório em PDF gerado com sucesso!');
  },

  async renderHistorico() {
    const container = document.getElementById('historico-lista');
    if (!container) return;

    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><p>Carregando histórico...</p></div>';

    let historico = [];

    try {
      const resp = await fetch(`${this.endpoint}?action=getHistoricoNuvem`, { signal: AbortSignal.timeout(3500) });
      if (resp.ok) {
        const nuvem = await resp.json();
        if (Array.isArray(nuvem) && nuvem.length > 0) {
          historico = nuvem;
        }
      }
    } catch (e) {
      // Fallback local
    }

    if (historico.length === 0) {
      historico = Store.getHistorico();
    }

    if (historico.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <p class="empty-state-text">Nenhuma aula registrada no histórico.<br>Finalize a chamada do dia para criar registros.</p>
        </div>`;
      return;
    }

    container.innerHTML = historico.slice().reverse().map((h, i) => {
      if (!h || !h.data || h.data === 'undefined') return '';
      const p = (Number(h.pA) || 0) + (Number(h.pJ) || 0) || (Array.isArray(h.frequencia) ? h.frequencia.filter(f => f.status === 'P').length : 0);
      const v = Number(h.vExtQtd) || 0;
      const dataEscaped = escapeHtml(h.data);
      const respEscaped = escapeHtml(h.responsavel || 'Sistema');
      const pAEscaped = escapeHtml(h.pA || '—');
      const pJEscaped = escapeHtml(h.pJ || '—');

      return `
        <div class="hist-item-card" onclick="Sync.verDetalhesHistorico(${i})">
          <div class="hist-top-line">
            <div class="hist-date-title">📅 ${dataEscaped}</div>
            <div class="hist-meta-info">👤 ${respEscaped}</div>
          </div>
          <div class="hist-stats-pills">
            <span class="hist-badge badge-p">✓ ${p} presentes</span>
            ${v > 0 ? `<span class="hist-badge badge-v">👋 ${v} visitantes</span>` : ''}
          </div>
          <div class="hist-meta-info">Professores: ${pAEscaped} / ${pJEscaped}</div>
        </div>`;
    }).filter(Boolean).join('');
  },

  verDetalhesHistorico(idx) {
    Haptics.selection();
    const modal = document.getElementById('modalHistDetalhes');
    const overlay = document.getElementById('modalOverlay');
    const titulo = document.getElementById('histDetalhesTitulo');
    const corpo = document.getElementById('histDetalhesCorpo');

    if (titulo) titulo.textContent = 'Detalhes do Registro';
    if (corpo) {
      corpo.innerHTML = `
        <div style="text-align:center; padding:16px; color:var(--text-secondary); line-height:1.6;">
          <p>Aula sincronizada e arquivada com sucesso.</p>
          <p style="font-size:0.8rem; margin-top:8px; color:var(--gold-primary);">
            Para consultar as assinaturas nominais e atas completas, verifique a planilha do Google Sheets.
          </p>
        </div>`;
    }

    if (modal && overlay) {
      overlay.classList.add('active');
      modal.classList.add('active');
      if (document.body) document.body.classList.add('modal-open');
    }
  }
};

if (typeof window !== 'undefined') {
  window.Sync = Sync;
  window.syncToSheets = () => Sync.syncToSheets();
  window.exportarCSV = () => Sync.exportarCSV();
  window.exportarPDF = () => Sync.exportarPDF();
  window.renderHistorico = () => Sync.renderHistorico();
}
