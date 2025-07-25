"use client"

import { useState, useEffect } from "react"
import { Search, ChevronRight, AlertTriangle, CheckCircle, Clock, XCircle, LogOut, User } from "lucide-react"
import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { fetchProjects, fetchEpics, fetchStories, fetchTestCases, checkAuth, logout, Project, Epic, Story, TestCase } from "@/lib/apiHelpers"
import { saveProject, loadProject, clearProject } from "@/lib/projectStorage"

// Extended Epic type to include stories
export type EpicWithStories = Epic & {
  stories: Story[];
};

// Helper function to calculate aggregated test data for epics
const getEpicAggregatedData = (stories: Story[], testCasesByStory: Record<string, TestCase[]>) => {
  const aggregated = stories.reduce(
    (acc, story) => {
      const testCases = testCasesByStory[story.key] || [];
      const storyStats = testCases.reduce(
        (storyAcc, tc) => {
          const status = tc.status.toLowerCase();
          if (status.includes('pass')) storyAcc.passing++;
          else if (status.includes('partial')) storyAcc.partial++;
          else if (status.includes('break') || status.includes('fail')) storyAcc.breaking++;
          else storyAcc.pending++;
          return storyAcc;
        },
        { passing: 0, partial: 0, breaking: 0, pending: 0 }
      );
      
      return {
        passing: acc.passing + storyStats.passing,
        partial: acc.partial + storyStats.partial,
        breaking: acc.breaking + storyStats.breaking,
        pending: acc.pending + storyStats.pending,
        tests: acc.tests + testCases.length,
      };
    },
    { passing: 0, partial: 0, breaking: 0, pending: 0, tests: 0 },
  )

  const passRate = aggregated.tests > 0 ? Math.round((aggregated.passing / aggregated.tests) * 100) : 0

  return { ...aggregated, passRate }
}

