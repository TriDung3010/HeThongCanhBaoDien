// client/src/components/LineChart.js
import React from 'react';
import { ResponsiveContainer, LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function LineChart({ data }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-800">PHỤ TẢI REAL-TIME</h3>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
          <span className="text-sm text-slate-600">Dòng Tổng (A)</span>
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          <span className="text-sm text-slate-600">Tổng Thiết Bị (A)</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ReLineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="time" stroke="#cbd5e1" fontSize={12} tickLine={false} />
          <YAxis stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} unit="A" />
          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', padding: '12px' }} />
          <Legend iconType="circle" />
          <Line type="monotone" dataKey="master" stroke="#2563eb" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="totalBranches" stroke="#22c55e" strokeWidth={2} dot={false} />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}