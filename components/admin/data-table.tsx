'use client';

import { useState, useEffect, ReactNode } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    ColumnDef,
    flexRender,
    SortingState,
    ColumnFiltersState,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Loader2,
} from 'lucide-react';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    loading?: boolean;
    searchPlaceholder?: string;
    searchColumn?: string;
    pageSize?: number;
    totalItems?: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    serverSidePagination?: boolean;
    emptyMessage?: string;
    headerActions?: ReactNode;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    loading = false,
    searchPlaceholder = 'Search...',
    searchColumn,
    pageSize = 10,
    totalItems,
    currentPage = 1,
    onPageChange,
    serverSidePagination = false,
    emptyMessage = 'No results found.',
    headerActions,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: serverSidePagination ? undefined : getPaginationRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize,
            },
        },
    });

    const totalPages = serverSidePagination
        ? Math.ceil((totalItems || 0) / pageSize)
        : table.getPageCount();

    const handlePageChange = (page: number) => {
        if (serverSidePagination && onPageChange) {
            onPageChange(page);
        } else {
            table.setPageIndex(page - 1);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header with search and actions */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-9"
                    />
                </div>
                {headerActions}
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                                        >
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={cn(
                                                        "flex items-center gap-2",
                                                        header.column.getCanSort() && "cursor-pointer select-none hover:text-foreground transition-colors"
                                                    )}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {header.column.getCanSort() && (
                                                        <span className="w-4 h-4">
                                                            {header.column.getIsSorted() === 'asc' ? (
                                                                <ArrowUp className="w-4 h-4" />
                                                            ) : header.column.getIsSorted() === 'desc' ? (
                                                                <ArrowDown className="w-4 h-4" />
                                                            ) : (
                                                                <ArrowUpDown className="w-4 h-4 opacity-50" />
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="bg-card hover:bg-muted/50 transition-colors"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3 text-sm text-foreground">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                    {serverSidePagination ? (
                        <>
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems || 0)} of {totalItems || 0} results
                        </>
                    ) : (
                        <>
                            Showing {table.getState().pagination.pageIndex * pageSize + 1} to{' '}
                            {Math.min(
                                (table.getState().pagination.pageIndex + 1) * pageSize,
                                table.getFilteredRowModel().rows.length
                            )}{' '}
                            of {table.getFilteredRowModel().rows.length} results
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={serverSidePagination ? currentPage === 1 : !table.getCanPreviousPage()}
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(serverSidePagination ? currentPage - 1 : table.getState().pagination.pageIndex)}
                        disabled={serverSidePagination ? currentPage === 1 : !table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <span className="text-sm text-muted-foreground px-2">
                        Page {serverSidePagination ? currentPage : table.getState().pagination.pageIndex + 1} of {totalPages}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(serverSidePagination ? currentPage + 1 : table.getState().pagination.pageIndex + 2)}
                        disabled={serverSidePagination ? currentPage >= totalPages : !table.getCanNextPage()}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={serverSidePagination ? currentPage >= totalPages : !table.getCanNextPage()}
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
