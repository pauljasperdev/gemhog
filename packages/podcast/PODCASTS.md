# Investment Podcast Directory

A curated collection of 38 investment and business podcasts organized by tier,
with Podscan IDs for integration.

## MVP Starting Set (10 Podcasts)

The core set used by daily sync and backfill functions:

```typescript
// MVP investing podcasts — balanced daily + weekly content
const PODCAST_IDS: readonly string[] = [
  // Daily market shows (high volume, current news)
  "pd_4evzb9qe3e49873g", // Thoughts on the Market (Morgan Stanley) - daily
  "pd_4evzb9qkyyl9873g", // Wall Street Breakfast (Seeking Alpha) - daily
  "pd_w6go3jmkn6l52la7", // Motley Fool Money - daily

  // Weekly deep-dives (quality investment theses)
  "pd_6gokljvvn7yj37ma", // All-In - weekly
  "pd_dpmk29nmper5ev8n", // Invest Like the Best - weekly
  "pd_v8xnmz97l4534qeo", // We Study Billionaires - weekly
  "pd_kwgp3jzaep9xnbyz", // Odd Lots (Bloomberg) - 3x/week
  "pd_exk67jggkrjm8lrw", // Animal Spirits - 2x/week
  "pd_dbka52p8eemj2gez", // Prof G Markets - 2x/week
  "pd_ka86x53mllm9wgdv", // Macro Voices - weekly
];
```

---

## 🥇 Tier 1: Premium Shows (15 Podcasts)

High-audience, established shows with strong editorial quality.

| Podcast                | Podscan ID          | Frequency | Episodes | Audience | Content Focus            |
| ---------------------- | ------------------- | --------- | -------- | -------- | ------------------------ |
| All-In                 | pd_6gokljvvn7yj37ma | Weekly    | 350      | 229,800  | Tech/markets/politics    |
| How I Built This       | pd_8xnmz97eq4qj34qe | Weekly    | 811      | 337,400  | Founder stories          |
| Pivot                  | pd_4evzb9qyvwp5873g | 2x/week   | 751      | 368,100  | Tech/business/markets    |
| Animal Spirits         | pd_exk67jggkrjm8lrw | 2x/week   | 765      | 147,200  | Markets commentary       |
| The Tim Ferriss Show   | pd_oely6582epo5q7ng | Weekly    | 859      | 146,700  | Investor interviews      |
| Prof G Markets         | pd_dbka52p8eemj2gez | 2x/week   | 271      | 109,100  | Galloway market analysis |
| We Study Billionaires  | pd_v8xnmz97l4534qeo | Weekly    | 1,159    | 76,800   | Value investing          |
| The Indicator          | pd_7a3do5b6nqn9kxyr | Daily     | 300      | 74,200   | NPR economics            |
| Motley Fool Money      | pd_w6go3jmkn6l52la7 | Daily     | 2,122    | 53,200   | Stock picks              |
| My First Million       | pd_dpmk29need9ev8nz | 3x/week   | 841      | 45,800   | Business/investing       |
| The Peter Schiff Show  | pd_6kewm9dypk9a847o | Daily     | 1,102    | 43,400   | Contrarian macro         |
| Bankless               | pd_n3ymxjx8nrz9b8v6 | 2x/week   | 1,229    | 30,600   | Crypto/macro             |
| The Knowledge Project  | pd_vp6km5aabey54lae | Weekly    | 269      | 26,400   | Mental models            |
| Wall Street Breakfast  | pd_4evzb9qkyyl9873g | Daily     | 1,000    | 23,700   | Seeking Alpha news       |
| Thoughts on the Market | pd_4evzb9qe3e49873g | Daily     | 1,571    | 20,200   | Morgan Stanley           |

---

## 🥈 Tier 2: Strong Performers (17 Podcasts)

Solid audience and specialized expertise in investing, venture, and macro.

