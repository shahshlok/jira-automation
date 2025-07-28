import { Progress } from "@/components/ui/progress";
import { Project, TestCase } from "@/lib/apiHelpers";
import { EpicWithStories } from "@/lib/dashboard/types";

interface ProjectsSidebarProps {
    projects: Project[];
    selectedProject: Project | null;
    epicsWithStories: EpicWithStories[];
    testCasesByStory: Record<string, TestCase[]>;
    onProjectChange: (project: Project) => void;
}

export const ProjectsSidebar = ({
    projects,
    selectedProject,
    epicsWithStories,
    testCasesByStory,
    onProjectChange,
}: ProjectsSidebarProps) => {
    return (
        <div className="bg-white border-r border-gray-200 w-80">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                    Projects
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {projects.length} active projects
                </p>
            </div>
            <div className="p-4 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
                {projects.map((project) => {
                    const projectEpics = epicsWithStories.filter((epic) =>
                        epic.stories.some((story) =>
                            story.key.startsWith(project.key),
                        ),
                    );
                    const projectStories = projectEpics.flatMap(
                        (epic) => epic.stories,
                    );
                    const projectTestCases = projectStories.flatMap(
                        (story) => testCasesByStory[story.key] || [],
                    );
                    const passRate =
                        projectTestCases.length > 0
                            ? Math.round(
                                  (projectTestCases.filter((tc) =>
                                      tc.status
                                          .toLowerCase()
                                          .includes("pass"),
                                  ).length /
                                      projectTestCases.length) *
                                      100,
                              )
                            : 0;

                    return (
                        <div
                            key={project.id}
                            className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                selectedProject?.id === project.id
                                    ? "border-emerald-200 bg-emerald-50"
                                    : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => onProjectChange(project)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium text-gray-900 text-sm">
                                    {project.name}
                                </h3>
                                <span className="text-xs text-gray-500">
                                    {passRate}%
                                </span>
                            </div>
                            <Progress
                                value={passRate}
                                className="h-2 mb-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>{projectEpics.length} epics</span>
                                <span>{projectStories.length} stories</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};