import { useState, useEffect } from 'react';
import { ChevronDown, Loader2, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useProjects } from '../hooks/useProjects';

interface HeaderProps {
  selectedProjectKey: string | null;
  onProjectChange: (projectKey: string) => void;
  isUpdating: boolean;
}

export function Header({ selectedProjectKey, onProjectChange, isUpdating }: HeaderProps) {
  const { data: projects, isLoading } = useProjects();
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('http://localhost:5000/auth/me', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/', { replace: true });
          return;
        }
        throw new Error('Failed to fetch user info');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user info:', err);
    } finally {
      setUserLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/', { replace: true });
    }
  };

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

      {/* Right: Project Picker, User Greeting & Logout */}
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

        {/* User Profile Section */}
        {!userLoading && user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-auto">
                <User className="h-4 w-4" />
                <span className="text-sm text-foreground">
                  Hello, {user.name || user.email}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-600">
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}