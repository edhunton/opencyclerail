# @opencyclerail/rules

The resolver behind the dataset: give it a train as a feed names it (line, operator, and the two stations if you have them) and it answers one of `assembled`, `reservation`, `disassembled`, `none` or `unknown`.

```ts
import { legBikePolicy, trainBikePolicy, setExtraRules } from '@opencyclerail/rules';

legBikePolicy({ line: 'EST 9114', agency: 'Eurostar', from: 'London St Pancras', to: 'Lille Europe' }); // 'none'
trainBikePolicy('TGV INOUI 6609', 'SNCF Voyageurs');                                                // 'reservation'
trainBikePolicy('XYZ 1', 'Some Railway');                                                           // 'unknown'
```

Order of consultation: route rules (an operator between two named places), then line rules on the train's code and operator, then the country rule for Great Britain, then any rules you add with `setExtraRules` (Open Cycle Rail keeps those in a table, resolved one by one from the trains riders actually meet). First match wins. `unknown` means no rule on file; show it as unconfirmed, never as fine.

Every rule carries the operator's page it was read from: see `../data/bike-policy-sources.json`. Tests: `npm test`.
