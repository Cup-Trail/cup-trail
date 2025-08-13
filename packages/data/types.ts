/**
 * Common result type for data layer functions.
 * 
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; source: 'supabase' | 'exception'; message: string };

/** Optional helpers */
export type Ok<T> = Extract<Result<T>, { success: true }>;
export type Err<T> = Extract<Result<T>, { success: false }>;

export function isOk<T>(r: Result<T>): r is Ok<T> {
  return r.success === true;
}
export function isErr<T>(r: Result<T>): r is Err<T> {
  return r.success === false;
}