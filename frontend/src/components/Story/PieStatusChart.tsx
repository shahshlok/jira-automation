import { PieChart } from 'react-minimal-pie-chart';
import { StatusPill } from './StatusPill';
import type { TestCase } from '../../api/fetchHelpers';

interface PieStatusChartProps {
  testCases: TestCase[];
}

const getStatusColor = (status: string) => {
  const lowerStatus = status.toLowerCase();
  
  if (lowerStatus.includes('pass')) return '#10b981'; // green-500
  if (lowerStatus.includes('partial')) return '#f59e0b'; // amber-500
  if (lowerStatus.includes('break') || lowerStatus.includes('fail')) return '#ef4444'; // red-500
  if (lowerStatus.includes('backlog')) return '#94a3b8'; // slate-400
  
  return '#d1d5db'; // gray-300 for pending/unknown
};

export function PieStatusChart({ testCases }: PieStatusChartProps) {
  // Calculate status counts
  const statusCounts = testCases.reduce((acc, testCase) => {
    acc[testCase.status] = (acc[testCase.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = testCases.length;
  
  // Prepare data for pie chart
  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    title: status,
    value: count,
    color: getStatusColor(status),
  }));

  if (total === 0) {
    return (
      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Test Status Overview</h3>
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-2" />
            <p>No test cases found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold mb-4">Test Status Overview</h3>
      
      <div className="flex items-center gap-6">
        {/* Pie Chart */}
        <div className="flex-shrink-0">
          <PieChart
            data={pieData}
            style={{ height: '160px', width: '160px' }}
            lineWidth={60}
            paddingAngle={2}
            animate
            animationDuration={500}
            label={({ dataEntry }) => `${Math.round((dataEntry.value / total) * 100)}%`}
            labelStyle={{
              fontSize: '8px',
              fontWeight: 'bold',
              fill: '#fff',
            }}
            labelPosition={70}
          />
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Status Breakdown</h4>
          {Object.entries(statusCounts).map(([status, count]) => {
            const percentage = Math.round((count / total) * 100);
            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusPill status={status} />
                </div>
                <div className="text-sm text-muted-foreground">
                  {count} ({percentage}%)
                </div>
              </div>
            );
          })}
          <div className="pt-2 border-t border-border text-sm font-medium">
            Total: {total} test cases
          </div>
        </div>
      </div>
    </div>
  );
}