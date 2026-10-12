import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const INK = '#5B3BD6'; // leading option
const INK_SOFT = '#C9BFF2'; // other options

function ResultsChart({ results }) {
  const maxVotes = Math.max(...results.map((r) => r.votes));

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, results.length * 52)}>
      <BarChart data={results} layout="vertical" margin={{ left: 0, right: 8 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="text"
          width={110}
          tick={{ fill: '#57536E', fontSize: 13, fontFamily: 'Instrument Sans Variable' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#F5F6FA' }}
          contentStyle={{ background: '#FFFFFF', border: '1px solid #E4E2EE', borderRadius: 10 }}
          labelStyle={{ color: '#1D1A31', fontWeight: 600 }}
          formatter={(value, name, props) => [`${value} votes (${props.payload.percentage}%)`, 'Votes']}
        />
        <Bar dataKey="votes" radius={[0, 8, 8, 0]} barSize={26}>
          {results.map((r) => (
            <Cell key={r.optionId} fill={r.votes === maxVotes && maxVotes > 0 ? INK : INK_SOFT} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default ResultsChart;
