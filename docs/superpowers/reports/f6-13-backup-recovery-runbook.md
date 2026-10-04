# F6.13 — Runbook de backup e recuperação

**Base:** `main` no commit `2e2aa683f79f88333e8866e7dd82c236b5fd1e50`  
**Escopo:** estabelecer uma estratégia operacional verificável para backup, retenção, restore, validação e recuperação da Academia Arcana.

> Regra de segurança: nenhum dump de produção, senha, connection string, service-role key ou outro segredo pode ser versionado no repositório, publicado em artifacts públicos ou enviado para issues/PRs.

## 1. Estado observado

A infraestrutura Supabase atualmente observada para a Academia Arcana está **ACTIVE_HEALTHY**, em PostgreSQL 17.6.1, na região `us-west-2`, e a organização está no **Free Plan**.

O banco expõe atualmente estas tabelas de domínio no schema `public`:

- `grimoires`
- `notebooks`
- `chapters`
- `pages`

Todas as quatro estão com RLS habilitado.

A listagem de migrations do projeto remoto retornou somente `20260915181306 / remote_schema`. O repositório possui histórico de migrations adicional; essa diferença deve ser reconciliada antes de tratar um restore como operacionalmente concluído.

## 2. Política de backup

### 2.1 Banco de dados

No Free Plan, não há backup automático diário disponível como capacidade contratada do projeto. A documentação atual do Supabase recomenda que projetos Free façam exports regulares usando `supabase db dump` e mantenham os backups **off-site**.

A estratégia da Academia Arcana será:

1. gerar backup lógico fora do repositório;
2. separar roles, schema e data;
3. armazenar os arquivos em local privado e externo ao GitHub;
4. aplicar retenção definida pelo responsável operacional;
5. registrar data, origem, versão do Postgres e checksum;
6. executar restore de teste periodicamente;
7. registrar o resultado do teste de recuperação.

Referência oficial:
https://supabase.com/docs/guides/platform/backups

## 3. Procedimento de backup

O dump deve ser executado a partir de um ambiente operacional autorizado, usando uma connection string obtida de forma segura.

Comandos de referência:

```bash
supabase db dump --db-url "$SUPABASE_DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$SUPABASE_DB_URL" -f schema.sql
supabase db dump --db-url "$SUPABASE_DB_URL" -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
```

Os arquivos gerados devem permanecer fora do repositório Git e fora de qualquer canal público.

A documentação oficial do Supabase descreve esse fluxo para backup lógico:
https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore

## 3.1 Rota Free-first (sem contratar PITR)

Quando a infraestrutura principal não disponibilizar uma cópia restaurável diretamente no plano atual, a primeira alternativa deve ser uma rota sem custo adicional de plataforma:

1. executar o export lógico com a Supabase CLI (db dump) a partir de um ambiente autorizado;
2. gerar checksum dos arquivos e, antes de qualquer armazenamento externo, empacotar e criptografar o dump com uma chave mantida fora do repositório;
3. manter a cópia final em armazenamento externo privado. O Dropbox Basic é uma opção disponível para esse propósito, com 2 GB gratuitos; a pasta deve permanecer privada e não deve ser usada como destino de dados em texto aberto;
4. registrar a data, origem, versão do PostgreSQL, tamanho e checksum sem registrar a connection string ou a chave de criptografia;
5. realizar o restore de teste em ambiente isolado.

Para repositórios públicos, não usar artefatos do GitHub Actions como armazenamento de dump em texto aberto. Quando Actions for usado somente como executor, o arquivo precisa estar criptografado antes de qualquer upload intermediário, e a cópia operacional final deve permanecer em armazenamento privado.

A documentação atual do Supabase recomenda o uso do db dump para projetos Free, e o fluxo continua independente de PITR. A capacidade de backup/restore somente pode mudar para VERIFICADA depois da execução real e do teste de restauração.

Fallback adicional: caso seja necessário um banco PostgreSQL temporário para validar schema, dados, índices e policies sem contratar infraestrutura Supabase, uma instância Free de outro provedor PostgreSQL pode servir como laboratório técnico. Isso não substitui um restore completo do ecossistema Supabase, porque Auth, Storage, configurações gerenciadas e chaves de criptografia exigem validação separada.

## 4. Storage

Backups do banco não são suficientes para recuperar objetos armazenados via Supabase Storage: o banco mantém os metadados dos objetos, não os arquivos em si.

Portanto, caso buckets de Storage sejam utilizados pela aplicação, o plano de recuperação deve possuir uma etapa independente para:

- inventariar buckets;
- exportar os objetos;
- preservar caminhos e metadados necessários;
- armazenar os objetos em destino privado separado;
- testar a restauração de uma amostra representativa.

