import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface Props{
    data: { date: string; amount: number; createdAt: Date }[];
    timeframe: string;
    onHover: (data: any) => void;
}



// #endregion
const SimpleAreaChart = ({ data, timeframe, onHover }: Props) => {
  return (
    <AreaChart
      style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      data={data}
      margin={{
        top: 20,
        right: 5,
        left: 5,
        bottom: 20,
      }}
      onContextMenu={(_, e) => e.preventDefault()}
      onMouseMove={(point: any) => {
        console.log(JSON.stringify(point)); 
        const index = point.activeIndex;
        console.log(data);
        console.log("Hovered index:", index, "Data at index:", data[index]);
        onHover(index !== undefined ? data[index] : null)}}
      onMouseLeave={() =>{onHover(null)}}
    >
      

        <XAxis dataKey={timeframe === "1D" ? "createdAt" : "date"} hide />
      <Area type="monotone" dataKey="amount" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} />
    </AreaChart>
  );
};

export default SimpleAreaChart;