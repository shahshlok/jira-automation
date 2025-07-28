import { Cell, Pie, PieChart, Tooltip } from "recharts";

interface StatusDistributionPieChartProps {
    passing: number;
    partial: number;
    breaking: number;
    pending: number;
    total: number;
    size?: number;
}

export const StatusDistributionPieChart = ({
    passing,
    partial,
    breaking,
    pending,
    total,
    size = 128,
}: StatusDistributionPieChartProps) => {
    if (total === 0) {
        return (
            <div
                className="relative flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                <div className="w-full h-full rounded-full border-8 border-gray-200"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">0</span>
                </div>
            </div>
        );
    }

    const data = [
        { name: "Passing", value: passing, color: "#10b981" },
        { name: "Partial", value: partial, color: "#f59e0b" },
        { name: "Breaking", value: breaking, color: "#ef4444" },
        { name: "Pending", value: pending, color: "#9ca3af" },
    ].filter((item) => item.value > 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="px-3 py-2 bg-white text-black text-sm rounded-lg shadow-lg whitespace-nowrap border border-gray-200">
                    {`${data.name}: ${data.value} test${data.value !== 1 ? "s" : ""}`}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <PieChart width={size} height={size}>
                <Pie
                    data={data}
                    cx={size / 2}
                    cy={size / 2}
                    innerRadius={size * 0.25}
                    outerRadius={size * 0.4}
                    paddingAngle={2}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
            </PieChart>
        </div>
    );
};