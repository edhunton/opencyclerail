# The page watch

`policyWatch.ts` is how the rules stay honest. For each operator's conditions page it keeps only the sentences that mention a bicycle, in the page's language (vélo, Fahrrad, fiets, bicicleta, cykel, rower, kerékpár, bisiklet and so on), and fingerprints those. A redesign, a cookie banner or a new menu changes nothing; a changed fee, hour or rule does. Open Cycle Rail runs it every Monday, stores the old and new text, and a person reads the difference before any rule changes.

`fetchExtract(url)` returns `{ status, extract }`; `fingerprint(extract)` the hash. PDFs need `pdf-parse`.
