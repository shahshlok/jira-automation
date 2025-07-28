import { Story, TestCase } from "@/lib/apiHelpers";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

export const getEpicAggregatedData = (
    stories: Story[],
    testCasesByStory: Record<string, TestCase[]>,
) => {
    const aggregated = stories.reduce(
        (acc, story) => {
            const testCases = testCasesByStory[story.key] || [];
            const storyStats = testCases.reduce(
                (storyAcc, tc) => {
                    const status = tc.status.toLowerCase();
                    if (status.includes("pass")) storyAcc.passing++;
                    else if (status.includes("partial")) storyAcc.partial++;
                    else if (
                        status.includes("break") ||
                        status.includes("fail")
                    )
                        storyAcc.breaking++;
                    else storyAcc.pending++;
                    return storyAcc;
                },
                { passing: 0, partial: 0, breaking: 0, pending: 0 },
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
    );

    const passRate =
        aggregated.tests > 0
            ? Math.round((aggregated.passing / aggregated.tests) * 100)
            : 0;

    return { ...aggregated, passRate };
};

export const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("pass"))
        return "text-emerald-600 bg-emerald-50";
    if (lowerStatus.includes("partial"))
        return "text-amber-600 bg-amber-50";
    if (lowerStatus.includes("break") || lowerStatus.includes("fail"))
        return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
};

export const getStatusIcon = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("pass"))
        return <CheckCircle className="w-4 h-4" />;
    if (lowerStatus.includes("partial"))
        return <AlertTriangle className="w-4 h-4" />;
    if (lowerStatus.includes("break") || lowerStatus.includes("fail"))
        return <XCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
};