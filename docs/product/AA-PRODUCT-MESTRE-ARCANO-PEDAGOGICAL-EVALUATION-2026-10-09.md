# AA-PRODUCT — Matriz de Avaliação Pedagógica do Mestre Arcano

> Data: 2026-10-09
>
> Autoridade: `docs/product/AA-PRODUCT-1.0.md` e `docs/product/AA-PRODUCT-REQUIREMENTS-1.0.md`.
>
> Natureza: aplicação incremental de evidência recente. Este documento **não reabre decisões canônicas** e não promove o Mestre Arcano para tutor avançado P2/P3. Ele transforma achados recentes em guardrails e hipóteses de validação.

## 1. Decisão desta rodada

Aplicar somente mudanças compatíveis com decisões já ativas:

- preservar aprendizagem ativa e autonomia;
- separar desempenho assistido de aprendizagem independente;
- usar metacognição como suporte, não como prova de domínio;
- manter adaptação como hipótese revisável;
- avaliar retenção e transferência separadamente;
- versionar e revalidar intervenções de IA que mudem materialmente.

Nenhum resultado isolado abaixo autoriza afirmar que IA melhora ou prejudica aprendizagem de forma geral.

## 2. Evidência nova incorporada

| ID | Pesquisa | Desenho / achado principal | Força para a Academia Arcana | Consequência |
|---|---|---|---|---|
| EV-2026-10-01 | Liu et al., *The Effects of Course-Integrated AI Tutoring on Student Performance and Engagement* | RCT, 2.379 universitários e 30 docentes. Acesso ao tutor foi associado a notas finais e participação menores no contraste principal. | MODERADA-ALTA para o contexto estudado; generalização limitada. | Tratar substituição de atividades de aprendizagem por IA como risco explícito. |
| EV-2026-09-01 | Harrison et al., *Evaluating AI Tutoring at the Speed of Innovation* | Micro-RCT multissítio em GCSE Science. 929 no baseline, 644 no pós-teste; efeito ITT g=0,33, com 30,7% de attrition. | MODERADA-BAIXA; preprint, desfecho alinhado ao currículo e attrition relevante. | Preferir avaliação causal rápida e repetível para versões do tutor. |
| EV-2026-09-02 | Maier et al., *Designing Against Deskilling* | Experimento online pré-registrado, N=704. Feedback metacognitivo reduziu offloading de respostas (OR=0,47) e melhorou teste sem assistência (OR=1,51). | MODERADA para mecanismo específico; preprint e tarefa limitada. | Testar feedback metacognitivo e ajuda graduada sem restringir a agência. |
| EV-2026-09-03 | Santos et al., *Beyond "ChatGPT Can Make Mistakes"* | Experimento, N=917. Cartões de confiabilidade e respostas contrastantes melhoraram calibração, sem ganho demonstrado de desempenho. | MODERADA para calibração; insuficiente para inferir aprendizagem. | Medir calibração e desempenho como alvos distintos. |
| EV-2026-09-04 | Ramgopal et al., *Examining the benefits of spaced retrieval practice* | Intervenção de semestre. Recuperação espaçada superou reestudo em itens repetidos; transferência global não foi demonstrada. | MODERADA para retenção no contexto; LIMITADA para transferência. | Separar retenção de transferência na avaliação da política de revisão. |

## 3. Guardrails aplicados agora

### AA-MA-G01 — Esforço cognitivo preservado

Quando a interação for claramente uma tarefa de aprendizagem, o Mestre Arcano deve, quando adequado, favorecer tentativa, pista, pergunta-guia ou decomposição antes da solução completa.

**Limite:** isso não é bloqueio de resposta. Se o estudante pedir ou precisar da resposta direta, o tutor pode fornecê-la sem coerção e oferecer uma verificação breve de compreensão.

### AA-MA-G02 — Feedback metacognitivo sem moralização

O tutor pode explicitar que delegar uma resposta pode reduzir a oportunidade de prática, mas deve preservar escolha, acessibilidade e contexto.

### AA-MA-G03 — Assistência não equivale a aprendizagem independente

Uso do tutor, satisfação, confiança, tempo de interação e acerto com assistência não podem ser apresentados como prova de aprendizagem independente.

### AA-MA-G04 — Adaptação é hipótese revisável

Sugestões adaptativas devem declarar o sinal disponível e continuar sendo recomendações, nunca ordens ou classificações permanentes.

### AA-MA-G05 — Retenção e transferência são resultados distintos

Recuperação espaçada pode ser favorecida quando adequada, mas o produto não deve inferir transferência para tarefas novas sem medição própria.

## 4. Matriz de avaliação pedagógica