Referência:
https://supabase.com/docs/guides/platform/backups

## 5. Restore

### 5.1 Restore lógico

O restore de teste deve ocorrer em um projeto Supabase separado da produção.

Sequência:

```text
Backup privado
   ↓
Provisionar projeto de recuperação
   ↓
Configurar extensões / settings necessários
   ↓
Restaurar roles
   ↓
Restaurar schema
   ↓
Restaurar data
   ↓
Recriar configurações externas
   ↓
Validar integridade
   ↓
Executar smoke tests
   ↓
Registrar evidência
```

Para restauração manual, o Supabase documenta `psql` com `--single-transaction` e `ON_ERROR_STOP=1` para o processo lógico.

### 5.2 Restore da plataforma

Backups físicos e PITR são capacidades distintas do export lógico. PITR é uma capacidade de planos pagos/add-on e não deve ser considerada disponível no projeto atual sem alteração de plano e confirmação no Dashboard.

Quando disponível, a restauração da plataforma deixa o projeto inacessível durante o processo; o downtime deve ser incluído no procedimento de recuperação.

## 6. Validação pós-restore

Um restore somente pode ser considerado **bem-sucedido** quando houver evidência de:

### Dados

- tabelas esperadas presentes;
- contagens de linhas coerentes com a origem;
- chaves primárias e estrangeiras válidas;
- índices necessários presentes;
- RLS habilitado;
- policies esperadas presentes.

### Aplicação

- autenticação funcionando;
- leitura do Workspace funcionando;
- criação/edição de grimórios, notebooks, capítulos e páginas funcionando;
- ordenação de páginas funcionando;
- Santuário autenticado carregando corretamente.

### Infraestrutura

- migrations reconciliadas;
- extensões/configurações externas reconstituídas;
- Storage restaurado quando aplicável;
- variáveis de ambiente configuradas;
- smoke tests passando.

## 7. RPO / RTO

Até existir medição operacional, estes valores permanecem **PENDENTES**.

O responsável pelo produto deve estabelecer pelo menos:

| Classe | Recurso | RPO alvo | RTO alvo | Evidência |
| --- | --- | --- | --- | --- |
| Crítico | Dados do Workspace | A definir | A definir | Teste de restore |
| Alto | Auth/configuração | A definir | A definir | Teste funcional |
| Alto | Storage | A definir | A definir | Teste de restauração |
| Médio | Analytics/telemetria | A definir | A definir | Reconfiguração |

Não atribuir números fictícios ao sistema apenas para preencher a matriz.

## 8. Frequência mínima recomendada

A política operacional deve definir uma cadência que seja executável e auditável. Para a fase atual:

- backup lógico: periodicidade definida pelo responsável antes de entrar em produção com dados relevantes;
- restore de teste: periódico e registrado;
- revisão de retenção: periódico;
- revisão de credenciais: após qualquer incidente, troca de operador ou alteração de infraestrutura;
- teste de recuperação completa: antes de declarar a capacidade de recuperação como operacionalmente pronta.

## 9. Segurança

Nunca:

- salvar dumps em `public/`;
- fazer commit de `roles.sql`, `schema.sql` ou `data.sql` de produção;
- colocar connection strings em issues, PRs ou logs;
- colocar service-role keys em `NEXT_PUBLIC_*`;
- publicar artifacts contendo dados reais;
- usar backup de produção como fixture de testes sem sanitização.

O backup deve ser tratado como dado sensível e receber controle de acesso equivalente ou superior ao banco de origem.

## 10. Critério de fechamento da F6.13

A issue somente deve ser marcada como operacionalmente concluída quando houver evidência externa verificável de:

- backup realizado;
- destino privado de armazenamento;
- retenção definida;
- checksum/integridade registrada;
- restore concluído em ambiente de recuperação;
- validação de schema e dados;
- validação do comportamento da aplicação;
- RPO definido;
- RTO definido;
- responsável operacional identificado;
- resultado do teste de recuperação registrado.

Até que esses itens existam, o estado correto é **PENDENTE**, mesmo que o procedimento esteja documentado.

## 11. Evidência técnica atual

O projeto Supabase está saudável no momento da inspeção e as tabelas de domínio possuem RLS ativo. Os advisors de segurança não retornaram findings; o advisor de performance retornou somente avisos informativos de índices ainda não utilizados, compatíveis com um banco com baixa atividade atual.

Esses fatos não equivalem a evidência de backup restaurável. Backup e recuperação continuam dependendo de execução operacional fora do código.

**Conclusão:** esta entrega estabelece o contrato e o runbook de F6.13 sem criar uma falsa sensação de recuperação. A capacidade de restore permanece pendente até que um teste real, controlado e registrado seja executado.
