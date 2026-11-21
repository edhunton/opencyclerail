// Open Cycle Rail: bicycle carriage rules for European trains, as code.
// Copyright (c) 2026 emhmedia. Licence: see ../LICENSE in this package.
//
// This file is the same resolver that runs inside TourTrax and
// opencyclerail.tech, kept in step by hand until the planner is released. The
// rules are the dataset in ../../data, written as patterns over the train's
// code and operator as the feeds name them. A train no rule matches is
// 'unknown', which a planner must report, never treat as fine.

// A growing dataset of operator / product bike-carriage rules for the Getting
// There rail planner. Bike policy is set at the operator/product level, not per
// individual train, so we match a leg's line (MOTIS routeShortName) and operator
// (agencyName) against these patterns. See project_gettingthere_bike_policy.
//
//   assembled     — assembled bike carried, no reservation needed (most regional)
//   reservation   — assembled bike carried, but a bike space must be booked/paid
//   disassembled  — only a bagged / disassembled bike is allowed
//   none          — no bike at all beyond a folder that fits as hand luggage,
//                   which a touring bike in a bag does not; avoided in both modes
//   unknown       — no data; caller decides (high-speed is treated conservatively)
//
// These are best-effort and change over time / by route & date — the UI tells the
// rider to confirm with the operator before booking. Refine + extend freely.

export type BikePolicy = 'assembled' | 'reservation' | 'disassembled' | 'none' | 'unknown';

interface PolicyRule { re: RegExp; policy: BikePolicy }

