# Santuário — Design Técnico

**Data:** 2026-09-17  
**Status:** Design aprovado em conversa; especificação aguardando revisão final antes do plano de implementação.

## 1. Objetivo

Criar o Santuário como uma rota autenticada e contextual da Academia Arcana, funcionando como ponto de entrada pessoal para aprendizagem. O Santuário deve orientar o usuário para a próxima ação relevante sem criar uma segunda fonte de verdade para conteúdo, planejamento ou gamificação.

A experiência combina:

- contexto pessoal;
- Continue de onde parou;
- progresso quando houver fonte real;
- missões quando houver implementação real;
- próximos compromissos quando houver planejamento real;
- acesso rápido aos recursos existentes;
- estados explícitos para conteúdo vazio, indisponível, parcialmente disponível e erro.

## 2. Decisões arquiteturais

### 2.1 Camadas

Fluxo obrigatório:

`UI → Application → Domain contracts/policies → Infrastructure → Supabase`

Componentes não acessam Supabase diretamente e não contêm regras de negócio de prioridade.

### 2.2 Fonte de verdade

O Santuário será uma projeção de dados existentes. Não será criada uma tabela `sanctuary` nem cópias das entidades de learning.

A hierarquia persistida existente é:

`grimoires → notebooks → chapters → pages`

O banco possui RLS para restringir os dados ao usuário autenticado.

### 2.3 Funcionalidades ainda não persistidas

Planning e gamification atualmente fornecem contratos de domínio, mas não devem ser tratados como fontes persistentes completas. O Santuário deve representar essas capacidades como `not-configured` quando não houver infraestrutura real.

Não serão criadas missões, streaks, progresso ou compromissos fictícios somente para preencher a interface.

## 3. Estrutura proposta

```text
src/
├── app/
│   └── santuario/
│       ├── page.tsx
│       ├── loading.tsx
│       └── error.tsx
│
├── application/
│   └── sanctuary/
│       ├── get-sanctuary.ts
│       ├── sanctuary-view-model.ts
│       └── policies/
│           ├── learning-policy.ts
│           ├── mission-policy.ts
│           ├── planning-policy.ts
│           └── priority-policy.ts
│
├── components/
│   └── sanctuary/
│       ├── Sanctuary.tsx
│       ├── SanctuaryHeader.tsx
│       ├── ContinueLearning.tsx
│       ├── DailyMissions.tsx
│       ├── ProgressSummary.tsx
│       ├── SchedulePreview.tsx
│       ├── QuickActions.tsx
│       └── SanctuaryEmptyState.tsx
│
├── domains/
│   └── sanctuary/
│       ├── contracts.ts
│       ├── policies.ts
│       ├── types.ts
│       └── index.ts
│
└── infrastructure/
    └── sanctuary/
        ├── sanctuary-repository.ts
        └── supabase-sanctuary-repository.ts
```

A estrutura é uma proposta de organização; nomes finais podem ser ajustados durante o plano de implementação sem alterar as decisões arquiteturais.

## 4. Contratos centrais

```ts
type FeatureAvailability =
  | "available"
  | "empty"
  | "not-configured";

type SanctuarySnapshot = {
  user: SanctuaryUser;
  continueLearning: ContinueLearning | null;
  progress: ProgressSummary | null;
  missions: SanctuaryMission[];
  schedule: ScheduleItem[];
  quickActions: QuickAction[];
};

type SanctuaryUser = {
  id: string;
  displayName?: string; // A UI deve usar "Visitante" quando o nome não estiver disponível.
  avatarUrl?: string;
};

type ContinueLearning = {
  grimoireId: string;
  grimoireTitle: string;
  notebookId?: string;
  notebookTitle?: string;
  chapterId?: string;
  chapterTitle?: string;
  pageId?: string;
  pageTitle?: string;
  href: string;
};

type SanctuaryViewModel = {
  header: {
    greeting: string;
    user: SanctuaryUser;
  };
  primaryAction: QuickAction;
  continueLearning: ContinueLearning | null;
  progress: ProgressSummary | null;
  missions: SanctuaryMission[];
  schedule: ScheduleItem[];
  quickActions: QuickAction[];
};
```

Os tipos `ProgressSummary`, `SanctuaryMission`, `ScheduleItem` e `QuickAction` devem ser derivados ou adaptados de contratos reais existentes, sem duplicar modelos de domínio desnecessariamente.

## 5. Continue Learning

A prioridade de aprendizagem segue:

1. contexto válido de página;
2. contexto válido de capítulo;
3. contexto válido de notebook;
4. grimório válido;
5. empty state se não houver conteúdo.

O Santuário não deve afirmar que uma página é “onde o usuário parou” sem existir um registro confiável dessa posição.

Quando houver somente conteúdo, mas não histórico de atividade, a ação deverá ser semanticamente neutra, como explorar ou abrir o grimório.

O `href` é derivado na camada de aplicação e não armazenado no banco.

## 6. Hierarchical Policy Engine

A política é determinística e independente da UI.

A prioridade semântica é:

- contexto de aprendizagem válido → ação primária de continuidade;
- missão real disponível → seção secundária relevante;
- compromisso real disponível → seção secundária relevante;
- ações rápidas → suporte e descoberta.

A ordem não elimina os blocos inferiores; determina principalmente a ação primária e a hierarquia de destaque.

Não usar pesos numéricos arbitrários como `continue = 100` ou `mission = 80`.

Preferir decisões semânticas:

