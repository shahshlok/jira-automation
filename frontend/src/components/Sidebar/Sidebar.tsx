import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SearchBox } from './SearchBox';
import { TreeView } from './TreeView';
import type { Story } from '../../api/mockData';

interface SidebarProps {
  projectKey: string | null;
  selectedStoryKey: string | null;
  onStorySelect: (storyKey: string, story: Story) => void;
}

export function Sidebar({ projectKey, selectedStoryKey, onStorySelect }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  return (
    <motion.aside
      className="fixed left-0 top-16 bottom-0 bg-white border-r border-border z-40 flex flex-col"
      animate={{
        width: isCollapsed ? 60 : 280,
      }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        {!isCollapsed && (
          <h2 className="text-sm font-medium text-foreground">Project Explorer</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-accent"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {!isCollapsed && (
          <>
            {/* Search Box */}
            <div className="p-3">
              <SearchBox
                value={searchFilter}
                onChange={setSearchFilter}
                placeholder="Search epics and stories..."
              />
            </div>

            {/* Tree View */}
            <div className="flex-1 overflow-y-auto">
              <TreeView
                projectKey={projectKey}
                selectedStoryKey={selectedStoryKey}
                onStorySelect={onStorySelect}
                searchFilter={searchFilter}
              />
            </div>
          </>
        )}
        
        {isCollapsed && projectKey && (
          <div className="p-2 text-center">
            <div className="w-8 h-8 bg-brand/10 rounded flex items-center justify-center mx-auto">
              <span className="text-xs font-bold text-brand">{projectKey}</span>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}