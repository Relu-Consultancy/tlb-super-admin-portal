/** Standard paginated list payload (API doc §9). */
export interface Paginated<T> {
  count: number;
  /** Present on this backend in addition to the documented fields. */
  page?: number;
  page_size?: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
