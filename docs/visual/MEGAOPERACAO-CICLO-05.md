# Academia Arcana — Megaoperação, Ciclo 05

Status: **PARCIAL / PR em revisão**. Data: 2026-10-09.

## Implementado na branch do PR #583
- Contrato experimental `src/application/teaching/list-classrooms-draft.ts` para Professor → Turmas. Negação por padrão, verificação de contexto, filtragem de registros por recurso, sem adapter de dados instalado.
- Testes do contrato cobrindo ausência de identidade, ausência de política, escopo incompatível, recursos não autorizados e falhas do adapter.
- Interface demonstrativa `/design-system/portais/professor/turmas` com dados fictícios, pesquisa e filtros locais, estado vazio e layout mobile.
- Proteção da rota de demonstração por sessão autenticada, com testes.
- Instalador `scripts/install-flonts-assets.mjs`, somente leitura por padrão; `--apply` copia apenas arquivos aprovados pelo SHA-256.
- O componente único `FlontsPortrait` e a miniatura 96×120 já presentes no PR continuam como referências fixas.

## Evidência local dos arquivos
- Os cinco arquivos oficiais do manifesto foram conferidos por SHA-256.
- Dry-run, aplicação isolada, reexecução idempotente e verificação `--strict` passaram em diretório temporário.
- Adulteração simulada do WebP 320×400 foi rejeitada.
- **Apenas a miniatura 96×120 está integrada ao GitHub**. Os outros quatro binários integram o pacote local e estão pendentes de envio ao repositório.
- Inventário físico local encontrado: 24 mockups PNG/WebP em pastas do Professor e do ciclo visual anterior. Não equivale a um inventário global completo e não prova fidelidade visual individual.

## Governança
- Código Next.js; não adicionar Elementor, ACF ou Custom Post Types do WordPress.
- Sem permissões fictícias: política de autorização e vínculo docente aprovados continuam pré-requisitos para rotas reais de Professor.
- Protótipos não leem dados acadêmicos reais nem disponibilizam operações de escrita.
- Sem merge, deploy, alteração de segredos, mudanças no plano Free ou em serviços publicados.

## Próximos bloqueios
1. Upload dos quatro binários maiores do Flonts à mesma branch, verificação `--strict` no checkout real e revisão de PR.
2. Comparação das ilustrações antigas com a fonte artística aprovada e substituições somente após validação de identidade.
3. Política canônica de vínculos docente–turma, backend com RLS e testes de revogação/cross-account.
4. Implementação da rota real de Turmas com leitura autorizada após contratação dos contratos funcionais.
5. Demais páginas, states, mobile, eventos e temas completos conforme mapa de cobertura.
6. Reexecutar Quality Gate após qualquer novo commit, antes de considerar o ciclo aprovado tecnicamente.
