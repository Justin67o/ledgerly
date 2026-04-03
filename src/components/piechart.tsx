import { Pie, PieChart, Tooltip, TooltipIndex } from 'recharts';

export const PIE_COLORS = [
  '#4ade80', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa',
  '#34d399', '#38bdf8', '#f87171', '#facc15', '#c084fc',
];

export type PieSlice = { name: string; value: number };

export default function SimplePieChart({
  isAnimationActive,
  defaultIndex,
  data,
}: {
  isAnimationActive?: boolean;
  defaultIndex?: TooltipIndex;
  data?: PieSlice[];
}) {
  const isEmpty = !data || data.length === 0;
  const chartData = isEmpty
    ? [{ name: 'No data', value: 1, fill: 'var(--border)' }]
    : data.map((d, i) => ({ ...d, fill: PIE_COLORS[i % PIE_COLORS.length] }));

  return (
    <PieChart
      style={{ width: '100%', height: '100%', maxWidth: '500px', maxHeight: '80vh', aspectRatio: 1 }}
      responsive
    >
      <Pie
        data={chartData}
        dataKey="value"
        cx="50%"
        cy="50%"
        outerRadius="80%"
        isAnimationActive={isAnimationActive}
      />
      {!isEmpty && <Tooltip defaultIndex={defaultIndex} />}
    </PieChart>
  );
}
