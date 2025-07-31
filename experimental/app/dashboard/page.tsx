"use client";

import { useState, useEffect, useCallback } from "react";
import {
    fetchProjects,
    fetchEpics,
    fetchStories,
    fetchTestCases,
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

                // Load projects
                const projectsData = await fetchProjects();
                setProjects(projectsData);

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
            } catch (error) {
                console.error("Failed to load initial data:", error);
            } finally {
                setLoadingProjects(false);
            }
        };

        loadInitialData();
    }, []);

    // Function to load project data (epics, stories, test cases)
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
            const [epics, stories] = await Promise.all([
                fetchEpics(selectedProject.key),
                fetchStories(selectedProject.key),
            ]);

            // Group stories by their Epic Link
            const storiesByEpic: Record<string, Story[]> = {};

            stories.forEach((story) => {
                const epicKey = story.epicLink;
                if (epicKey) {
                    if (!storiesByEpic[epicKey]) {
                        storiesByEpic[epicKey] = [];
                    }
                    storiesByEpic[epicKey].push(story);
                }
            });

            // Combine epics with their stories
            const epicsWithStoriesData: EpicWithStories[] = epics.map(
                (epic) => ({
                    ...epic,
                    stories: storiesByEpic[epic.key] || [],
                }),
            );

            setEpicsWithStories(epicsWithStoriesData);

            // Load test cases for all stories
            const testCasesPromises = stories.map(async (story) => {
                try {
                    const testCases = await fetchTestCases(story.key);
                    return { storyKey: story.key, testCases };
                } catch (error) {
                    console.error(
                        `Failed to load test cases for ${story.key}:`,
                        error,
                    );
                    return { storyKey: story.key, testCases: [] };
                }
            });

            const testCasesResults = await Promise.all(testCasesPromises);
            const testCasesMap: Record<string, TestCase[]> = {};
            testCasesResults.forEach((result) => {
                testCasesMap[result.storyKey] = result.testCases;
            });

            setTestCasesByStory(testCasesMap);

            // Update the timestamp when refreshing
            if (isRefresh) {
                setCurrentTime(new Date());
            }
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

    const handleProjectChange = (project: Project) => {
        setSelectedProject(project);
        saveProject(project.key);
        setSelectedEpic(null);
        setSelectedStory(null);
    };

    const handleRefresh = () => {
        loadProjectData(true);
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
                epicsWithStories={epicsWithStories}
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