| Podcast                  | Podscan ID          | Frequency | Episodes | Audience | Content Focus       |
| ------------------------ | ------------------- | --------- | -------- | -------- | ------------------- |
| Invest Like the Best     | pd_dpmk29nmper5ev8n | Weekly    | 566      | 13,900   | Premier interviews  |
| 20VC                     | pd_mqazg9y3rn5r6w48 | Daily     | 1,423    | 13,800   | Venture capital     |
| Odd Lots                 | pd_kwgp3jzaep9xnbyz | 3x/week   | 1,150    | 12,700   | Bloomberg economics |
| Valuetainment            | pd_k42yajrmdzb5p8ow | Daily     | 1,641    | 12,600   | Business/markets    |
| Macro Voices             | pd_ka86x53mllm9wgdv | Weekly    | 300      | 9,700    | Institutional macro |
| InvestTalk               | pd_gdk6w9k6yr7j3za7 | Daily     | 2,048    | 8,600    | Daily market show   |
| Afford Anything          | pd_rnkbp9ongmm572wa | Weekly    | 737      | 8,600    | Investing/FIRE      |
| Chat With Traders        | pd_eaboy5l6dnq5zvdx | Weekly    | 320      | 8,500    | Trading interviews  |
| The Compound and Friends | pd_n3ymxjxkkg9b8v67 | Weekly    | 539      | 8,400    | Josh Brown          |
| Wealthion                | pd_eym7vj433dq943wp | Daily     | 1,183    | 8,000    | Macro/resilience    |
| The Pomp Podcast         | pd_oely6582k6o5q7ng | Daily     | 1,694    | 6,400    | Crypto/markets      |
| Real Vision              | pd_ka86x53p6n9wgdvq | Daily     | 2,075    | 6,200    | Finance interviews  |
| Behind the Balance Sheet | pd_oely658nzyo5q7ng | Weekly    | 63       | 4,600    | Financial analysis  |
| Stock Club               | pd_vp6km5a8gb94lae7 | Weekly    | 299      | 3,900    | Stock picks         |
| Capital Allocators       | pd_mqazg9ym67n9r6w4 | Weekly    | 779      | 3,700    | Institutional       |
| Bogleheads               | pd_oely658nryb5q7ng | Monthly   | 91       | 3,300    | Index investing     |
| Top Traders Unplugged    | pd_gdk6w9koxq3j3za7 | Weekly    | 907      | 2,800    | Hedge fund          |

---

## 🥉 Tier 3: Specialized Niche (6 Podcasts)

Smaller but highly focused audiences with deep expertise.

| Podcast             | Podscan ID          | Frequency | Episodes | Audience | Content Focus      |
| ------------------- | ------------------- | --------- | -------- | -------- | ------------------ |
| The Meb Faber Show  | pd_6kewm9dv2gp9a847 | Weekly    | 685      | 1,900    | Fund manager       |
| The Long View       | pd_lz3od9wyb625vxa8 | Weekly    | 362      | 1,900    | Morningstar        |
| The Morning Filter  | pd_pmk29npo73a5ev8n | Weekly    | 53       | 1,500    | Morningstar stocks |
| Masters in Business | pd_k42yajr2k8o9p8ow | Weekly    | 746      | 1,400    | Bloomberg          |
| ETF Edge            | pd_lz3od9wxn8kjvxa8 | Weekly    | 292      | 1,400    | CNBC ETFs          |
| Rational Reminder   | pd_k42yajrpdgw5p8ow | Weekly    | 420      | 100\*    | Ben Felix          |

\*Rational Reminder: low reported audience but excellent content quality

---

## Frequency Breakdown

### Daily Shows (11 podcasts)

High-volume content for staying current with markets and news.

| Podcast                | Podscan ID          | Episodes | Audience |
| ---------------------- | ------------------- | -------- | -------- |
| The Indicator          | pd_7a3do5b6nqn9kxyr | 300      | 74,200   |
| Motley Fool Money      | pd_w6go3jmkn6l52la7 | 2,122    | 53,200   |
| The Peter Schiff Show  | pd_6kewm9dypk9a847o | 1,102    | 43,400   |
| Wall Street Breakfast  | pd_4evzb9qkyyl9873g | 1,000    | 23,700   |
| Thoughts on the Market | pd_4evzb9qe3e49873g | 1,571    | 20,200   |
| 20VC                   | pd_mqazg9y3rn5r6w48 | 1,423    | 13,800   |
| Valuetainment          | pd_k42yajrmdzb5p8ow | 1,641    | 12,600   |
| InvestTalk             | pd_gdk6w9k6yr7j3za7 | 2,048    | 8,600    |
| Wealthion              | pd_eym7vj433dq943wp | 1,183    | 8,000    |
| The Pomp Podcast       | pd_oely6582k6o5q7ng | 1,694    | 6,400    |
| Real Vision            | pd_ka86x53p6n9wgdvq | 2,075    | 6,200    |

