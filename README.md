# EBD Nova Suíça

Página web para controle de frequência e acompanhamento espiritual de alunos do ensino bíblico dominical. Hospedado em Vercel.

🔗 **Acesso:** https://ebd-nova-suica.vercel.app/
🐙 **Repositório:** https://github.com/VictorRamosHC/EBD-Nova-suica

## Tecnologias

- **Frontend:** HTML, CSS (variáveis, tokens, escala de espaçamento), JavaScript vanilla (módulos separados)
- **Gráficos:** Chart.js (doughnut de frequência + miniChart no header)
- **Exportação:** CSV nativo + PDF via jsPDF
- **PWA:** manifest.json + service worker (cache-first, offline)
- **Integração:** Google Sheets via Apps Script (SCRIPT_URL em `index.html`)

## Funcionalidades implementadas

### Sprint 1–2 (tokenização CSS)
- Todo `font-size` → `var(--fs-*)` com base 16px e ratio 1.25
- Espaçamento consolidado em escala 4/8/12/16/24/32/48/64px
- Media queries: 320/480/600/768/900px
- Touch targets ≥ 44px
- Canvas charts com `max-width:100%` e `aspect-ratio:3/1`
- `:focus-visible` com outline azul 3px preservado
- Card hover: `translateY(-3px)` + shadow

### Sprint 3–4 (dark mode + estrutura)
- Modo escuro completo com CSS custom properties
- Flip entre temas via botão + memória em localStorage
- Botão de início de sessão (login simulado)

### Sprint 5
- Estados de hover em 14+ elementos
- Bottom nav corrigido (problema de duplicação de classe `active` → não use chained `.nav-item.active.jornada.active::after`)
- Admin card hover refinado
- Foco visível em todos os elementos interativos

### Sprint 6
- **Página Jornada:** perfil do aluno, séries, período, resumo, respostas reflexivas (3 temas), hook
- **Página Memórias:** flashcard (referência ↔ texto), crossfade, check de memorizado, progresso "X de 12", hook diário
- Expandido para: mural/scrapbook, estórias/parábolas, momentos especiais, diário de monitoria

### Roadmap 9 itens (pós-Sprint 6)
1. **JS tab switching + renderização dinâmica** — `js/app.router.js` (AppRouter.switch() com focus management)
2. **Persistência localStorage** — `js/app.store.js` (Store.get/set/remove, prefixo `ebd_`)
3. **Exportação PDF/CSV** — `exportarCSV()` + `exportarPDF()` com jsPDF via CDN
4. **Acessibilidade WCAG 2.1 AA** — skip-link, focus-visible, roles (navigation/tab/tabpanel), aria-labels, aria-current, aria-controls
5. **Dashboard de frequência** — Chart.js doughnut + miniChart no header
6. **Integração Google Sheets** — `syncToSheets()` via fetch à SCRIPT_URL
7. **Busca rápida de aluno** — input de busca com filtro em tempo real
8. **PWA offline** — manifest.json (standalone) + sw.js (cache-first, CACHE_NAME 'ebd-v1')
9. **Notificações lembrete** — módulo de lembretes exibidos no header + marcador de data

## Melhorias de frontend (post-roadmap)

Aplicadas com base na análise do skill `frontend-design` + `design-critique`, priorizando pelo impacto:

### 1. Hierarquia visual — restrição do accent a 3 destinos por tela
- O `--primary` estava sendo gasto em hover de botões, miniChart, indicadores → nada se destaca quando tudo brilha.
- Ajuste: reduzido para no máximo 3 usos por tela; botões de ação mantêm `background: var(--primary)`; hover de cards usa `--primary-dim` em vez de brilho sólido.

### 2. Espaço vazio (empty state) nas memórias
- Quando não há versículos salvos, o módulo de memórias mostrava lista vazia sem feedback.
- Ajuste: estado vazio com mensagem clara e dica de ação (ex.: "Nenhum versículo salvo ainda — comece adicionando um na chamada").

### 3. `.toolbar` alinhado à escala 4/8/12
- Antes: `gap: 10px; margin-bottom: 14px` — fora da escala.
- Agora: `gap: 8px; margin-bottom: 12px` — alinhado ao sistema de design.

