/**
 * Approximate US ZIP prefix → IECC climate zone mapping.
 *
 * Keyed by the first 3 digits of a 5-digit ZIP code. This is a
 * coarse, state-level approximation — good enough to auto-select a
 * reasonable default zone so users don't have to guess, but not a
 * substitute for looking up the exact zone from the IECC map when
 * precision matters. The user can always override the Select manually.
 *
 * Data is encoded as inclusive ranges `[startPrefix, endPrefix, zone]`
 * and expanded into a flat `Map<string, string>` at module load.
 * Ranges that fall inside a state whose climate zone varies north-to-
 * south are split.
 *
 * Zone IDs must match entries in `./climate-zones.ts`. If a ZIP falls
 * in a zone this app doesn't model (e.g. 3C Pacific marine, 4C Pacific
 * NW marine), we map to the nearest supported zone.
 */

type ZipRange = [start: number, end: number, zone: string];

// prettier-ignore
const ZIP_RANGES: ZipRange[] = [
  // New England
  [ 10,  27, '5A'], // MA
  [ 28,  29, '5A'], // RI
  [ 30,  38, '5A'], // NH (southern); northern NH is 6A
  [ 39,  49, '6A'], // ME (much of it 6A/7)
  [ 50,  59, '6A'], // VT
  [ 60,  69, '5A'], // CT

  // Mid-Atlantic
  [ 70,  89, '4A'], // NJ
  [100, 104, '4A'], // NYC metro
  [105, 119, '4A'], // downstate NY / Long Island
  [120, 149, '5A'], // upstate NY
  [150, 168, '5A'], // western PA
  [169, 196, '4A'], // central/eastern PA
  [197, 199, '4A'], // DE
  [200, 205, '4A'], // DC
  [206, 219, '4A'], // MD
  [220, 246, '4A'], // VA
  [247, 268, '4A'], // WV
  [270, 289, '3A'], // NC
  [290, 299, '3A'], // SC

  // Southeast
  [300, 319, '3A'], // GA
  [320, 329, '2A'], // FL north
  [330, 334, '1A'], // FL south (Miami area)
  [335, 342, '2A'], // FL central
  [344, 349, '2A'], // FL southwest
  [350, 369, '3A'], // AL (north = 3A, south = 2A — approximate)
  [370, 385, '4A'], // TN
  [386, 397, '3A'], // MS
  [398, 399, '3A'], // GA (extra)

  // Midwest / Great Lakes
  [400, 427, '4A'], // KY
  [430, 459, '5A'], // OH
  [460, 479, '5A'], // IN (northern); southern IN 4A but split skipped
  [480, 499, '5A'], // MI (lower); UP is 6A
  [500, 528, '5A'], // IA
  [530, 549, '6A'], // WI
  [550, 567, '6A'], // MN (central/south); north = 7
  [570, 577, '6A'], // SD
  [580, 588, '6A'], // ND
  [590, 599, '6B'], // MT
  [600, 629, '5A'], // IL (Chicago area + downstate)
  [630, 658, '4A'], // MO
  [660, 679, '4A'], // KS
  [680, 693, '5A'], // NE

  // South / Gulf
  [700, 714, '2A'], // LA
  [716, 729, '3A'], // AR
  [730, 749, '3A'], // OK
  [750, 799, '2A'], // TX (most); west TX is 3B — approximate

  // Mountain West
  [800, 816, '5B'], // CO
  [820, 831, '6B'], // WY
  [832, 838, '6B'], // ID
  [840, 847, '5B'], // UT
  [850, 860, '2B'], // AZ south (Phoenix)
  [863, 865, '4B'], // AZ north (Flagstaff)
  [870, 884, '4B'], // NM
  [889, 898, '3B'], // NV (Vegas = 3B)

  // Pacific
  [900, 928, '3B'], // CA south (LA / SD / IE)
  [930, 939, '3B'], // CA central coast / valley
  [940, 961, '3B'], // CA north (SF Bay ≈ 3C; mapped to 3B)
  [967, 968, '1A'], // HI
  [970, 979, '4B'], // OR (4C marine approximated as 4B)
  [980, 994, '5A'], // WA (interior 5B; coast 4C; mapped 5A)
  [995, 999, '8' ], // AK
];

const ZIP_TO_ZONE: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [start, end, zone] of ZIP_RANGES) {
    for (let p = start; p <= end; p++) {
      map.set(String(p).padStart(3, '0'), zone);
    }
  }
  return map;
})();

/**
 * Look up an IECC climate zone by the first 3 digits of a ZIP code.
 * Returns `null` if the prefix isn't in the table (e.g. PO box blocks,
 * APO/FPO, or malformed input).
 */
export function zipPrefixToZone(prefix3: string): string | null {
  return ZIP_TO_ZONE.get(prefix3) ?? null;
}
