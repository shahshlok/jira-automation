import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { StoryPanel } from '../components/Story/StoryPanel';
import { useProjects } from '../hooks/useProjects';
import { fetchEpics, fetchStories } from '../api/fetchHelpers';
import { loadProject, saveProject } from '../utils/projectStorage';
import type { Story, Epic } from '../api/mockData';

// Extended Epic type to include stories
export type EpicWithStories = Epic & {
  stories: Story[];
};

export default function Dashboard() {
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(() => 
    loadProject() || null
  );
  const [selectedStoryKey, setSelectedStoryKey] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [epicsWithStories, setEpicsWithStories] = useState<EpicWithStories[]>([]);
  
  const { data: projects } = useProjects();

  // Sync after /api/projects fetch
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectKey) {
      const stored = loadProject();
      const fallback = projects[0]?.key;
      const projectToSelect = stored && projects.some(p => p.key === stored) ? stored : fallback;
      if (projectToSelect) {
        setSelectedProjectKey(projectToSelect);
      }
    }
  }, [projects, selectedProjectKey]);

  // Fetch epics and stories when project changes
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!selectedProjectKey) {
        setEpicsWithStories([]);
        return;
      }

      try {
        console.log(`Fetching epics and stories for project ${selectedProjectKey}...`);
        
        // Fetch epics and stories in parallel
        const [epics, stories] = await Promise.all([
          fetchEpics(selectedProjectKey),
          fetchStories(selectedProjectKey)
        ]);
        
        // Group stories by their Epic Link
        const storiesByEpic: Record<string, Story[]> = {};
        
        stories.forEach(story => {
          const epicKey = story.epicLink;
          if (epicKey) {
            if (!storiesByEpic[epicKey]) {
              storiesByEpic[epicKey] = [];
            }
            storiesByEpic[epicKey].push(story);
          }
        });
        
        // Combine epics with their stories
        const epicsWithStoriesData: EpicWithStories[] = epics.map(epic => ({
          ...epic,
          stories: storiesByEpic[epic.key] || []
        }));
        
        setEpicsWithStories(epicsWithStoriesData);
        
        console.log(`✅ Fetched ${epics.length} epics and ${stories.length} stories for project ${selectedProjectKey}`);
      } catch (error) {
        console.error(`Error fetching data for project ${selectedProjectKey}:`, error);
        setEpicsWithStories([]);
      }
    };

    fetchProjectData();
  }, [selectedProjectKey]);

  // Polling stub for real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setIsUpdating(true);
      // TODO: refetch endpoints when backend is ready
      setTimeout(() => setIsUpdating(false), 1000);
    }, 60_000); // Every 60 seconds
    
    return () => clearInterval(timer);
  }, []);

  const handleProjectChange = (newKey: string) => {
    setSelectedProjectKey(newKey);
    saveProject(newKey);
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
          epicsWithStories={epicsWithStories}
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