### 4. Feedback de clique mais tangível
- Antes: `.tool-btn:active { opacity: 0.7; transform: scale(0.98); }` — sutil demais.
- Agora: `opacity: 0.6; transform: scale(0.96)` — satisfatório sem exagerar.

### 5. Botões desabilitados visíveis
- Sem estado `disabled`: os botões ficavam inúteis quando o `executarAcao()` os desabilitava sem feedback visual.
- Agora: `.tool-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }` + `.tool-btn:disabled:hover` sem efeito.

### 6. Toast acessível para leitores de tela
- Antes: `showToast(msg) { ... t.classList.add('active'); ... }` — mudança visual só.
- Agora: `role="status" aria-live="polite" aria-atomic="true"` — leitores de tela anunciam a mudança sem interromper o fluxo.

### 7. Seam header–conteúdo
- Antes: `border-bottom: 1px solid var(--border)` — difusa entre o fundo translúcido do header e o conteúdo.
- Agora: `border-bottom: 2px solid var(--border)` — linha mais marcante que delimita visualmente a transição.

### 8. `prefers-reduced-motion`
- Usuários que preferem menos animação no SO ainda recebiam transições em cards, tooltip fade, toast.
- Agora: `@media (prefers-reduced-motion: reduce)` zera todas as transições/animarions do sistema.

### 9. Correção do ícone `favicon.jpg`
- O código referenciava `165057.jpg` que não existia — quebrava os ícones do site.
- Agora: corrigido para `favicon.jpg` que existe.

## Contra-cuidados (o que se NÃO faz)

- Não espalhar `font-variant-numeric: tabular-nums` em elementos que não mostram números dinâmicos — aplica-se só em `.stat-num`, `.saldo-val`, inputs numéricos.
- Não criar `references/` por incidente — cada arquivo deve ser reutilizável, nomeado por tópico, não por data/incidente.
- Não substituir `index.html` por arquivo novo — a história de commits e a URL do Vercel dependem do arquivo único.

## Histórico de commits recente

```
[1a4542d4] feat: melhorias de frontend baseadas em análise de design — acessibilidade, consistência e polish
[e40a0ab7] feat: sprint 6 — implementação das páginas Jornada e Memórias
[eee10fd8] feat: sprints 1-5 — tokenização CSS, hover states (14+), dark mode refinado, bottom nav fix, focus-visible, admin card hover
[64084d06] fix(ranking): corrige contagem local que somava Ausente (A) em vez de Presente (P)
```

## Verificação pós-commit

Após cada push para `origin/main`, o Vercel faz deploy automático. Verificar:
1. O site carrega em `https://ebd-nova-suica.vercel.app/` sem console errors.
2. O botão de sincronização (se usado) não quebra — verificar no navegador.
3. O README.md está atualizado com as novas funções.

## Estrutura de arquivos

```
C:/t/ebd-nova-suica/
├── index.html          — página principal (single-page app)
├── manifest.json       — manifest PWA
├── sw.js               — service worker
├── favicon.jpg         — ícone do site
└── js/
    ├── app.store.js    — localStorage wrapper (Store)
    ├── app.router.js   — roteamento de tabs (AppRouter)
    └── app.chart.js    — wrapper Chart.js (ChartLib)
```

## Como usar

1. Abra `https://ebd-nova-suica.vercel.app/` no navegador
2. Faça login (simulado — basta escolher o perfil pastor/monitoria)
3. Use a navegação bottom-nav para alternar entre:
   - **Chamada:** registro de frequência por data
   - **Histórico:** lista de chamadas anteriores
   - **Ranking:** classificação dos alunos
   - **Jornada:** acompanhamento espiritual do aluno
   - **Memórias:** módulo de memorização bíblica
   - **Caixa:** controle financeiro simples
4. Exportar dados: botão "Exportar CSV/PDF" na tela de chamada
5. Sincronizar com Google Sheets: o botão "Sincronizar" envia para a planilha configurada

## Commit padrão

Mensagens em português, prefixo `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`.

```bash
cd C:/t/ebd-nova-suica
git add -A
git commit -m "feat: descrição da mudança"
git push origin main
```

## Autor

Victor Hugo — Calcário Diamante Ltda.
