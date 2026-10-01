# AA-PRODUCT-1.0 — Baseline Operacional de Produto

> Autoridade: Prompt 01 — Produto, subordinado à Constituição Master da Academia Arcana (Prompt 00).
>
> Este documento transforma o contrato de produto em uma linha de base operacional verificável no repositório. Não substitui a Constituição Master e não redefine arquitetura técnica, banco, segurança, Design System, UI visual, infraestrutura, integrações ou CI/CD.

## 1. Identidade do produto

A Academia Arcana é uma plataforma educacional gamificada, adaptativa, acessível e personalizável, criada para apoiar o processo completo de aprendizagem.

A fantasia é linguagem de experiência e motivação. A finalidade central permanece educacional.

O produto deve ajudar o estudante a:

- compreender o que precisa aprender;
- organizar objetivos e conteúdos;
- transformar intenção em ações;
- estudar e praticar;
- receber feedback;
- revisar;
- acompanhar progresso real;
- reconhecer lacunas;
- refletir sobre a própria aprendizagem;
- adaptar estratégias;
- desenvolver autonomia.

## 2. Ciclo canônico de aprendizagem

O produto é organizado pelo ciclo:

`Objetivo → Planejamento → Estudo → Prática → Feedback → Revisão → Progresso → Adaptação`

Nenhum módulo deve ser desenvolvido isoladamente de forma que quebre esse ciclo.

## 3. Princípios educacionais

Quando aplicável e proporcional ao contexto, a Academia Arcana deve considerar:

- prática de recuperação;
- espaçamento;
- interleaving;
- elaboração;
- prática deliberada;
- feedback;
- metacognição;
- carga cognitiva;
- planejamento;
- monitoramento;
- autorregulação;
- aprendizagem ativa.

Nenhuma estratégia deve ser tratada como universal sem base suficiente para essa generalização.

## 4. Modelo adaptativo

A adaptação trabalha com sinais multidimensionais e revisáveis, incluindo, conforme disponibilidade:

- conhecimento;
- desempenho;
- dificuldade;
- histórico;
- ritmo;
- objetivos;
- contexto;
- preferências;
- padrões de estudo;
- progresso;
- necessidade de revisão.

O produto não deve fixar o estudante em rótulos permanentes.

A linguagem correta é baseada em evidência e incerteza:

> os dados atuais sugerem um padrão

e não:

> este estudante é assim.

## 5. Autonomia

Recomendações são suporte, não ordens.

O sistema pode recomendar, sugerir, lembrar, organizar, adaptar e explicar, mas o estudante deve manter controle sobre suas escolhas quando isso for compatível com a segurança e as regras do produto.

## 6. Público

A Academia Arcana deve servir a diferentes perfis de estudantes.

Personalização, acessibilidade e Neurodesign existem para ampliar compreensão, previsibilidade, conforto e controle — não para criar uma classificação humana rígida.

## 7. Domínios de produto

| Área | Papel de produto | Estado observado |
|---|---|---|
| Santuário | entrada contextual, retomada e orientação | IMPLEMENTADO |
| Academia | ponto de entrada para a experiência educacional | IMPLEMENTADO COMO PORTAL |
| Grimórios | organização de conhecimento | IMPLEMENTADO |
| Capítulos | estrutura intermediária de conhecimento | IMPLEMENTADO NO WORKSPACE |
| Páginas | unidade de conteúdo/registro | IMPLEMENTADO |
| Missões | transformar objetivos/eventos em ações reconhecíveis | IMPLEMENTADO EM FORMA BÁSICA |
| Cronograma | planejamento temporal e execução de tarefas | IMPLEMENTADO |
| Foco | sessões de estudo concentrado | IMPLEMENTADO |
| Streak | continuidade de atividade | IMPLEMENTADO |
| Estatísticas | leitura de progresso e atividade | IMPLEMENTADO EM FORMA BÁSICA |
| Conquistas | reconhecimento de marcos | IMPLEMENTADO EM FORMA BÁSICA |
| Amigos | interação social opcional | SUPERFÍCIE PREPARADA; FUNÇÃO REAL PENDENTE |
| Perfil | identidade e estado do usuário | IMPLEMENTADO EM FORMA BÁSICA |
| Personalização | controle da experiência visual/cognitiva | IMPLEMENTADO EM FORMA BÁSICA |
| Configurações | controle de preferências e integrações | IMPLEMENTADO EM FORMA BÁSICA |
| Mestre Arcano | inteligência contextual para apoio à aprendizagem | IMPLEMENTADO TECNICAMENTE; CAPACIDADE EDUCACIONAL AINDA EM EVOLUÇÃO |

