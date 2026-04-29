import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "./firebase";
import { ref, onValue, push, update } from "firebase/database";
import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import LineChart from "./components/LineChart";
import SystemStatus from "./components/SystemStatus";
import { Zap, FileText, Settings, History, CreditCard, Trash2 } from "lucide-react";

export default function Dashboard() {
  const [view, setView] = useState("overview"); // Chuyển đổi tab: overview, history, settings
  const [data, setData] = useState({ master: 0, sub1: 0, sub2: 0 });
  const [billing, setBilling] = useState({ kwh: 0, cost: 0, budget: 50000 });
  const [config, setConfig] = useState({ threshold: 2000, isSecurityOn: false });
  const [chartData, setChartData] = useState([]);
  const [billHistory, setBillHistory] = useState([]); // Lịch sử hóa đơn từ Firebase
  const [roomPath, setRoomPath] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const pricePerKwh = 2500;
  const timerRef = useRef(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const adminEmail = "tridung30102004@gmail.com";
      const isAd = user.email === adminEmail;
      setIsAdmin(isAd);
      // Khớp UID với SmartSimulator.html
      const targetUID = isAd ? "cgaXgtYenRVPTbAnIi0mkjXNBZ32" : user.uid;
      setRoomPath(`phongtro/${targetUID}`);
    }
  }, []);

  useEffect(() => {
    if (!roomPath) return;

    // 1. Lắng nghe dữ liệu Live & Cấu hình
    const unsubscribeLive = onValue(ref(db, roomPath), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setData({ master: val.currentPower || 0, sub1: val.sub1 || 0, sub2: val.sub2 || 0 });
        setConfig({ threshold: val.threshold || 2000, isSecurityOn: val.isSecurityOn || false });
      }
    });

    // 2. Lấy lịch sử hóa đơn
    const unsubscribeHistory = onValue(ref(db, `${roomPath}/billingHistory`), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.entries(val).map(([id, data]) => ({ id, ...data }));
        setBillHistory(list.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setBillHistory([]);
      }
    });

    // 3. Loop tính toán điện năng
    timerRef.current = setInterval(() => {
      setData((curr) => {
        if (curr.master > 0) {
          const kwhGained = curr.master / 1000 / 3600;
          setBilling((prev) => ({
            ...prev,
            kwh: prev.kwh + kwhGained,
            cost: (prev.kwh + kwhGained) * pricePerKwh,
            budget: Math.max(0, prev.budget - kwhGained * pricePerKwh),
          }));
        }
        setChartData((prev) => [...prev, { time: new Date().toLocaleTimeString("vi-VN"), master: curr.master }].slice(-15));
        return curr;
      });
    }, 1000);

    return () => {
      unsubscribeLive();
      unsubscribeHistory();
      clearInterval(timerRef.current);
    };
  }, [roomPath]);

  const handleSaveBill = () => {
    if (billing.kwh <= 0.001) return alert("Chỉ số điện quá thấp để chốt hóa đơn!");
    push(ref(db, `${roomPath}/billingHistory`), {
      month: `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
      kwh: billing.kwh.toFixed(3),
      amount: Math.round(billing.cost),
      timestamp: Date.now(),
    }).then(() => {
      alert("Đã chốt hóa đơn thành công!");
      setBilling((prev) => ({ ...prev, kwh: 0, cost: 0 })); // Reset sau khi chốt
    });
  };

  return (
    <div className="flex bg-[#f8fafc] min-h-screen font-sans">
      <Sidebar isAdmin={isAdmin} setView={setView} currentView={view} />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header giống bản trước nhưng đổi text theo View */}
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tighter">
              {view === "overview" ? "Giám sát tổng hợp" : view === "history" ? "Lịch sử hóa đơn" : "Cài đặt hệ thống"}
            </h1>
            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{auth.currentUser?.email}</p>
          </div>
          {view === "overview" && (
            <button onClick={handleSaveBill} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-200 hover:scale-105 transition">
              Chốt hóa đơn
            </button>
          )}
        </header>

        {/* Tab 1: Overview */}
        {view === "overview" && (
          <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard label="Công suất (W)" value={data.master} unit="W" type="zap" />
              <StatCard label="Tiền điện" value={Math.round(billing.cost).toLocaleString()} unit="đ" />
              <StatCard label="Điện năng" value={billing.kwh.toFixed(3)} unit="kWh" iconColor="text-green-500" />
              <StatCard label="Số dư" value={Math.round(billing.budget).toLocaleString()} unit="đ" isOrange={billing.budget < 10000} />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <LineChart data={chartData} />
              </div>
              <div className="space-y-6">
                <SystemStatus isAlert={config.isSecurityOn && data.master > 50} />
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4">Nạp tiền nhanh</h4>
                  <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                    <CreditCard size={16} /> Nạp 50,000đ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Lịch sử hóa đơn */}
        {view === "history" && (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Tháng</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Điện năng</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Thành tiền</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Ngày chốt</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {billHistory.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50 transition">
                    <td className="p-6 font-bold text-slate-700">{bill.month}</td>
                    <td className="p-6 font-medium text-slate-500">{bill.kwh} kWh</td>
                    <td className="p-6 font-black text-blue-600">{parseInt(bill.amount).toLocaleString()} đ</td>
                    <td className="p-6 text-slate-400 text-sm">{bill.date}</td>
                    <td className="p-6 text-center">
                      <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black">ĐÃ THANH TOÁN</span>
                    </td>
                  </tr>
                ))}
                {billHistory.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-20 text-center text-slate-400 font-bold italic">
                      Chưa có hóa đơn nào được chốt.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Cài đặt */}
        {view === "settings" && (
          <div className="max-w-2xl bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm animate-in zoom-in-95 duration-300">
            <h3 className="font-black text-slate-800 mb-8 uppercase tracking-widest text-xs">Cấu hình hệ thống</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl">
                <span className="font-bold text-slate-600">Ngưỡng báo động (W)</span>
                <input
                  type="number"
                  value={config.threshold}
                  onChange={(e) => update(ref(db, roomPath), { threshold: parseInt(e.target.value) })}
                  className="w-24 p-2 bg-white border rounded-lg text-center font-black text-blue-600 outline-none"
                />
              </div>
              <div className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl">
                <span className="font-bold text-slate-600">Chế độ bảo vệ</span>
                <button
                  onClick={() => update(ref(db, roomPath), { isSecurityOn: !config.isSecurityOn })}
                  className={`w-14 h-7 rounded-full transition-all ${config.isSecurityOn ? "bg-red-500" : "bg-slate-300"} relative`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${config.isSecurityOn ? "right-1" : "left-1"}`} />
                </button>
              </div>
              <div className="pt-10 border-t border-slate-100">
                <button onClick={() => auth.signOut()} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition">
                  Đăng xuất tài khoản
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
