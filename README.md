# The World Today — Monday 23 November 2026

[![make.fun · news-image-20261123](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/muhammad-rafly/news-image-20261123/rank.svg)](https://make.fun/bounty/news-image-20261123/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/muhammad-rafly/news-image-20261123/reward.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)

Entry for make.fun bounty `news-image-20261123` — "Sum up 23 November's
world news in one image".

`main.ts` (Node 22, stdlib only) draws a 1024×1024 newspaper front page
entirely in code — own PNG encoder, own 5×7 bitmap font, fixed-seed layout —
and writes it to `/output/entry.png`. Deterministic: two runs produce
identical bytes.

Lead story: Nvidia brings Jensen Huang back as CEO 11 days after he
resigned — shares soar about 33%, and the S&P 500 jumps 4.82% in a sharp
rebound after last week's AI sell-off. Also inside: Ukraine strikes
Russian ships in Libya, COP31 ends with no deal, analysts estimate
GTA VI sold 44.9M copies in its launch weekend, plus an IN BRIEF strip
(Trump on Putin, Democrats' House majority, EU sanctions, El Chapo
Isidro captured, Dymer strike, Iran vs the US blockade).

Run it:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
