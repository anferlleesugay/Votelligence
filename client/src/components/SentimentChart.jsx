import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  positive: '#10A37F',
  neutral: '#E8A33D',
  negative: '#E5484D',
};

function SentimentChart({ breakdown }) {
  if (!breakdown || breakdown.totalWithComment === 0) {
    return (
      <>
        <h3>Voter mood</h3>
        <p className="muted small" style={{ marginTop: 8 }}>
          No comments yet. When voters leave one, AI sorts it as positive, neutral or negative.
        </p>
      </>
    );
  }

  const data = [
    { name: 'Positive', value: breakdown.positive, key: 'positive' },
    { name: 'Neutral', value: breakdown.neutral, key: 'neutral' },
    { name: 'Negative', value: breakdown.negative, key: 'negative' },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <div className="panel-head">
        <h3>Voter mood</h3>
        <span className="count">
          {breakdown.totalWithComment} {breakdown.totalWithComment === 1 ? 'comment' : 'comments'}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={COLORS[entry.key]} stroke="none" />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E4E2EE', borderRadius: 10 }} />
          <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 13 }} />
        </PieChart>
      </ResponsiveContainer>

      {breakdown.comments && breakdown.comments.length > 0 && (
        <ul className="comment-list">
          {breakdown.comments.map((c, i) => (
            // Comments have no id from the API, and this list never reorders, so the index is a safe key
            <li key={i} className="comment">
              <span
                className="comment-dot"
                style={{ background: COLORS[c.sentiment?.toLowerCase()] || '#8C88A3' }}
                title={c.sentiment}
              />
              <div>
                <div className="comment-author">{c.voterLabel}</div>
                <div className="muted small">{c.text}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SentimentChart;
