import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { StackedProgressBar } from "@/components/dashboard/StackedProgressBar";
import { getEpicAggregatedData } from "@/lib/dashboard/testHelpers";
import { EpicWithStories } from "@/lib/dashboard/types";
import { Story, TestCase } from "@/lib/apiHelpers";

interface StoryGridViewProps {
    selectedEpic: EpicWithStories;
    selectedStory: Story | null;
    testCasesByStory: Record<string, TestCase[]>;
    onStorySelect: (story: Story) => void;
    onBackToEpics: () => void;
}

export const StoryGridView = ({
    selectedEpic,
    selectedStory,
    testCasesByStory,
    onStorySelect,
    onBackToEpics,
}: StoryGridViewProps) => {
    const aggregatedData = getEpicAggregatedData(
        selectedEpic.stories,
        testCasesByStory,
    );

    return (
        <div className="p-8">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBackToEpics}
                    className="mb-4"
                >
                    ← Back to Epics
                </Button>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-black">
                        {selectedEpic.summary}
                    </h2>

                    <div className="flex items-center space-x-4">
                        <div className="relative w-24 h-24">
                            <PieChart width={96} height={96}>
                                <Pie
                                    data={[
                                        {
                                            name: "Passing",
                                            value: aggregatedData.passing,
                                            color: "#10b981",
                                        },
                                        {
                                            name: "Partial",
                                            value: aggregatedData.partial,
                                            color: "#f59e0b",
                                        },
                                        {
                                            name: "Breaking",
                                            value: aggregatedData.breaking,
                                            color: "#ef4444",
                                        },
                                        {
                                            name: "Pending",
                                            value: aggregatedData.pending,
                                            color: "#9ca3af",
                                        },
                                    ].filter((item) => item.value > 0)}
                                    cx={48}
                                    cy={48}
                                    innerRadius={25}
                                    outerRadius={40}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {[
                                        {
                                            name: "Passing",
                                            value: aggregatedData.passing,
                                            color: "#10b981",
                                        },
                                        {
                                            name: "Partial",
                                            value: aggregatedData.partial,
                                            color: "#f59e0b",
                                        },
                                        {
                                            name: "Breaking",
                                            value: aggregatedData.breaking,
                                            color: "#ef4444",
                                        },
                                        {
                                            name: "Pending",
                                            value: aggregatedData.pending,
                                            color: "#9ca3af",
                                        },
                                    ]
                                        .filter((item) => item.value > 0)
                                        .map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                            />
                                        ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }: any) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="px-3 py-2 bg-white text-black text-sm rounded-lg shadow-lg whitespace-nowrap border border-gray-200">
                                                    {`${data.name}: ${data.value} test${data.value !== 1 ? "s" : ""}`}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </div>
                        <div className="text-sm text-gray-600">
                            <div
                                className={`font-semibold text-lg ${
                                    aggregatedData.passRate <= 30
                                        ? "text-red-500"
                                        : aggregatedData.passRate <= 75
                                          ? "text-amber-500"
                                          : "text-emerald-500"
                                }`}
                            >
                                {aggregatedData.passRate}% Pass Rate
                            </div>
                            <div>{aggregatedData.tests} total tests</div>
                            <div>{aggregatedData.passing} passing</div>
                        </div>
                    </div>
                </div>
                <p className="text-slate-500">
                    Click on a story to view its details in the sidebar
                </p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {selectedEpic.stories.map((story) => {
                    const storyTestCases = testCasesByStory[story.key] || [];
                    const storyStats = storyTestCases.reduce(
                        (acc, tc) => {
                            const status = tc.status.toLowerCase();
                            if (status.includes("pass")) acc.passing++;
                            else if (status.includes("partial")) acc.partial++;
                            else if (
                                status.includes("break") ||
                                status.includes("fail")
                            )
                                acc.breaking++;
                            else acc.pending++;
                            return acc;
                        },
                        {
                            passing: 0,
                            partial: 0,
                            breaking: 0,
                            pending: 0,
                        },
                    );

                    return (
                        <Card
                            key={story.key}
                            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 group ${
                                selectedStory?.key === story.key
                                    ? "ring-2 ring-blue-300 bg-violet-50"
                                    : ""
                            }`}
                            onClick={() => onStorySelect(story)}
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
                                                    <span className="font-medium">
                                                        {storyStats.passing}
                                                    </span>
                                                </div>
                                                {storyStats.partial > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                                            <span>Partial</span>
                                                        </div>
                                                        <span className="font-medium">
                                                            {storyStats.partial}
                                                        </span>
                                                    </div>
                                                )}
                                                {storyStats.breaking > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                            <span>Breaking</span>
                                                        </div>
                                                        <span className="font-medium">
                                                            {storyStats.breaking}
                                                        </span>
                                                    </div>
                                                )}
                                                {storyStats.pending > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                            <span>Pending</span>
                                                        </div>
                                                        <span className="font-medium">
                                                            {storyStats.pending}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="border-t border-gray-700 mt-2 pt-2">
                                                <div className="flex items-center justify-between font-medium">
                                                    <span>Total</span>
                                                    <span>
                                                        {storyTestCases.length}
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