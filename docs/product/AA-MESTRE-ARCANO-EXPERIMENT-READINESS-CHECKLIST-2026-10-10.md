# AA-MESTRE-ARCANO — Checklist Interdomínio de Prontidão Experimental

> Data: 2026-10-10
>
> Escopo: AA-MA-EVAL-001/002.
>
> Dependência técnica: PR #586 — pacote tecnicamente validado, ainda em DRAFT e sob NO-GO para merge/deploy.
>
> Regra desta rodada: **nenhuma persistência experimental, randomização ou coleta nova é autorizada por este documento**.

## 1. Estados

- **PASS** — evidência suficiente para esta etapa.
- **READY-NONPERSISTENT** — pronto apenas para comportamento/contrato sem nova persistência.
- **PENDING** — revisão ou definição ainda necessária.
- **BLOCKED** — não pode avançar para coleta até resolução explícita.

## 2. Resultado executivo

| Domínio | Estado | Evidência atual | Próximo gate |
|---|---|---|---|
| Trust | BLOCKED para coleta | SEC-007 exige finalidade, necessidade/minimização, base legal, retenção, descarte, acesso e direitos antes de nova persistência | aprovar contrato de dados experimental concreto |
| Data | BLOCKED para persistência experimental | tabelas educacionais atuais têm ownership/RLS definidos; não existe contrato aprovado para assignment/episode analytics | definir somente após owners + Trust; nenhuma tabela agora |
| Learning / Education | READY-NONPERSISTENT | P1.5 criterion-referenced V1 existe com pass/fail, criterion/version, item scope e minimumEvidence | fixar outcome independente e vínculo sem assistência |
| UI/UX | READY-NONPERSISTENT / PENDING experimento | PR #586 oferece níveis explícitos de ajuda e preserva resposta direta | revisão específica de copy, equivalência de escolha e acessibilidade da variante experimental |
| QA | PASS para Slice 1 / BLOCKED para experimento | PR #586 passou Quality Gate, unitários, a11y, E2E, build, banco e segurança | testes de assignment, ITT, contaminação, attrition e versionamento antes da coleta |

## 3. Trust

### 3.1 Já atendido no desenho

- não usar texto integral de prompt/resposta como requisito de medição;
- não duplicar conteúdo de SharePoint ou fontes conectadas;
- não inferir perfil psicológico, diagnóstico ou “dependência de IA”;
- distinguir evidência observada de inferência;
- manter resposta direta disponível sem coerção;
- não usar engajamento como proxy de aprendizagem.

**Estado:** PASS no desenho não persistente.

### 3.2 Ainda não aprovado para persistência

SEC-007 determina que todo novo fluxo persistente declare, antes da implementação:

- finalidade;
- necessidade/minimização;
- base legal aplicável;
- titular/contexto de acesso;
- compartilhamento;
- retenção e descarte;
- exportação/exclusão quando aplicável;
- auditoria e exceções de conservação.

O experimento ainda não possui contrato aprovado para persistir `experimentId`, `variantId`, `episodeId` ou assignment.

**Estado:** BLOCKED para coleta.

### 3.3 Critério de fechamento Trust

Trust só muda para PASS quando existir um contrato específico do experimento e ele demonstrar que a pergunta causal não pode ser respondida com menos dados.

---

## 4. Data

### 4.1 Ownership preservado

A arquitetura canônica estabelece:

- Education possui estruturas de prática e evidência;
- Learning possui efeitos/projeções de progresso;
- Data implementa persistência/adapters, mas não se torna owner da semântica;
- Trust possui consentimento/governança e eventos de auditoria relevantes;
- Intelligence possui orquestração do Mestre Arcano e limites de tools/contexto.

**Estado:** PASS.

### 4.2 Persistência experimental

Não há contrato canônico atual para:

- assignment de variante;
- episódio de assistência;
- vínculo causal entre episódio e outcome posterior;
- retenção de telemetria experimental.

Nenhuma migration/tabela deve ser criada nesta fase.

**Estado:** BLOCKED.

### 4.3 Baseline atual

Na consulta agregada ao Supabase atual em 2026-10-10:

- `educational_practice_items`: 0 linhas;
- `educational_practice_attempts`: 0 linhas;
- learners com attempts: 0;
- criterion-referenced attempts: 0;
- pass rate: não estimável;
- média/SD de `evidence_score`: não estimáveis.