// First match wins — put specific products before broad operators. A code and
// its train number arrive both ways from the feeds ("RE 5" and "RE5", "IC 530"
// and "IC1"), so every code rule lets the digits touch: a bare \bre\b called
// 46 of the warmed regional legs unknown on 4 Nov 2026. A code that is a
// single letter (R, S, L, D) means different things in different countries and
// stays unknown here; the bike_policies table can pin it per operator.
const RULES: PolicyRule[] = [
  // ── Disassembled / bagged only ──────────────────────────────────────────────
  { re: /\bthalys\b/i,                                              policy: 'disassembled' }, // Thalys / Eurostar Red
  // Ouigo Train Classique takes a bike built or folded (Ed, 5 Nov 2026);
  // the feed codes it OUIGO_TC. Before the Ouigo rule, which is the
  // high-speed service and bagged only.
  // ouigo.com, read 21 Nov 2026: a built bike is a paid "option vélo",
  // 10 euros a traveller a journey, booked with the ticket or up to 30
  // minutes before departure; bagged in a cover 5 euros. Refused built on
  // Paris-Bordeaux (route rule) and Friday to Monday on Paris-Brussels,
  // which the rules cannot say by day.
  { re: /\bouigo_tc\b/i,                                            policy: 'reservation' },
  { re: /\bouigo\b/i,                                               policy: 'disassembled' }, // TGV Ouigo (low-cost)
  { re: /\b(ave|avlo)\b/i,                                          policy: 'disassembled' }, // RENFE AVE / AVLO
  // Renfe's long-distance conventional trains, Alvia and Intercity: folded
  // or in a cover only (Ed, 5 Nov 2026). Anchored on the operator and ahead
  // of the Intercity rule, which is right for most of Europe and wrong here.
  { re: /^(alvia|intercity)(\s+\d+)?\s+renfe\b/i,                   policy: 'disassembled' },
  { re: /\bfreccia(rossa|argento|bianca)?\b/i,                      policy: 'disassembled' }, // Trenitalia Frecce
  { re: /\bf[rab]\s*\d{4}\b/i,                                      policy: 'disassembled' }, // the same trains as the feed codes them: FR 8807, FA, FB
  { re: /\bitalo\b/i,                                               policy: 'disassembled' }, // Italo (NTV): folding bikes only; italotreno.com (21 Nov 2026) says nothing of a dismantled bike in a bag
  // DB ICE 10–19 are the Brussels–Cologne–Frankfurt ICE 3 sets, which have no
  // bicycle spaces at all (bike carriage on ICE is ICE 4 / ICE T / ICE 1 only).
  { re: /\bice\s*1\d\b/i,                                           policy: 'disassembled' },
  // Eurostar's continental trains (the former Thalys, numbered 9xxx and shown
  // as EST 9xxx): folded or bagged bikes only.
  { re: /\best\s*9\d{3}\b/i,                                        policy: 'disassembled' },
  // TCDD (Ed, 5 Nov 2026): on the high-speed YHT a bike only fully packed in
  // a zipped bag, front wheel off; on Marmaray, Başkentray and İzban free,
  // bar Sundays, holidays and the weekday peaks; on the mainline and
  // regional trains a built bike is generally restricted or prohibited
  // unless the train has a luggage car or hooks, which most do not and the
  // feed cannot tell, and the advice is to pack it. So the numbered
  // mainline trains are bagged only: a built bike must not count on them.
  { re: /\byht\b/i,                                                 policy: 'disassembled' },
  { re: /^\d+\s+tcdd\b/i,                                           policy: 'disassembled' },
  // CP's Alfa Pendular: a bike only fully disassembled and packed as hand
  // luggage (Ed, 5 Nov 2026). The feed codes it AP; anchored on CP.
  { re: /^ap(\s+\d+)?\s+cp\b/i,                                     policy: 'disassembled' },
  // SJ, Sweden: no built bike on its trains at all; dismantled in a bag or
  // box within 140 × 85 × 30 cm as hand luggage (Ed, 5 Nov 2026). The feed
  // gives these trains a number and the agency "SJ"; anchored on the end.
  // SJ Nord, Norway, is another matter and sits in the reservation rules.
  { re: /\ssj$/i,                                                   policy: 'disassembled' },
  // Snälltåget: a standard bike only on the summer and autumn mountain trains
  // to Jämtland and Härjedalen, numbers 24 and 25, pre-booked in the luggage
  // carriage (199 SEK a direction); on every other day or night train none,
  // and a folded one only within hand-luggage size, 55 × 45 × 25 cm, which is
  // a Brompton and not a touring bike in a bag (Ed, 5 Nov 2026). The feed
  // codes it NT; the two exceptions sit before the rule for the rest.
  { re: /^nt\s*2[45]\s+sn[äa]llt[åa]get$/i,                         policy: 'reservation' },
  { re: /sn[äa]llt[åa]get/i,                                        policy: 'none' },

  // ── Assembled, but a bike space must be booked (reservation) ────────────────
  { re: /\beurostar\b/i,                                            policy: 'reservation' },  // Eurostar (bike must be booked)
  { re: /\bice\s*\d*\b/i,                                           policy: 'reservation' },  // DB ICE: selected trains, bike ticket plus a booked space, nothing bought on board (Ed, 5 Nov 2026)
  { re: /\btgv(\s*inoui)?\b/i,                                      policy: 'reservation' },  // SNCF TGV inOui: €10 a bike a journey built, free folded or in a cover (Ed, 5 Nov 2026)
  // SNCB/NMBS, every Belgian domestic train: a built bike with a bike
  // supplement (€3 off peak, €5 at peak), no space to book (Ed, 5 Nov 2026).
  // Ahead of the IC rule, which would ask the rider to reserve.
  { re: /nmbs|sncb/i,                                               policy: 'assembled' },
  // NS, the Dutch Intercity and Sprinter: a built bike off peak only (09:00
  // to 16:00 and 18:30 to 06:30 on weekdays, all day at weekends, holidays
  // and in July and August) with an off-peak bike ticket, no space to book
  // (Ed, 5 Nov 2026). NS International's ICE is DB's and stays above.
  { re: /^(intercity|sprinter)(\s+\d+)?\s+(nederlandse spoorwegen|ns)$/i, policy: 'assembled' },   // the feed names the agency NS
  // SNCF Intercités: a built bike needs a booked space (€5 to €10) at the
  // time of buying the ticket, which cannot be added later (Ed, 5 Nov 2026).
  // Trenitalia (Ed, 5 Nov 2026): a built bike on the daytime Intercity with a
  // booked space (€3.50, carriage 3, six per train), which the IC rule gives;
  // on Intercity Notte none unless folded or wheels off in a closed bag,
  // so ICN is bagged only and sits ahead of it. The built chain to Sicily
  // had been boarding the night train.
  { re: /\bicn\s*\d*\b/i,                                           policy: 'disassembled' },
  // DSB's EuroCity and EuroCity Express, Copenhagen to Hamburg: an
  // international bicycle ticket and a mandatory space reservation, eight to
  // twelve spaces a train, one bike a person, booked by phone or at a desk
  // rather than in the app (Ed, 5 Nov 2026). ECE had no rule.
  { re: /\bece\s*\d*\b/i,                                           policy: 'reservation' },
  // PKP Intercity, TLK, IC, EIC and EIP: a built bike with a flat-rate bike
  // ticket (PLN 11.90), only on trains with a designated bike space, never
  // in a sleeper or couchette car; a bike ticket cannot be bought aboard an
  // EIP (Ed, 5 Nov 2026). The ticket is the booking; by operator.
  { re: /^(tlk|ic|eic|eip)(\s+\d+)?\s+pkp intercity\b/i,            policy: 'reservation' },
  // DSB InterCity and InterCityLyn: a bicycle ticket with a mandatory space
  // reservation for every bike; MÁV InterCity the same, a bicycle ticket and
  // a mandatory space reservation (both Ed, 5 Nov 2026). This rule gives it.
  { re: /\b(intercit[eé]s?|intercity|eurocity|icl|ec|ic)\s*\d*\b/i, policy: 'reservation' },  // IC / EC / ICL / Intercités
  { re: /\b(railjet|nightjet|euronight|rjx|rj|nj)\s*\d*\b/i,       policy: 'reservation' },  // ÖBB Railjet / Nightjet
  { re: /\ben\s*\d+\b/i,                                            policy: 'reservation' },  // EuroNight, always numbered
  // SBB (Ed, 5 Nov 2026): a bike day pass (CHF 15) on everything. InterCity
  // needs a booked space (CHF 2) daily from 21 March to 31 October on IC2,
  // IC21, IC5 and IC51 and Friday to Sunday on the rest, which the IC rule
  // below covers; InterRegio cannot be reserved at all, first come first
  // served, so it is built with no booking and sits ahead of the IR rule.
  { re: /^ir\s*\d*\s+schweizerische bundesbahnen\b/i,               policy: 'assembled' },
  { re: /\b(interregio|ir)\s*\d*\b/i,                               policy: 'reservation' },  // InterRegio
  // WESTbahn: bike spaces on board, reservation and bike ticket mandatory
  // (Ed, 5 Nov 2026). The feed codes it DRF; by operator.
  { re: /\bwestbahn\b/i,                                            policy: 'reservation' },
  // SJ Nord, Norway: a built bike on board, with a separate bicycle ticket
  // booked ahead on the long-distance lines (Dovre, Nordland), first come on
  // local routes; 175 cm at most, barred from a replacement bus (Ed, 5 Nov
  // 2026). Must sit before the Swedish SJ rule, which refuses a built bike.
  { re: /\bsj (nord|norge)\b/i,                                     policy: 'reservation' },
  // LTG Link, Lithuania: a built bike with a separate bicycle ticket (a 45%
  // surcharge), one per passenger, never in first class, 185 × 110 × 60 cm
  // at most; packed within a 200 cm sum it goes free (Ed, 5 Nov 2026).
  { re: /\bltg link\b/i,                                            policy: 'reservation' },
  // ÖBB's D-Zug, long-distance like the Railjet: a bicycle ticket (about
  // 10% of the fare) and a bike space reservation (€3), strictly required;
  // on the Micotra over the Italian border the reservation comes with the
  // ticket (Ed, 5 Nov 2026). Villach to Ljubljana and Zagreb. Anchored on
  // the operator, since D alone means other things elsewhere.
  { re: /^d\s*\d+\s+oebb\b|^d\s*\d+\s+öbb\b/i,                      policy: 'reservation' },
  // Eurocity Direct, NS International's Brussels train: a standard bike with
  // a bike ticket, subject to space and outside the peak (Ed, 5 Nov 2026).
  // The feed codes it ECD, which the EC rule must not swallow.
  { re: /\becd\s*\d*\b/i,                                           policy: 'reservation' },

  // ── Assembled, no reservation (regional / suburban) ─────────────────────────
  // TER: a built bike free, first come first served, no reservation (Ed, 5 Nov 2026).
  { re: /\b(ter|regional(?:e|i|express)?|regio|reg(?:\.?\s*exp\.?)?|rv|rex|rer|re|rb|ire|s-?bahn|cercan[ií]as|rodalies|nahverkehr)\s*\d*\b/i, policy: 'assembled' },
  { re: /\bs\d+\b/i,                                                policy: 'assembled' },    // S1, S3: S-Bahn and S-tog lines by number
  // TER Hauts-de-France, which the feed codes by brand: Krono+ (K90+), Krono
  // (K16…), Proxi (P). A built bike travels free; on certain busy and
  // cross-border lines a free reservation is mandatory (Ed, 5 Nov 2026),
  // which the rider is told to check when booking. Anchored on the operator
  // so a bare K or P matches nothing else.
  { re: /^(k\d*\+?|p)\s*\d*\s+sncf voyageurs$/i,                   policy: 'assembled' },   // the feed also writes P845123, no space
  // Rotterdam's metro, lines A to E: a standard bike travels free outside
  // the peak (Ed, 5 Nov 2026). Line B is the old Hoek van Holland railway,
  // the first leg off the Harwich ferry. Anchored on the operator.
  { re: /^[a-e]\s+ret$/i,                                           policy: 'assembled' },
  // Euskotren, every train, free (Ed, 5 Nov 2026): the built-bike way along
  // the Basque coast from Hendaye to Bilbao. By operator; the lines are E1, E2.
  { re: /\beuskotren\b/i,                                           policy: 'assembled' },
  // Renfe Media Distancia: a full-size bike on board, typically three per
  // train (Ed, 5 Nov 2026). Anchored on the operator; AVE and Avlo stay
  // bagged only above.
  { re: /^md(\s+\d+)?\s+renfe\b/i,                                  policy: 'assembled' },
  // Renfe's Celta, Vigo to Porto: a built bike with a reservation, three per
  // train, or packed (Ed, 5 Nov 2026). Every chain into Portugal from the
  // north crosses on it.
  { re: /^trencelta(\s+\d+)?\s+renfe\b/i,                           policy: 'reservation' },
  // Öresundståg and Pågatåg, Skånetrafiken's trains across the Øresund and
  // around Skåne: a standard bike on board, subject to space and the crew
  // (Ed, 5 Nov 2026). The feed gives these trains a number and no name, so
  // the rule is by operator. No \b: å is not a word character to JS.
  { re: /sk[åa]netrafiken|[öo]resundst[åa]g|p[åa]gat[åa]g/i,        policy: 'assembled' },
  // Koleje Dolnośląskie, the way into Poland from Görlitz: one bike per
  // traveller (Ed, 5 Nov 2026). By operator; the lines are D10, D62 and so on.
  { re: /koleje dolno/i,                                            policy: 'assembled' },
  // Trenord, Lombardy's regional trains: a built bike on the trains marked
  // with a bicycle in the timetable, one per traveller, free inside Milan
  // and a €3–3.50 supplement beyond; never on a replacement bus (Ed,
  // 5 Nov 2026). Was matched by the RE rule by accident of code.
  { re: /\btrenord\b/i,                                             policy: 'assembled' },
  // MÁV's stopping trains, S (személyvonat), G and Z: a bike on nearly every
  // service without a reservation, bar the few the timetable marks with the
  // prohibition symbol (Ed, 5 Nov 2026). The feed codes them SZ. By
  // operator; InterCity keeps its booked space above.
  { re: /^(sz|s|g|z)(\s+\d+)?\s+m[áa]v\b/i,                        policy: 'assembled' },
  // BDZ, Bulgaria's fast and passenger trains (БВ, МБВ, ПВ): a bike on the
  // entrance platform of the last coach, looked after by its rider, for a
  // BGN 3 fee bought with the ticket, no reservation (Ed, 5 Nov 2026). By
  // operator; Ruse to Sofia and on to the Turkish border.
  { re: /bulgarian state railways|бдж|\bbdz\b/i,                   policy: 'assembled' },
  { re: /marmaray|ba[şs]kentray|i̇zban|izban/i,                      policy: 'assembled' },    // TCDD suburban, see YHT above
  { re: /\svy( norge)?$/i,                                          policy: 'assembled' },    // Vy's other trains; the booked lines are route rules above
  // HŽPP, Croatia: a bike on domestic trains and on the designated
  // cross-border ones (Ed, 5 Nov 2026). Augsburg to Ljubljana and Zagreb.
  { re: /\bh[žz]pp\b/i,                                             policy: 'assembled' },
];

