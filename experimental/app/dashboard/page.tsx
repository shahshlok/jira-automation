"use client";

import { useState, useEffect, useCallback } from "react";
import {
    fetchBulkData,
    checkAuth,
    logout,
    Project,
    Story,
    TestCase,
} from "@/lib/apiHelpers";

// Message interface for chat conversations
interface Message {
    id: string;
    role: 'user' | 'bot';
    content: string;
}
import { saveProject, loadProject, clearProject } from "@/lib/projectStorage";
import { EpicWithStories } from "@/lib/dashboard/types";
import { ProjectsSidebar } from "@/components/dashboard/layout/ProjectsSidebar";
import { HeaderBar } from "@/components/dashboard/layout/HeaderBar";
import { StoryDetailsSidebar } from "@/components/dashboard/layout/StoryDetailsSidebar";
import { EpicGridView } from "@/components/dashboard/views/EpicGridView";
import { StoryGridView } from "@/components/dashboard/views/StoryGridView";
import { ChatPopup } from "@/components/ChatPopup";


export default function Dashboard() {
    // Data state
    const [projects, setProjects] = useState<Project[]>([]);
    const [epicsWithStories, setEpicsWithStories] = useState<EpicWithStories[]>(
        [],
    );
    const [allEpicsWithStories, setAllEpicsWithStories] = useState<EpicWithStories[]>(
        [],
    );
    const [testCasesByStory, setTestCasesByStory] = useState<
        Record<string, TestCase[]>
    >({});

    // UI state
    const [selectedProject, setSelectedProject] = useState<Project | null>(
        null,
    );
    const [selectedEpic, setSelectedEpic] = useState<EpicWithStories | null>(
        null,
    );
    const [selectedStory, setSelectedStory] = useState<Story | null>(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [lastDataRefresh, setLastDataRefresh] = useState<Date>(new Date());

    // Chat conversation state - persists across chat popup open/close
    const [conversations, setConversations] = useState<Record<string, Message[]>>({});

    // Loading states
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Load user info and projects on mount
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load user info
                const userData = await checkAuth();
                setUser(userData);

                // Load ALL data upfront using bulk API
                console.log('🚀 Loading all data upfront for fast navigation...');
                const startTime = Date.now();
                const bulkData = await fetchBulkData();
                const loadTime = Date.now() - startTime;
                
                console.log(`⚡ Initial data loaded in ${loadTime}ms:`, {
                    projects: bulkData.metadata.totalProjects,
                    issues: bulkData.metadata.totalIssues,
                    epics: bulkData.epics.length,
                    stories: bulkData.stories.length,
                    testCases: bulkData.testCases.length
                });

                // Show performance warning if needed  
                if (bulkData.metadata.totalIssues > 800) {
                    console.warn('⚠️ Approaching data limit. Consider pagination when you reach production scale.');
                }

                // Extract projects from bulk data
                const projectsData = bulkData.projects;
                setProjects(projectsData);
                
                // Store bulk data for fast project switching
                (window as any).__bulkData = bulkData;

                // Restore selected project from localStorage
                const storedProjectKey = loadProject();
                let projectToSelect = projectsData[0]; // Default to first project

                if (storedProjectKey) {
                    const storedProject = projectsData.find(
                        (p) => p.key === storedProjectKey,
                    );
                    if (storedProject) {
                        projectToSelect = storedProject;
                    }
                }

                if (projectToSelect) {
                    setSelectedProject(projectToSelect);
                    saveProject(projectToSelect.key);
                }

                // Set initial data refresh timestamp
                setLastDataRefresh(new Date());
            } catch (error) {
                console.error("Failed to load initial data:", error);
            } finally {
                setLoadingProjects(false);
            }
        };

        loadInitialData();
    }, []);

    // Function to load ALL project data upfront (epics, stories, test cases)
    const loadProjectData = useCallback(async (isRefresh = false) => {
        if (!selectedProject) {
            setEpicsWithStories([]);
            return;
        }

        if (isRefresh) {
            setIsRefreshing(true);
        } else {
            setLoadingData(true);
        }

        try {
            let bulkData;
            
            if (isRefresh || !(window as any).__bulkData) {
                // Load fresh data from API
                console.log('🚀 Loading fresh data from API...');
                const startTime = Date.now();
                bulkData = await fetchBulkData();
                const loadTime = Date.now() - startTime;
                
                console.log(`⚡ Data loaded in ${loadTime}ms:`, {
                    projects: bulkData.metadata.totalProjects,
                    issues: bulkData.metadata.totalIssues,
                    epics: bulkData.epics.length,
                    stories: bulkData.stories.length,
                    testCases: bulkData.testCases.length
                });

                // Show performance warning if needed  
                if (bulkData.metadata.totalIssues > 800) {
                    console.warn('⚠️ Approaching data limit. Consider pagination when you reach production scale.');
                }
                
                // Update cached data
                (window as any).__bulkData = bulkData;
            } else {
                // Use cached data for instant navigation
                console.log('⚡ Using cached data for instant navigation');
                bulkData = (window as any).__bulkData;
            }

            // Create complete epics with stories data for all projects (for sidebar progress bars)
            const allStoriesByEpic: Record<string, Story[]> = {};
            bulkData.stories.forEach((story: any) => {
                const epicKey = story.epicLink;
                if (epicKey) {
                    if (!allStoriesByEpic[epicKey]) {
                        allStoriesByEpic[epicKey] = [];
                    }
                    allStoriesByEpic[epicKey].push(story);
                }
            });

            const allEpicsWithStoriesData: EpicWithStories[] = bulkData.epics.map(
                (epic: any) => ({
                    ...epic,
                    stories: allStoriesByEpic[epic.key] || [],
                }),
            );

            setAllEpicsWithStories(allEpicsWithStoriesData);

            // Filter data for current project for main view
            const projectEpics = bulkData.epics.filter((epic: any) => epic.projectKey === selectedProject.key);
            const projectStories = bulkData.stories.filter((story: any) => story.projectKey === selectedProject.key);

            // Group stories by their Epic Link for current project
            const storiesByEpic: Record<string, Story[]> = {};

            projectStories.forEach((story: any) => {
                const epicKey = story.epicLink;
                if (epicKey) {
                    if (!storiesByEpic[epicKey]) {
                        storiesByEpic[epicKey] = [];
                    }
                    storiesByEpic[epicKey].push(story);
                }
            });

            // Combine epics with their stories for current project
            const epicsWithStoriesData: EpicWithStories[] = projectEpics.map(
                (epic: any) => ({
                    ...epic,
                    stories: storiesByEpic[epic.key] || [],
                }),
            );

            setEpicsWithStories(epicsWithStoriesData);

            // Use test cases from bulk data (already loaded)
            const testCasesMap: Record<string, TestCase[]> = {};
            
            // Group test cases by their parent story
            bulkData.testCases.forEach((testCase: any) => {
                if (testCase.parentKey) {
                    if (!testCasesMap[testCase.parentKey]) {
                        testCasesMap[testCase.parentKey] = [];
                    }
                    testCasesMap[testCase.parentKey].push({
                        key: testCase.key,
                        summary: testCase.summary,
                        status: testCase.status
                    });
                }
            });

            setTestCasesByStory(testCasesMap);

            // Update the data refresh timestamp
            setLastDataRefresh(new Date());
        } catch (error) {
            console.error("Error fetching project data:", error);
            setEpicsWithStories([]);
        } finally {
            if (isRefresh) {
                setIsRefreshing(false);
            } else {
                setLoadingData(false);
            }
        }
    }, [selectedProject]);

    // Load epics and stories when project changes
    useEffect(() => {
        loadProjectData();
    }, [loadProjectData]);

    // Update clock
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Auto-refresh data every 60 seconds
    useEffect(() => {
        if (!selectedProject) return;

        const autoRefreshInterval = setInterval(async () => {
            console.log('🔄 Auto-refresh: Fetching latest data...');
            try {
                // Clear cached data and trigger refresh
                delete (window as any).__bulkData;
                await loadProjectData(true);
                
                // Update projects list from fresh data
                const bulkData = (window as any).__bulkData;
                if (bulkData && bulkData.projects) {
                    setProjects(bulkData.projects);
                }
                
                console.log('✅ Auto-refresh completed');
            } catch (error) {
                console.error('❌ Auto-refresh failed:', error);
                
                // Check if it's an authentication error
                if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
                    console.warn('🔐 Authentication expired during auto-refresh. Please refresh the page to re-authenticate.');
                    // Optionally, you could redirect to login or show a notification
                    // For now, just stop the auto-refresh to prevent spam
                    clearInterval(autoRefreshInterval);
                }
            }
        }, 60000); // 60 seconds

        return () => clearInterval(autoRefreshInterval);
    }, [selectedProject, loadProjectData]);

    const handleProjectChange = (project: Project) => {
        setSelectedProject(project);
        saveProject(project.key);
        setSelectedEpic(null);
        setSelectedStory(null);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            console.log('🔄 Full refresh initiated - fetching latest data from JIRA...');
            
            // Clear cached data to force fresh API call
            delete (window as any).__bulkData;
            
            // Trigger project data reload which will fetch fresh data
            await loadProjectData(true);
            
            // Update projects list from the fresh bulk data
            const bulkData = (window as any).__bulkData;
            if (bulkData && bulkData.projects) {
                setProjects(bulkData.projects);
            }
            
            console.log('✅ Full refresh completed - all data updated');
        } catch (error) {
            console.error('❌ Refresh failed:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            clearProject();
            window.location.href = "/";
        } catch (error) {
            console.error("Logout error:", error);
            window.location.href = "/";
        }
    };


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
            <ProjectsSidebar
                projects={projects}
                selectedProject={selectedProject}
                epicsWithStories={allEpicsWithStories}
                testCasesByStory={testCasesByStory}
                onProjectChange={handleProjectChange}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <HeaderBar
                    selectedProject={selectedProject}
                    user={user}
                    currentTime={currentTime}
                    lastDataRefresh={lastDataRefresh}
                    projects={projects}
                    epicsWithStories={epicsWithStories}
                    onProjectSelect={handleProjectChange}
                    onEpicSelect={setSelectedEpic}
                    onStorySelect={setSelectedStory}
                    onLogout={handleLogout}
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                />

                <div className="flex-1 flex">
                    {/* Canvas Area */}
                    <div className="flex-1 p-6">
                        <div className="bg-white rounded-lg border border-gray-200 h-full relative overflow-hidden">
                            {loadingData ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-lg">
                                        Loading project data...
                                    </div>
                                </div>
                            ) : !selectedProject ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-lg text-gray-500">
                                        Select a project to get started
                                    </div>
                                </div>
                            ) : !selectedEpic ? (
                                <EpicGridView
                                    selectedProject={selectedProject}
                                    epicsWithStories={epicsWithStories}
                                    testCasesByStory={testCasesByStory}
                                    onEpicSelect={setSelectedEpic}
                                />
                            ) : (
                                <StoryGridView
                                    selectedEpic={selectedEpic}
                                    selectedStory={selectedStory}
                                    testCasesByStory={testCasesByStory}
                                    onStorySelect={setSelectedStory}
                                    onBackToEpics={() => setSelectedEpic(null)}
                                />
                            )}
                        </div>
                    </div>
                    {/* Right Panel - Updated for story-focused view */}
                    {selectedEpic && (
                        <StoryDetailsSidebar
                            selectedStory={selectedStory}
                            testCasesByStory={testCasesByStory}
                        />
                    )}
                </div>
            </div>

            {/* Chat Popup */}
            <ChatPopup
                open={chatOpen}
                onOpenChange={setChatOpen}
                selectedStory={selectedStory}
                selectedEpic={selectedEpic}
                conversations={conversations}
                setConversations={setConversations}
            />

        </div>
    );
}
