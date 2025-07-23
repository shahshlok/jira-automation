import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { StoryPanel } from '../components/Story/StoryPanel';
import { useProjects } from '../hooks/useProjects';
import { fetchEpics } from '../api/fetchHelpers';
import type { Story } from '../api/mockData';

export default function Dashboard() {
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(null);
  const [selectedStoryKey, setSelectedStoryKey] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { data: projects } = useProjects();

  // Auto-select first project when projects load
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectKey) {
      setSelectedProjectKey(projects[0].key);
    }
  }, [projects, selectedProjectKey]);

  // Fetch and log epics for project P1 on component mount
  useEffect(() => {
    const fetchAndLogEpics = async () => {
      try {
        console.log('Fetching epics for project P1...');
        await fetchEpics('P1');
      } catch (error) {
        console.error('Error fetching epics for project P1:', error);
      }
    };

    fetchAndLogEpics();
  }, []); // Empty dependency array means this runs once on mount

  // Polling stub for real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setIsUpdating(true);
      // TODO: refetch endpoints when backend is ready
      setTimeout(() => setIsUpdating(false), 1000);
    }, 60_000); // Every 60 seconds
    
    return () => clearInterval(timer);
  }, []);

  const handleProjectChange = (projectKey: string) => {
    setSelectedProjectKey(projectKey);
    // Clear story selection when project changes
    setSelectedStoryKey(null);
    setSelectedStory(null);
  };

  const handleStorySelect = (storyKey: string, story: Story) => {
    setSelectedStoryKey(storyKey);
    setSelectedStory(story);
  };

  return (
    <div className="min-h-screen bg-pastel-light">
      {/* Header */}
      <Header
        selectedProjectKey={selectedProjectKey}
        onProjectChange={handleProjectChange}
        isUpdating={isUpdating}
      />

      {/* Main Layout */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <Sidebar
          projectKey={selectedProjectKey}
          selectedStoryKey={selectedStoryKey}
          onStorySelect={handleStorySelect}
        />

        {/* Main Content - adjust left margin based on sidebar */}
        <main className="flex-1 ml-[280px] transition-all duration-200">
          <StoryPanel selectedStory={selectedStory} />
        </main>
      </div>
    </div>
  );
}