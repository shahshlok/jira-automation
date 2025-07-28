import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { fetchBulkData, BulkData } from "@/lib/apiHelpers";

interface GlobalSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface SearchResult {
    type: 'project' | 'epic' | 'story' | 'task';
    key: string;
    summary: string;
    projectKey?: string;
    projectName?: string;
}

export const GlobalSearchDialog = ({ open, onOpenChange }: GlobalSearchDialogProps) => {
    const [query, setQuery] = useState("");
    const [bulkData, setBulkData] = useState<BulkData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch bulk data when dialog opens for the first time
    useEffect(() => {
        if (open && !bulkData && !loading) {
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
    }, [open, bulkData, loading]);

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

        return results.slice(0, 20); // Limit to 20 results
    }, [bulkData, query]);

    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'project': return 'bg-blue-100 text-blue-800';
            case 'epic': return 'bg-purple-100 text-purple-800';
            case 'story': return 'bg-green-100 text-green-800';
            case 'task': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Global Search</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 flex-1 overflow-hidden">
                    <Input
                        placeholder="Search projects, epics, stories, tasks..."
                        className="w-full"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    
                    {loading && (
                        <div className="text-center py-8 text-gray-500">
                            Loading all project data...
                        </div>
                    )}
                    
                    {error && (
                        <div className="text-center py-4 text-red-500">
                            Error: {error}
                        </div>
                    )}
                    
                    {bulkData && !loading && (
                        <div className="text-xs text-gray-500 mb-2">
                            {bulkData.metadata.totalProjects} projects, {bulkData.metadata.totalIssues} issues loaded
                        </div>
                    )}
                    
                    {searchResults.length > 0 && (
                        <div className="overflow-y-auto max-h-96 space-y-1">
                            {searchResults.map((result) => (
                                <div
                                    key={`${result.type}-${result.key}`}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border"
                                >
                                    <Badge className={getBadgeColor(result.type)}>
                                        {result.type.toUpperCase()}
                                    </Badge>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">
                                            {result.key}
                                        </div>
                                        <div className="text-xs text-gray-600 truncate">
                                            {result.summary}
                                        </div>
                                        {result.projectName && (
                                            <div className="text-xs text-gray-400">
                                                {result.projectName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {query.trim() && searchResults.length === 0 && bulkData && (
                        <div className="text-center py-8 text-gray-500">
                            No results found for "{query}"
                        </div>
                    )}
                    
                    <div className="text-sm text-gray-500">
                        Use ⌘K to open search from anywhere
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};