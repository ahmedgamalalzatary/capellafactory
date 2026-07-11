/** Escapes literal text embedded in a MySQL LIKE pattern. */
export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}
