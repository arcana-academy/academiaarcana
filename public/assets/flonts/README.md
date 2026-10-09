# AA-ASSET-013 — Flonts: ilustração-base aprovada

**Status:** PROPOSTO PARA INTEGRAÇÃO / arquivo binário ainda ausente da branch

## Phase 2 metadata

- **Graphic role:** personagem ilustrado canônico aprovado para utilização contextual
- **Consumer status:** ACTIVE NA BRANCH DE REVISÃO para miniatura da sidebar; arquivo mestre e variantes grandes ainda PENDING
- **Theme behavior:** manter o mesmo bitmap entre temas, sem recolorir, deformar ou redesenhar a aparência física
- **Originality/source status:** ilustração fornecida e aprovada pela pessoa proprietária na conversa; os arquivos derivados WebP e a imagem original estão no pacote local, ainda não integrados como binários ao repositório

# Flonts — arte oficial aprovada

A identidade visual oficial é **somente** a ilustração aprovada pela pessoa proprietária.
A referência foi enviada como imagem nesta conversa. Não criar, trocar ou substituir
Flonts por um gato parecido. O gerador de layouts **não** deve redesenhar Flonts.

## Miniatura já integrada à branch
- `flonts-mago-mini-96.webp` (96 × 120) — imagem derivada do arquivo aprovado, SHA-256 verificado; arquivo no PR de revisão, ainda não publicado.

## Arquivos a integrar após revisão
- `flonts-mago-original-aprovado.png` (1122 × 1402) — master sem alteração;
- `flonts-mago-960.webp` (960 × 1200) — detalhe/hero;
- `flonts-mago-480.webp` (480 × 600) — cards;
- `flonts-mago-320.webp` (320 × 400) — miniaturas.

Todos os arquivos estão no pacote de entrega da megaoperação. A presença deste
README **não significa que a imagem binária já foi publicada no repositório**.

## Regras
- Manter master e hashes SHA-256 do manifesto do pacote.
- Reutilizar o mesmo arquivo binário; nunca regenerar a cabeça, olhos, focinho ou
  manchas do Flonts por imagem generativa em cada página.
- Preservar proporção; em molduras usar `object-fit: contain` quando o personagem
  inteiro precisar aparecer; `cover` somente com recortes intencionais aprovados.
- Nenhuma transformação antropomórfica ou mudança de pelagem.
- Testar alt text, responsividade, contraste e desempenho no navegador.
