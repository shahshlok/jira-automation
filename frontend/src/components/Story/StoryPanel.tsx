import { useState } from 'react';
import { ChevronDown, ChevronUp, User, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PieStatusChart } from './PieStatusChart';
import { TestCaseTable } from './TestCaseTable';
import { ChatBotPanel } from './ChatBotPanel';
import { useTestCases } from '../../hooks/useTestCases';
import type { Story } from '../../api/mockData';

interface StoryPanelProps {
  selectedStory: Story | null;
}

export function StoryPanel({ selectedStory }: StoryPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { data: testCases = [], isLoading } = useTestCases(selectedStory?.key || null);

  if (!selectedStory) {
    return (
      <div className="flex-1 flex items-center justify-center bg-pastel-light">
        <div className="text-center text-muted-foreground">
          <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-sm">
            <span className="text-4xl">📊</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Select a Story</h2>
          <p>Choose a story from the sidebar to view its test case status and coverage</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-pastel-light p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Title Row */}
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{selectedStory.key}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-expanded={showAdvanced}
                >
                  Show advanced {showAdvanced ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </Button>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {selectedStory.summary}
              </p>
            </div>
          </div>

          {/* Advanced Details */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
                  {/* Assignee */}
                  {selectedStory.assignee && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Assignee:</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedStory.assignee.avatarUrl} alt={selectedStory.assignee.displayName} />
                          <AvatarFallback className="text-xs">
                            {selectedStory.assignee.displayName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{selectedStory.assignee.displayName}</span>
                      </div>
                    </div>
                  )}

                  {/* Priority */}
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Priority:</span>
                    <Badge variant={
                      selectedStory.priority.name === 'Critical' ? 'destructive' :
                      selectedStory.priority.name === 'High' ? 'default' : 
                      'secondary'
                    }>
                      {selectedStory.priority.name}
                    </Badge>
                  </div>

                  {/* Updated */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Updated: {new Date(selectedStory.updated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Chart */}
        <PieStatusChart testCases={testCases} />

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left: Test Cases Table */}
          <div className="order-2 xl:order-1">
            {isLoading ? (
              <div className="bg-white rounded-lg border border-border p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <TestCaseTable testCases={testCases} />
            )}
          </div>

          {/* Right: AI Chat Panel */}
          <div className="order-1 xl:order-2">
            <ChatBotPanel story={selectedStory} testCases={testCases} />
          </div>
        </div>
      </div>
    </div>
  );
}