| ID | Hipótese | Métrica primária | Métricas secundárias | Risco principal | Critério de promoção |
|---|---|---|---|---|---|
| AA-MA-EVAL-001 | Ajuda graduada reduz substituição de prática por resposta pronta. | desempenho posterior **sem assistência** em tarefa criterion-referenced compatível | taxa de tentativa antes de solução; conclusão da tarefa; pedido explícito de resposta direta | criar fricção ou paternalismo | promover somente se não houver deterioração relevante do desempenho independente e houver sinal de menor offloading; margem de não-inferioridade deve ser pré-registrada antes do experimento |
| AA-MA-EVAL-002 | Feedback metacognitivo reduz offloading sem reduzir autonomia. | proporção de solicitações de resposta completa após o nudge | abandono; escolha do nível de ajuda; desempenho independente | tornar o tutor julgador ou repetitivo | promover se offloading cair de forma educacionalmente relevante, sem aumento material de abandono e sem dano ao desempenho independente |
| AA-MA-EVAL-003 | Intervenções de calibração melhoram julgamento do estudante sem serem confundidas com domínio. | erro de calibração entre confiança e evidência objetiva | discriminação; confiança média; desempenho | interpretar calibração como aprendizagem | manter apenas se a calibração melhorar; qualquer efeito de aprendizagem deve ser avaliado separadamente |
| AA-MA-EVAL-004 | Revisão com recuperação espaçada melhora retenção. | desempenho de retenção em itens equivalentes após intervalo definido | transferência para itens novos; experiência do estudante | otimizar repetição e prejudicar flexibilidade/transferência | retenção e transferência devem ser reportadas separadamente; ganho de retenção não autoriza claim de transferência |
| AA-MA-EVAL-005 | Avaliação versionada permite aprender com mudanças rápidas do tutor. | efeito causal por versão/configuração | implementação, attrition, aderência, acessibilidade | evidência ficar obsoleta após mudanças de modelo/prompt/UI | toda avaliação deve registrar versão do modelo, política de instruções, conjunto de ferramentas e variante de interface; mudanças materiais exigem nova validação |

## 5. Instrumentação mínima necessária antes de experimentos

A instrumentação deve ser minimizada e revisada por Trust/Data antes de persistência nova. Para os experimentos acima, o produto precisa conseguir distinguir, no mínimo:

1. interação assistida versus avaliação sem assistência;
2. nível de ajuda escolhido/oferecido: pista, decomposição ou solução completa;
3. tentativa do estudante antes da solução quando observável;
4. versão do modelo e da política de instruções;
5. variante experimental;
6. origem e tipo da evidência educacional;
7. retenção e transferência como resultados separados.

Não registrar conteúdo privado adicional apenas para medir essas hipóteses.

## 6. Plano experimental recomendado

### Fase A — Guardrail de baixo risco

Estado: **APLICADO NESTA RODADA**.

- instruções do Mestre Arcano passam a preservar oportunidade de tentativa;
- resposta direta continua disponível;
- metacognição é apresentada sem culpa;
- adaptação permanece hipótese;
- aprendizagem independente é explicitamente distinta de uso assistido.

### Fase B — Instrumentação

Estado: **PENDENTE DE DESENHO INTERDOMÍNIO**.

Responsáveis esperados: Intelligence + Learning + Data + Trust + UI/UX.

Saída: eventos mínimos, política de retenção e definição dos desfechos.

### Fase C — Experimento controlado

Estado: **NÃO INICIADO**.

Comparar pelo menos uma política-base com uma variante de ajuda graduada/metacognitiva. O protocolo deve definir antes da coleta: população e contexto, unidade de randomização, outcome primário, janela temporal, margem de não-inferioridade ou MDE, critérios de exclusão, tratamento de attrition, análise de subgrupos somente quando justificada e versão exata da intervenção.

### Fase D — Replicação

Estado: **NÃO INICIADO**.

Uma única rodada positiva não transforma a hipótese em regra universal. Repetir em outro conteúdo, coorte ou versão antes de generalização ampla.

## 7. Decisões preservadas

Continuam sem alteração:

- AA-PROD-003 — gamificação não é domínio acadêmico;
- AA-PROD-004 — perfil educacional é revisável;
- AA-PROD-005 — autonomia;
- AA-PROD-006 — proveniência da evidência;
- AA-PROD-007 — adaptação V1 limitada;
- P1.5 — criterion-referenced V1 de escopo limitado;
- Mestre Arcano avançado continua P2/P3 em evolução.

## 8. Estado de execução e próximo trabalho

**Concluído nesta rodada:**

- matriz de avaliação pedagógica;
- guardrails AA-MA-G01–G05;
- Slice 1 não persistente com política versionada e níveis explícitos de ajuda;
- desenho de instrumentação mínima;
- protocolo experimental pré-registrável para AA-MA-EVAL-001/002.

**Ainda bloqueado:** persistência experimental, randomização e coleta.

**Próximo trabalho prioritário:** fechar o checklist interdomínio de Trust/Data/Learning/UI/QA e obter baseline suficiente para definir MDE ou margem de não-inferioridade antes de qualquer coleta.

## 9. Fontes

- Liu et al. (2026), EdWorkingPaper 26-1598, DOI: 10.26300/y3f8-vh05.
- Harrison et al. (2026), arXiv:2609.14789.
- Maier et al. (2026), arXiv:2609.20143.
- Santos et al. (2026), arXiv:2609.17065.
- Ramgopal et al. (2026), *Memory*, DOI: 10.1080/09658211.2026.2733327.
