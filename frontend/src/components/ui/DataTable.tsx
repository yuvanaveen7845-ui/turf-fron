import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { TableSkeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchableKey?: keyof T | ((item: T) => string);
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  emptyActionText?: string;
  pageSize?: number;
  headerActions?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  searchPlaceholder = "Search records...",
  searchableKey,
  emptyTitle = "No records found",
  emptyDescription = "There are currently no items matching your criteria.",
  onEmptyAction,
  emptyActionText,
  pageSize = 10,
  headerActions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Safe Data Guard
  const safeData = Array.isArray(data) ? data : [];

  // Filter
  const filteredData = React.useMemo(() => {
    if (!searchTerm.trim() || !searchableKey) return safeData;
    return safeData.filter((item) => {
      const val =
        typeof searchableKey === "function"
          ? searchableKey(item)
          : String(item[searchableKey] || "");
      return val.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [safeData, searchTerm, searchableKey]);

  // Sort
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const res = aVal > bVal ? 1 : -1;
      return sortDirection === "asc" ? res : -res;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Top Action & Search Bar */}
      {(searchableKey || headerActions) && (
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#F8FAFC]/50">
          {searchableKey && (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          )}

          {headerActions && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[220px]">
        {isLoading ? (
          <TableSkeleton rows={pageSize > 5 ? 5 : pageSize} cols={columns.length} />
        ) : paginatedData.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionText={emptyActionText}
            onAction={onEmptyAction}
          />
        ) : (
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`py-3.5 px-4 ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    } ${col.className || ""}`}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-slate-900 transition cursor-pointer"
                      >
                        <span>{col.header}</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paginatedData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3.5 px-4 ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      } ${col.className || ""}`}
                    >
                      {col.render
                        ? col.render(item)
                        : (item as any)[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!isLoading && sortedData.length > pageSize && (
        <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 bg-[#F8FAFC]/50">
          <div>
            Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> to{" "}
            <span className="font-semibold text-slate-700">{Math.min(currentPage * pageSize, sortedData.length)}</span> of{" "}
            <span className="font-semibold text-slate-700">{sortedData.length}</span> records
          </div>

          <div className="flex items-center gap-1.5 sm:mr-16">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-700 px-2 min-w-[3rem] text-center">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Next page"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
