# Academia Arcana — Política de adoção documental controlada do Superpowers

**Identificador:** AA-SUPERPOWERS-POLITICA-CONTROLADA-V01-2026-11-13  
**Situação:** PROPOSTA DOCUMENTAL EM BRANCH ISOLADA — NÃO RATIFICADA — DRAFT/NO-GO  
**Repositório:** arcana-academy/academiaarcana  
**Branch de preparação:** docs/superpowers-controlled-adoption-20261113  
**Base Git confirmada no preflight:** main em 28014dd3acc147ec00dbf36e023fd2316a2c4221  
**Escopo desta alteração:** um arquivo de documentação; sem alteração de código, configuração, dependências, workflows ou banco de dados.

> **Atenção:** o registro desta política no Git não constitui aprovação institucional, implantação operacional do Superpowers, habilitação de agentes ou autorização de operações. A documentação metodológica já existente em `docs/superpowers/` permanece preservada. Esta proposta não substitui o documento canônico `docs/architecture/AA-ARCHITECTURE-1.0.md`, a constituição mestre, o Brand Book, o Design System, os Flonts oficiais ou quaisquer decisões previamente aprovadas.

## 1. Finalidade e limites

A Academia Arcana — O Portal do Conhecimento preserva sua identidade **Dark Fantasy Arcane + Arcane Academic**, a assinatura **“Seu caminho, seu ritmo, suas descobertas.”** e a prioridade **Conhecimento → Academia → Mistério → Magia → Ornamentação**.

O Superpowers pode auxiliar metodologicamente na leitura, planejamento, depuração documental, revisão de propostas e organização de critérios de evidência. **A presença do plugin no ChatGPT não comprova integração executável no portal.** Seu uso como metodologia não altera a arquitetura de monólito modular, os 14 domínios, as fronteiras técnicas, nem cria um módulo, dependência ou funcionalidade para estudantes.

**Precedência:** (1) autorizações explícitas e restrições da responsável; (2) segurança, privacidade e obrigações aplicáveis; (3) decisões e documentação canônicas; (4) QA e governança vigentes; (5) recomendações e fluxos do Superpowers. A instrução de uma habilidade nunca amplia uma autorização.

**Restrições atuais:** custo incremental pago **R$ 0**; publicação estudantil **DRAFT/NO-GO**; sem autorização para instalar, executar agentes, testar, criar worktrees, modificar código, criar commits adicionais, fazer merge ou deploy. A autorização que originou esta branch limitou-se a **uma branch isolada e um commit documental**. Não é autorização contínua.

## 2. Classificação das 15 habilidades

Esta é uma **proposta de classificação de uso para a Academia Arcana**, não uma característica oficial das habilidades ou um controle técnico instalado.

| Classe | Habilidade | Uso admitido no escopo documental |
|---|---|---|
| A | Using Superpowers | Localizar e compreender instruções, sem iniciar automaticamente outros fluxos |
| B | Brainstorming | Explorar alternativas e requisitos em texto, sem implementar |
| B | Writing Plans | Redigir propostas de planejamento no chat, sem arquivos de plano e commits |
| B | Systematic Debugging | Analisar sintomas e hipóteses documentais, sem reprodução ou instrumentação |
| B | Receiving Code Review | Avaliar comentários disponíveis, sem correções automáticas |
| B | Verification Before Completion | Checar suficiência textual das evidências, sem alegar testes PASS |
| B | Diagnosing Superpowers | Examinar metodologia de diagnósticos, sem ler sessões protegidas ou despachar agentes |
| B | Requesting Code Review | Formular checklist, sem convocar agentes revisores |
| B | Writing Skills | Especificar uma habilidade em texto, sem instalar, criar arquivos ou testá-la |
| C | Test-Driven Development | Fluxo de testes e implementação bloqueado |
| C | Using Git Worktrees | Criação, configuração ou limpeza de worktrees bloqueadas |
| C | Executing Plans | Execução das tarefas e commits bloqueada |
| C | Subagent-Driven Development | Subagentes implementadores/revisores bloqueados |
| C | Dispatching Parallel Agents | Agentes paralelos bloqueados |
| C | Finishing a Development Branch | Merge, push, PR e limpeza operacional bloqueados |

**Interpretação:** A = consulta compatível; B = aproveitamento conceitual parcial; C = fluxo característico executável proibido. É permitido estudar documentalmente o tema de uma habilidade C, sem iniciar seu fluxo. Nenhuma classe equivale a autorização operacional; a execução integral de habilidades A/B também não é autorizada quando contiver procedimentos fora do escopo.

