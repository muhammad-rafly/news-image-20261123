# The World Today — Monday 23 November 2026

[![make.fun bounty](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/muhammad-rafly/news-image-20261123/rank.svg)](https://make.fun/bounty/news-image-20261123/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/muhammad-rafly/news-image-20261123/reward.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)

A one-image newspaper front page summing up the world's news of **Monday 23 November 2026**, drawn entirely by `main.ts` with the Node standard library — no assets, no network, no randomness.

## The day's stories

- **Nvidia brings Huang back** — Nvidia reinstated Jensen Huang as CEO 11 days after he resigned; shares jumped about 33% as the S&P 500 rose 4.82% in a sharp rebound after last week's AI sell-off, and SK Hynix soared 20%.
- **Ukraine strikes Russia in Libya** — Ukrainian sea drones struck Russian ships in the Libyan port of Benghazi; President Zelenskyy says the corvette Merkury was sunk by seven naval drones.
- **COP31 ends with no deal** — UN climate talks in Antalya, Turkey ended without an overall agreement after divisions over fossil fuels and money; the longest UN climate conference in history.
- **GTA VI: 45M copies in one weekend** — analysts estimate 44.9 million copies sold through launch weekend (33.7 million on PS5, 11.2 million on Xbox), with revenue over $4 billion.
- **In brief** — Trump calls Putin "my friend" after the Xi summit; Democrats win their biggest House majority since 1992; the EU proposes a 22nd sanctions package on Russia; "El Chapo Isidro" captured in Sinaloa; a Russian strike on a Dymer flat kills at least 11; Iran vows to counter the US blockade and says it downed a US drone.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` (1024×1024, under 1 MiB). Running it twice produces byte-identical output.
