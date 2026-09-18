# TTQ Attack Planner

A minimal, mobile-friendly attack planner for Travian Tournament Qualification Europe.

## What it does
- Ships with the current TTQ `map.sql` snapshot.
- Searches villages, players, alliances and coordinates.
- Selects source and target villages.
- Selects troop type and exact landing time.
- Calculates Travian map distance (including wrap-around) and departure time.
- Supports multiple attack waves.
- No Travian login or password is required.

## Automatic map updates
Travian states that `map.sql` is a complete daily snapshot and is published shortly after midnight server time. This project uses a GitHub Action that fetches the file around the two EU daylight-saving offsets, rebuilds `data/villages.json`, and commits only when the data changes. A connected Vercel project then redeploys automatically.

Set the repository variable/secret `TTQ_MAP_URL` if the world URL ever changes. Default:
`https://ttq.x2.europe.travian.com/map.sql`

## Deploy
1. Create a GitHub repository and upload this project.
2. Import that repository into Vercel.
3. Deploy with no database required for this MVP.
4. GitHub Actions will refresh the map automatically.
5. The Vercel deployment updates after the map commit.

## Important
`map.sql` is a once-daily snapshot, not live second-by-second game state. The planner therefore keeps village/player/alliance data current to the latest published snapshot. Attack times are calculated locally and do not require access to a Travian account.
