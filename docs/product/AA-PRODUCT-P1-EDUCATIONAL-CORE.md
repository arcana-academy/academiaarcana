# AA-PRODUCT-P1 — Especificação de Fechamento do Núcleo Educacional

Este documento detalha os requisitos de Produto P1 que devem transformar a fundação organizacional da Academia Arcana em um núcleo educacional efetivo.

Autoridade: `docs/product/AA-PRODUCT-1.0.md`.

Este documento define comportamento de produto e critérios de aceitação. Implementação técnica pertence aos domínios responsáveis.

## P1.0 — Princípio de fechamento

O núcleo educacional não será considerado concluído apenas porque o estudante consegue:

- criar conteúdo;
- criar tarefas;
- usar temporizador;
- concluir missões;
- acumular XP;
- manter streak;
- visualizar páginas.

Essas capacidades organizam e reconhecem atividade. O núcleo educacional exige também mecanismos que produzam evidência de aprendizagem.

## P1.1 — Prática educacional

### Objetivo

Permitir que o estudante pratique ativamente determinado conhecimento.

### Requisito

O produto deve possuir pelo menos uma forma de atividade em que o estudante precise produzir uma resposta, solução, explicação, decisão ou aplicação relacionada ao conteúdo estudado.

### Critérios de aceitação

- a atividade possui objetivo/conteúdo de referência;
- o estudante precisa realizar uma ação cognitiva, não somente ler;
- a resposta/resultado é associado ao contexto correto;
- o resultado pode gerar feedback;
- a experiência é acessível;
- falha na atividade não gera punição gamificada automática;
- a prática pode ser repetida.

## P1.2 — Recuperação

### Objetivo

Verificar o que o estudante consegue recuperar sem depender apenas de releitura.

### Requisito

O produto deve oferecer atividades de recuperação compatíveis com o contexto do conteúdo.

### Critérios de aceitação

- o estudante tenta recuperar informação antes de receber a resposta completa;
- o sistema registra o resultado da tentativa;
- o resultado pode alimentar o estado educacional;
- incerteza ou ausência de evidência é explicitada;
- o sistema não transforma uma única resposta em diagnóstico definitivo de domínio.

## P1.3 — Revisão baseada em evidência

### Objetivo

Ajudar o estudante a revisar quando houver motivo educacional verificável.

### Requisito

O produto deve poder sugerir revisão usando sinais como desempenho, histórico de prática, tempo desde exposição e objetivo, quando disponíveis.

### Critérios de aceitação

- a recomendação apresenta motivo compreensível;
- a recomendação não depende apenas de uma data arbitrária;
- o estudante pode aceitar ou modificar o plano quando permitido;
- ausência de histórico suficiente produz estado de baixa confiança, não falsa precisão;
- revisão permanece distinta de simples releitura.

## P1.4 — Feedback educacional

### Objetivo

Transformar o resultado da prática em informação útil para o próximo passo.

### Requisito

O resultado de uma atividade deve poder apresentar feedback relacionado ao objetivo da atividade.

### Critérios de aceitação

- feedback identifica o que ocorreu;
- quando possível, explica por que;
- quando possível, sugere próximo passo;
- não confunde erro pontual com incapacidade;
- feedback é compreensível e acessível;
- feedback não deve ser apenas recompensa de XP.

## P1.5 — Evidência de domínio

### Objetivo

Separar atividade de domínio acadêmico.

### Requisito

O produto deve manter uma representação de domínio baseada em evidências educacionais disponíveis.

### Critérios de aceitação

- XP, streak e número de tarefas não são usados isoladamente como domínio;
- o domínio pode variar por conteúdo/competência;
- o estado pode ser desconhecido ou insuficientemente evidenciado;
- novas evidências podem revisar o estado;
- linguagem de interface evita certeza indevida.

## P1.6 — Lacunas de aprendizagem

### Objetivo

Identificar conteúdos/competências que merecem atenção.

### Requisito

O produto pode sinalizar possíveis lacunas quando houver evidência suficiente.

### Critérios de aceitação

- lacuna é apresentada como sinal ou hipótese quando apropriado;
- a origem da evidência é identificável;
- não há diagnóstico clínico;
- o sistema oferece ação de investigação/prática/revisão;
- baixa evidência impede conclusões fortes.

## P1.7 — Perfil educacional dinâmico

### Objetivo

Adaptar suporte sem transformar padrões atuais em rótulos permanentes.

### Requisito

O sistema deve manter sinais educacionais revisáveis.

### Critérios de aceitação

- cada sinal possui origem/contexto;
- sinais podem mudar;
- ausência de dados é distinguida de desempenho baixo;
- inferências permanecem separadas de fatos observados;
- o estudante não é definido por uma categoria fixa.

## P1.8 — Estatísticas educacionais

### Objetivo

Mostrar evolução que tenha significado pedagógico.

### Requisito

As estatísticas devem evoluir além de métricas de gamificação.

### Indicadores possíveis

- prática realizada;
- taxa de recuperação;
- desempenho por conteúdo;
- evolução de domínio;
- itens que requerem revisão;
- consistência contextualizada;
- objetivos concluídos;
- distribuição de estudo por área.

