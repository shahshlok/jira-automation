import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Zap, Ban, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Story } from '../../api/mockData';
import type { EpicWithStories } from '../../pages/Dashboard';

interface TreeViewProps {
  projectKey: string | null;
  epicsWithStories: EpicWithStories[];
  selectedStoryKey: string | null;
  onStorySelect: (storyKey: string, story: Story) => void;
  searchFilter: string;
}

interface TreeNodeProps {
  label: string;
  icon: React.ReactNode;
  level: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  isSelected?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

function TreeNode({ 
  label, 
  icon, 
  level, 
  isExpanded, 
  onToggle, 
  isSelected, 
  onClick, 
  children 
}: TreeNodeProps) {
  const hasChildren = !!children;
  
  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 cursor-pointer text-sm hover:bg-accent/50 transition-colors",
          "border-l-2 border-transparent",
          isSelected && "bg-brand/10 border-l-brand text-brand font-medium",
          level > 0 && "ml-4"
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
          if (e.key === 'ArrowRight' && hasChildren && !isExpanded) {
            onToggle?.();
          }
          if (e.key === 'ArrowLeft' && hasChildren && isExpanded) {
            onToggle?.();
          }
        }}
        tabIndex={0}
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className="flex items-center justify-center w-4 h-4 hover:bg-accent rounded-sm"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        {icon}
        <span className="truncate flex-1">{label}</span>
      </div>
      
      <AnimatePresence>
        {isExpanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TreeView({ projectKey, epicsWithStories, selectedStoryKey, onStorySelect, searchFilter }: TreeViewProps) {
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

  const toggleEpic = (epicKey: string) => {
    const newExpanded = new Set(expandedEpics);
    if (newExpanded.has(epicKey)) {
      newExpanded.delete(epicKey);
    } else {
      newExpanded.add(epicKey);
    }
    setExpandedEpics(newExpanded);
  };

  // Auto-expand epics that have stories and epic containing selected story
  useEffect(() => {
    if (epicsWithStories && epicsWithStories.length > 0) {
      const newExpanded = new Set(expandedEpics);
      
      // Auto-expand epics that have stories
      epicsWithStories.forEach(epic => {
        if (epic.stories && epic.stories.length > 0) {
          newExpanded.add(epic.key);
        }
      });
      
      // Also expand epic containing selected story
      if (selectedStoryKey) {
        const epic = epicsWithStories.find(epic => 
          epic.stories.some(story => story.key === selectedStoryKey)
        );
        if (epic) {
          newExpanded.add(epic.key);
        }
      }
      
      setExpandedEpics(newExpanded);
    }
  }, [selectedStoryKey, epicsWithStories]);

  const filteredEpics = epicsWithStories.filter(epic => 
    epic.summary.toLowerCase().includes(searchFilter.toLowerCase()) ||
    epic.key.toLowerCase().includes(searchFilter.toLowerCase()) ||
    epic.stories.some(story => 
      story.summary.toLowerCase().includes(searchFilter.toLowerCase()) ||
      story.key.toLowerCase().includes(searchFilter.toLowerCase())
    )
  );

  if (!projectKey) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Select a project to view epics and stories</p>
      </div>
    );
  }

  return (
    <div className="py-2" role="tree">
      {filteredEpics.map((epic) => {
        const isEpicExpanded = expandedEpics.has(epic.key);
        
        const filteredStories = epic.stories.filter(story =>
          story.summary.toLowerCase().includes(searchFilter.toLowerCase()) ||
          story.key.toLowerCase().includes(searchFilter.toLowerCase())
        );

        return (
          <TreeNode
            key={epic.key}
            label={epic.summary}
            icon={<Zap className="h-4 w-4 text-blue-500" />}
            level={0}
            isExpanded={isEpicExpanded}
            onToggle={() => toggleEpic(epic.key)}
          >
            {filteredStories.map((story) => (
              <TreeNode
                key={story.key}
                label={`${story.key}: ${story.summary}`}
                icon={<ListChecks className="h-4 w-4 text-green-600" />}
                level={1}
                isSelected={selectedStoryKey === story.key}
                onClick={() => onStorySelect(story.key, story)}
              />
            ))}
            {isEpicExpanded && filteredStories.length === 0 && (
              <div className="ml-8 py-2 px-3 text-sm text-muted-foreground">
                No stories found
              </div>
            )}
          </TreeNode>
        );
      })}
      
      {filteredEpics.length === 0 && (
        <div className="p-4 text-center text-muted-foreground">
          <Ban className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No epics found</p>
        </div>
      )}
    </div>
  );
}