```ts
type SanctuaryPriority =
  | "primary"
  | "secondary"
  | "supporting";

type PriorityDecision = {
  section: SanctuarySection;
  priority: SanctuaryPriority;
  reason: string;
};
```

Exemplos de razões devem ser estáveis e testáveis, como `valid-learning-context`.

## 7. Estados da UI

### Loading

`src/app/santuario/loading.tsx` fornece skeleton estrutural e evita tela branca durante o carregamento.

### Ready

Dados suficientes para montar a experiência normalmente.

### Empty

Usuário autenticado sem grimórios/conteúdo. Mostrar uma ação real para iniciar a jornada.

### Partial

Uma ou mais fontes estão disponíveis e outras estão vazias, não configuradas ou com erro. Seções saudáveis continuam funcionando.

### Error

Reservado para falhas impeditivas na montagem do contexto ou erro inesperado. Deve oferecer recuperação sem expor detalhes internos.

## 8. Degradação por seção

Cada fonte deve poder produzir estado independente. Conceitualmente:

```ts
type SectionState<T> =
  | { status: "ready"; data: T }
  | { status: "empty"; data: null }
  | { status: "not-configured"; data: null }
  | { status: "error"; data: null; message: string };
```

Uma falha de Planning ou Gamification não deve derrubar Learning, Identity ou Quick Actions.

## 9. Autenticação e segurança

`/santuario` é uma rota autenticada.

A identidade deve vir da sessão autenticada e nunca de parâmetros como `?userId=`.

As consultas ao conteúdo devem respeitar o RLS existente no Supabase. A camada de infraestrutura não deve permitir que um usuário leia grimórios pertencentes a outro usuário.

Erros internos, SQL e stack traces não devem ser enviados à UI.

## 10. Responsividade

Desktop deve favorecer composição em múltiplas colunas, mantendo Continue Learning como foco principal.

Mobile deve reordenar semanticamente para:

1. Header;
2. Continue Learning;
3. Progress;
4. Missions;
5. Schedule;
6. Quick Actions;
7. Grimoires.

A versão mobile não será apenas uma compressão da grade desktop.

## 11. Acessibilidade e Design System

O Santuário deve respeitar o contrato global da Academia Arcana:

- WCAG 2.2 AA mínimo;
- navegação por teclado;
- foco visível;
- landmarks semânticos;
- hierarquia correta de headings;
- contraste adequado;
- não depender exclusivamente de cor;
- suporte a `prefers-reduced-motion`;
- targets adequados para toque;
- estados dinâmicos anunciados somente quando necessário.

A identidade Dark Fantasy Arcane será consumida através do Design System existente, evitando tokens visuais locais sem governança.

## 12. Testes

A implementação deverá prever testes em quatro níveis:

### Domain

- políticas de prioridade;
- transições de estado;
- regras de disponibilidade;
- seleção de contexto.

### Application

- construção do `SanctuaryViewModel`;
- composição de fontes;
- degradação parcial;
- usuário novo;
- conteúdo sem histórico.

### Component

- rendering dos estados;
- acessibilidade básica;
- ações primárias e links;
- empty state;
- partial state.

### E2E

- acesso autenticado a `/santuario`;
- redirecionamento/controle de autenticação;
- abertura de Continue Learning;
- comportamento com usuário sem conteúdo;
- recuperação de erro quando aplicável.

## 13. Critérios de aceitação

- [ ] `/santuario` existe como rota autenticada.
- [ ] O usuário é identificado pela sessão.
- [ ] Não existe acesso direto UI → Supabase.
- [ ] Continue Learning usa dados reais de learning quando disponíveis.
- [ ] O Santuário não inventa dados de planning/gamification.
- [ ] Estados `available`, `empty` e `not-configured` são distinguíveis.
- [ ] Falha parcial não derruba a página inteira.
- [ ] Prioridade é determinada fora dos componentes.
- [ ] RLS continua sendo respeitado.
- [ ] Loading e error boundaries existem.
- [ ] A interface atende ao contrato de acessibilidade do projeto.
- [ ] Testes cobrem política, aplicação, componentes e fluxo E2E relevante.
- [ ] A implementação não altera a responsabilidade do Workspace como shell de conteúdo.

## 14. Relação com o Workspace

O Workspace continua sendo a experiência de navegação e edição do conteúdo.

O Santuário funciona como camada de orientação e entrada contextual.

Fluxo esperado:

`Santuário → Continue Learning → Workspace`

Não haverá duplicação da árvore de navegação do Workspace no Santuário.

## 15. Fora de escopo desta implementação

- implementação completa de Gamification;
- implementação completa de Planning;
- criação de sistema persistente de streak;
- criação de sistema persistente de missões;
- criação de motor adaptativo de recomendações;
- criação de novas tabelas somente para alimentar o dashboard;
- substituição do Workspace.

Esses sistemas podem posteriormente fornecer adapters ao Santuário através dos contratos já definidos.

## 16. Dependências e riscos conhecidos

O projeto possui um problema de build/deploy independente do Santuário nas páginas de autenticação e em `src/core/authorization/contracts.ts`. Esse problema deve ser tratado como pré-condição de integração/deploy e não mascarado por mudanças no Santuário.

O ambiente Vercel também deve ser alinhado ao runtime Node usado pelo projeto antes da publicação final.

## 17. Próximo passo

Após aprovação desta especificação formal, criar o plano de implementação detalhado com ordem de execução, testes, checkpoints, estratégia de branch/PR e verificação de integração.
