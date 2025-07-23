import { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProjects } from '../hooks/useProjects';

interface HeaderProps {
  selectedProjectKey: string | null;
  onProjectChange: (projectKey: string) => void;
  isUpdating: boolean;
}

export function Header({ selectedProjectKey, onProjectChange, isUpdating }: HeaderProps) {
  const { data: projects, isLoading } = useProjects();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-border z-50 flex items-center justify-between px-6">
      {/* Left: Brand Mark */}
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          {/* Brand SVG */}
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-brand">
            <circle cx="16" cy="16" r="14" fill="currentColor" />
            <path
              d="M12 16l3 3 6-6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span className="ml-2 text-xl font-semibold text-foreground">TestCase Status</span>
        </div>
        
        {/* Update indicator */}
        {isUpdating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Right: Project Picker & User Avatar */}
      <div className="flex items-center gap-4">
        {/* Project Picker */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Project:</span>
          <Select
            value={selectedProjectKey || ''}
            onValueChange={onProjectChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select project..." />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project) => (
                <SelectItem key={project.key} value={project.key}>
                  <div className="flex items-center gap-2">
                    <img 
                      src={project.avatarUrl} 
                      alt=""
                      className="w-4 h-4 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span>{project.name}</span>
                    <span className="text-muted-foreground">({project.key})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src="/avatars/current-user.jpg" alt="Current user" />
          <AvatarFallback className="bg-brand text-brand-foreground text-sm font-medium">
            QA
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}