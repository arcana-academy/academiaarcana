# C105 — recortes visuais aprovados: custódia e integração

Os dois arquivos WebP foram produzidos a partir das imagens aprovadas pela proprietária e estão disponíveis no pacote de arte C105, **fora do repositório até transferência binária autorizada**.

| Caminho de destino no checkout isolado | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/assets/approved/aa-login-library-c105.webp` | 140894 | `14aae6816718b6d17dd736ab17616d5ba4ee1fb7ffc599b972f5600b14cc9551` |
| `public/assets/approved/aa-sanctuary-library-c105.webp` | 98102 | `7fc277f4c9321af6e3cb8ee7cc330f0c81276cff3178816f12d814e8af873fec` |

**Integridade:** nunca inventar, redesenhar, recomprimir ou substituir Flonts ou outro ativo canônico. Os recortes WebP são fundos decorativos; devem ter `aria-hidden` ou CSS background, nunca conter texto de interface nem carregar dados do estudante.

**Gate de integração:** o conector GitHub desta execução aceita atualizações de texto e blobs textuais, mas não transportou os bytes dos WebP disponíveis no ambiente de anexos. Portanto, estes caminhos **não devem ser ativados no CSS** enquanto os binários não constarem e seus SHA-256 não corresponderem. Manter o SVG institucional já comitado como fallback íntegro, sem 404.

Uma vez transferidos por operador autorizado para esta branch ou checkout isolado, a substituição controlada consiste apenas em mudar as URLs decorativas no CSS de:
- `/arcana/arcana-hero.svg` (login) para `/assets/approved/aa-login-library-c105.webp`.
- `/arcana/arcana-hero.svg` (Santuário) para `/assets/approved/aa-sanctuary-library-c105.webp`.

**Critérios de aprovação:** Git SHA exato; ausência de 404 e reflows; screenshots Chromium 1440×900 e 390×844; navegação por teclado; contraste e texto alternativo quando informativo; dados exclusivamente sintéticos; produção intacta. Não testar contas reais ou criar novas credenciais.

**NO-GO:** sem merge, deploy, GHCR, upload público, publicação, alteração de segredos, RLS ou assets canônicos. A prova sintética nunca deve ser promovida a produção.
