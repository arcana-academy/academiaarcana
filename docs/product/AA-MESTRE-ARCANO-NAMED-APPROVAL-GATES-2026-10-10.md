# AA-MESTRE-ARCANO — Gates Nominados de Aprovação Experimental

> Data: 2026-10-10
>
> Escopo: AA-MA-EVAL-001/002.
>
> Dependências: PR #586 (Slice 1 não persistente) e PR #596 (readiness/baseline).
>
> Estado global: **NO-GO PARA PERSISTÊNCIA, RANDOMIZAÇÃO E COLETA**.

## 1. Regra de aprovação nominal

Cada gate só pode ser considerado aprovado quando o registro de aprovação contiver, de forma explícita:

- ID do gate;
- nome da pessoa aprovadora;
- papel/domínio de autoridade;
- data;
- revisão/commit dos artefatos avaliados;
- decisão `APPROVED | APPROVED_WITH_CONDITIONS | REJECTED`;
- condições pendentes, quando houver;
- evidência ou link verificável.

O repositório atual não define pessoas distintas como owners humanos de Trust, Data, Learning/Education, UI/UX e QA. O CODEOWNERS público nomeia apenas `@arcana-academy` para superfícies sensíveis específicas. Portanto, **nenhum nome humano é inventado neste documento**. O campo de aprovador permanece PENDING até uma autoridade humana real ser registrada.

Uma aprovação do próprio autor do PR não satisfaz o requisito de revisão independente do PR #586.

## 2. Gate AA-MA-GATE-TRUST-01 — Privacidade e ciclo de vida

**Autoridade requerida:** Trust.

**Aprovador humano nominal:** PENDING.

### Deve aprovar

- finalidade específica do experimento;
- necessidade de cada campo persistente;
- minimização;
- base jurídica/política aplicável;
- retenção e descarte;
- acesso;
- exportação/exclusão quando aplicável;
- auditoria;
- tratamento de exceções;
- proibição de armazenar conteúdo textual desnecessário.

### Evidência mínima

Contrato de dados do experimento versionado e explicitamente aprovado.

### Resultado atual

**BLOCKED / NOT APPROVED.**

Nenhuma persistência experimental pode existir antes deste gate.

---

## 3. Gate AA-MA-GATE-DATA-01 — Persistência e isolamento técnico

**Autoridade requerida:** Data, com anuência dos owners semânticos relevantes.

**Aprovador humano nominal:** PENDING.

### Pré-condições

- AA-MA-GATE-TRUST-01 = APPROVED;
- contrato semântico fechado por Intelligence + Education/Learning;
- finalidade e retenção definidas.

### Deve aprovar

- schema mínimo;
- ownership;
- RLS;
- grants;
- isolamento por usuário/experimento;
- idempotência;
- migration/rollback;
- ausência de captura textual fora do contrato;
- acesso somente por adapters autorizados.

### Evidência mínima

Design técnico + migration proposta + testes de RLS/ownership, **antes** de qualquer aplicação em ambiente com coleta.

### Resultado atual

**BLOCKED / NOT APPROVED.**

Nenhuma tabela, migration ou event store experimental é autorizada.

---

## 4. Gate AA-MA-GATE-LEARN-01 — Validade educacional do outcome

**Autoridade requerida:** Learning + Education.

**Aprovador humano nominal:** PENDING.

### Deve aprovar

- outcome primário;
- condição de avaliação sem assistência;
- validity scope;
- criterion version;
- política de itens;
- janela temporal;
- tratamento de repetição por item/estudante;
- distinção entre aprendizagem, calibração, engajamento e uso do tutor;
- margem pedagogicamente tolerável caso seja usada não-inferioridade.

### Baseline atual

O Supabase possui 0 `educational_practice_items` e 0 `educational_practice_attempts`. Logo, taxa-base, variância, ICC e attrition não são estimáveis.

### Resultado atual

**READY PARA DEFINIÇÃO / BLOCKED PARA EXPERIMENTO.**