// Rules added at run time by whoever deploys the library (Open Cycle Rail
// keeps them in a table, resolved from its queue of trains met with no rule
// on file): consulted only for a train the code rules above call unknown,
// so a confirmed operator can be added without a release. Never a guess.
import { iso1A2Code } from 'country-coder';
let _extraRules: PolicyRule[] = [];
export function setExtraRules(rules: { pattern: string; policy: BikePolicy }[]): void {
  _extraRules = rules.map(r => { try { return { re: new RegExp(r.pattern, 'i'), policy: r.policy }; } catch { return null; } }).filter((x): x is PolicyRule => !!x);
}
function countryOffline(lat: number, lng: number): string | null {
  try { const cc = iso1A2Code([lng, lat]); return cc ? cc.toUpperCase() : null; } catch { return null; }
}

// Eurostar's bike policy is set by route, not by train number, and the number
// cannot tell them apart: MOTIS names every Eurostar "EST 9xxx", London-Paris
// (9014) and London-Brussels (9116) alike. A line rule on that pattern marked
// London-Brussels bagged-only, contradicting the crossings table on the one
// crossing that carries a built bike across the Channel. So these are matched
// on the leg's two stations and consulted before any line rule, DB or code.
//
// Station names come as MOTIS reports them, in whichever feed carried the
// train: "St-Pancras-International" or "London St. Pancras Int.",
// "Bruxelles-Midi" or "Brussel-Zuid", "Paris-Nord". Either direction.
// eurostar.com, read 21 Nov 2026: a fully assembled bike only between
// London and Brussels and London and Amsterdam (selected trains, booked);
// London-Paris disassembled in a box or bag; no bike service at all to or
// from Lille or Rotterdam, a folding bike under 85 cm in a bag excepted,
// which is no touring bike. Consistent with api/_lib/crossings.ts.
interface RouteRule { agency: RegExp; a: RegExp; b: RegExp; policy: BikePolicy }
const LONDON = /st[.\s-]*pancras|\blondon\b/i;
const BRUSSELS = /bruxelles|brussel|brussels/i;
const LILLE = /\blille\b/i;
const PARIS = /\bparis\b/i;
const AMSTERDAM = /amsterdam/i;
const ROTTERDAM = /rotterdam/i;
const BORDEAUX = /bordeaux/i;
const OUIGO_TC = /ouigo_tc/i;
const EUROSTAR_AGENCY = /eurostar|ns international/i;
// Nomad, Normandy's TER: a built bike is free and unreserved on its lines,
// except to and from Paris, where a bike reservation is mandatory all year
// (Ed, 5 Nov 2026). The Dieppe ferry's rider meets this at Rouen. Also
// mandatory May to August on the summer lines (Caen–Granville–Rennes,
// Caen–Le Mans–Tours), which the rules cannot say by season yet.
const NOMAD = /nomad/i;
const ANY = /./;
// Vy, Norway (vy.no, read 21 Nov 2026): a built bike on most trains, with
// a reservation required in advance on the Bergen line and the Flåm railway
// (summer only on the Flåm), recommended on the Gjøvik line and
// Oslo–Halden–Gothenburg, and none needed on the other regional and local
// trains, boarding the carriage marked with a bicycle and buying the bike
// ticket on board. No Malmö service with a required booking is listed. By
// route, with the plain Vy rule below for the rest.
const VY = /\bvy\b/i;
const OSLO = /\boslo\b/i;
const VY_BOOKED = /bergen|voss|fl[åa]m|myrdal/i;
const ROUTE_RULES: RouteRule[] = [
  { agency: VY, a: OSLO, b: VY_BOOKED, policy: 'reservation' },
  { agency: VY, a: VY_BOOKED, b: VY_BOOKED, policy: 'reservation' },
  { agency: NOMAD, a: PARIS, b: ANY, policy: 'reservation' },
  { agency: EUROSTAR_AGENCY, a: LONDON, b: BRUSSELS, policy: 'reservation' },
  { agency: EUROSTAR_AGENCY, a: LONDON, b: LILLE, policy: 'none' },          // no bike service to or from Lille (21 Nov 2026)
  { agency: EUROSTAR_AGENCY, a: LONDON, b: PARIS, policy: 'disassembled' },
  { agency: EUROSTAR_AGENCY, a: LONDON, b: AMSTERDAM, policy: 'reservation' }, // assembled on selected trains, booked (21 Nov 2026)
  { agency: EUROSTAR_AGENCY, a: LONDON, b: ROTTERDAM, policy: 'none' },       // no bike service (21 Nov 2026)
  { agency: OUIGO_TC, a: PARIS, b: BORDEAUX, policy: 'disassembled' },        // Ouigo Classique refuses a built bike on this line
];

