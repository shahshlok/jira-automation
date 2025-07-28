import { Card, CardContent } from "@/components/ui/card";
import { StackedProgressBar } from "@/components/dashboard/StackedProgressBar";
import { getEpicAggregatedData } from "@/lib/dashboard/testHelpers";
import { EpicWithStories } from "@/lib/dashboard/types";
import { Project, TestCase } from "@/lib/apiHelpers";

interface EpicGridViewProps {
    selectedProject: Project;
    epicsWithStories: EpicWithStories[];
    testCasesByStory: Record<string, TestCase[]>;
    onEpicSelect: (epic: EpicWithStories) => void;
}

export const EpicGridView = ({
    selectedProject,
    epicsWithStories,
    testCasesByStory,
    onEpicSelect,
}: EpicGridViewProps) => {
    return (
        <div className="p-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedProject.name}
                </h2>
                <p className="text-gray-600">
                    Click on an epic to explore its stories
                </p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {epicsWithStories.map((epic) => {
                    const aggregatedData = getEpicAggregatedData(
                        epic.stories,
                        testCasesByStory,
                    );
                    return (
                        <Card
                            key={epic.key}
                            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 group"
                            onClick={() => onEpicSelect(epic)}
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
                                                    <span className="font-medium">
                                                        {aggregatedData.passing}
                                                    </span>
                                                </div>
                                                {aggregatedData.partial > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                                            <span>Partial</span>
                                                        </div>
                                                        <span className="font-medium">
                                                            {aggregatedData.partial}
                                                        </span>
                                                    </div>
                                                )}
                                                {aggregatedData.breaking > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                            <span>Breaking</span>
                                                        </div>
                                                        <span className="font-medium">
                                                            {aggregatedData.breaking}
                                                        </span>
                                                    </div>
                                                )}
                                                {aggregatedData.pending > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                            <span>Pending</span>
                                                        </div>
                                                        <span className="font-medium">
                                                            {aggregatedData.pending}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="border-t border-gray-700 mt-2 pt-2">
                                                <div className="flex items-center justify-between font-medium">
                                                    <span>Total</span>
                                                    <span>
                                                        {aggregatedData.tests}
                                                    </span>
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
    );
};