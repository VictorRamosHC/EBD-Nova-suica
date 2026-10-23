/**
 * ============================================================================
 * EBD NOVA SUÍÇA — MODULE: ADMIN & CADASTRO
 * Gerenciamento de alunos/membros, usuários, seletores e modais do sistema.
 * ============================================================================
 */

import { Store } from '../core/store.js';
import { Chamada, escapeHtml } from './chamada.js';
import { Sync } from './sync.js';
import { Haptics } from '../core/haptics.js';

export const Admin = {
  editIndex: -1,
  acaoPendente: null,
  profA: 'Selecionar',
  profJ: 'Selecionar',

  init() {
    this.inicializarUsuario();
  },

  inicializarUsuario() {
    const usuarioAtual = Store.getUser();
    const badge = document.getElementById('userBadge');
    if (!usuarioAtual) {
      this.abrirModalUsuario(false);
    } else if (badge) {
      badge.textContent = `👤 ${usuarioAtual}`;
    }
  },

  abrirModalUsuario(podeFechar = true) {
    Haptics.selection();
    const modal = document.getElementById('modalUsuario');
    const overlay = document.getElementById('modalOverlay');
    const btnFechar = document.getElementById('btnFecharUserModal');
    const inputNome = document.getElementById('inputUsuarioNome');

    if (btnFechar) btnFechar.style.display = podeFechar ? 'block' : 'none';
    if (inputNome) inputNome.value = Store.getUser() || '';

    if (modal && overlay) {
      overlay.classList.add('active');
      modal.classList.add('active');
      if (document.body) document.body.classList.add('modal-open');
    }
  },

  salvarUsuario() {
    const inputNome = document.getElementById('inputUsuarioNome');
    const nome = inputNome ? inputNome.value.trim() : '';

    if (!nome) {
      alert("Por favor, digite seu nome ou cargo para identificação.");
      return;
    }

    const formatado = Chamada.capitalize(nome);
    Store.setUser(formatado);

    const badge = document.getElementById('userBadge');
    if (badge) badge.textContent = `👤 ${formatado}`;

    Haptics.success();
    this.fecharModais();
    if (window.showToast) window.showToast(`Bem-vindo(a), ${formatado}!`);
  },

  abrirAdmin() {
    Haptics.medium();
    const modal = document.getElementById('modalAdmin');
    const overlay = document.getElementById('modalOverlay');
    if (modal && overlay) {
      overlay.classList.add('active');
      modal.classList.add('active');
      if (document.body) document.body.classList.add('modal-open');
      this.listar();
    }
  },

  listar() {
    const container = document.getElementById('listaAdminItems');
    if (!container) return;

    const db = Store.getDb();
    container.innerHTML = db.map((m, idx) => {
      const escapedNome = escapeHtml(m.nome);
      const capNome = escapeHtml(Chamada.capitalize(m.nome));
      const escapedApelido = escapeHtml(m.apelido || 'Membro');

      return `
        <div class="admin-member-row">
          <div class="admin-member-info">
            <div class="admin-member-name" style="${m.oculto ? 'opacity:0.4; text-decoration:line-through' : ''}">
              ${capNome}
            </div>
            <div class="admin-member-sub">${escapedApelido} ${m.oculto ? '(Oculto)' : ''}</div>
          </div>
          <div class="admin-actions-group">
            <button class="btn-admin-action btn-admin-edit" onclick="Admin.editar(${idx})" title="Editar" aria-label="Editar">✏️</button>
            <button class="btn-admin-action btn-admin-hide" onclick="Admin.toggleOculto(${idx})" title="${m.oculto ? 'Exibir' : 'Ocultar'}" aria-label="Ocultar">${m.oculto ? '🙈' : '👁️'}</button>
            <button class="btn-admin-action btn-admin-delete" onclick="Admin.confirmarExclusao(${idx})" title="Excluir" aria-label="Excluir">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  },

  editar(idx) {
    Haptics.selection();
    const db = Store.getDb();
    const m = db[idx];
    if (!m) return;

    this.editIndex = idx;
    const nomeInput = document.getElementById('membroNome');
    const apelidoInput = document.getElementById('membroApelido');
    const btnSalvar = document.getElementById('btnSalvarMembro');
    const btnCancela = document.getElementById('btnCancelaEdit');

    if (nomeInput) nomeInput.value = m.nome;
    if (apelidoInput) apelidoInput.value = m.apelido || '';
    if (btnSalvar) btnSalvar.textContent = 'ATUALIZAR';
    if (btnCancela && btnCancela.style) btnCancela.style.display = 'block';
  },

  salvarMembro() {
    const nomeInput = document.getElementById('membroNome');
    const apelidoInput = document.getElementById('membroApelido');

    const nome = nomeInput ? nomeInput.value.toUpperCase().trim() : '';
    const apelido = apelidoInput ? apelidoInput.value.trim() : 'Membro';

    if (!nome) {
      alert("O nome do aluno é obrigatório.");
      return;
    }

    const db = Store.getDb();
    if (this.editIndex === -1) {
      // Novo membro
      db.push({ nome, apelido, oculto: false });
    } else {
      // Atualização com preservação de presenças do dia se o nome mudou
      const oldNome = db[this.editIndex].nome;
      db[this.editIndex].nome = nome;
      db[this.editIndex].apelido = apelido;

      if (oldNome && oldNome !== nome) {
        Store.renamePresenca(oldNome, nome);
      }
    }

    Store.setDb(db);
    Haptics.success();
    this.limparForm();
    this.listar();
    Chamada.render();
    if (window.showToast) window.showToast('✓ Cadastro de membro salvo!');
  },

  limparForm() {
    this.editIndex = -1;
    const nomeInput = document.getElementById('membroNome');
    const apelidoInput = document.getElementById('membroApelido');
    const btnSalvar = document.getElementById('btnSalvarMembro');
    const btnCancela = document.getElementById('btnCancelaEdit');

    if (nomeInput) nomeInput.value = '';
    if (apelidoInput) apelidoInput.value = '';
    if (btnSalvar) btnSalvar.textContent = 'SALVAR';
    if (btnCancela && btnCancela.style) btnCancela.style.display = 'none';
  },

  toggleOculto(idx) {
    Haptics.selection();
    const db = Store.getDb();
    if (db[idx]) {
      db[idx].oculto = !db[idx].oculto;
      Store.setDb(db);
      this.listar();
      Chamada.render();
    }
  },

  confirmarExclusao(idx) {
    Haptics.warning();
    const db = Store.getDb();
    const m = db[idx];
    if (!m) return;

    if (confirm(`Tem certeza que deseja excluir permanentemente "${Chamada.capitalize(m.nome)}"?`)) {
      Store.removePresenca(m.nome);
      db.splice(idx, 1);
      Store.setDb(db);
      this.limparForm();
      this.listar();
      Chamada.render();
      if (window.showToast) window.showToast('✓ Membro excluído.');
    }
  },

  abrirSeletor(tipo) {
    Haptics.selection();
    const modalPicker = document.getElementById('modalPicker');
    const modalConfirm = document.getElementById('modalConfirm');
    const container = document.getElementById('pickerOptions');
    if (!container || !modalPicker) return;

    if (modalConfirm) modalConfirm.classList.remove('active');
    modalPicker.classList.add('active');

    container.innerHTML = '';
    const opcoes = ["PASTOR JOSÉ", "ADONIAS", "JOSELMA", "IRMÃ TÂNIA", "OUTRO"];

    opcoes.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn-tool';
      btn.style.width = '100%';
      btn.style.marginBottom = '8px';
      btn.textContent = opt;
      btn.onclick = () => {
        if (tipo === 'profA') {
          this.profA = opt;
          const span = document.querySelector('#btnProfA span');
          if (span) span.textContent = opt;
        } else {
          this.profJ = opt;
          const span = document.querySelector('#btnProfJ span');
          if (span) span.textContent = opt;
        }
        modalPicker.classList.remove('active');
        if (modalConfirm) modalConfirm.classList.add('active');
      };
      container.appendChild(btn);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-tool';
    cancelBtn.style.width = '100%';
    cancelBtn.style.opacity = '0.7';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.onclick = () => {
      modalPicker.classList.remove('active');
      if (modalConfirm) modalConfirm.classList.add('active');
    };
    container.appendChild(cancelBtn);
  },

  abrirModalFinalizar() {
    Haptics.medium();
    this.acaoPendente = 'ENVIAR_RELATORIO';

    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('modalConfirm');
    const envioExtras = document.getElementById('envioExtras');
    const icon = document.getElementById('confirmIcon');
    const title = document.getElementById('confirmTitle');
    const desc = document.getElementById('confirmDesc');
    const btn = document.getElementById('btnConfirmarFinal');

    if (icon) icon.textContent = '🚀';
    if (title) title.textContent = 'Finalizar Chamada da Aula';
    if (desc) desc.textContent = 'Confira os dados da aula. Ao confirmar, o relatório será gravado localmente e enviado para a nuvem.';
    if (envioExtras) envioExtras.style.display = 'block';
    if (btn) {
      btn.textContent = 'CONFIRMAR E ENVIAR';
      btn.onclick = () => this.executarFinalizacao();
    }

    if (overlay && modal) {
      overlay.classList.add('active');
      modal.classList.add('active');
      if (document.body) document.body.classList.add('modal-open');
    }
  },

  async executarFinalizacao() {
    const btn = document.getElementById('btnConfirmarFinal');
    if (btn) {
      btn.textContent = 'ENVIANDO...';
      btn.disabled = true;
    }

    const bibInput = document.getElementById('bib');
    const revInput = document.getElementById('rev');
    const qtdVisInput = document.getElementById('qtdVisitantes');
    const nomesVisInput = document.getElementById('nomesVisitantes');

    const extras = {
      profA: this.profA,
      profJ: this.profJ,
      bib: bibInput ? parseInt(bibInput.value) || 0 : 0,
      rev: revInput ? parseInt(revInput.value) || 0 : 0,
      vExtQtd: qtdVisInput ? parseInt(qtdVisInput.value) || 0 : 0,
      vExtNomes: nomesVisInput ? nomesVisInput.value.trim() : ''
    };

    try {
      await Sync.finalizarChamada(extras);
    } finally {
      if (btn) {
        btn.textContent = 'CONFIRMAR E ENVIAR';
        btn.disabled = false;
      }
      this.fecharModais();
    }
  },

  limparChamadaHoje() {
    Haptics.warning();
    if (confirm("Deseja realmente limpar as presenças e ofertas da chamada de hoje?")) {
      Store.limparPresencas();
      this.fecharModais();
      Chamada.render();
      if (window.showToast) window.showToast('✓ Chamada de hoje limpa!');
    }
  },

  fecharModais() {
    document.querySelectorAll('.modal-box').forEach(m => m.classList.remove('active'));
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
    if (document.body) document.body.classList.remove('modal-open');
  }
};

if (typeof window !== 'undefined') {
  window.Admin = Admin;
  window.abrirAdmin = () => Admin.abrirAdmin();
  window.mudarUsuario = () => Admin.abrirModalUsuario(true);
  window.salvarNovoUsuario = () => Admin.salvarUsuario();
  window.fecharModal = () => Admin.fecharModais();
  window.confirmarAcao = (acao) => {
    if (acao === 'ENVIAR_RELATORIO') Admin.abrirModalFinalizar();
    else if (acao === 'LIMPAR_CHAMADA') Admin.limparChamadaHoje();
  };
  window.abrirSeletor = (tipo) => Admin.abrirSeletor(tipo);
}
