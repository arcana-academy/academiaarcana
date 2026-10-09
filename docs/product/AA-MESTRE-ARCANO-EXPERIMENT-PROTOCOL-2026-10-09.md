# AA-MESTRE-ARCANO — Protocolo Experimental Pedagógico

> Data: 2026-10-09
>
> Estado: **PROTOCOLO DE PRODUTO PRÉ-REGISTRÁVEL; COLETA NÃO AUTORIZADA**.
>
> Autoridade: `AA-PRODUCT-1.0.md`, `AA-PRODUCT-REQUIREMENTS-1.0.md` e `AA-PRODUCT-MESTRE-ARCANO-PEDAGOGICAL-EVALUATION-2026-10-09.md`.

## 1. Pergunta

Ajuda graduada e feedback metacognitivo no Mestre Arcano melhoram ou preservam aprendizagem posterior sem assistência, sem reduzir autonomia nem criar abandono material?

## 2. Hipóteses

### H1 — ajuda graduada

Uma experiência que torna níveis de ajuda explícitos pode reduzir a substituição de prática por respostas completas sem deteriorar o desempenho posterior sem assistência.

### H2 — feedback metacognitivo

Um lembrete breve e não moralizante sobre oportunidade de prática pode reduzir pedidos de solução completa sem deteriorar o desempenho posterior sem assistência.

## 3. População elegível

Somente fluxos em que:

- exista tarefa de prática claramente identificada;
- exista uma avaliação posterior adequada ao mesmo escopo educacional;
- a avaliação possa ocorrer sem assistência do Mestre Arcano;
- a proveniência da evidência seja conhecida;
- o estudante possa escolher resposta direta quando desejar.

Até existir avaliação objetiva mais ampla, a elegibilidade deve respeitar o escopo criterion-referenced atualmente validado pelo produto. Não extrapolar resultados para domínio global.

## 4. Unidade de randomização

Preferência: **estudante por experimento**, com alocação estável durante a janela experimental, para reduzir contaminação entre políticas dentro da mesma pessoa.

A implementação da alocação não está autorizada por este documento. Antes de persistir assignment, Trust/Data devem fechar finalidade, retenção e acesso.

## 5. Experimento AA-MA-EXP-001 — ajuda graduada

### Controle

Mestre Arcano com política pedagógica versionada e entrada livre `unspecified`, sem exigir seleção de nível de ajuda.

### Tratamento

A interface torna explicitamente disponíveis:

- pista;
- decomposição;
- resposta direta.

Nenhuma opção é apresentada como moralmente superior. Resposta direta permanece disponível.

### Outcome primário

Desempenho em avaliação posterior **sem assistência**, criterion-referenced e compatível com o escopo da prática.

### Outcomes secundários

- proporção de episódios em que resposta direta é escolhida;
- conclusão da prática;
- abandono antes da avaliação;
- tempo até avaliação, somente se necessário e aprovado;
- confiança/calibração somente se medida separadamente do domínio.

## 6. Experimento AA-MA-EXP-002 — feedback metacognitivo

Elegível somente quando o estudante solicita resposta completa em contexto de prática.

### Controle

Respeitar a solicitação de resposta direta sem lembrete metacognitivo adicional.

### Tratamento

Antes ou junto da resposta, apresentar mensagem breve informando que tentar antes pode criar uma oportunidade adicional de prática, mantendo a opção de receber a solução imediatamente.

### Outcome primário

Desempenho posterior sem assistência.

### Outcomes secundários

- escolha por tentar antes;
- solicitação de resposta direta;
- abandono;
- conclusão da prática.

## 7. Estimando principal

Análise primária: **intention-to-treat (ITT)** pela variante atribuída.

Escolhas efetivas de ajuda podem ser analisadas como comportamento secundário, mas não substituem a comparação ITT porque são auto-selecionadas.

## 8. Missingness e attrition

- ausência de avaliação posterior não equivale a desempenho baixo;
- reportar taxa de attrition por braço;
- investigar desequilíbrio de attrition;
- não remover participantes pós-randomização apenas por não usar o tutor;
- qualquer análise per-protocol é secundária e deve ser rotulada como tal.

## 9. Janela temporal

A janela exata deve ser fixada antes da coleta conforme o tipo de conteúdo e a capacidade real do fluxo de prática.

Não escolher a janela depois de observar os resultados.

## 10. Tamanho de efeito e amostra

Nenhum MDE ou margem de não-inferioridade é inventado neste documento.

Antes do lançamento, a equipe deve obter dados de baseline ou estimativa externa adequada e então registrar:

- taxa/desempenho esperado no controle;
- MDE educacionalmente relevante ou margem de não-inferioridade;
- alfa;
- poder;
- correção para desenho, se aplicável;
- amostra-alvo;
- regra de encerramento.

Sem esses valores, o experimento permanece **NÃO PRONTO PARA COLETA**.

## 11. Critério de promoção

Uma variante não é promovida apenas porque aumenta uso, satisfação ou engajamento.

Para promoção:

1. outcome primário sem assistência não pode apresentar deterioração além da margem pré-registrada;
2. deve existir benefício no mecanismo-alvo ou no desempenho independente;
3. attrition não pode invalidar a interpretação;
4. não pode haver sinal material de perda de autonomia/acessibilidade;
5. resultados devem permanecer limitados ao contexto avaliado;
6. mudança material de modelo, prompt, tools ou UI exige nova versão e revalidação.

## 12. Critérios de interrupção

Interromper ou pausar a variante se houver evidência de:

- piora material no outcome primário;
- aumento relevante de abandono;
- bloqueio ou degradação da opção de resposta direta;
- falha de consentimento, minimização, ownership ou RLS;
- coleta de conteúdo além do contrato aprovado;
- erro de randomização que comprometa o estimando.

## 13. Análises exploratórias

Podem explorar diferenças por conteúdo ou experiência prévia apenas quando:

- a variável já for legitimamente disponível;
- houver tamanho de amostra suficiente;
- o resultado for rotulado como exploratório;
- não forem criadas categorias permanentes de estudante.

Evitar caça a subgrupos pós-hoc.

## 14. Versão da intervenção

A primeira candidata é:

- política: `2026-10-09-v1`;
- níveis: `unspecified | hint | decomposition | direct-answer`;
- runtime: Mestre Arcano contextual V1;
- ferramentas: conjunto autorizado vigente no commit experimental;
- UI: variante explicitamente registrada no protocolo final.

Qualquer mudança material cria nova versão.

## 15. Gates antes da coleta

- [ ] Trust aprova finalidade, minimização, retenção e descarte.
- [ ] Data define persistência somente via contratos dos owners.
- [ ] Learning/Education confirmam outcome independente válido.
- [ ] UI/UX valida autonomia, linguagem e acessibilidade.
- [ ] QA valida randomização, ausência de vazamento entre braços e regressões.
- [ ] baseline permite fixar MDE/margem e amostra.
- [ ] protocolo final é congelado antes da primeira observação experimental.

## 16. Estado final desta rodada

**Desenho experimental: CONCLUÍDO.**

**Coleta: BLOQUEADA** até fechamento dos gates acima.

**Próximo trabalho:** transformar os gates em checklist técnico/interdomínio e validar a implementação do Slice 1 nos gates do repositório.