Nenhum dado pessoal ou resposta textual foi lido para este baseline.

**Estado:** baseline interno indisponível.

---

## 5. Learning / Education

### 5.1 Outcome disponível

P1.5 V1 fornece uma avaliação objective/criterion-referenced limitada a:

- scoring policy `normalized-exact-match`;
- `criterion_result = pass | fail`;
- `criterion_version`;
- `criterion_scope`;
- `minimum_evidence`;
- conclusão limitada a `practice-item`.

Isso é suficiente para **definir** um outcome objetivo, mas não para estimar efeito enquanto a base estiver vazia.

**Estado:** READY-NONPERSISTENT.

### 5.2 Outcome primário recomendado

Para AA-MA-EVAL-001/002, o outcome primário deve ser:

> resultado de uma avaliação criterion-referenced posterior, pré-especificada e realizada **sem assistência do Mestre Arcano**.

Não usar como outcome primário:

- XP;
- streak;
- tempo de foco;
- uso do tutor;
- satisfação;
- confiança isolada;
- `masteryConfirmed` sem controlar `minimumEvidence` e repetição.

### 5.3 Gap

O schema atual não registra uma propriedade experimental de “assistência durante avaliação”. Portanto, a condição “sem assistência” precisa ser garantida pelo fluxo/protocolo antes de qualquer coleta; não deve ser inferida depois do texto.

**Estado:** PENDING/BLOCKED para experimento.

---

## 6. UI/UX

### 6.1 Agência

O PR #586 implementa escolha explícita:

- pista;
- decomposição;
- resposta direta;
- entrada livre com `unspecified`.

Editar texto livre retorna a `unspecified`; resposta direta não é bloqueada.

**Estado:** READY-NONPERSISTENT, condicionado à revisão independente do PR #586.

### 6.2 Gate experimental de UX

Antes de coletar:

- opções devem ter apresentação equivalente, sem dark pattern;
- nenhuma opção pode sugerir culpa ou superioridade moral;
- resposta direta deve permanecer acessível;
- copy metacognitiva deve ser curta e opcional;
- teclado, foco, leitor de tela e estados de erro devem ser validados;
- a variante não pode tornar o estudante refém do experimento;
- deve existir saída/reversão clara.

**Estado:** PENDING.

---

## 7. QA

### 7.1 Slice 1

No HEAD validado do PR #586, passaram:

- Quality Gate;
- lint/typecheck;
- unit tests;
- accessibility tests;
- production build;
- E2E;
- Database Tests;
- CodeQL;
- Gitleaks;
- Dependency Review;
- Auth/RLS regressions.

**Estado:** PASS técnico para o Slice 1.

### 7.2 Experimento

Ainda faltam testes para:

- assignment estável por estudante;
- ausência de troca silenciosa de braço;
- versionamento de política/model/tools/UI;
- exclusão de assistência no outcome primário;
- missingness/attrition sem imputação como falha;
- análise ITT;
- prevenção de contaminação entre braços;
- desativação/rollback do experimento;
- nenhum conteúdo textual persistido fora do contrato aprovado.

**Estado:** BLOCKED antes da coleta.

---

## 8. Gate consolidado

### Pode avançar agora

- revisão independente do PR #586;
- refinamento documental do experimento;
- definição matemática de MDE/NI;
- queries agregadas read-only de baseline existente;
- revisão de copy/acessibilidade sem ativar experimento.

### Não pode avançar agora

- merge/deploy do PR #586 sem revisão independente;
- assignment experimental;
- criação de tabela/migration de analytics;
- persistência de `episodeId`/variant;
- coleta;
- inferência de outcome a partir de conteúdo textual;
- uso de dados privados conectados para analytics experimental.

## 9. Estado final

**Slice 1 não persistente: TECNICAMENTE VALIDADO NO PR #586, AINDA NO-GO PARA MERGE/DEPLOY.**

**Experimento: NÃO PRONTO PARA COLETA.**

Bloqueadores objetivos:

1. contrato Trust para qualquer persistência experimental;
2. contrato de Data subordinado aos owners;
3. baseline interno não existe ainda;
4. definição final de MDE ou margem de não-inferioridade;
5. revisão UI/UX experimental;
6. QA de randomização/ITT/attrition/versionamento.
