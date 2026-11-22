/* Découpage d'une suite lente en morceaux parallèles (factory, phase 1).
   Une suite qui commence par `// @shards N` est lancée N fois par
   test/tools/run.js, avec TEST_SHARD=k/N. `inShard(liste)` garde un élément
   sur N : chaque morceau joue sa part de la grande boucle, et tout le reste
   de la suite tourne dans chaque morceau. Lancée seule, sans TEST_SHARD,
   une suite fait tout (morceau 0/1). */
const [k, n] = (process.env.TEST_SHARD || '0/1').split('/').map(Number);
const inShard = (list) => list.filter((_, i) => i % n === k);
module.exports = { inShard, shard: { k, n } };
