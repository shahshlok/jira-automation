interface StackedProgressBarProps {
    passing: number;
    partial: number;
    breaking: number;
    pending: number;
    total: number;
}

export const StackedProgressBar = ({
    passing,
    partial,
    breaking,
    pending,
    total,
}: StackedProgressBarProps) => {
    if (total === 0) {
        return <div className="w-full h-2 bg-gray-200 rounded-full" />;
    }

    const passingPercent = (passing / total) * 100;
    const partialPercent = (partial / total) * 100;
    const breakingPercent = (breaking / total) * 100;
    const pendingPercent = (pending / total) * 100;

    return (
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
            {passing > 0 && (
                <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${passingPercent}%` }}
                />
            )}
            {partial > 0 && (
                <div
                    className="bg-amber-500 h-full border-l border-white"
                    style={{ width: `${partialPercent}%` }}
                />
            )}
            {breaking > 0 && (
                <div
                    className="bg-red-500 h-full border-l border-white"
                    style={{ width: `${breakingPercent}%` }}
                />
            )}
            {pending > 0 && (
                <div
                    className="bg-gray-400 h-full border-l border-white"
                    style={{ width: `${pendingPercent}%` }}
                />
            )}
        </div>
    );
};