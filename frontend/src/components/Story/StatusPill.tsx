import { cn } from '@/lib/utils';
import type { TestCase } from '../../api/mockData';

interface StatusPillProps {
  status: TestCase['status'];
  className?: string;
}

const statusConfig = {
  'Pending': {
    className: 'bg-gray-300 text-gray-800',
    label: 'Pending'
  },
  'Breaking': {
    className: 'bg-red-500/20 text-red-700',
    label: 'Breaking'
  },
  'Partial Passing': {
    className: 'bg-amber-400/20 text-amber-700',
    label: 'Partial'
  },
  'Passing': {
    className: 'bg-green-500/20 text-green-700',
    label: 'Passing'
  }
} as const;

export function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 text-xs font-medium rounded-sm',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}