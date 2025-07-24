import { useState } from 'react';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SearchBox } from './SearchBox';
import { TreeView } from './TreeView';
import type { Story } from '../../api/mockData';
import type { EpicWithStories } from '../../pages/Dashboard';

interface SidebarProps {
  projectKey: string | null;
  epicsWithStories: EpicWithStories[];
  selectedStoryKey: string | null;
  onStorySelect: (storyKey: string, story: Story) => void;
}

export function Sidebar({ projectKey, epicsWithStories, selectedStoryKey, onStorySelect }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

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

            {/* API Tester Button */}
            <div className="px-3 mb-3">
              <Button
                variant={location.pathname === '/api-tester' ? 'default' : 'outline'}
                size="sm"
                onClick={() => navigate('/api-tester')}
                className="w-full justify-start gap-2"
              >
                <Settings className="h-4 w-4" />
                API Tester
              </Button>
            </div>

            {/* Tree View */}
            <div className="flex-1 overflow-y-auto">
              <TreeView
                projectKey={projectKey}
                epicsWithStories={epicsWithStories}
                selectedStoryKey={selectedStoryKey}
                onStorySelect={onStorySelect}
                searchFilter={searchFilter}
              />
            </div>
          </>
        )}
        
        {isCollapsed && (
          <div className="p-2 space-y-2">
            {projectKey && (
              <div className="text-center">
                <div className="w-8 h-8 bg-brand/10 rounded flex items-center justify-center mx-auto">
                  <span className="text-xs font-bold text-brand">{projectKey}</span>
                </div>
              </div>
            )}
            <div className="text-center">
              <Button
                variant={location.pathname === '/api-tester' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate('/api-tester')}
                className="h-8 w-8 p-0"
                aria-label="API Tester"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}