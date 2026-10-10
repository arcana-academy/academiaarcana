# AA-MESTRE-ARCANO — Baseline e Prontidão para MDE / Não-Inferioridade

> Data: 2026-10-10
>
> Escopo: planejamento estatístico de AA-MA-EVAL-001/002.
>
> Regra: este documento **não autoriza coleta, randomização ou persistência nova**.

## 1. Decisão que o baseline deve suportar

O experimento precisa responder se ajuda graduada/metacognitiva:

1. preserva ou melhora aprendizagem posterior **sem assistência**;
2. reduz offloading/resposta completa como mecanismo secundário;
3. não aumenta abandono de forma material;
4. não reduz autonomia.

A decisão estatística principal deve se apoiar em aprendizagem independente, não em engajamento.

## 2. Fonte de outcome disponível

O contrato P1.5 oferece uma primeira medida objetiva limitada:

- evidence type: `criterion-referenced`;
- scoring: `normalized-exact-match`;
- criterion result: `pass | fail`;
- criterion version;
- scope: `practice-item`;
- minimum evidence configurável.

Para o primeiro experimento, o outcome primário mais simples e auditável é **pass/fail em avaliação criterion-referenced posterior e sem assistência**.

## 3. Estado empírico atual

Consulta agregada read-only ao Supabase atual em 2026-10-10:

| Medida | Valor |
|---|---:|
| educational_practice_items | 0 |
| total attempts | 0 |
| criterion-referenced attempts | 0 |
| self-assessment attempts | 0 |
| learners com attempts | 0 |
| pass rate criterion-referenced | não estimável |
| média de evidence_score | não estimável |
| SD de evidence_score | não estimável |

**Conclusão:** não existe baseline interno observacional para estimar `p0`, variância, ICC, attrition ou distribuição por item.

Não usar fixtures/testes como se fossem dados de usuários.

## 4. Parâmetros necessários antes do cálculo final

### 4.1 Para outcome binário pass/fail

Precisamos de:

- `p0`: taxa de aprovação no controle/baseline;
- número de estudantes elegíveis;
- número de itens por estudante;
- distribuição por item/dificuldade;
- repetição por estudante;
- ICC ou outra medida de dependência, se houver múltiplas observações por estudante/item;
- taxa de missingness entre elegibilidade e avaliação posterior.

### 4.2 Para outcome contínuo

Se `evidence_score` for usado como secundário:

- média;
- desvio-padrão;
- range/distribuição;
- relação com `criterion_result`;
- estabilidade por item/dificuldade.

Com V1 exact-match, o outcome binário é mais diretamente interpretável e deve ser preferido como primário até existir justificativa melhor.

## 5. MDE — diferença mínima detectável

Para dois braços com alocação igual e outcome binário, uma aproximação de planejamento, quando `pT ≈ pC = p0`, é:

`n_por_braco ≈ 2 × (z_(1-α/2) + z_(1-β))² × p0 × (1-p0) / δ²`

onde:

- `δ` = diferença absoluta mínima que o experimento deve detectar;
- `α` = erro tipo I;
- `1-β` = poder.

**Hoje o cálculo numérico não é válido porque `p0` é desconhecido.**

Se houver repetição/cluster por estudante ou item, a amostra deve ser ajustada pelo desenho, por exemplo com design effect aproximado:

`DE = 1 + (m - 1) × ICC`

quando essa aproximação for apropriada ao desenho final.

## 6. Não-inferioridade

Se a pergunta for “a variante reduz offloading sem piorar aprendizagem independente além de um limite aceitável”, a hipótese de não-inferioridade deve usar uma margem `ΔNI`.

Uma aproximação de planejamento, sob taxas esperadas semelhantes, usa:

`n_por_braco ≈ 2 × (z_(1-α) + z_(1-β))² × p0 × (1-p0) / ΔNI²`

com teste unilateral.

### Regra de produto para a margem

`ΔNI` **não deve ser escolhido apenas porque gera uma amostra conveniente**.

A margem deve representar a maior perda absoluta em aprendizagem independente que Produto + Learning/Education considerariam pedagogicamente tolerável em troca do benefício do mecanismo.

A definição precisa ser fechada **antes** dos resultados.

## 7. Escolha entre superioridade e não-inferioridade

### AA-MA-EVAL-001 — ajuda graduada

Estratégia recomendada:

- primário: não-inferioridade em aprendizagem sem assistência;
- mecanismo: redução de resposta direta/offloading como secundário;
- promoção exige não-inferioridade + benefício no mecanismo ou aprendizagem.

### AA-MA-EVAL-002 — feedback metacognitivo

Mesma estrutura é adequada enquanto a prioridade for reduzir offloading sem sacrificar aprendizagem.

Uma hipótese de superioridade em aprendizagem só deve virar primária se o produto declarar explicitamente que esse é o benefício necessário.

## 8. Baseline que pode ser calculado sem nova telemetria

Quando existirem dados ordinários de uso do fluxo P1.5, uma query agregada read-only pode estimar:

- número de learners;
- número de criterion-referenced attempts;
- pass rate;
- média/SD de evidence_score;
- distribuição por item e dificuldade;
- repetição por learner/item.

Não é necessário persistir texto de prompt/resposta do Mestre Arcano para isso.

## 9. Baseline que NÃO existe no schema atual

Sem instrumentação experimental não conseguimos estimar de forma válida:

- taxa de resposta direta após um nudge;
- offloading por nível de ajuda;
- exposição a uma variante;
- attrition entre episódio do Mestre Arcano e avaliação posterior;
- contaminação entre braços;
- assistência durante a avaliação posterior.

Esses itens não devem ser reconstruídos a posteriori por classificação de texto livre.

## 10. Gate para calcular MDE/NI numericamente

Só calcular números finais quando:

1. houver observações criterion-referenced reais;
2. houver variação suficiente para estimar `p0`/variância;
3. a unidade de randomização estiver definida;
4. a estrutura de repetição/cluster estiver conhecida;
5. Produto + Learning/Education definirem a perda pedagogicamente tolerável para NI;
6. `α`, poder e regra de multiplicidade estiverem pré-especificados;
7. a janela de outcome estiver congelada.

Até lá, qualquer sample size numérico deve ser rotulado apenas como cenário hipotético, não como plano aprovado.

## 11. O que está fechado agora

- outcome primário candidato: pass/fail criterion-referenced posterior e sem assistência;
- baseline interno atual: vazio;
- MDE numérico: **NÃO ESTIMÁVEL**;
- margem NI numérica: **NÃO DEFINIDA**;
- fórmula/inputs necessários: **DEFINIDOS**;
- persistência nova: **NÃO AUTORIZADA**;
- randomização/coleta: **NÃO AUTORIZADAS**.

## 12. Próximo gatilho

O próximo cálculo quantitativo só deve ocorrer quando houver baseline ordinário não experimental suficiente para estimar `p0` e estrutura de dependência, ou quando Produto/Learning definirem uma margem pedagógica explícita para uma análise de sensibilidade.

Efeitos publicados em pesquisas externas podem informar cenários de sensibilidade, mas **não substituem o baseline interno** e não devem reabrir decisões canônicas por si sós.
