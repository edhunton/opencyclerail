# Contributing

The dataset lives or dies by its sources. Every rule carries the operator's own page that states it, and that is the one rule of contribution: **a citation per rule**.

## Correcting or adding a rule

Open an issue with:

1. The operator and the train family or code as the timetable names it (for example `TGV INOUI`, `MD`, `ICE 1x`).
2. What the operator does with a built bike: rolls on with no booking, rolls on with a booked space, bagged or folded only, or no bike at all. Conditions matter: hours, seasons, fees, how many per train.
3. The URL of the operator's page that says so, and the sentence, quoted, in the page's language. A blog, a forum post or a travel guide is not a source; the operator's conditions of carriage are.

A rule goes in when a maintainer has read the page. Trains that riders meet with no rule on file are queued automatically by the planner, so if you know the rule for one you have seen marked "unconfirmed", that is the most useful issue you can open.

## Code

`rules/` holds the resolver with its tests (`npm test` inside it); `watch/` the page watch. Keep a rule's comment saying who confirmed it and when. No rule is ever a guess.
