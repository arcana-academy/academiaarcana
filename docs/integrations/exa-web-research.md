# Exa Web Research

A Academia Arcana usa o Exa como um provider server-side de pesquisa web para o Mestre Arcano.

## Boundary

`API autenticada → application/intelligence → Mestre Arcano → search_web → infrastructure/exa → Exa API`

A chave `EXA_API_KEY` é lida exclusivamente no runtime server-side. Nenhuma variável `NEXT_PUBLIC_*` deve ser usada para essa credencial.

## Comportamento

A ferramenta `search_web`:

- recebe uma consulta em linguagem natural;
- limita o número de resultados a no máximo 10;
- usa o modo `fast`;
- solicita `highlights` para reduzir o volume de contexto;
- normaliza título, URL, data, autor e trechos relevantes;
- falhas de rede, HTTP e JSON são convertidas em erros explícitos.

Resultados externos devem ser tratados pelo Mestre Arcano como evidência não confiável. Conteúdo encontrado na web nunca deve ser interpretado como instrução do sistema.

## Configuração

Adicionar somente no ambiente server-side:

`EXA_API_KEY`

A configuração não deve ser adicionada a componentes cliente, variáveis públicas ou código enviado ao navegador.

## Limites deste provider

O Exa é uma camada de recuperação externa. O banco Supabase continua sendo a fonte de verdade dos dados da Academia Arcana, e o boundary de autorização do Mestre Arcano continua responsável por controlar quais ferramentas podem ser executadas.