export interface LegForPolicy { line?: string | null; agency?: string | null; from?: string | null; to?: string | null; fromLat?: number | null; fromLng?: number | null; toLat?: number | null; toLng?: number | null }

// Every British operator carries a built bike with a booked space (Ed, 4 Nov
// 2026), so a train with both ends in Great Britain needs no row of its own.
// The feeds name these legs by operator ("Avanti", "Greater Anglia"), which
// no line rule knows; the country is read off the stations. Comes after the
// line rules so a specific British product can still be pinned.
const domesticGB = (l: LegForPolicy) =>
  l.fromLat != null && l.fromLng != null && l.toLat != null && l.toLng != null
  && countryOffline(l.fromLat, l.fromLng) === 'GB' && countryOffline(l.toLat, l.toLng) === 'GB';

/** Policy for a leg: its route first, then its line, then its country. */
export function legBikePolicy(l: LegForPolicy): BikePolicy {
  const ag = l.agency ?? '';
  const from = l.from ?? '', to = l.to ?? '';
  if (from && to) {
    for (const r of ROUTE_RULES) {
      if (!r.agency.test(ag) && !r.agency.test(l.line ?? '')) continue;
      if ((r.a.test(from) && r.b.test(to)) || (r.a.test(to) && r.b.test(from))) return r.policy;
    }
  }
  const byLine = trainBikePolicy(l.line, l.agency);
  if (byLine !== 'unknown') return byLine;
  return domesticGB(l) ? 'reservation' : 'unknown';
}

