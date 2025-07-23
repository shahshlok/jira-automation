import { formatDistanceToNow } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusPill } from './StatusPill';
import type { TestCase } from '../../api/mockData';

interface TestCaseTableProps {
  testCases: TestCase[];
}

export function TestCaseTable({ testCases }: TestCaseTableProps) {
  if (testCases.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Test Cases</h3>
        <div className="text-center py-8 text-muted-foreground">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <p>No test cases available for this story</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold">Test Cases ({testCases.length})</h3>
      </div>
      
      <div className="overflow-auto max-h-96">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[120px]">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testCases.map((testCase) => (
              <TableRow key={testCase.id} className="hover:bg-accent/50">
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {testCase.id}
                </TableCell>
                <TableCell className="max-w-0 truncate" title={testCase.description}>
                  {testCase.description}
                </TableCell>
                <TableCell>
                  <StatusPill status={testCase.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(testCase.lastUpdated), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}