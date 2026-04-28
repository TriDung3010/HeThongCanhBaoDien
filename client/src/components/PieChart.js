// client/src/components/PieChart.js
import React from 'react';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#22c55e', '#ef4444']; // Green for useful, Red for leakage

export default function PieChart({ useful, loss }) {
  const data = [
    { name: 'Hữu ích', value: parseFloat(useful) },
    { name: 'Thất thoát', value: parseFloat(loss) },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">PHÂN BỔ DÒNG RÒ</h3>
      <ResponsiveContainer width="100%" height={250}>
        <RePieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="90%"
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend
            iconType="circle"
            layout="vertical"
            verticalAlign="middle"
            align="right"
            formatter={(value, entry) => (
              <span className="text-slate-600 text-sm ml-2">
                {value} ({((entry.payload.value / (useful + loss)) * 100).toFixed(0)}%)
              </span>
            )}
          />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}