// Bike policy for a rail service from its line / operator strings. The code
// rules come first: every one that decides a journey was confirmed by Ed on
// 5 Nov 2026, and the bike_policies table turned out to hold the old code
// guesses, consulted first, overruling them in production (Renfe Intercity
// "book a space" on the Porto chain after the rule said bagged only). The
// table is a fallback for what the code calls unknown, so a confirmed
// operator can be added without a deploy. Prefer legBikePolicy where the
// leg's stations are known.
export function trainBikePolicy(line?: string | null, agency?: string | null): BikePolicy {
  const hay = `${line ?? ''} ${agency ?? ''}`.trim();
  if (!hay) return 'unknown';
  for (const r of RULES) if (r.re.test(hay)) return r.policy;
  for (const r of _extraRules) if (r.re.test(hay)) return r.policy;
  return 'unknown';
}

// The rules as data, for Open Cycle Rail's /api/policies and the operators
// page: every line rule and route rule with its pattern and policy, in the
// order they are consulted. Published under ODbL.
export function policyRules(): { kind: 'route' | 'line'; pattern: string; policy: BikePolicy; agency?: string; a?: string; b?: string }[] {
  return [
    ...ROUTE_RULES.map(r => ({ kind: 'route' as const, pattern: r.agency.source, agency: r.agency.source, a: r.a.source, b: r.b.source, policy: r.policy })),
    ...RULES.map(r => ({ kind: 'line' as const, pattern: r.re.source, policy: r.policy })),
  ];
}
