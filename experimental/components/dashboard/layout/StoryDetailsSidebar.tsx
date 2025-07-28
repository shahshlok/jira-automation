import { Search } from "lucide-react";
import { Story, TestCase } from "@/lib/apiHelpers";
import { StatusDistributionPieChart } from "@/components/dashboard/StatusDistributionPieChart";
import { getStatusColor, getStatusIcon } from "@/lib/dashboard/testHelpers";

interface StoryDetailsSidebarProps {
    selectedStory: Story | null;
    testCasesByStory: Record<string, TestCase[]>;
}

export const StoryDetailsSidebar = ({ selectedStory, testCasesByStory }: StoryDetailsSidebarProps) => {
    if (!selectedStory) {
        return (
            <div className="w-80 bg-white border-l border-gray-200 p-6">
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a Story
                    </h3>
                    <p className="text-sm text-gray-500">
                        Click on any story card to view detailed
                        information and test results here.
                    </p>
                </div>
            </div>
        );
    }

    const storyTestCases = testCasesByStory[selectedStory.key] || [];
    const storyStats = storyTestCases.reduce(
        (acc, tc) => {
            const status = tc.status.toLowerCase();
            if (status.includes("pass")) acc.passing++;
            else if (status.includes("partial")) acc.partial++;
            else if (status.includes("break") || status.includes("fail"))
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
        <div className="w-80 bg-white border-l border-gray-200 p-6">
            <div>
                <div className="mb-6">
                    <div className="flex text-sm text-gray-500 mb-4 items-center">
                        <span className="text-black font-medium text-lg">
                            {selectedStory.summary}
                        </span>
                    </div>

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

                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                            Test Summary
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                    Total Tests
                                </span>
                                <span className="font-medium">
                                    {storyTestCases.length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                    Pass Rate
                                </span>
                                <span className="font-medium text-emerald-600">
                                    {storyTestCases.length > 0
                                        ? Math.round(
                                              (storyStats.passing /
                                                  storyTestCases.length) *
                                                  100,
                                          )
                                        : 0}
                                    %
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                            Test Cases
                        </h3>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                            {storyTestCases
                                .sort((a, b) => {
                                    const statusOrder: Record<string, number> = {
                                        breaking: 0,
                                        partial: 1,
                                        pending: 2,
                                        passing: 3,
                                    };
                                    const aStatus = a.status
                                        .toLowerCase()
                                        .includes("break")
                                        ? "breaking"
                                        : a.status.toLowerCase().includes("partial")
                                          ? "partial"
                                          : a.status.toLowerCase().includes("pass")
                                            ? "passing"
                                            : "pending";
                                    const bStatus = b.status
                                        .toLowerCase()
                                        .includes("break")
                                        ? "breaking"
                                        : b.status.toLowerCase().includes("partial")
                                          ? "partial"
                                          : b.status.toLowerCase().includes("pass")
                                            ? "passing"
                                            : "pending";
                                    return (
                                        statusOrder[aStatus] -
                                        statusOrder[bStatus]
                                    );
                                })
                                .map((testCase) => (
                                    <div
                                        key={testCase.key}
                                        className={`p-3 rounded-lg text-sm ${getStatusColor(testCase.status)} flex items-center justify-between`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            {getStatusIcon(testCase.status)}
                                            <span className="font-medium text-xs">
                                                {testCase.summary}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-600">
                                            {testCase.key}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};