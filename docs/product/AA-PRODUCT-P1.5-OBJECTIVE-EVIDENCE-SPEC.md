# AA-PRODUCT-P1.5 — Especificação de Evidência Objetiva de Domínio

> Autoridade: Chat 01 — Produto.
>
> Esta especificação fecha o contrato de Produto para P1.5 sem afirmar que a capacidade técnica já está implementada.

## 1. Objetivo

Permitir que a Academia Arcana diferencie explicitamente: atividade/prática; autoavaliação; evidência observada/objetiva; e domínio confirmado, quando os critérios da tarefa forem suficientes.

O sistema nunca deve promover automaticamente uma autoavaliação para domínio confirmado.

## 2. Taxonomia canônica

| Tipo | Significado | Pode confirmar domínio? |
|---|---|---|
| self-assessment | estudante relata sua própria recuperação/desempenho | NÃO |
| retrieval-observed | resultado observável de uma tentativa com critério definido | SOMENTE se a tarefa possuir critério apropriado |
| criterion-referenced | resultado comparado a critérios explícitos da competência/tarefa | SIM, quando os critérios forem satisfeitos |
| teacher-validated | validação explícita por avaliador autorizado | SIM, conforme política da tarefa |
| insufficient | evidência ausente ou insuficiente | NÃO |
| conflicting | evidências relevantes entram em conflito | NÃO automaticamente |

## 3. Regra central

**Domínio confirmado é uma conclusão derivada de evidência adequada à tarefa, não um atributo bruto de uma tentativa.**

Uma tentativa forte de recuperação pode ser evidência objetiva somente quando o tipo de tarefa permite inferir a competência avaliada, existe critério explícito e verificável, a resposta pode ser comparada ao critério, o contexto é conhecido e a amostra mínima exigida foi satisfeita.

## 4. Critérios de tarefa

Toda futura avaliação capaz de contribuir para domínio objetivo deverá declarar: competency/context; evidenceType; criterion; scoringPolicy; minimumEvidence; validityScope; createdAt/version.

A ausência desses metadados impede a afirmação de domínio objetivo.

## 5. Escopo da conclusão

Domínio deve ser sempre limitado ao escopo da evidência: competência, conteúdo ou habilidade específica. Não é permitido transformar domínio de uma tarefa em afirmação universal sobre o estudante.

## 6. Estados canônicos

A futura representação objetiva deve admitir, no mínimo:
- unknown — não existe evidência adequada;
- insufficient — existe evidência, mas não atende ao mínimo;
- developing — há evidência parcial;
- confirmed — critérios objetivos/validados foram satisfeitos;
- conflicting — evidências relevantes divergem.

strong-evidence continua reservado à evidência autorreportada forte e não deve ser usado como sinônimo de confirmed.

## 7. Proveniência obrigatória

Toda evidência objetiva deverá permitir identificar fonte, tipo, tarefa, competência/conteúdo, critério, resultado, confiança/qualidade, timestamp e versão do critério.

## 8. Atualização e reversibilidade

Domínio confirmado não deve ser permanente por definição. Novas evidências podem confirmar novamente, manter, reduzir confiança, produzir estado conflitante ou devolver o estado para insuficiente/unknown conforme a política da competência. A mudança deve ser rastreável.

## 9. Separação de gamificação

XP, nível, streak, missão concluída, conquista, tempo de foco e quantidade de tarefas não podem confirmar domínio isoladamente.

## 10. Separação da autoavaliação

A autoavaliação continua útil para revisão, metacognição, planejamento, identificação de possíveis lacunas e estatísticas de processo. Ela não deve alterar masteryConfirmed para true por si só.

## 11. Requisitos de UX

A interface deve distinguir visual e textualmente: “Você se avaliou como forte”; “Há evidência observada”; “Os critérios foram satisfeitos”; “Não há evidência suficiente”. Evitar afirmações absolutas quando a evidência não sustenta a conclusão.

## 12. Acessibilidade

Estados de evidência devem ser compreensíveis sem depender apenas de cor, com texto equivalente, teclado, leitor de tela, explicação acessível do motivo e estado vazio/sem dados explícito.

## 13. QA — critérios mínimos

1. autoavaliação forte não confirma domínio;
2. tentativa isolada não confirma domínio quando a política exige amostra maior;
3. XP/streak/conquistas não confirmam domínio;
4. evidência sem critério não confirma domínio;
5. critério satisfeito pode produzir confirmed;
6. escopo da conclusão corresponde ao escopo da tarefa;
7. evidência conflitante não gera certeza automática;
8. nova evidência pode revisar o estado;
9. proveniência permanece disponível;
10. UI não usa linguagem mais forte que a evidência.

## 14. Critério de promoção de P1.5

P1.5 somente poderá passar de PARCIAL para CONCLUÍDO quando houver pelo menos um tipo de tarefa com evidência objetiva implementada; critérios formalizados; resultado reproduzível/validável; proveniência persistida; estados de ausência/insuficiência/conflito; UI proporcional à evidência; testes unitários/integrados; acessibilidade validada; segurança/ownership validados; e integração com o ciclo educacional.

## 15. O que esta fase NÃO implementa

Não cria diagnóstico, perfil psicológico, nota escolar universal, ranking, classificação permanente, domínio global do estudante, modelo adaptativo universal ou substituição de avaliação docente.

## 16. Handoff interdomínio

### Education
Definir quais atividades podem produzir evidência observável e quais respostas podem ser avaliadas.

### Learning
Definir contratos de evidência, agregação, estados e proveniência.

### Adaptive
Definir como evidência objetiva pode alimentar revisão/adaptação sem extrapolação.

### UI/UX + Linguagem
Definir apresentação, estados, microcopy e acessibilidade sem certeza indevida.

### QA
Transformar os critérios desta especificação em testes verificáveis e regressões.

### Database/Supabase
Somente quando os domínios definirem o contrato de persistência necessário; preservar ownership, RLS e minimização de dados.

## 17. Estado

**P1.5: PARCIAL — ESPECIFICAÇÃO CANÔNICA DEFINIDA; IMPLEMENTAÇÃO OBJETIVA PENDENTE.**

PI-01/PI-02 permanecem concluídas. Esta especificação não reabre essas decisões.
