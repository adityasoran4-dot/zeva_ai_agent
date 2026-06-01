import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface Column {
  key: string;
  title: string;
  render?: (value: any, record: any) => React.ReactNode;
}

interface Pagination {
  totalResults: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasMore: boolean;
}

interface PaginatedTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onSearch?: (searchTerm: string) => void;
  searchPlaceholder?: string;
  emptyText?: string;
  rowKey?: string;
  className?: string;
}

const PaginatedTable: React.FC<PaginatedTableProps> = ({
  data = [],
  columns,
  loading = false,
  pagination,
  onPageChange,
  onSearch,
  searchPlaceholder = 'Search...',
  emptyText = 'No data found',
  rowKey = '_id',
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const debouncedOnSearch = useCallback((term: string) => {
    if (onSearch) {
      const timer = setTimeout(() => {
        onSearch(term);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onSearch]);
  
  useEffect(() => {
    debouncedOnSearch(searchTerm);
  }, [searchTerm, debouncedOnSearch]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= pagination.totalPages; i++) {
      if (i === 1 || i === pagination.totalPages || (i >= pagination.currentPage - delta && i <= pagination.currentPage + delta)) {
        range.push(i);
      }
    }

    let prev;
    for (const i of range) {
      if (prev) {
        if (i - prev === 2) rangeWithDots.push(prev + 1);
        else if (i - prev !== 1) rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Search Bar */}
      {onSearch && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Loading...</p>
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((record) => (
                <tr key={record[rowKey]} className="hover:bg-gray-50 transition-colors">
                  {columns.map((column) => (
                    <td key={`${record[rowKey]}-${column.key}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {column.render
                        ? column.render(record[column.key], record)
                        : record[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-500">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(pagination.totalPages > 1 || loading) && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            {loading ? (
              'Loading...'
            ) : (
              `Showing ${(pagination.currentPage - 1) * pagination.limit + 1} to ${Math.min(
                pagination.currentPage * pagination.limit,
                pagination.totalResults
              )} of ${pagination.totalResults} results`
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1 || loading}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all text-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {getPageNumbers().map((page, idx) => (
              page === '...' ? (
                <span key={`dot-${idx}`} className="px-3 py-2 text-gray-600">
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => handlePageChange(Number(page))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pagination.currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-white'
                  }`}
                >
                  {page}
                </button>
              )
            ))}
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages || loading}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all text-gray-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginatedTable;