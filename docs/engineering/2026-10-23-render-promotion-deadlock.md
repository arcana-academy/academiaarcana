# Render promotion deadlock — 2026-10-23

## Sintoma

Depois do merge do #799 (`b808779`), o _Production Smoke_ do `main` falhou em
**Check health endpoint** e a produção continuou servindo `d305ae4` por mais de
40 minutos.

Evidência coletada:

- `GET https://academiaarcana.onrender.com/api/health` respondeu
  `{"status":"ok","service":"academiaarcana","revision":"d305ae483d14cbdc54bccd2298904c06c7406f88"}`
  em todas as tentativas, mesmo 40 minutos depois do merge.
- Run `40022982919`: `Check production alias` passou em 31 s; `Check health
  endpoint` esgotou as 30 tentativas (5 min) e falhou às 21:01:32 UTC.
- O status do Render estava **operacional** na janela (o incidente de rede de
  16:05–17:34 UTC já havia sido resolvido antes do merge, às 20:47 UTC).

## Causa

O Blueprint declarava `autoDeployTrigger: checksPass`. Nesse modo o Render só
publica o commit quando **todos** os checks detectados estiverem aprovados
(`success`, `neutral` ou `skipped`); qualquer check vermelho ou pendente retém o
deploy.

O _Production Smoke_ é, por definição, pós-deploy: o workflow falha quando
`revision` na produção é diferente do SHA mergeado. Logo:

```text
deploy depende de Production Smoke verde
Production Smoke verde depende do deploy
```

Circularidade. Enquanto o smoke estava pendente, o Render esperou; quando o
smoke falhou, o Render passou a **não publicar aquele commit de forma alguma** —
só um commit novo destravaria o serviço.

Esse comportamento já era o risco registrado no issue #497, encerrado por "não
reprodução". A não reprodução anterior não era estrutural: o deploy e o smoke
disputavam a mesma janela, e o Render costumava avaliar o conjunto de checks
antes de o smoke concluir. Quando o build passou a demorar mais que essa janela,
a circularidade apareceu. A produção do `d305ae4` veio da sincronização do
Blueprint (que publica imediatamente), não de uma promoção por `checksPass` —
por isso o problema passou despercebido naquele merge.

## Correção

`render.yaml` passa a usar:

```yaml
autoDeployTrigger: commit
```

Isso está alinhado com o que a arquitetura já declara em §25.6
(`docs/architecture/AA-ARCHITECTURE-1.0.md`): o Production Smoke é evidência
sobre o runtime publicado, **não** entrada da mesma decisão de promoção.

O gate de qualidade continua garantido antes da promoção, porque `main` só
recebe commits por pull request com o _Quality Gate_ verde. O smoke permanece
como verificação pós-deploy e continua vermelho na interface quando a produção
serve uma revisão diferente da esperada — ele apenas não bloqueia mais o próprio
deploy que precisa acontecer.

Também foi adicionado um teste de contrato
(`tests/infrastructure/delivery-contract.test.ts`, "keeps production promotion
independent from the post-deploy smoke") que falha se `checksPass` voltar ao
Blueprint.

## Efeito colateral operacional

Alterar `render.yaml` dispara a sincronização automática do Blueprint, que
publica o commit imediatamente, independente do trigger configurado. Esse é o
caminho que destrava o `b808779` e qualquer commit posterior sem intervenção
manual no painel.

## O que continua valendo do #497

- Um único mecanismo de CD: o Render segue promovendo sozinho; não há deploy
  hook, imagem privada nem segundo caminho.
- O smoke segue obrigatório como evidência pós-deploy, e continua comparando a
  revisão servida com o SHA esperado.