## 3. Lista positiva DOC-01 a DOC-08

São admissíveis, apenas quando o conteúdo for legitimamente acessível e a operação estiver no escopo autorizado:

| Código | Ação documental |
|---|---|
| DOC-01 | Consultar instruções publicamente ou legitimamente disponíveis |
| DOC-02 | Examinar documentos expressamente acessíveis e permitidos |
| DOC-03 | Comparar requisitos e decisões sem substituí-los |
| DOC-04 | Identificar conflitos, incertezas e lacunas sem modificações |
| DOC-05 | Preparar propostas ou alternativas exclusivamente em texto |
| DOC-06 | Elaborar matrizes, pareceres e critérios sem presumir testes executados |
| DOC-07 | Registrar checkpoints no chat sem presumir persistência externa |
| DOC-08 | Preparar prompts de retomada sem iniciar operações |

**Controle documental ≠ controle técnico:** este documento orienta governança e não comprova que ferramentas, conectores, agentes ou ambientes possuem mecanismos automáticos de bloqueio.

São excluídas ações operacionais não autorizadas, inclusive gravações, testes, instalações, acessos a dados protegidos, alterações Git, ações em serviços, publicação e processamento de material confidencial.

## 4. AUT-01 a AUT-11 — Contrato de autorização

Uma autorização futura poderá cobrir uma operação ou um **lote explicitamente delimitado**. Deve especificar:

| Código | Campo obrigatório do contrato |
|---|---|
| AUT-01 | Autoridade responsável |
| AUT-02 | Finalidade |
| AUT-03 | Operações incluídas |
| AUT-04 | Recursos e ambientes |
| AUT-05 | Limites de leitura e escrita |
| AUT-06 | Dados permitidos e excluídos |
| AUT-07 | Condições de custo |
| AUT-08 | Validade ou condição de encerramento |
| AUT-09 | Critérios de verificação |
| AUT-10 | Condições de interrupção |
| AUT-11 | Operações explicitamente excluídas |

O lote não autoriza ferramentas, ações, repetições, destinatários, ambientes ou finalidades que não estejam nele abrangidos. Uma permissão técnica de escrita não é uma autorização de uso dessa permissão. **Planejar ≠ executar; revisar ≠ aprovar; teste PASS ≠ homologação; PR mergeable ≠ merge autorizado; merge ≠ publicação autorizada.**

## 5. Privacidade — classes D0 a D5 e contrato PRIV

| Classe | Descrição e tratamento neste escopo |
|---|---|
| D0 | Informação pública: consulta apenas quando legítima e necessária |
| D1 | Dados efetivamente sintéticos sem vínculo com pessoas reais: uso conceitual permitido quando compatível |
| D2 | Documentos internos não públicos: sem acesso adicional sem autorização específica |
| D3 | Dados pessoais, inclusive estudantis: processamento proibido neste escopo |
| D4 | Provas, gabaritos e avaliações restritas: processamento proibido neste escopo |
| D5 | Segredos, tokens e credenciais: acesso e reprodução proibidos neste escopo |

### Errata SP08-E01 — proteção cumulativa e prevalência mais protetiva

As classes **D0 a D5 não são necessariamente mutuamente exclusivas e a numeração não é uma hierarquia de sensibilidade**. Uma informação pode pertencer a várias classes. Nesse caso, registrar todas as classes pertinentes; aplicar cumulativamente os controles; quando permissões aparentes forem incompatíveis, observar a restrição mais protetiva; e interromper o tratamento caso alguma classe aplicável permaneça excluída.

- **D0 + D3:** dado pessoal acessível publicamente continua sendo dado pessoal; sua disponibilidade não autoriza tratamento neste ciclo.
- **D2 + D4:** documento interno contendo prova confidencial continua proibido.
- **D1:** somente dados genuinamente sintéticos e sem vínculo identificável/reversível com pessoa real podem ser considerados no uso conceitual permitido.

Não presumir anonimização, consentimento, retenção zero, criptografia ou eliminação sem evidência.

**Contrato futuro PRIV-01 a PRIV-12:** (01) categoria dos dados; (02) finalidade; (03) origem e autoridade de uso; (04) base legal quando aplicável; (05) ambiente; (06) ferramentas e destinatários; (07) transmissões e transferências; (08) retenção e eliminação; (09) controles de acesso; (10) logs, transcrições e derivados; (11) autorização necessária; (12) riscos e parada. A identificação desse contrato **não autoriza** o tratamento.

## 6. Condição financeira

