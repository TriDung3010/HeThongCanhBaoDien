// client/src/components/IncidentLogs.js
import React from 'react';
import { AlertTriangle, MapPin, Zap } from 'lucide-react';

const mockLogs = [
  { time: '8:26:00 PM', sensor: 'Nhánh 1', type: 'Thất thoát', useful: '2.85A', loss: '+0.77A' },
  { time: '8:25:30 PM', sensor: 'Nhánh 2', type: 'An toàn', useful: '2.10A', loss: '+0.05A' },
];

export default function IncidentLogs() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex-1">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">NHẬT KÝ SỰ CỐ GẦN ĐÂY</h3>
      <div className="overflow-x-auto">
        <table className="w-100 min-w-[500px]">
          <thead className="border-b border-slate-100">
            <tr>
              <th className="text-left py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mốc thời gian</th>
              <th className="text-left py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vị trí cảm biến</th>
              <th className="text-left py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phân loại</th>
              <th className="text-left py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hữu ích / Thất thoát</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockLogs.map((log, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 text-sm font-medium text-slate-900">{log.time}</td>
                <td className="py-4 text-sm text-slate-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400"/>
                    {log.sensor}
                </td>
                <td className="py-4 text-sm">
                  <span className={`badge flex items-center gap-1.5 ${
                    log.type === 'Thất thoát' ? 'text-red-600 font-medium' : 'text-slate-600 font-medium'
                  }`}>
                    {log.type === 'Thất thoát' && <AlertTriangle className="w-4 h-4" /> }
                    {log.type}
                  </span>
                </td>
                <td className="py-4 text-sm text-slate-600">
                    <span className="text-green-600 font-medium">{log.useful}</span>
                    {" / "}
                    <span className="text-red-600 font-medium">{log.loss}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}