### Weekly Shows (20+ podcasts)

Deep-dive content for quality investment theses and analysis.

| Podcast                  | Podscan ID          | Episodes | Audience |
| ------------------------ | ------------------- | -------- | -------- |
| All-In                   | pd_6gokljvvn7yj37ma | 350      | 229,800  |
| How I Built This         | pd_8xnmz97eq4qj34qe | 811      | 337,400  |
| The Tim Ferriss Show     | pd_oely6582epo5q7ng | 859      | 146,700  |
| We Study Billionaires    | pd_v8xnmz97l4534qeo | 1,159    | 76,800   |
| The Knowledge Project    | pd_vp6km5aabey54lae | 269      | 26,400   |
| Invest Like the Best     | pd_dpmk29nmper5ev8n | 566      | 13,900   |
| Macro Voices             | pd_ka86x53mllm9wgdv | 300      | 9,700    |
| Afford Anything          | pd_rnkbp9ongmm572wa | 737      | 8,600    |
| Chat With Traders        | pd_eaboy5l6dnq5zvdx | 320      | 8,500    |
| The Compound and Friends | pd_n3ymxjxkkg9b8v67 | 539      | 8,400    |
| Behind the Balance Sheet | pd_oely658nzyo5q7ng | 63       | 4,600    |
| Stock Club               | pd_vp6km5a8gb94lae7 | 299      | 3,900    |
| Capital Allocators       | pd_mqazg9ym67n9r6w4 | 779      | 3,700    |
| The Meb Faber Show       | pd_6kewm9dv2gp9a847 | 685      | 1,900    |
| The Long View            | pd_lz3od9wyb625vxa8 | 362      | 1,900    |
| The Morning Filter       | pd_pmk29npo73a5ev8n | 53       | 1,500    |
| Masters in Business      | pd_k42yajr2k8o9p8ow | 746      | 1,400    |
| ETF Edge                 | pd_lz3od9wxn8kjvxa8 | 292      | 1,400    |
| Rational Reminder        | pd_k42yajrpdgw5p8ow | 420      | 100      |

### Multi-per-week Shows (2x/week, 3x/week)

Balanced frequency for regular engagement without daily commitment.

| Podcast          | Podscan ID          | Frequency | Episodes | Audience |
| ---------------- | ------------------- | --------- | -------- | -------- |
| Pivot            | pd_4evzb9qyvwp5873g | 2x/week   | 751      | 368,100  |
| Animal Spirits   | pd_exk67jggkrjm8lrw | 2x/week   | 765      | 147,200  |
| Prof G Markets   | pd_dbka52p8eemj2gez | 2x/week   | 271      | 109,100  |
| Bankless         | pd_n3ymxjx8nrz9b8v6 | 2x/week   | 1,229    | 30,600   |
| My First Million | pd_dpmk29need9ev8nz | 3x/week   | 841      | 45,800   |
| Odd Lots         | pd_kwgp3jzaep9xnbyz | 3x/week   | 1,150    | 12,700   |

### Monthly Shows (1 podcast)

Occasional deep-dive content.

| Podcast    | Podscan ID          | Episodes | Audience |
| ---------- | ------------------- | -------- | -------- |
| Bogleheads | pd_oely658nryb5q7ng | 91       | 3,300    |

---

## Integration Notes

**Trial limits:** 5 podcasts × 10 pages = 50 requests per backfill run

All 38 podcasts have Podscan IDs documented for seamless integration with
podcast data fetching and transcript processing workflows.