**Custo incremental pago autorizado: R$ 0.** Plugin disponível, plano existente ou serviço gratuito em termos gerais não comprovam ausência de cobrança marginal em cada operação. Antes de qualquer ampliação, verificar provedor, modalidade de cobrança, franquias, limites e bloqueios de excedentes. Se não for possível estabelecer custo adequado ao limite R$ 0, **não executar**. Nenhuma contratação é autorizada por este documento.

## 7. Gates documentais, técnicos e decisórios

As dimensões **GD** (consistência e rastreabilidade documental), **GT** (condições e resultados técnicos efetivamente verificados) e **GA** (autoridade e decisão explícita) **não substituem nem aprovam** G-SP-01 a G-SP-07 ou outros gates canônicos.

| Gate preservado | Dimensão relevante | Limite essencial |
|---|---|---|
| G-SP-01 Baseline | GD/GT | Fonte documental não confirma automaticamente HEAD atual |
| G-SP-02 Escopo | GD/GA | Matriz de permissão não autoriza operação |
| G-SP-03 Privacidade | GD/GT/GA | Política não comprova proteção implementada |
| G-SP-04 Custos | GD/GT/GA | Regra R$ 0 não comprova billing auditado |
| G-SP-05 Isolamento | GD/GT | Plano não comprova isolamento técnico |
| G-SP-06 QA | GD/GT | Teste especificado não é teste executado |
| G-SP-07 Deliberação | GD/GA | Parecer não é decisão competente |

Os gates mantêm sua autoridade, requisitos e histórico. Não criar ciclos circulares sem nova evidência material. Aceite documental não equivale a autorização técnica ou institucional.

## 8. Evidência e QA

Para cada afirmação material, registrar conforme possível: **PROV-01 origem, PROV-02 identidade, PROV-03 versão, PROV-04 integridade, PROV-05 conteúdo, PROV-06 relação com a afirmação, PROV-07 suficiência probatória, PROV-08 limitações, PROV-09 estado**. A existência de uma fonte não prova toda conclusão que lhe seja atribuída. Não transformar referências históricas em evidência atual.

Para testes, preservar **TEST-01 identificador, TEST-02 requisito, TEST-03 branch/SHA, TEST-04 ambiente, TEST-05 ciclo/data, TEST-06 procedimento, TEST-07 resultado, TEST-08 evidência, TEST-09 limitações, TEST-10 responsável**.

Estados de teste são escopados ao ciclo e à evidência: PASS, FAIL, NOT RUN, NOT VERIFIED, BLOCKED e NOT APPLICABLE. **NOT RUN neste ciclo não invalida resultados históricos que não foram reexaminados.** Revisão documental WCAG 2.2 AA não equivale a QA manual ou assistivo nem a homologação.

## 9. Conflitos e riscos preservados

| ID | Conflito CF | Controle |
|---|---|---|
| CF-01 | Criação/limpeza de worktrees | Proibida sem autorização específica |
| CF-02 | Instalações | Proibidas no escopo documental |
| CF-03 | Commits automáticos | Autorização delimitada; nenhuma permissão futura implícita |
| CF-04 | Continuação de tarefas | Lote explícito; sem propagação |
| CF-05 | Testes e instrumentação | Somente critérios documentais neste escopo |
| CF-06 | Revisão por agentes | Não equivale à aprovação independente competente |
| CF-07 | Escrita de documentos/arquivos | Limitada à autorização específica que criou esta proposta |
| CF-08 | Merge/limpeza de branches | Não autorizados |
| CF-09 | Custos/serviços externos | R$ 0 e privacidade como pré-condições |
| CF-10 | Soluções genéricas | Prevalência de decisões e arquitetura canônicas |

| ID | Risco SP-R | Tratamento documental |
|---|---|---|
| SP-R01 | Mutação automática | Bloquear sem escopo específico |
| SP-R02 | Substituir decisões | Preservar registro original |
| SP-R03 | Expor dados protegidos | Excluir categorias não autorizadas |
| SP-R04 | Custo inesperado | R$ 0 |
| SP-R05 | Homologação indevida | Separar evidência, teste e decisão |
| SP-R06 | Concorrência de agentes | Agentes paralelos bloqueados; isolamento futuro exigido |
| SP-R07 | T13 com fontes incompletas | HOLD |
| SP-R08 | Conformidade WCAG não validada | Sem homologação |
| SP-R09 | Proveniência Git | Verificar branch/SHA/worktree antes de intervenção |
| SP-R10 | Aplicação automática de revisão | Deliberação explícita necessária |

