import { Pie, PieChart, Tooltip, TooltipIndex } from 'recharts';

export const PIE_COLORS = [
  '#4ade80', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa',
  '#34d399', '#38bdf8', '#f87171', '#facc15', '#c084fc',
];

export type PieSlice = { name: string; value: number };

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { fill: string } }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const { name, value, payload: { fill } } = payload[0];
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '8px 12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: fill, flexShrink: 0 }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{name}</span>
      </div>
      <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, marginTop: '2px', paddingLeft: '16px' }}>
        {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(value)}
      </div>
    </div>
  );
}

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
    : data.map((d, i) => ({ fill: PIE_COLORS[i % PIE_COLORS.length], ...d }));

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
      {!isEmpty && <Tooltip defaultIndex={defaultIndex} content={<CustomTooltip />} />}
    </PieChart>
  );
}
