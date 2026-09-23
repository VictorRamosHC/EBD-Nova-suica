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
- Bottom nav corrigido (problema de duplicação de classe `active`)
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
4. **Acessibilidade WCAG 2.1 AA** — skip-link, focus-visible, roles (navigation/tab/tabpanel), aria-labels, aria-current, aria-controls, toast com `role="status" aria-live="polite"`
5. **Dashboard de frequência** — Chart.js doughnut + miniChart no header
6. **Integração Google Sheets** — `syncToSheets()` via fetch à SCRIPT_URL
7. **Busca rápida de aluno** — input de busca com filtro em tempo real
8. **PWA offline** — manifest.json (standalone) + sw.js (cache-first, CACHE_NAME 'ebd-v1')
9. **Notificações lembrete** — módulo de lembretes exibidos no header + marcador de data

## Melhorias de frontend (post-roadmap)

Aplicadas com base no skill `frontend-design` e `design-critique`:

1. `.toolbar` alinhado à escala (gap: 8px, margin-bottom: 12px)
2. `prefers-reduced-motion` para quem tem a preferência no SO
3. `.tool-btn:disabled` com opacidade 0.4 + `cursor: not-allowed`
4. `.tool-btn:active` mais tangível (opacity: 0.6, scale: 0.96)
5. Toast com `role="status" aria-live="polite"` para leitores de tela
6. Seam header–conteúdo: `border-bottom: 2px` mais marcante
7. `.stat-num` e `.saldo-val` com `font-variant-numeric: tabular-nums` para alinhamento vertical dos dígitos
8. Corrigido `165057.jpg` → `favicon.jpg` (arquivo inexistente quebrava os ícones)
9. Redução de uso do `--primary` para no máximo 3 destinos por tela
10. Espaço vazio (empty state) nas memórias quando não há versículos salvos

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

Mensagens em português, prefixo `feat:`, `fix:`, `refactor:`, `chore:`.

```bash
cd C:/t/ebd-nova-suica
git add -A
git commit -m "feat: descrição da mudança"
git push origin main
```

## Autor

Victor Hugo — Calcário Diamante Ltda.