Outcome candidato: `pass | fail` criterion-referenced posterior e sem assistência.

---

## 5. Gate AA-MA-GATE-UX-01 — Agência, equivalência de escolha e acessibilidade

**Autoridade requerida:** UI/UX.

**Aprovador humano nominal:** PENDING.

### Deve aprovar

- equivalência visual entre níveis de ajuda;
- ausência de culpa/moralização;
- resposta direta sempre disponível;
- reversibilidade;
- linguagem cognitiva acessível;
- teclado/foco/leitor de tela;
- error/recovery states;
- nenhuma opção apresentada como moralmente superior;
- nenhum dark pattern para empurrar o estudante a um braço.

### Evidência mínima

Revisão explícita da variante experimental + checklist a11y + critérios de aceitação.

### Resultado atual

**READY-NONPERSISTENT / PENDING EXPERIMENT REVIEW.**

O Slice 1 do PR #586 já passou a11y/Anti-Dark Pattern, mas isso não substitui aprovação específica da variante experimental.

---

## 6. Gate AA-MA-GATE-QA-01 — Integridade experimental e regressão

**Autoridade requerida:** QA.

**Aprovador humano nominal:** PENDING.

### Pré-condições

- Trust, Data, Learning/Education e UI/UX aprovados;
- versão experimental congelada.

### Deve aprovar

- assignment estável;
- prevenção de troca silenciosa de braço;
- análise ITT;
- missingness/attrition;
- contaminação;
- versionamento de modelo/prompt/tools/UI;
- exclusão de assistência do outcome primário;
- rollback/desativação;
- falha fechada quando contrato estiver ausente;
- nenhuma coleta fora do contrato.

### Evidência mínima

Plano de testes reproduzível + execução verde em ambiente autorizado.

### Resultado atual

**PASS PARA SLICE 1 / BLOCKED PARA EXPERIMENTO.**

---

## 7. Gate transversal AA-MA-GATE-STAT-01 — Baseline e poder

**Autoridade requerida:** Produto + Learning/Education + responsável estatístico/metodológico designado.

**Aprovador humano nominal:** PENDING.

### Deve fechar antes da coleta

- `p0` ou baseline equivalente;
- unidade de randomização;
- estrutura de cluster/repetição;
- `alpha`;
- poder;
- MDE ou margem NI;
- attrition esperado;
- regra de multiplicidade, se aplicável;
- sample size alvo;
- regra de encerramento.

### Estado atual

**BLOCKED POR AUSÊNCIA DE BASELINE EMPÍRICO.**

Não é permitido escolher margem ou MDE para “caber” em uma amostra conveniente.

---

## 8. Ordem de desbloqueio

```text
LEARNING/EDUCATION define outcome e margem pedagógica
            ↓
TRUST aprova finalidade/minimização/ciclo de vida
            ↓
UI/UX aprova variante e agência
            ↓
DATA desenha persistência sob contratos já aprovados
            ↓
STAT fecha baseline/poder/sample size
            ↓
QA valida mecânica experimental completa
            ↓
AUTORIZAÇÃO EXPLÍCITA DE COLETA
```

A ordem pode ter trabalho paralelo documental, mas nenhum gate posterior pode autorizar coleta contornando um gate anterior não aprovado.

## 9. Critério de GO futuro

O experimento só pode mudar para GO quando todos estiverem registrados como APPROVED:

- [ ] AA-MA-GATE-TRUST-01
- [ ] AA-MA-GATE-DATA-01
- [ ] AA-MA-GATE-LEARN-01
- [ ] AA-MA-GATE-UX-01
- [ ] AA-MA-GATE-QA-01
- [ ] AA-MA-GATE-STAT-01
- [ ] autorização executiva/Produto explícita para iniciar coleta

## 10. Estado desta rodada

**Todos os gates nominais foram definidos. Nenhum foi falsamente marcado como aprovado.**

**Persistência: NO-GO.**
**Randomização: NO-GO.**
**Coleta: NO-GO.**
**Merge/deploy do PR #586: NO-GO até revisão independente.**