const StackedProgressBar = ({
  passing,
  partial,
  breaking,
  pending,
  total,
}: {
  passing: number
  partial: number
  breaking: number
  pending: number
  total: number
}) => {
  if (total === 0) {
    return <div className="w-full h-2 bg-gray-200 rounded-full" />;
  }

  const passingPercent = (passing / total) * 100
  const partialPercent = (partial / total) * 100
  const breakingPercent = (breaking / total) * 100
  const pendingPercent = (pending / total) * 100

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
      {passing > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${passingPercent}%` }} />}
      {partial > 0 && (
        <div className="bg-amber-500 h-full border-l border-white" style={{ width: `${partialPercent}%` }} />
      )}
      {breaking > 0 && (
        <div className="bg-red-500 h-full border-l border-white" style={{ width: `${breakingPercent}%` }} />
      )}
      {pending > 0 && (
        <div className="bg-gray-400 h-full border-l border-white" style={{ width: `${pendingPercent}%` }} />
      )}
    </div>
  )
}

const StatusDistributionPieChart = ({
  passing,
  partial,
  breaking,
  pending,
  total,
  size = 128,
}: {
  passing: number
  partial: number
  breaking: number
  pending: number
  total: number
  size?: number
}) => {
  if (total === 0) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="w-full h-full rounded-full border-8 border-gray-200"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900">0</span>
        </div>
      </div>
    )
  }

  // Transform data for Recharts
  const data = [
    { name: 'Passing', value: passing, color: '#10b981' },
    { name: 'Partial', value: partial, color: '#f59e0b' },
    { name: 'Breaking', value: breaking, color: '#ef4444' },
    { name: 'Pending', value: pending, color: '#9ca3af' }
  ].filter(item => item.value > 0)

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="px-3 py-2 bg-white text-black text-sm rounded-lg shadow-lg whitespace-nowrap border border-gray-200">
          {`${data.name}: ${data.value} test${data.value !== 1 ? 's' : ''}`}
        </div>
      )
    }
    return null
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx={size / 2}
          cy={size / 2}
          innerRadius={size * 0.25}
          outerRadius={size * 0.4}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </div>
  )
}

export default function Dashboard() {
  // Data state
  const [projects, setProjects] = useState<Project[]>([])
  const [epicsWithStories, setEpicsWithStories] = useState<EpicWithStories[]>([])
  const [testCasesByStory, setTestCasesByStory] = useState<Record<string, TestCase[]>>({})
  
  // UI state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedEpic, setSelectedEpic] = useState<EpicWithStories | null>(null)
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [sidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Loading states
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Load user info and projects on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load user info
        const userData = await checkAuth();
        setUser(userData);
        
        // Load projects
        const projectsData = await fetchProjects();
        setProjects(projectsData);
        
        // Restore selected project from localStorage
        const storedProjectKey = loadProject();
        let projectToSelect = projectsData[0]; // Default to first project
        
        if (storedProjectKey) {
          const storedProject = projectsData.find(p => p.key === storedProjectKey);
          if (storedProject) {
            projectToSelect = storedProject;
          }
        }
        
        if (projectToSelect) {
          setSelectedProject(projectToSelect);
          saveProject(projectToSelect.key);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadInitialData();
  }, []);

  // Load epics and stories when project changes
  useEffect(() => {
    const loadProjectData = async () => {
      if (!selectedProject) {
        setEpicsWithStories([]);
        return;
      }

      setLoadingData(true);
      try {
        const [epics, stories] = await Promise.all([
          fetchEpics(selectedProject.key),
          fetchStories(selectedProject.key)
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
        
        // Load test cases for all stories
        const testCasesPromises = stories.map(async (story) => {
          try {
            const testCases = await fetchTestCases(story.key);
            return { storyKey: story.key, testCases };
          } catch (error) {
            console.error(`Failed to load test cases for ${story.key}:`, error);
            return { storyKey: story.key, testCases: [] };
          }
        });
        
        const testCasesResults = await Promise.all(testCasesPromises);
        const testCasesMap: Record<string, TestCase[]> = {};
        testCasesResults.forEach(result => {
          testCasesMap[result.storyKey] = result.testCases;
        });
        
        setTestCasesByStory(testCasesMap);
        
      } catch (error) {
        console.error('Error fetching project data:', error);
        setEpicsWithStories([]);
      } finally {
        setLoadingData(false);
      }
    };

    loadProjectData();
  }, [selectedProject]);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleProjectChange = (project: Project) => {
    setSelectedProject(project);
    saveProject(project.key);
    setSelectedEpic(null);
    setSelectedStory(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      clearProject();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('pass')) return "text-emerald-600 bg-emerald-50";
    if (lowerStatus.includes('partial')) return "text-amber-600 bg-amber-50";
    if (lowerStatus.includes('break') || lowerStatus.includes('fail')) return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  }

  const getStatusIcon = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('pass')) return <CheckCircle className="w-4 h-4" />;
    if (lowerStatus.includes('partial')) return <AlertTriangle className="w-4 h-4" />;
    if (lowerStatus.includes('break') || lowerStatus.includes('fail')) return <XCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  }

  if (loadingProjects) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="bg-white border-r border-gray-200 w-80">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500 mt-1">{projects.length} active projects</p>
        </div>
        <div className="p-4 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
          {projects.map((project) => {
            // Calculate project stats
            const projectEpics = epicsWithStories.filter(epic => 
              epic.stories.some(story => story.key.startsWith(project.key))
            );
            const projectStories = projectEpics.flatMap(epic => epic.stories);
            const projectTestCases = projectStories.flatMap(story => testCasesByStory[story.key] || []);
            const passRate = projectTestCases.length > 0 ? 
              Math.round((projectTestCases.filter(tc => tc.status.toLowerCase().includes('pass')).length / projectTestCases.length) * 100) : 0;

            return (
              <div
                key={project.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  selectedProject?.id === project.id
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleProjectChange(project)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">{project.name}</h3>
                  <span className="text-xs text-gray-500">{passRate}%</span>
                </div>
                <Progress value={passRate} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{projectEpics.length} epics</span>
                  <span>{projectStories.length} stories</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">DX Test Hub</h1>
              {selectedProject && (
                <Badge variant="outline" className="border-emerald-200 text-slate-50 border bg-green-500">
                  {selectedProject.name}
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="text-gray-600 font-medium"
              >
                <Search className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="ml-2 px-0.5 py-0.5 bg-gray-100 rounded text-xs tracking-[0.2em] tracking-widest">⌘K</kbd>
              </Button>

              <div className="text-sm text-gray-500">Last updated: {currentTime.toLocaleTimeString()}</div>

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 flex">
          {/* Canvas Area */}
          <div className="flex-1 p-6">
            <div className="bg-white rounded-lg border border-gray-200 h-full relative overflow-hidden">
              {loadingData ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-lg">Loading project data...</div>
                </div>
              ) : !selectedProject ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-lg text-gray-500">Select a project to get started</div>
                </div>
              ) : !selectedEpic ? (
                // Epic View
                <div className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProject.name}</h2>
                    <p className="text-gray-600">Click on an epic to explore its stories</p>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {epicsWithStories.map((epic) => {
                      const aggregatedData = getEpicAggregatedData(epic.stories, testCasesByStory)
                      return (
                        <Card
                          key={epic.key}
                          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 group"
                          onClick={() => setSelectedEpic(epic)}
                        >
                          <CardContent className="p-4">
                            <h3 className="font-medium text-gray-900 text-sm mb-3 leading-tight min-h-[2.5rem]">
                              {epic.summary}
                            </h3>

                            <div className="relative group/progress">
                              <StackedProgressBar
                                passing={aggregatedData.passing}
                                partial={aggregatedData.partial}
                                breaking={aggregatedData.breaking}
                                pending={aggregatedData.pending}
                                total={aggregatedData.tests}
                              />

                              <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover/progress:opacity-100 transition-opacity duration-200 z-10">
                                <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg min-w-[200px]">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        <span>Passing</span>
                                      </div>
                                      <span className="font-medium">{aggregatedData.passing}</span>
                                    </div>
                                    {aggregatedData.partial > 0 && (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                          <span>Partial</span>
                                        </div>
                                        <span className="font-medium">{aggregatedData.partial}</span>
                                      </div>
                                    )}
                                    {aggregatedData.breaking > 0 && (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                          <span>Breaking</span>
                                        </div>
                                        <span className="font-medium">{aggregatedData.breaking}</span>
                                      </div>
                                    )}
                                    {aggregatedData.pending > 0 && (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                          <span>Pending</span>
                                        </div>
                                        <span className="font-medium">{aggregatedData.pending}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="border-t border-gray-700 mt-2 pt-2">
                                    <div className="flex items-center justify-between font-medium">
                                      <span>Total</span>
                                      <span>{aggregatedData.tests}</span>
                                    </div>
                                  </div>
                                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ) : !selectedStory ? (
                // Story View
                <div className="p-8">
                  <div className="mb-6">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedEpic(null)} className="mb-4">
                      ← Back to Epics
                    </Button>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-bold text-black">{selectedEpic.summary}</h2>

                      {/* Inline Pie Chart */}
                      <div className="flex items-center space-x-4">
                        {(() => {
                          const aggregatedData = getEpicAggregatedData(selectedEpic.stories, testCasesByStory);
                          return (
                            <>
                              <div className="relative w-24 h-24">
                                <PieChart width={96} height={96}>
                                  <Pie
                                    data={[
                                      { name: 'Passing', value: aggregatedData.passing, color: '#10b981' },
                                      { name: 'Partial', value: aggregatedData.partial, color: '#f59e0b' },
                                      { name: 'Breaking', value: aggregatedData.breaking, color: '#ef4444' },
                                      { name: 'Pending', value: aggregatedData.pending, color: '#9ca3af' }
                                    ].filter(item => item.value > 0)}
                                    cx={48}
                                    cy={48}
                                    innerRadius={25}
                                    outerRadius={40}
                                    paddingAngle={2}
                                    dataKey="value"
                                  >
                                    {[
                                      { name: 'Passing', value: aggregatedData.passing, color: '#10b981' },
                                      { name: 'Partial', value: aggregatedData.partial, color: '#f59e0b' },
                                      { name: 'Breaking', value: aggregatedData.breaking, color: '#ef4444' },
                                      { name: 'Pending', value: aggregatedData.pending, color: '#9ca3af' }
                                    ].filter(item => item.value > 0).map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip content={({ active, payload }: any) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload
                                      return (
                                        <div className="px-3 py-2 bg-white text-black text-sm rounded-lg shadow-lg whitespace-nowrap border border-gray-200">
                                          {`${data.name}: ${data.value} test${data.value !== 1 ? 's' : ''}`}
                                        </div>
                                      )
                                    }
                                    return null
                                  }} />
                                </PieChart>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div className={`font-semibold text-lg ${
                                  aggregatedData.passRate <= 30 
                                    ? 'text-red-500' 
                                    : aggregatedData.passRate <= 75 
                                      ? 'text-amber-500' 
                                      : 'text-emerald-500'
                                }`}>
                                  {aggregatedData.passRate}% Pass Rate
                                </div>
                                <div>{aggregatedData.tests} total tests</div>
                                <div>{aggregatedData.passing} passing</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <p className="text-slate-500">Click on a story to view its details in the sidebar</p>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {selectedEpic.stories.map((story) => {
                      const storyTestCases = testCasesByStory[story.key] || [];
                      const storyStats = storyTestCases.reduce(
                        (acc, tc) => {
                          const status = tc.status.toLowerCase();
                          if (status.includes('pass')) acc.passing++;
                          else if (status.includes('partial')) acc.partial++;
                          else if (status.includes('break') || status.includes('fail')) acc.breaking++;
                          else acc.pending++;
                          return acc;
                        },
                        { passing: 0, partial: 0, breaking: 0, pending: 0 }
                      );

                      return (
                        <Card
                          key={story.key}
                          className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 group ${
                            selectedStory?.key === story.key ? "ring-2 ring-emerald-500 bg-emerald-50" : ""
                          }`}
                          onClick={() => setSelectedStory(story)}
                        >
                          <CardContent className="p-4">
                            <h3 className="font-medium text-gray-900 text-sm mb-3 leading-tight min-h-[2.5rem]">
                              {story.summary}
                            </h3>

                            <div className="relative group/progress">
                              <StackedProgressBar
                                passing={storyStats.passing}
                                partial={storyStats.partial}
                                breaking={storyStats.breaking}
                                pending={storyStats.pending}
                                total={storyTestCases.length}
                              />

                              <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover/progress:opacity-100 transition-opacity duration-200 z-10">
                                <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg min-w-[200px]">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        <span>Passing</span>
                                      </div>
                                      <span className="font-medium">{storyStats.passing}</span>
                                    </div>
                                    {storyStats.partial > 0 && (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                          <span>Partial</span>
                                        </div>
                                        <span className="font-medium">{storyStats.partial}</span>
                                      </div>
                                    )}
                                    {storyStats.breaking > 0 && (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                          <span>Breaking</span>
                                        </div>
                                        <span className="font-medium">{storyStats.breaking}</span>
                                      </div>
                                    )}
                                    {storyStats.pending > 0 && (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                          <span>Pending</span>
                                        </div>
                                        <span className="font-medium">{storyStats.pending}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="border-t border-gray-700 mt-2 pt-2">
                                    <div className="flex items-center justify-between font-medium">
                                      <span>Total</span>
                                      <span>{storyTestCases.length}</span>
                                    </div>
                                  </div>
                                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Test View
                <></>
              )}
            </div>
          </div>

          {/* Right Panel - Updated for story-focused view */}
          {selectedEpic && (
            <div className="w-80 bg-white border-l border-gray-200 p-6">
              {!selectedStory ? (
                // Empty state when no story is selected
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Story</h3>
                  <p className="text-sm text-gray-500">
                    Click on any story card to view detailed information and test results here.
                  </p>
                </div>
              ) : (
                // Story details when a story is selected
                <div>
                  <div className="mb-6">
                    <div className="flex text-sm text-gray-500 mb-4 items-center">
                      <span className="text-black font-medium text-lg">{selectedStory.summary}</span>
                    </div>

                    {/* Story Status Distribution Pie Chart */}
                    {(() => {
                      const storyTestCases = testCasesByStory[selectedStory.key] || [];
                      const storyStats = storyTestCases.reduce(
                        (acc, tc) => {
                          const status = tc.status.toLowerCase();
                          if (status.includes('pass')) acc.passing++;
                          else if (status.includes('partial')) acc.partial++;
                          else if (status.includes('break') || status.includes('fail')) acc.breaking++;
                          else acc.pending++;
                          return acc;
                        },
                        { passing: 0, partial: 0, breaking: 0, pending: 0 }
                      );

                      return (
                        <>
                          <div className="flex items-center justify-center mb-6">
                            <StatusDistributionPieChart
                              passing={storyStats.passing}
                              partial={storyStats.partial}
                              breaking={storyStats.breaking}
                              pending={storyStats.pending}
                              total={storyTestCases.length}
                              size={128}
                            />
                          </div>

                          {/* Summary Section */}
                          <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Test Summary</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total Tests</span>
                                <span className="font-medium">{storyTestCases.length}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Pass Rate</span>
                                <span className="font-medium text-emerald-600">
                                  {storyTestCases.length > 0 ? Math.round((storyStats.passing / storyTestCases.length) * 100) : 0}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Test Cases Table */}
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Test Cases</h3>
                            <div className="max-h-64 overflow-y-auto space-y-1">
                              {storyTestCases
                                .sort((a, b) => {
                                  const statusOrder: Record<string, number> = { 
                                    breaking: 0, partial: 1, pending: 2, passing: 3 
                                  };
                                  const aStatus = a.status.toLowerCase().includes('break') ? 'breaking' :
                                                 a.status.toLowerCase().includes('partial') ? 'partial' :
                                                 a.status.toLowerCase().includes('pass') ? 'passing' : 'pending';
                                  const bStatus = b.status.toLowerCase().includes('break') ? 'breaking' :
                                                 b.status.toLowerCase().includes('partial') ? 'partial' :
                                                 b.status.toLowerCase().includes('pass') ? 'passing' : 'pending';
                                  return statusOrder[aStatus] - statusOrder[bStatus];
                                })
                                .map((testCase) => (
                                  <div
                                    key={testCase.key}
                                    className={`p-3 rounded-lg text-sm ${getStatusColor(testCase.status)} flex items-center justify-between`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      {getStatusIcon(testCase.status)}
                                      <span className="font-medium text-xs">{testCase.summary}</span>
                                    </div>
                                    <span className="text-xs text-gray-600">{testCase.key}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Crystal FAB */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg transform rotate-45"
            size="icon"
          >
            <div className="transform -rotate-45">
              <div className="w-6 h-6 bg-white/20 rounded transform rotate-45 mb-1"></div>
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI Generation</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="tests" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tests">Generate Tests</TabsTrigger>
              <TabsTrigger value="stories">Generate Stories</TabsTrigger>
            </TabsList>
            <TabsContent value="tests" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Number of test ideas</label>
                <Input type="number" defaultValue="5" className="mt-1" />
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Generate Test Ideas</Button>
            </TabsContent>
            <TabsContent value="stories" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Number of user stories</label>
                <Input type="number" defaultValue="3" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Target Epic</label>
                <Input defaultValue={selectedEpic?.summary || "Select an epic first"} className="mt-1" />
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Generate User Stories</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Global Search */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Global Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Search projects, epics, stories..." className="w-full" autoFocus />
            <div className="text-sm text-gray-500">Use ⌘K to open search from anywhere</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}