### Critérios de aceitação

- cada métrica possui definição explícita;
- a fonte é identificável;
- períodos e unidades são claros;
- pequenas amostras não recebem interpretação exagerada;
- métricas inexistentes permanecem em estado vazio.

## P1.9 — Integração com o ciclo da Academia

Toda capacidade P1 deve reforçar:

`Objetivo → Planejamento → Estudo → Prática → Feedback → Revisão → Progresso → Adaptação`

Uma implementação que adiciona atividade sem produzir conexão com esse ciclo deve ser reavaliada antes de ser considerada concluída.

## P1.10 — Autonomia

O estudante deve poder:

- entender por que algo foi recomendado;
- aceitar ou ajustar recomendações quando o fluxo permitir;
- revisar resultados;
- distinguir fato observado de inferência;
- continuar sem uma recomendação quando isso não violar requisitos de segurança ou integridade.

## P1.11 — Estado de confiança

Dados educacionais devem admitir, conforme o caso:

- evidência forte;
- evidência parcial;
- evidência insuficiente;
- sem dados.

O produto não deve criar precisão artificial.

## P1.12 — Acessibilidade

Cada capacidade P1 deve ter:

- navegação por teclado;
- foco perceptível;
- sem dependência exclusiva de cor;
- estados de loading/erro/sucesso compreensíveis;
- suporte a redução de movimento quando aplicável;
- linguagem clara;
- possibilidade de recuperação de erro.

## P1.13 — Segurança de produto

O núcleo educacional não pode:

- expor dados de outro estudante;
- transformar inferência educacional em diagnóstico;
- registrar mais dados pessoais do que o necessário;
- permitir que o Mestre Arcano escreva ou altere estado crítico sem o mecanismo de autorização adequado.

## P1.14 — Validação por domínio

| Requisito | Produto | Domínio principal esperado |
|---|---|---|
| Prática | comportamento educacional | education / learning |
| Recuperação | comportamento e evidência | education / learning |
| Revisão | regras de revisão | adaptive / learning / planning |
| Feedback | resultado e orientação | education |
| Domínio | modelo de evidência | learning / education / adaptive |
| Lacunas | inferência revisável | adaptive / education |
| Perfil dinâmico | sinais/contexto | adaptive |
| Estatísticas | projeções e métricas | learning / gamification / adaptive |
| Autonomia | experiência | application / UI/UX + domínio relevante |
| Mestre Arcano | suporte contextual | intelligence |

A tabela identifica responsabilidade de produto; os contratos e decisões técnicas permanecem nos chats especializados.

## P1.15 — Critério de conclusão

P1 só pode ser promovido de PENDENTE para CONCLUÍDO quando:

1. a capacidade estiver implementada;
2. seu comportamento esperado estiver coberto por critérios de aceitação;
3. houver evidência de dados reais ou estado vazio explícito;
4. houver validação de acessibilidade;
5. houver testes pertinentes;
6. integração com o ciclo educacional estiver comprovada;
7. não houver confusão entre atividade, gamificação e domínio;
8. dependências interdomínio estiverem resolvidas;
9. limitações e incertezas estiverem visíveis ao estudante;
10. o comportamento estiver validado em ambiente apropriado.

## P1.16 — Ordem de fechamento recomendada

`Prática → Recuperação → Feedback → Revisão → Domínio → Lacunas → Perfil adaptativo → Estatísticas educacionais`

Essa ordem é uma sequência operacional recomendada para reduzir dependências; não representa ranking de valor absoluto entre capacidades.

## P1.17 — Estado

Os itens P1.1–P1.8 estão **CONCLUÍDOS** na implementação corrente da Academia Arcana.

A validação que sustenta este estado inclui:

- prática e recuperação nativas na superfície `/pratica`;
- evidência de tentativa separada de XP, streak e demais sinais de gamificação;
- recomendações de revisão e sinais adaptativos revisáveis;
- estatísticas educacionais distintas das estatísticas de gamificação;
- validação de ownership e RLS no Supabase;
- gravação de evidência por operação atômica autenticada;
- testes unitários, de acessibilidade, integração de banco e E2E cobrindo o núcleo P1.

### Segurança da evidência educacional

A operação pública `record_educational_practice_attempt` é a única rota autorizada pela aplicação para registrar tentativas.

A função pública é `SECURITY INVOKER`, usa `search_path = public, pg_catalog` e pode ser executada somente por `authenticated`. Ela delega a gravação atômica a uma implementação privada, fora da superfície pública da API, que é `SECURITY DEFINER`, usa `search_path = ''`, valida `auth.uid()` e ownership do item e executa as escritas necessárias com privilégios elevados.

O privilégio `INSERT` direto na tabela de tentativas permanece revogado para `authenticated`, evitando bypass da atualização atômica de progresso. A implementação privada também não concede execução a `anon` ou `service_role`.

Este documento permanece como especificação e rastreabilidade de produto; os contratos e decisões técnicas ficam nos domínios e migrações correspondentes.

