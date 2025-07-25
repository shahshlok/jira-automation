import { cn } from '@/lib/utils';

interface StatusPillProps {
  status: string;
  className?: string;
}

const getStatusConfig = (status: string) => {
  // Map common Jira status names to colors
  const lowerStatus = status.toLowerCase();
  
  if (lowerStatus.includes('pass')) {
    return {
      className: 'bg-green-500/20 text-green-700',
      label: 'Passing'
    };
  }
  
  if (lowerStatus.includes('partial')) {
    return {
      className: 'bg-amber-400/20 text-amber-700',
      label: 'Partial'
    };
  }
  
  if (lowerStatus.includes('break') || lowerStatus.includes('fail')) {
    return {
      className: 'bg-red-500/20 text-red-700',
      label: 'Breaking'
    };
  }
  
  if (lowerStatus.includes('backlog')) {
    return {
      className: 'bg-slate-400/20 text-slate-700',
      label: 'Backlog'
    };
  }
  
  // Default for pending, unknown, etc.
  return {
    className: 'bg-gray-300 text-gray-800',
    label: status
  };
};

export function StatusPill({ status, className }: StatusPillProps) {
  const config = getStatusConfig(status);
  
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