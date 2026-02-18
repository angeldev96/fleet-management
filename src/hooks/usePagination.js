import { useState, useCallback, useMemo } from "react";

/**
 * Hook to manage pagination state
 * @param {Object} options
 * @param {number} options.initialPage - Initial page number (default: 1)
 * @param {number} options.initialPageSize - Initial page size (default: 10)
 * @param {number} options.totalCount - Total number of items (default: 0)
 * @returns {Object} Pagination state and controls
 */
export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  totalCount = 0,
} = {}) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate range for Supabase .range(from, to)
  const range = useMemo(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  }, [page, pageSize]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pageSize) || 1;
  }, [totalCount, pageSize]);

  // Navigation functions
  const goToPage = useCallback(
    (newPage) => {
      const maxPage = Math.ceil(totalCount / pageSize) || 1;
      setPage(Math.max(1, Math.min(newPage, maxPage)));
    },
    [totalCount, pageSize]
  );

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);

  // Reset to page 1 (useful when search changes)
  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  // Change page size and reset to page 1
  const changePageSize = useCallback((newSize) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  return {
    page,
    pageSize,
    setPageSize: changePageSize,
    range,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export default usePagination;
