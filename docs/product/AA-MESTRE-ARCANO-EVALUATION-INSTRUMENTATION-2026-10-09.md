# AA-MESTRE-ARCANO — Instrumentação Mínima para Avaliação Pedagógica

> Data: 2026-10-09
>
> Deriva de `AA-PRODUCT-MESTRE-ARCANO-PEDAGOGICAL-EVALUATION-2026-10-09.md`.
>
> Estado: **DESENHO CONCLUÍDO; PERSISTÊNCIA NÃO AUTORIZADA NESTA RODADA**.

## 1. Objetivo

Avaliar AA-MA-EVAL-001 e AA-MA-EVAL-002 sem armazenar texto de conversa, respostas do tutor ou conteúdo conectado apenas para medição.

Perguntas centrais:

1. ajuda graduada reduz substituição de prática por resposta pronta?
2. feedback metacognitivo melhora o uso da ajuda sem prejudicar desempenho posterior sem assistência?

## 2. Ownership

| Responsabilidade | Owner |
|---|---|
| episódio de assistência e nível de ajuda | intelligence |
| resultado educacional e evidência objetiva | education / learning |
| política adaptativa quando aplicável | adaptive |
| finalidade, retenção e governança | trust |
| adapters de persistência após aprovação | data |
| escolha explícita do nível de ajuda | UI/UX + application |

## 3. Dados mínimos candidatos

- identificador opaco do episódio;
- variante experimental;
- versão da política de instruções;
- modelo executado;
- nível de ajuda explicitamente selecionado;
- timestamps;
- outcome técnico;
- referência autorizada a uma tentativa educacional;
- resultado educacional derivado pelo domínio responsável.

Não duplicar texto de prompt, resposta, documento conectado ou resposta do estudante na instrumentação.

## 4. Contratos propostos

### AssistanceEpisodeStarted

- `episodeId`;
- `experimentId`;
- `variantId`;
- `instructionPolicyVersion`;
- `model`;
- `startedAt`;
- `entryPoint`: `sanctuary | practice | other`;
- `requestedHelpLevel`: `unspecified | hint | decomposition | direct-answer`.

### AssistanceEpisodeCompleted

- `episodeId`;
- `completedAt`;
- `outcome`: `success | error`.

### EducationalOutcomeLinked

Somente após avaliação educacional independente adequada:

- `episodeId`;
- referência autorizada à tentativa;
- `evidenceType`;
- `criterionVersion`, quando aplicável;
- resultado categórico derivado do contrato educacional;
- `assistanceDuringAssessment`: deve ser `false` para o outcome primário;
- `measuredAt`.

## 5. Nível de ajuda

Na primeira implementação experimental, não inferir o nível de ajuda a partir do texto livre.

Preferir escolha explícita e reversível:

- Quero uma pista;
- Quero decompor o problema;
- Quero a resposta direta.

`unspecified` permanece válido para entrada livre, e resposta direta nunca é bloqueada.

## 6. Vinculação com prática

1. iniciar o experimento em fluxo de prática ou criar `episodeId` explícito;
2. medir depois com evidência do domínio Education/Learning;
3. vincular por identificadores, não por conteúdo textual;
4. definir janela temporal no protocolo;
5. ausência de avaliação posterior é missingness/attrition, não baixo desempenho.

## 7. Versionamento obrigatório

Registrar por variante:

- `instructionPolicyVersion`;
- modelo;
- conjunto autorizado de tools;
- variante de UI;
- regra de ajuda graduada;
- período do experimento.

Mudança material cria nova versão experimental.

## 8. Gate de privacidade

Antes de persistência, Trust/Data devem fechar finalidade, necessidade, retenção, descarte, acesso e compatibilidade com ownership/RLS. Este documento não autoriza tabela ou migração.

## 9. Estratégia de implementação

### Slice 1 — sem persistência

Estado: **IMPLEMENTADO NO BRANCH DE VALIDAÇÃO**.

- `MESTRE_ARCANO_INSTRUCTION_POLICY_VERSION` versiona a política;
- `MestreArcanoHelpLevel` define `unspecified | hint | decomposition | direct-answer`;
- o boundary server-side valida o valor recebido;
- `unspecified` preserva o payload anterior;
- escolhas explícitas são transmitidas ao runtime;
- nenhuma persistência ou analytics foi adicionada.

### Slice 2 — avaliação controlada

- instrumentar somente ambiente/experimento autorizado;
- validar eventos sem conteúdo textual;
- validar ownership/RLS se houver persistência.

### Slice 3 — experimento

- habilitar após aprovação de Trust/Data;
- pré-registrar outcome, margem/MDE e tratamento de attrition;
- comparar aprendizagem sem assistência, não apenas uso do tutor.

## 10. Próxima fatia executável

**Pré-registrar o protocolo de experimento para AA-MA-EVAL-001 e AA-MA-EVAL-002**, antes de criar persistência.

O protocolo deve fixar: população elegível, unidade de randomização, braços, outcome primário sem assistência, janela temporal, tratamento de missingness/attrition, critérios de promoção e versão exata da intervenção. A coleta continua bloqueada até o gate de Trust/Data.
