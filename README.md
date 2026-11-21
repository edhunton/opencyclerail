# Open Cycle Rail

The dataset in `data/` is open under ODbL. The code is not yet released; `LICENSE.intended` is the text under consideration for when it is.

Train journeys across Europe that take your bike. The planner at
https://opencyclerail.tech finds the fastest chain of trains from A to B that
honours the bike, built or bagged, and says plainly which train takes it,
which wants it in a bag, which refuses it, and which it cannot yet confirm.

This repository is the open home of the project.

## What is here

- `data/` - the **bike carriage rules dataset**: one row per operator or train
  family, the policy (built and free, built with a booked space, bagged only,
  none), the conditions in a line, the operator's own page that states them, a
  verbatim excerpt and the date it was read. 37 rows across 34 operators in 19
  countries as of 21 November 2026. Open data under ODbL, see `data/LICENSE`.
  The same rows are served live at
  https://opencyclerail.tech/api/journey?operators=1; `schema/` describes a row.
- `rules/` - the **resolver** as a small TypeScript package with tests: give it
  a train as a feed names it and it answers `assembled`, `reservation`,
  `disassembled`, `none` or `unknown`. The same code runs inside TourTrax and
  opencyclerail.tech.
- `watch/` - the **page watch** that keeps the rules honest: the sentences of
  each operator's page that mention a bicycle, fingerprinted weekly.
- `scripts/export-dataset.mjs` refreshes `data/` from the live catalogue.
- The journey composer (corridors, crossings, the rail leg cache) runs at
  opencyclerail.tech and inside TourTrax and is being prepared for an open
  release; the licence will be announced with it.

## How the rules are kept honest

Every rule was confirmed against the operator's own conditions of carriage
before it went in. Every Monday the source pages are fetched again, the
sentences that mention a bicycle in the page's language are compared with
last week's, and a change is flagged for a person to read. Nothing changes a
rule automatically.

Found a rule that is wrong, an operator we are missing, or a page that has
moved? Open an issue with the operator's page.

## Why

No open system can answer "can I take my bike on this train?" across Europe.
The GTFS standard's one field for it, `bikes_allowed`, is binary and almost
never filled; the conditions that matter (off peak only, booked space, bagged
only, three per train, not in July) live in thirty-odd operators' PDFs. This
dataset is the conditional model that field lacks, and the planner is the
proof it can be used.

Built by the makers of [TourTrax](https://tourtrax.guide). A project of emhmedia, all rights reserved in the code. Contact: hello@opencyclerail.org
