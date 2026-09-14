/**
 * A facility's name is withheld until it has this many published reports
 * TOTAL, across all care types — so one self-selected report can't define
 * a facility's public reputation. See METHODOLOGY.md section 7. This is an
 * application-layer display rule — app_public.facility_stats itself
 * returns every row regardless of count.
 */
export const FACILITY_NAME_THRESHOLD = 5

export function isFacilityIdentifiable(totalReports: number): boolean {
  return totalReports >= FACILITY_NAME_THRESHOLD
}

export function displayFacilityName(name: string, totalReports: number): string {
  return isFacilityIdentifiable(totalReports) ? name : 'Under 5 reports (name withheld)'
}
