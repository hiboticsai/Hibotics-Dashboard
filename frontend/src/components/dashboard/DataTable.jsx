import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

// Status badge mapping
const getStatusBadge = (status, type = 'default') => {
  const statusMap = {
    // Call outcomes
    booking: 'bg-emerald-500/20 text-emerald-400',
    lead: 'bg-blue-500/20 text-blue-400',
    faq: 'bg-gray-500/20 text-gray-400',
    voicemail: 'bg-amber-500/20 text-amber-400',
    failed: 'bg-red-500/20 text-red-400',
    // Lead statuses
    new: 'bg-blue-500/20 text-blue-400',
    contacted: 'bg-amber-500/20 text-amber-400',
    booked: 'bg-purple-500/20 text-purple-400',
    won: 'bg-emerald-500/20 text-emerald-400',
    lost: 'bg-red-500/20 text-red-400',
    // Agent statuses
    active: 'bg-emerald-500/20 text-emerald-400',
    inactive: 'bg-gray-500/20 text-gray-400',
    paused: 'bg-amber-500/20 text-amber-400',
    // Billing statuses
    paid: 'bg-emerald-500/20 text-emerald-400',
    pending: 'bg-amber-500/20 text-amber-400',
    overdue: 'bg-red-500/20 text-red-400',
  };

  return statusMap[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-400';
};

export const StatusBadge = ({ status }) => (
  <span 
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(status)}`}
    data-testid={`status-badge-${status}`}
  >
    {status?.charAt(0).toUpperCase() + status?.slice(1)}
  </span>
);

// Generic Data Table Component
export const DataTable = ({
  title,
  columns,
  data,
  loading = false,
  onRowClick,
  emptyMessage = 'No data available',
  actions
}) => {
  if (loading) {
    return (
      <Card className="glass-card" data-testid="data-table-loading">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card" data-testid={`data-table-${title?.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {actions && <div className="flex gap-2">{actions}</div>}
      </CardHeader>
      <CardContent>
        {data?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {columns.map((column) => (
                    <TableHead 
                      key={column.key} 
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((row, rowIndex) => (
                  <TableRow
                    key={row.id || rowIndex}
                    className={`border-b border-border/50 ${onRowClick ? 'cursor-pointer hover:bg-muted/30' : ''}`}
                    onClick={() => onRowClick?.(row)}
                    data-testid={`table-row-${rowIndex}`}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key} className="py-4">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Format date helper
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format duration helper
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format currency helper
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

export default DataTable;
