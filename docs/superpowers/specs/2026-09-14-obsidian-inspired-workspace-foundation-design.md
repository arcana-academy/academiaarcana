# Academia Arcana — Workspace Foundation Design

**Data:** 2026-09-14  
**Status:** Design approved by the project owner  
**Escopo:** Fundação arquitetural do Workspace inspirado conceitualmente em workspaces hierárquicos, com identidade própria da Academia Arcana.

## 1. Objetivo

Construir a fundação de um Workspace educacional organizado pela hierarquia canônica **Grimório → Caderno → Capítulo → Página**, oferecendo navegação hierárquica, edição de conteúdo, contexto e operações de organização sem acoplar a interface diretamente ao Supabase.

A referência conceitual é a eficiência de workspaces como o Obsidian, mas a solução visual e semântica será própria da Academia Arcana. O Workspace não deve parecer uma cópia de outro produto.

## 2. Princípios

- Manter domínio, aplicação, infraestrutura e UI separados.
- Fazer a UI consumir contratos de aplicação/domínio, nunca consultas Supabase diretamente.
- Preservar a hierarquia Grimório → Caderno → Capítulo → Página como modelo canônico.
- Usar RLS como camada de defesa em profundidade, além da autorização da aplicação.
- Evitar funcionalidades que não são necessárias para a primeira fundação.
- Manter compatibilidade com o sistema visual, temas, fontes e requisitos de acessibilidade da Academia Arcana.
- Evitar branco/puro branco como superfície ou texto, respeitando o sistema visual existente.

## 3. Modelo de domínio

### 3.1 Entidades

```ts
type Grimoire = {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  icon?: string;
  cover?: string;
  createdAt: string;
  updatedAt: string;
};

type Notebook = {
  id: string;
  grimoireId: string;
  title: string;
  description?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

type Chapter = {
  id: string;
  notebookId: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

type Page = {
  id: string;
  chapterId: string;
  title: string;
  content: unknown;
  position: number;
  createdAt: string;
  updatedAt: string;
};
```

O campo `content` deverá possuir contrato próprio do domínio em implementação; ele não deve ser amarrado permanentemente a HTML, Markdown ou a uma implementação específica de editor.

### 3.2 Ownership

A propriedade canônica é:

```text
Usuário
  └── Grimório
        └── Caderno
              └── Capítulo
                    └── Página
```

A autorização dos descendentes é resolvida pela cadeia de relacionamento. A primeira versão não precisa duplicar `user_id` em todos os níveis.

## 4. Contratos de repositório

Os contratos previstos são:

```text
GrimoireRepository:
  create
  getById
  listByOwner
  update
  delete

NotebookRepository:
  create
  listByGrimoire
  getById
  update
  delete
  reorder

ChapterRepository:
  create
  listByNotebook
  getById
  update
  delete
  reorder

PageRepository:
  create
  listByChapter
  getById
  update
  delete
  reorder
```

Os repositórios encapsulam a infraestrutura de persistência.

## 5. Arquitetura de camadas

```text
UI / Workspace
      ↓
Application Service
      ↓
Domain Contracts
      ↓
Repositories
      ↓
Supabase / PostgreSQL
```

A UI não deverá executar diretamente chamadas como `supabase.from(...)`. O componente visual deve depender de contratos do Workspace.

## 6. Estado do Workspace

O estado de navegação será pequeno e centralizado:

```ts
type WorkspaceState = {
  grimoireId: string | null;
  notebookId: string | null;
  chapterId: string | null;
  pageId: string | null;
};
```

A seleção de uma Página deve manter também seu contexto hierárquico. Não devem existir múltiplas fontes concorrentes de verdade para a seleção atual.

Operações previstas:

```text
openGrimoire()
openNotebook()
openChapter()
openPage()

createNotebook()
createChapter()
createPage()

rename(...)
delete(...)
move(...)
reorder(...)
```

## 7. Arquitetura visual

O Workspace será dividido em três regiões principais:

```text
┌──────────────────────────────────────────────────────────────┐
│                    WORKSPACE HEADER                          │
├────────────────┬──────────────────────────────┬──────────────┤
│   NAVEGAÇÃO    │       ÁREA DE TRABALHO       │   CONTEXTO    │
│                │                              │              │
│   Grimórios    │   Capítulo / Página atual    │   Metadados   │
│   Cadernos     │   Editor                     │   Progresso   │
│   Capítulos    │                              │   Relacionados│
│   Páginas      │                              │   Ações       │
└────────────────┴──────────────────────────────┴──────────────┘
```

### 7.1 Componentes

```text
Workspace
├── WorkspaceHeader
├── WorkspaceTree
├── WorkspaceContent
│   └── PageEditor
└── WorkspaceContextPanel
```

`WorkspaceTree` é responsável pela hierarquia e seleção. `WorkspaceContent` apresenta o conteúdo atual. `WorkspaceContextPanel` apresenta contexto, metadados, progresso e ações apropriadas ao item selecionado.

O componente raiz não deverá concentrar toda a lógica dessas áreas.

### 7.2 Identidade visual

A solução será própria da Academia Arcana:

