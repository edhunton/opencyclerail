# Open Cycle Rail

Train journeys across Europe that take your bike. The planner at
https://opencyclerail.tech finds the fastest chain of trains from A to B that
honours the bike, built or bagged, and says plainly which train takes it,
which wants it in a bag, which refuses it, and which it cannot yet confirm.

This repository is the open home of the project.

## What is here

- `data/` - the **bike carriage rules dataset**: one row per operator or train
  family, the policy (built and free, built with a booked space, bagged only,
  none), the conditions in a line, the operator's own page that states them, a
  verbatim excerpt and the date it was read. 37 rows across 19 countries as of
  21 November 2026. Open data under ODbL, see `data/LICENSE`. The same rows
  are served live at https://opencyclerail.tech/api/journey?operators=1 and
  the matching patterns at https://opencyclerail.tech/api/journey?policies=1.
- The planner's code (journey composer, corridor assembler, rail leg cache,
  policy resolver) is free software under the AGPL-3.0, see `LICENSE`. It is
  being extracted from the TourTrax monorepo into this repository; until then
  it runs from there and this repository holds the dataset and the site.

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

Built by the makers of [TourTrax](https://tourtrax.guide). A project of
emhmedia. Contact: hello@opencyclerail.org
