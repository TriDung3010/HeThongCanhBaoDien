// client/src/components/StatCard.js
import React from 'react';
import { Power, Zap } from 'lucide-react';

const defaultIcons = {
  power: Power,
  zap: Zap,
};

export default function StatCard({ label, value, unit, type = 'power', iconColor = 'text-blue-500', isOrange = false, threshold }) {
  const Icon = defaultIcons[type] || Power;
  const bgColor = isOrange ? 'border-orange-500' : 'border-blue-500';

  return (
    <div className={`bg-white p-6 rounded-2xl shadow-lg border-l-4 ${bgColor} relative overflow-hidden transition hover:scale-105`}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold uppercase text-slate-500 tracking-wider">{label}</span>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-4xl font-extrabold ${isOrange ? 'text-slate-900' : 'text-slate-900'}`}>{value}</span>
        <span className="text-lg font-medium text-slate-500">{unit}</span>
      </div>
      {threshold && (
        <p className="text-xs text-orange-600 mt-2 font-medium">NGƯỠNG: {threshold}A</p>
      )}
    </div>
  );
}