### Regra de interpretação

A existência de uma rota não significa que a capacidade educacional esteja concluída.

Uma superfície pode estar:

- implementada;
- parcialmente implementada;
- preparada;
- bloqueada por dependência externa;
- ainda pertencente ao backlog.

Não declarar uma capacidade como concluída somente por existir uma página.

## 8. Estado real do produto observado no main

### Núcleo P0 já materializado

O repositório apresenta evidência de:

- autenticação e acesso protegido;
- Workspace;
- Grimórios, notebooks, capítulos e páginas;
- persistência e ordenação da hierarquia;
- tarefas de estudo no Cronograma;
- sessões de Foco;
- Santuário autenticado;
- missões derivadas de estado de gamificação;
- XP, nível e streak;
- conquistas;
- preferências de movimento;
- temas/personalização;
- integração de calendário e ferramentas externas em superfícies já conectadas.

### P0 ainda não deve ser considerado totalmente fechado do ponto de vista educacional

Ainda faltam evidências de que o produto, como experiência completa, já entrega:

- prática de recuperação de forma nativa e sistemática;
- revisão espaçada baseada em estado real de aprendizagem;
- avaliação educacional estruturada;
- feedback educacional suficientemente rico;
- detecção de lacunas de conhecimento além de sinais de atividade/gamificação;
- adaptação educacional multidimensional operacionalizada de ponta a ponta.

Esses itens são requisitos de produto, não devem ser considerados resolvidos apenas porque existem gamificação, páginas, tarefas ou recomendações.

## 9. P1 — Experiência educacional essencial

P1 deve concentrar as capacidades que transformam o núcleo de organização em uma experiência de aprendizagem efetiva:

### P1.1 — Prática

O estudante deve conseguir praticar ativamente o conteúdo, e não somente armazená-lo ou visualizá-lo.

### P1.2 — Recuperação

Devem existir mecanismos para verificar o que o estudante consegue recuperar sem depender apenas de releitura.

### P1.3 — Revisão

O produto deve apoiar revisão baseada em necessidade e evidência, evitando recomendar revisão apenas porque uma data passou.

### P1.4 — Feedback

O estudante deve receber informação útil sobre o resultado da prática e sobre o próximo passo.

### P1.5 — Domínio

Atividade, XP e streak não podem ser usados como sinônimos de domínio acadêmico.

### P1.6 — Adaptação educacional

As recomendações devem combinar contexto, histórico, desempenho e objetivo, quando esses sinais estiverem disponíveis e forem confiáveis.

### P1.7 — Estatísticas educacionais

As estatísticas devem evoluir de métricas predominantemente de gamificação para indicadores educacionais verificáveis.

## 10. P2 — Evolução

P2 pode aprofundar:

- modelos educacionais por contexto;
- planejamentos mais sofisticados;
- visualizações de progressão;
- personalização funcional mais ampla;
- recursos de colaboração;
- automações educacionais;
- integrações de apoio que preservem a fonte de verdade da Academia Arcana.

## 11. P3 — Diferenciais

P3 inclui diferenciais avançados, como:

- adaptação mais sofisticada;
- experiências multimodais;
- capacidades avançadas do Mestre Arcano;
- mecanismos de metacognição mais ricos;
- experiências imersivas conectadas à aprendizagem.

## 12. P4 — Experimental