**SP-R06** relaciona-se a CF-04/CF-06/CF-08 e G-SP-02/05/06. **SP-R09** relaciona-se a CF-01/03/08 e G-SP-01/05/07.

### Errata SP08-E02 — proveniência de SP05-R08

**Origem principal correta de SP05-R08:** auditoria de rastreabilidade do SP-05, especificamente SP-R06, SP-R09 e preservação nominal versus literal. **SP05-A10** é somente referência relacionada à preservação decisória, não fundamento principal/exclusivo de SP05-R08. Esta errata corrige metadados de proveniência, **não modifica controles técnicos ou concede decisão nova**.

## 10. Integridade histórica, T13 e bloqueios

A documentação histórica SP-02, SP-02a e SP-02b e os patches SP03-P01–P10, SP05-R01–R08 e SP08-E01/E02 permanecem **registros preservados**. O conteúdo deste arquivo é uma consolidação proposta em branch isolada; não implica que as redações anteriores tenham sido ratificadas ou aplicadas em produção.

O piloto **T13 da PR #862 não foi executado**. Fontes documentais históricas ainda não integralmente reconciliadas:

- AA-PR862-T13-SPEC-CONSOLIDADA-V02-2026-11-12
- AA-PR862-T13-GATE-DOCUMENTAL-V01-2026-11-12
- AA-PR862-T13-SPEC-V02A-AJUSTES-NAO-APLICADOS-2026-11-12

Preservar os identificadores **C-D01–05; RF-01–10; SEC-01–12; AC-T01–05; G-T13-01–09; T13-01–26; AC-SPT13-01–10; CV-SP04-01–15; CV-SP06-01–12; SP04-B01–B10; SP06-B01–B12**. Sua citação não comprova preservação literal integral de fontes indisponíveis.

**SP07-H01: HOLD MANTIDO**, abrangendo **CV-SP06-12, CV-SP04-10 e CV-SP04-13** até fonte legítima, integral e suficiente. Não reconstruir conteúdo ausente nem reabrir gates sem fato novo.

Bloqueios externos de segurança, backup/recuperação, governança, privacidade, acessibilidade e assets oficiais permanecem independentes desta política. **Publicação estudantil continua DRAFT/NO-GO.**

## 11. Controle de mudanças e critérios de verificação

Esta proposta foi preparada para **uma nova branch isolada e um único arquivo documental**, sem alterar planos, ledger, código, testes, workflows, dependências, configuração ou `main`.

Antes de eventual adoção: decisão expressa sobre a política e as erratas; revisão da integridade documental; confirmação das permissões e custos; revisão de dados e segurança; gates canônicos satisfeitos na extensão apropriada. Nenhum desses atos é presumido.

**Aceite documental futuro exige:** fonte e versão identificadas; manutenção das 15 classes sem duplicação; DOC-01–08, AUT-01–11, PRIV-01–12, PROV-01–09, TEST-01–10 coerentes; erratas SP08-E01/E02 rastreáveis; HOLD mantido onde faltam fontes; nenhum GO técnico ou de publicação deduzido.

**Critérios de interrupção:** autorização insuficiente, custos desconhecidos ou pagos, dados protegidos, estado Git não reconciliado antes de intervenção, conflitos com baseline, necessidade de instalar/rodar/implementar/publicar ou tentativa de converter proposta em decisão.

### Referências de governança

- AA-SUPERPOWERS-EVAL-V01-2026-11-12
- AA-SUPERPOWERS-SP02-GATE-DOCUMENTAL-V01-2026-11-12
- AA-SUPERPOWERS-SP03-REVISAO-INDEPENDENTE-V01-2026-11-12
- AA-SUPERPOWERS-SP04-SANEAMENTO-SP02A-NAO-APLICADO-V01-2026-11-12
- AA-SUPERPOWERS-SP05-GATE-INDEPENDENTE-CONSISTENCIA-V01-2026-11-12
- AA-SUPERPOWERS-SP06-SANEAMENTO-SP02B-NAO-APLICADO-V01-2026-11-12
- AA-SUPERPOWERS-SP07-GATE-ACEITE-DOCUMENTAL-V01-2026-11-13
- AA-SUPERPOWERS-SP08-ERRATA-LIMITADA-HOLD-V01-2026-11-13
- docs/architecture/AA-ARCHITECTURE-1.0.md (arquitetura operacional canônica)

**Última evidência disponível antes desta alteração:** `main` no SHA `28014dd3acc147ec00dbf36e023fd2316a2c4221`. A presente política é **não ratificada, sem implantação, sem testes e sem autorização de merge/deploy**.
