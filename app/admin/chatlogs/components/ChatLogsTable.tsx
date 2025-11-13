'use client'

import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, Eye, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { ChatLog } from '@/lib/chatLogger'

interface ChatLogsTableProps {
  logs: ChatLog[]
  onViewDetails: (log: ChatLog) => void
  onMarkReplied: (chatId: string) => Promise<void>
}

export function ChatLogsTable({ logs, onViewDetails, onMarkReplied }: ChatLogsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'timestamp', desc: true }])
  const [isMarking, setIsMarking] = useState<string | null>(null)

  const columns = useMemo<ColumnDef<ChatLog>[]>(
    () => [
      {
        accessorKey: 'timestamp',
        header: ({ column }) => {
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-1 hover:text-primary-600"
            >
              Timestamp
              <ArrowUpDown className="h-4 w-4" />
            </button>
          )
        },
        cell: ({ row }) => {
          const date = new Date(row.original.timestamp)
          return (
            <div className="text-sm">
              <div className="font-medium">{date.toLocaleDateString()}</div>
              <div className="text-slate-500">{date.toLocaleTimeString()}</div>
            </div>
          )
        },
      },
      {
        accessorKey: 'userMessage',
        header: 'User Message',
        cell: ({ row }) => {
          const message = row.original.userMessage
          const truncated = message.length > 60 ? message.slice(0, 60) + '...' : message
          return (
            <div className="text-sm max-w-xs">
              <p className="truncate" title={message}>
                {truncated}
              </p>
            </div>
          )
        },
      },
      {
        accessorKey: 'assistantResponse',
        header: 'Assistant Response',
        cell: ({ row }) => {
          const response = row.original.assistantResponse
          const truncated = response.length > 60 ? response.slice(0, 60) + '...' : response
          return (
            <div className="text-sm max-w-xs">
              <p className="truncate" title={response}>
                {truncated}
              </p>
            </div>
          )
        },
      },
      {
        accessorKey: 'pageContext',
        header: 'Page Context',
        cell: ({ row }) => {
          const context = row.original.pageContext
          return (
            <div className="text-sm">
              <div className="text-slate-600">{context?.page || 'N/A'}</div>
              {context?.videoId && (
                <div className="text-xs text-slate-500">Video: {context.videoId}</div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'needsHumanReply',
        header: ({ column }) => {
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-1 hover:text-primary-600"
            >
              Status
              <ArrowUpDown className="h-4 w-4" />
            </button>
          )
        },
        cell: ({ row }) => {
          const needsReply = row.original.needsHumanReply
          return (
            <div className="flex items-center gap-2">
              {needsReply ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                  <AlertCircle className="h-3 w-3" />
                  Needs Reply
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  <CheckCircle className="h-3 w-3" />
                  Replied
                </span>
              )}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const log = row.original
          const needsReply = log.needsHumanReply

          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewDetails(log)}
                className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
                View
              </button>

              {needsReply && (
                <button
                  onClick={async () => {
                    setIsMarking(log.id)
                    try {
                      await onMarkReplied(log.id)
                    } finally {
                      setIsMarking(null)
                    }
                  }}
                  disabled={isMarking === log.id}
                  className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1 disabled:opacity-50"
                  title="Mark as Replied"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isMarking === log.id ? 'Marking...' : 'Mark Replied'}
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [onViewDetails, onMarkReplied, isMarking]
  )

  const table = useReactTable({
    data: logs,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  })

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <p className="text-slate-500">No chat logs found for the selected filters.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700">
            Showing{' '}
            <span className="font-medium">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                logs.length
              )}
            </span>{' '}
            of <span className="font-medium">{logs.length}</span> results
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-700">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