P4 é reservado a experimentos que possam ser testados sem comprometer a coerência do produto.

Um experimento não altera o núcleo do produto sem evidência suficiente.

## 13. Mestre Arcano — regra de produto

O Mestre Arcano deve:

- apoiar planejamento;
- sugerir revisão;
- ajudar na retomada;
- explicar;
- propor exercícios;
- contextualizar decisões;
- apoiar metacognição;
- trabalhar com dados reais e explicitamente autorizados.

O Mestre Arcano não deve:

- inventar estado do estudante;
- tratar inferências como fatos;
- substituir o processo de aprendizagem;
- alterar dados críticos sem autorização;
- transformar atividade ou gamificação em prova de domínio.

## 14. Gamificação responsável

Gamificação deve aumentar:

- visibilidade de progresso;
- feedback;
- continuidade;
- motivação para objetivos reais.

Gamificação não deve criar:

- punição artificial;
- vergonha;
- pressão desnecessária;
- competição permanente;
- bloqueios artificiais de produto.

Streak é um indicador, não uma medida de valor pessoal ou de domínio.

## 15. Personalização

A personalização deve poder atuar em:

- visual;
- funcional;
- educacional;
- cognitivo;
- temporal.

A personalização precisa ser controlável e compreensível.

## 16. Acessibilidade e Neurodesign

Acessibilidade é requisito de produto.

O produto deve considerar, entre outros:

- previsibilidade;
- diferentes formas de interação;
- diferentes formas de apresentação;
- controle de estímulos;
- foco visível;
- compatibilidade com tecnologias assistivas;
- redução de carga cognitiva;
- controle de movimento;
- preferências individuais.

Neurodesign não deve ser usado como diagnóstico ou rotulagem clínica.

## 17. Critério de conclusão de produto

Uma funcionalidade só está concluída quando houver, no mínimo:

1. problema claro;
2. usuário definido;
3. objetivo educacional ou de produto explícito;
4. comportamento esperado;
5. estados relevantes;
6. critérios de aceitação;
7. dependências identificadas;
8. validação adequada;
9. integração com o ciclo da Academia Arcana;
10. nenhuma lacuna conhecida que impeça o comportamento prometido.

## 18. Diferenciação entre estados

### IDEIA

Possibilidade ainda não analisada.

### HIPÓTESE

Suposição que precisa de validação.

### PROPOSTA

Solução sugerida, ainda não aprovada.

### REQUISITO

Comportamento que o produto deve possuir.

### DECISÃO

Escolha formalmente adotada.

### IMPLEMENTAÇÃO

Código/configuração que materializa uma decisão.

Uma etapa não substitui a anterior.

## 19. Decisões canônicas

### AA-PROD-001 — Ciclo principal do produto

**Contexto:** o produto possui múltiplos módulos e poderia evoluir como um conjunto fragmentado de ferramentas.

**Problema:** ausência de um eixo comum poderia transformar a Academia Arcana em um agregador de funcionalidades.

**Decisão:** todos os módulos relevantes devem reforçar o ciclo:

`Objetivo → Planejamento → Estudo → Prática → Feedback → Revisão → Progresso → Adaptação`

**Status:** ATIVA.

### AA-PROD-002 — Rota não equivale a produto concluído

**Contexto:** várias áreas já possuem rotas e superfícies.

**Problema:** uma página funcional pode mascarar ausência de capacidade educacional real.

**Decisão:** o estado do produto será determinado pelo comportamento entregue, e não pela existência da rota.

**Status:** ATIVA.

### AA-PROD-003 — Gamificação não é domínio acadêmico

**Contexto:** XP, níveis, streak e conquistas são úteis para progressão e feedback.

**Problema:** métricas de atividade podem ser confundidas com aprendizagem.

**Decisão:** atividade, progressão gamificada e domínio acadêmico devem permanecer conceitos distintos.

**Status:** ATIVA.

### AA-PROD-004 — Perfil educacional é revisável

**Contexto:** adaptação depende de dados incompletos e mutáveis.

**Decisão:** inferências devem ser probabilísticas/revisáveis e não podem virar rótulos permanentes.

**Status:** ATIVA.

### AA-PROD-005 — Autonomia

**Contexto:** um sistema adaptativo pode facilmente virar prescritivo.

**Decisão:** recomendações devem preservar controle e compreensão por parte do estudante.

**Status:** ATIVA.

## 20. Backlog de fechamento do produto

| ID | Capacidade | Prioridade | Estado |
|---|---|---|---|
| AA-PROD-B01 | prática educacional nativa | P1 | PENDENTE |
| AA-PROD-B02 | recuperação de aprendizagem | P1 | PENDENTE |
| AA-PROD-B03 | revisão adaptativa baseada em evidência | P1 | PENDENTE |
| AA-PROD-B04 | feedback educacional estruturado | P1 | PENDENTE |
| AA-PROD-B05 | sinalização de lacunas de conhecimento | P1 | PENDENTE |
| AA-PROD-B06 | perfil educacional dinâmico operacional | P1 | PENDENTE |
| AA-PROD-B07 | estatísticas educacionais além de gamificação | P1 | PENDENTE |
| AA-PROD-B08 | colaboração/social funcional | P2 | PENDENTE |
| AA-PROD-B09 | aprofundamento do Mestre Arcano como tutor/planejador | P2/P3 | EVOLUÇÃO |
| AA-PROD-B10 | experiências experimentais | P4 | NÃO INICIADO |

## 21. Não incluir automaticamente

Novos recursos não devem entrar no produto apenas por:

- tendência;
- disponibilidade de tecnologia;
- presença de um plugin;
- facilidade de implementação;
- estética;
- desejo de aumentar o número de funcionalidades.

A regra é:

`valor educacional × valor de produto × manutenção × complexidade × risco`

A expansão precisa ser deliberada.

## 22. Dependências interdomínio

Quando uma decisão de produto exigir:

- arquitetura;
- banco;
- segurança;
- Design System;
- UI/UX;
- infraestrutura;
- integração externa;
- testes;
- documentação;

o requisito deve ser encaminhado ao domínio correspondente.

Este documento não autoriza implementação fora do domínio Produto.

## 23. Critério de encerramento do Chat 01

O Chat 01 pode considerar uma demanda de produto encerrada quando:

- o problema foi definido;
- a decisão está registrada;
- o escopo está delimitado;
- as dependências estão identificadas;
- os critérios de aceitação estão claros;
- não existem ambiguidades relevantes sobre o comportamento pretendido.

A implementação técnica e a validação operacional continuam pertencendo aos domínios responsáveis.

## 24. Estado atual

**Produto:** CONSOLIDADO COMO BASELINE.

**Núcleo operacional:** IMPLEMENTADO PARCIALMENTE.

**Núcleo educacional completo:** PENDENTE.

**Gamificação:** IMPLEMENTADA EM NÍVEL BÁSICO.

**Adaptação educacional:** EM EVOLUÇÃO.

**Mestre Arcano:** IMPLEMENTADO TECNICAMENTE; EVOLUÇÃO EDUCACIONAL PENDENTE.

**Social:** PREPARADO; FUNCIONALIDADE REAL PENDENTE.

**Estatísticas educacionais:** PENDENTES.

**Conclusão:** o produto já possui uma fundação funcional coerente, mas ainda não deve ser declarado 100% concluído como plataforma educacional. O próximo fechamento de Produto deve atacar primeiro AA-PROD-B01–B07, sem expandir P2–P4 antes de consolidar o núcleo educacional.

## 25. Relação com a arquitetura

A arquitetura operacional deve receber este baseline como contexto de Produto, sem reinterpretar suas responsabilidades.

Referência técnica atual:

`docs/architecture/AA-ARCHITECTURE-1.0.md`

A arquitetura define como implementar dentro das fronteiras aprovadas; este documento define o comportamento e a intenção do produto.

