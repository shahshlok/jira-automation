import { useState, useEffect, useMemo, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchBulkData, BulkData } from "@/lib/apiHelpers";

interface SearchResult {
    type: 'project' | 'epic' | 'story' | 'task' | 'testcase';
    key: string;
    summary: string;
    projectKey?: string;
    projectName?: string;
    parentKey?: string;
    parentSummary?: string;
}

interface InlineSearchProps {
    className?: string;
}

export const InlineSearch = ({ className = "" }: InlineSearchProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [query, setQuery] = useState("");
    const [bulkData, setBulkData] = useState<BulkData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close search when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
                setQuery("");
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                setIsExpanded(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
            if (event.key === 'Escape' && isExpanded) {
                setIsExpanded(false);
                setQuery("");
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isExpanded]);

    // Fetch bulk data when search is expanded for the first time
    useEffect(() => {
        if (isExpanded && !bulkData && !loading) {
            setLoading(true);
            setError(null);
            
            fetchBulkData()
                .then((data) => {
                    setBulkData(data);
                })
                .catch((err) => {
                    setError(err.message);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isExpanded, bulkData, loading]);

    // Search results computed from bulkData
    const searchResults = useMemo(() => {
        if (!bulkData || !query.trim()) return [];

        const lowerQuery = query.toLowerCase();
        const results: SearchResult[] = [];

        // Search projects
        bulkData.projects.forEach(project => {
            if (project.name.toLowerCase().includes(lowerQuery) || 
                project.key.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'project',
                    key: project.key,
                    summary: project.name
                });
            }
        });

        // Search epics
        bulkData.epics.forEach(epic => {
            if (epic.summary.toLowerCase().includes(lowerQuery) || 
                epic.key.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'epic',
                    key: epic.key,
                    summary: epic.summary,
                    projectKey: epic.projectKey,
                    projectName: epic.projectName
                });
            }
        });

        // Search stories
        bulkData.stories.forEach(story => {
            if (story.summary.toLowerCase().includes(lowerQuery) || 
                story.key.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'story',
                    key: story.key,
                    summary: story.summary,
                    projectKey: story.projectKey,
                    projectName: story.projectName
                });
            }
        });

        // Search tasks
        bulkData.tasks.forEach(task => {
            if (task.summary.toLowerCase().includes(lowerQuery) || 
                task.key.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'task',
                    key: task.key,
                    summary: task.summary,
                    projectKey: task.projectKey,
                    projectName: task.projectName
                });
            }
        });

        // Search test cases
        bulkData.testCases.forEach(testCase => {
            if (testCase.summary.toLowerCase().includes(lowerQuery) || 
                testCase.key.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'testcase',
                    key: testCase.key,
                    summary: testCase.summary,
                    projectKey: testCase.projectKey,
                    projectName: testCase.projectName,
                    parentKey: testCase.parentKey,
                    parentSummary: testCase.parentSummary
                });
            }
        });

        return results.slice(0, 8); // Limit to 8 results for inline display
    }, [bulkData, query]);

    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'project': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'epic': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'story': return 'bg-green-100 text-green-800 border-green-200';
            case 'task': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'testcase': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleSearchClick = () => {
        setIsExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleClear = () => {
        setQuery("");
        inputRef.current?.focus();
    };

    return (
        <div ref={searchRef} className={`relative ${className}`}>
            {/* Search Button/Input Container */}
            <div
                className={`flex items-center border border-gray-200 rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out ${
                    isExpanded 
                        ? 'w-96 shadow-lg border-blue-300' 
                        : 'w-44 hover:border-gray-300 cursor-pointer'
                }`}
                onClick={!isExpanded ? handleSearchClick : undefined}
            >
                <div className="flex items-center px-3 py-2">
                    <Search className="w-4 h-4 text-gray-400" />
                </div>
                
                {isExpanded ? (
                    <div className="flex-1 flex items-center">
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search projects, epics, stories, tasks, test cases..."
                            className="border-none bg-transparent px-0 py-1 focus-visible:ring-0 text-sm"
                            autoFocus
                        />
                        {query && (
                            <button
                                onClick={handleClear}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-between flex-1 px-1">
                        <span className="text-sm text-gray-600">Search</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500">⌘ K</kbd>
                    </div>
                )}
            </div>

            {/* Results Dropdown */}
            {isExpanded && (
                <div className="absolute top-full left-0 w-96 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                    {loading && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            Loading...
                        </div>
                    )}
                    
                    {error && (
                        <div className="p-4 text-center text-red-500 text-sm">
                            Error: {error}
                        </div>
                    )}
                    
                    {bulkData && !loading && query.trim() === "" && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            Start typing to search across {bulkData.metadata.totalProjects} projects, {bulkData.metadata.totalIssues} issues
                        </div>
                    )}
                    
                    {searchResults.length > 0 && (
                        <div className="max-h-80 overflow-y-auto">
                            {searchResults.map((result, index) => (
                                <div
                                    key={`${result.type}-${result.key}`}
                                    className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer ${
                                        index !== searchResults.length - 1 ? 'border-b border-gray-100' : ''
                                    }`}
                                >
                                    <Badge 
                                        variant="outline" 
                                        className={`${getBadgeColor(result.type)} text-xs px-2 py-0.5`}
                                    >
                                        {result.type.toUpperCase()}
                                    </Badge>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate text-gray-900">
                                            {result.key}
                                        </div>
                                        <div className="text-xs text-gray-600 truncate">
                                            {result.summary}
                                        </div>
                                        {result.type === 'testcase' && result.parentSummary && (
                                            <div className="text-xs text-gray-400 truncate">
                                                Parent: {result.parentSummary}
                                            </div>
                                        )}
                                        {result.projectName && (
                                            <div className="text-xs text-gray-400 truncate">
                                                {result.projectName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {query.trim() && searchResults.length === 0 && bulkData && !loading && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No results found for "{query}"
                        </div>
                    )}
                    
                    {isExpanded && (
                        <div className="border-t border-gray-100 p-2 bg-gray-50">
                            <div className="text-xs text-gray-500 text-center">
                                Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> to close
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};