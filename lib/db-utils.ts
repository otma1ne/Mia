// ─────────────────────────────────────────
// Pagination helpers
// ─────────────────────────────────────────

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function getPaginationArgs(params: PaginationParams) {
  const page = Math.max(1, params.page ?? 1)
  const limit = Math.min(100, Math.max(1, params.limit ?? 20))
  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  }
}

export async function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): Promise<PaginatedResult<T>> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// ─────────────────────────────────────────
// Schedule helpers
// ─────────────────────────────────────────

export function hasTimeOverlap(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string }
): boolean {
  return a.startTime < b.endTime && a.endTime > b.startTime
}
