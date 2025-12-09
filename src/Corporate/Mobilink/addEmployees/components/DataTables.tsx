import React, { useState, useMemo } from 'react';
import { FaSort, FaSortUp, FaSortDown, FaSearch, FaDownload, FaCaretLeft, FaCaretRight } from 'react-icons/fa';

interface DataTableProps {
  data: CellData[];
  headers: string[];
  sheetName: string;
}

interface CellData {
  [key: string]: string | number | boolean | null;
}

type SortDirection = 'asc' | 'desc' | 'none';

const DataTable: React.FC<DataTableProps> = ({ data, headers, sheetName }) => {
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('none');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 20;

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || sortDirection === 'none') return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      
      return sortDirection === 'asc' 
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString);
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Cycle through sort states: none -> asc -> desc -> none
      if (sortDirection === 'none') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortDirection('none');
        setSortColumn('');
        return;
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <FaSort className="text-gray-400" />;
    if (sortDirection === 'asc') return <FaSortUp className="text-blue-500" />;
    if (sortDirection === 'desc') return <FaSortDown className="text-blue-500" />;
    return <FaSort className="text-gray-400" />;
  };

  const handleExportCSV = () => {
    if (sortedData.length === 0) return;
    
    // Convert data to CSV
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    sortedData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quotes
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
          ? `"${escaped}"` 
          : escaped;
      });
      csvRows.push(values.join(','));
    });
    
    // Create and download CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${sheetName || 'data'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <p className="text-gray-500 text-lg">No data available in this sheet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Table Controls */}
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-auto sm:min-w-[300px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search in data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-red-500 font-medium hover:text-red-600 px-2"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <div className="text-gray-600 text-sm font-medium whitespace-nowrap">
              Showing <span className="font-bold">{paginatedData.length}</span> of <span className="font-bold">{sortedData.length}</span> rows
            </div>
            <button 
              onClick={handleExportCSV}
              disabled={sortedData.length === 0}
              className={`
                font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 
                flex items-center justify-center gap-2 whitespace-nowrap
                ${sortedData.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
                }
              `}
            >
              <FaDownload /> Export CSV
            </button>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full">
          <thead className="bg-gray-800 sticky top-0 z-10">
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  onClick={() => handleSort(header)}
                  className={`
                    px-4 py-3.5 text-left font-semibold text-white
                    hover:bg-gray-700 transition-colors duration-150
                    cursor-pointer select-none
                    ${sortColumn === header ? 'bg-gray-900' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate max-w-[200px]" title={header}>
                      {header}
                    </span>
                    <span className="ml-2 flex-shrink-0">
                      {getSortIcon(header)}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={`
                  hover:bg-gray-50 transition-colors duration-150
                  ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                `}
              >
                {headers.map((header, colIndex) => (
                  <td 
                    key={colIndex}
                    className="px-4 py-3 text-gray-700 max-w-xs overflow-hidden"
                  >
                    {row[header] !== null && row[header] !== undefined 
                      ? <span className="line-clamp-2" title={String(row[header])}>{String(row[header])}</span>
                      : <span className="text-gray-400 italic">(empty)</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 whitespace-nowrap">
              Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors duration-200
                  ${currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100' 
                    : 'text-gray-700 hover:bg-gray-200 bg-white'
                  }
                `}
              >
                <FaCaretLeft /> Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`
                        min-w-[40px] h-10 rounded-lg font-medium transition-colors duration-150
                        flex items-center justify-center
                        ${currentPage === pageNum 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-gray-200 bg-white'
                        }
                      `}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <span className="px-3 text-gray-500">... of {totalPages}</span>
                )}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors duration-200
                  ${currentPage === totalPages 
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100' 
                    : 'text-gray-700 hover:bg-gray-200 bg-white'
                  }
                `}
              >
                Next <FaCaretRight />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Data Summary */}
      <div className="p-4 border-t border-gray-200 bg-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="font-semibold">{headers.length}</span> columns
            </span>
            <span className="flex items-center gap-1">
              <span className="font-semibold">{data.length}</span> total rows
            </span>
            {searchTerm && (
              <span className="flex items-center gap-1">
                <span className="font-semibold">{filteredData.length}</span> filtered rows
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Sheet: <span className="font-medium">{sheetName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;