import { useState, useEffect } from 'react';
import { FiArrowLeft, FiAlertTriangle, FiLoader } from 'react-icons/fi';
import { fetchAnalytics } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const SENTIMENT_COLORS = {
  Positive: '#10A37F',
  Neutral: '#E8A33D',
  Negative: '#E5484D',
};

const TOOLTIP_STYLE = { background: '#FFFFFF', border: '1px solid #E4E2EE', borderRadius: 10 };

function AnalyticsDashboard({ onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="note note-error"><FiAlertTriangle /> {error}</p>;
  if (!data) return <p className="loading"><FiLoader className="spin" /> Loading analytics…</p>;

  const sentimentData = [
    { name: 'Positive', value: data.sentimentBreakdown.positive },
    { name: 'Neutral', value: data.sentimentBreakdown.neutral },
    { name: 'Negative', value: data.sentimentBreakdown.negative },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <button className="back-link" onClick={onBack}><FiArrowLeft /> Back to polls</button>
      <h1>Analytics</h1>

      <div className="stat-row">
        <div className="stat">
          <div className="stat-value">{data.totalPolls}</div>
          <div className="stat-label">Polls created</div>
        </div>
        <div className="stat">
          <div className="stat-value">{data.totalVotes}</div>
          <div className="stat-label">Votes cast</div>
        </div>
        <div className="stat">
          <div className="stat-value">{data.closedPolls}</div>
          <div className="stat-label">Polls closed</div>
        </div>
      </div>

      <div className="analytics-grid">
        <section className="panel">
          <div className="panel-head">
            <h3>Votes per poll</h3>
          </div>
          {data.pollsSummary.length === 0 ? (
            <p className="muted">No polls yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(140, data.pollsSummary.length * 56)}>
              <BarChart data={data.pollsSummary} layout="vertical" margin={{ left: 0, right: 8 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="question"
                  width={170}
                  tick={{ fill: '#57536E', fontSize: 12, fontFamily: 'Instrument Sans Variable' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: '#F5F6FA' }} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="totalVotes" name="Votes" fill="#5B3BD6" radius={[0, 8, 8, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Overall voter mood</h3>
          </div>
          {sentimentData.length === 0 ? (
            <p className="muted">No comments on any poll yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={86} paddingAngle={2}>
                  {sentimentData.map((entry) => (
                    <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
