export function toPagination(page = 1, pageSize = 10) {
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}
