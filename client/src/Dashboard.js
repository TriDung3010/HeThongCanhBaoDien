import React, { useEffect, useState, useRef } from 'react';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import LineChart from './components/LineChart';
import PieChart from './components/PieChart';
import SystemStatus from './components/SystemStatus';
import IncidentLogs from './components/IncidentLogs';
import { Pulse } from 'lucide-react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function Dashboard() {
  // --- Giữ nguyên các biến logic từ app.js cũ ---
  const [metrics, setMetrics] = useState({ master: 0, sub1: 0, sub2: 0 });
  const [totalKwh, setTotalKwh] = useState(0.000);
  const [estimatedBill, setEstimatedBill] = useState(0);
  const [budget, setBudget] = useState(50000);
  const [threshold, setThreshold] = useState(2000); // Ngưỡng W
  const [isSecurityOn, setIsSecurityOn] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [logs, setLogs] = useState([]);

  const pricePerKwh = 2500; // Giá điện cũ của anh

  useEffect(() => {
    socket.on('energyData', (payload) => {
      const { master, sub1, sub2, time } = payload;
      setMetrics({ master, sub1, sub2 });

      // 1. Tính toán Delta (Thất thoát)
      const loss = (master - (sub1 + sub2)).toFixed(2);

      // 2. Logic tính kWh và Tiền điện (từ app.js cũ)
      if (master > 0) {
        let kwhGained = (master / 1000) / 3600; // Giả lập tích lũy mỗi giây
        setTotalKwh(prev => prev + kwhGained);
        setEstimatedBill(prev => (totalKwh + kwhGained) * pricePerKwh);
        setBudget(prev => Math.max(0, prev - (kwhGained * pricePerKwh)));
      }

      // 3. Cập nhật biểu đồ
      setChartData(prev => [
        ...prev, 
        { time: time.split(' ')[0], master, subTotal: (sub1 + sub2) }
      ].slice(-15));

      // 4. Kiểm tra ngưỡng & Chống trộm (Logic cũ)
      checkAlerts(master, loss);
    });

    return () => socket.off('energyData');
  }, [totalKwh, isSecurityOn, threshold]);

  const checkAlerts = (power, loss) => {
    if (isSecurityOn && loss > 0.5) {
      addLog("🚨 BÁO ĐỘNG: Phát hiện dòng rò/trộm điện!");
    } else if (power > threshold) {
      addLog(`⚠️ CẢNH BÁO: Quá tải (${power}W)!`);
    }
  };

  const addLog = (msg) => {
    const newLog = { time: new Date().toLocaleTimeString(), msg };
    setLogs(prev => [newLog, ...prev].slice(0, 10));
  };

  // Hàm Chốt hóa đơn (từ window.saveMonthlyBill cũ)
  const handleSaveBill = () => {
    const billData = {
      kwh: totalKwh.toFixed(3),
      amount: Math.round(estimatedBill),
      date: new Date().toLocaleDateString()
    };
    // Gửi về Server để lưu vào MySQL
    socket.emit('saveBill', billData);
    alert("Đã chốt hóa đơn thành công vào MySQL!");
  };

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-900 font-inter">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">HỆ THỐNG GIÁM SÁT ĐIỆN NĂNG</h1>
            <p className="text-slate-500">Phòng: {isSecurityOn ? "🛡️ Đang bảo vệ" : "🏠 Chế độ thường"}</p>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={handleSaveBill} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">CHỐT BILL</button>
            <div className="text-right">
                <div className="text-sm font-bold text-green-600">LIVE FEED</div>
                <div className="text-lg font-mono font-bold">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </header>

        {/* Các thẻ chỉ số */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard label="Công suất (W)" value={metrics.master} unit="W" type="zap" />
          <StatCard label="Tiền điện" value={Math.round(estimatedBill).toLocaleString()} unit="đ" iconColor="text-yellow-500" />
          <StatCard label="Số điện" value={totalKwh.toFixed(3)} unit="kWh" type="power" iconColor="text-green-500" />
          <StatCard label="Ngân sách" value={Math.round(budget).toLocaleString()} unit="đ" isOrange={budget < 10000} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <LineChart data={chartData} />
          </div>
          <div className="space-y-6">
            <SystemStatus isAlert={isSecurityOn && (metrics.master - (metrics.sub1 + metrics.sub2)) > 0.5} />
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold mb-4">CẤU HÌNH NHANH</h3>
                <label className="text-sm block mb-2">Ngưỡng cảnh báo (W): {threshold}</label>
                <input type="range" min="100" max="5000" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mb-4" />
                <button 
                  onClick={() => setIsSecurityOn(!isSecurityOn)}
                  className={`w-full py-2 rounded-lg font-bold transition ${isSecurityOn ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}
                >
                  {isSecurityOn ? '🔓 TẮT CHỐNG TRỘM' : '🛡️ BẬT CHỐNG TRỘM'}
                </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
            <IncidentLogs logs={logs} />
        </div>
      </main>
    </div>
  );
}