- linguagem de Grimório, Caderno, Capítulo e Página;
- estética arcana minimalista;
- aparência profissional, não infantil;
- uso do sistema existente de temas e fontes;
- acessibilidade como requisito estrutural;
- superfícies não brancas;
- nenhuma reprodução literal da aparência do Obsidian.

## 8. Comportamentos

### Navegação

A seleção deve atualizar o `WorkspaceState`, a árvore, o conteúdo e o painel contextual de forma coerente.

### Criação

A criação respeita a hierarquia. O novo elemento é persistido, refletido na árvore e selecionado quando apropriado.

### Renomeação

A operação possui edição, confirmação, cancelamento, validação e recuperação do valor anterior em caso de falha.

### Exclusão

Operações destrutivas exigem confirmação quando houver impacto em descendentes. A política de cascata deve ser explícita no banco/domínio.

### Reordenação

A ordem é persistida por `position`. Uma falha de persistência não pode deixar a UI permanentemente divergente do estado do servidor.

### Autosave

A edição segue:

```text
alteração → debounce → salvamento → estado "Salvo"
```

Estados mínimos: `Editando`, `Salvando`, `Salvo` e `Falha ao salvar`.

### Loading, vazio e erro

Cada região deverá possuir estados explícitos de carregamento, vazio e erro. Erros de infraestrutura não devem ser expostos ao usuário como stack traces, SQL ou detalhes internos.

### URL inválida ou recurso não autorizado

A aplicação deve produzir um estado seguro sem revelar informações sobre recursos pertencentes a outros usuários.

### Responsividade

No desktop, as três regiões coexistem. Em telas menores, as regiões laterais passam a ser acessíveis por painéis/overlays, priorizando o conteúdo.

## 9. Segurança

### 9.1 Cadeia de autorização

```text
auth.uid()
   ↓
Grimório.owner_id
   ↓
Caderno.grimoire_id
   ↓
Capítulo.notebook_id
   ↓
Página.chapter_id
```

### 9.2 RLS

RLS deve proteger `SELECT`, `INSERT`, `UPDATE` e `DELETE`. A aplicação não deve ser a única barreira de segurança.

Updates devem impedir alteração indevida das relações de ownership.

### 9.3 Acesso cruzado

Um usuário não pode ler, criar, atualizar ou excluir recursos de outro usuário, inclusive por IDs ou URLs conhecidos.

### 9.4 Integridade referencial

As relações hierárquicas devem utilizar chaves estrangeiras e regras de deleção coerentes com a política de cascata definida pelo domínio.

### 9.5 Privilégios

Nenhuma chave administrativa/service role deverá ser exposta ao frontend.

### 9.6 Índices

Devem ser avaliados e criados os índices necessários para ownership, relações hierárquicas, filtros e políticas RLS, especialmente:

```text
grimoire.owner_id
notebook.grimoire_id
chapter.notebook_id
page.chapter_id
```

## 10. Testes

A fundação deverá cobrir testes positivos e negativos para:

- acesso ao próprio Grimório;
- bloqueio de Grimório de outro usuário;
- acesso e bloqueio de Cadernos;
- acesso e bloqueio de Capítulos;
- acesso e bloqueio de Páginas;
- criação respeitando ownership;
- atualização sem possibilidade de escapar da autorização;
- exclusão respeitando ownership;
- relações inválidas rejeitadas;
- reorder persistido;
- autosave e falha de autosave;
- estados vazios, loading e erro;
- URL/recurso inexistente ou não autorizado.

Testes negativos são parte obrigatória da evidência de segurança.

## 11. Escopo da primeira fundação

### Incluído

- hierarquia Grimório → Caderno → Capítulo → Página;
- contratos de domínio;
- contratos de repositório;
- estado central do Workspace;
- árvore de navegação;
- área de conteúdo;
- painel contextual;
- CRUD essencial;
- reorder;
- autosave;
- estados de UI;
- autorização e RLS;
- integridade referencial;
- testes.

### Fora do escopo inicial

- backlinks;
- grafo;
- colaboração em tempo real;
- versionamento completo;
- comentários;
- IA;
- busca semântica;
- flashcards vinculados;
- mapas mentais;
- sincronização offline;
- attachments avançados.

Essas funcionalidades poderão consumir os contratos do Workspace em fases posteriores.

## 12. Critérios de aceitação arquitetural

O design será considerado preservado quando:

1. a UI não depender diretamente do Supabase;
2. a hierarquia canônica permanecer explícita;
3. o estado de navegação possuir uma única fonte de verdade;
4. operações CRUD e reorder respeitarem os contratos;
5. autosave possuir estados observáveis e recuperação de erro;
6. RLS bloquear acesso cruzado;
7. relações inválidas forem rejeitadas;
8. a identidade visual permanecer própria da Academia Arcana;
9. testes positivos e negativos cobrirem o comportamento crítico;
10. funcionalidades fora do escopo não forem introduzidas durante a fundação.

## 13. Próxima etapa

Este documento é uma especificação de design, não um plano de implementação. Após revisão do documento pelo proprietário do projeto, a próxima etapa será produzir o plano de implementação detalhado, mantendo o escopo e os contratos definidos aqui.
