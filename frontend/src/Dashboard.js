import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "./firebase";
import { ref, onValue, push, update, set } from "firebase/database";
import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import LineChart from "./components/LineChart";
import SystemStatus from "./components/SystemStatus";
import IncidentLogs from "./components/IncidentLogs";
import { Zap, ShieldAlert, CreditCard, Activity, Home } from "lucide-react";

export default function Dashboard() {
  const [view, setView] = useState("overview");
  const [data, setData] = useState({ master: 0, sub1: 0, sub2: 0 });
  const [chartData, setChartData] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [roomPath, setRoomPath] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [roomsList, setRoomsList] = useState([]);

  // --- THÔNG SỐ VẬN HÀNH ---
  const [billing, setBilling] = useState({ kwh: 0, cost: 0, budget: 50000 });
  const pricePerKwh = 2500;
  const [config, setConfig] = useState({ threshold: 2000, isSecurityOn: false });

  const timerRef = useRef(null);
  const lastAlertTime = useRef(0); // Tôi dùng biến này để chặn việc ghi Log quá nhanh

  // Ánh xạ tên phòng từ Database
  const roomNameMap = {
    cgaXgtYenRVPTbAnIi0mkjXNBZ32: "Phòng Admin (Quản lý)",
    tce2W5ywB2NAmOKkyUxZYDdgLBQ2: "Phòng 101 (Khách thuê)",
    dNKmNrObnZbBgIH6O9c2ohZUpV03: "Phòng 102 (Khách thuê)",
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const isAd = user.email === "tridung30102004@gmail.com";
      setIsAdmin(isAd);

      if (isAd) {
        onValue(ref(db, "phongtro"), (snapshot) => {
          const roomsData = snapshot.val();
          if (roomsData) {
            const list = Object.keys(roomsData).map((uid) => ({
              id: uid,
              name: roomsData[uid].roomName || roomNameMap[uid] || `Phòng ${uid.substring(0, 5)}`,
            }));
            setRoomsList(list);
            if (!roomPath) setRoomPath(`phongtro/${list[0].id}`);
          }
        });
      } else {
        setRoomPath(`phongtro/${user.uid}`);
      }
    }
  }, []);

  useEffect(() => {
    if (!roomPath) return;

    const unsubscribeLive = onValue(ref(db, roomPath), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const power = val.currentPower || 0;
        setData({ master: power, sub1: val.sub1 || 0, sub2: val.sub2 || 0 });
        setConfig({ threshold: val.threshold || 2000, isSecurityOn: val.isSecurityOn || false });

        // LOGIC CHỐNG LAG: Chỉ ghi Log vào Firebase nếu cách nhau ít nhất 10 giây
        const leakage = power - ((val.sub1 || 0) + (val.sub2 || 0));
        if (val.isSecurityOn && leakage > 15) {
          const now = Date.now();
          if (now - lastAlertTime.current > 10000) {
            // 10000ms = 10 giây
            lastAlertTime.current = now;
            handleAutoAlert(`🚨 Phát hiện thất thoát: ${leakage.toFixed(1)}W`);
          }
        }
      }
    });

    onValue(ref(db, `${roomPath}/billingHistory`), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.entries(val).map(([id, item]) => ({ id, ...item }));
        setBillHistory(list.sort((a, b) => b.timestamp - a.timestamp));
      }
    });

    onValue(ref(db, `${roomPath}/incidentLogs`), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.entries(val)
          .map(([id, item]) => ({ id, ...item }))
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        setLogs(list);
      }
    });

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
        setChartData((prev) =>
          [
            ...prev,
            {
              time: new Date().toLocaleTimeString("vi-VN"),
              master: curr.master,
            },
          ].slice(-15),
        );
        return curr;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [roomPath]);

  const handleAutoAlert = (msg) => {
    push(ref(db, `${roomPath}/incidentLogs`), {
      time: new Date().toLocaleString("vi-VN"),
      msg: msg,
      timestamp: Date.now(),
    });
  };

  const handleSaveBill = () => {
    if (billing.kwh <= 0.001) return alert("Chưa có dữ liệu.");
    const monthId = `month_${new Date().getMonth() + 1}_${new Date().getFullYear()}`;
    set(ref(db, `${roomPath}/billingHistory/${monthId}`), {
      month: `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
      kwh: billing.kwh.toFixed(3),
      amount: Math.round(billing.cost).toLocaleString(),
      timestamp: Date.now(),
    }).then(() => {
      alert("Đã chốt hóa đơn.");
      setBilling((prev) => ({ ...prev, kwh: 0, cost: 0 }));
    });
  };

  const leakagePower = Math.max(0, data.master - (data.sub1 + data.sub2));

  return (
    <div className="flex bg-[#fdfdfe] h-screen overflow-hidden font-sans text-slate-800">
      <Sidebar isAdmin={isAdmin} setView={setView} currentView={view} />

      <main className="flex-1 h-full overflow-y-auto p-10 custom-scrollbar">
        <header className="flex justify-between items-center mb-10 bg-white/70 backdrop-blur-md p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/40">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
              AI <span className="text-blue-600">GRID PRO</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">{isAdmin ? "Hệ thống Quản trị tòa nhà" : "Cổng thông tin khách thuê"}</p>
          </div>

          <div className="flex gap-4">
            {isAdmin && view === "overview" && (
              <select
                value={roomPath.split("/")[1]}
                onChange={(e) => setRoomPath(`phongtro/${e.target.value}`)}
                className="bg-slate-100 border-none rounded-2xl px-6 py-3 font-bold text-xs text-blue-600 outline-none shadow-sm"
              >
                {roomsList.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            )}
            {view === "overview" && (
              <button onClick={handleSaveBill} className="bg-slate-950 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-transform">
                Chốt hóa đơn
              </button>
            )}
          </div>
        </header>

        {view === "overview" && (
          <div className="space-y-10 animate-in fade-in duration-700">
            {leakagePower > 15 && config.isSecurityOn && (
              <div className="bg-red-600 text-white p-7 rounded-[3rem] flex items-center gap-6 shadow-2xl animate-pulse">
                <ShieldAlert size={36} />
                <div>
                  <h4 className="font-black uppercase text-sm">Phát hiện hành vi câu trộm điện</h4>
                  <p className="text-xs font-medium opacity-90 tracking-wide">Sai lệch công suất: {leakagePower.toFixed(1)}W. Đang có thiết bị kết nối ngoài các tải nhánh giám sát.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <StatCard label="Công suất tổng" value={data.master} unit="W" type="zap" />
              <StatCard label="Hóa đơn tạm" value={Math.round(billing.cost).toLocaleString()} unit="đ" />
              <StatCard label="Điện năng tiêu thụ" value={billing.kwh.toFixed(3)} unit="kWh" iconColor="text-emerald-500" />
              <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-200 text-white relative">
                <p className="text-[10px] font-black uppercase mb-4 opacity-80">Ngân sách còn lại</p>
                <h2 className="text-3xl font-black">
                  {Math.round(billing.budget).toLocaleString()} <small className="text-xs font-bold">VNĐ</small>
                </h2>
                <div className="mt-4 w-full bg-blue-700 h-1 rounded-full overflow-hidden">
                  <div className="bg-white h-full transition-all duration-1000" style={{ width: `${(billing.budget / 50000) * 100}%` }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              <div className="xl:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative">
                <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={16} className="text-blue-600" /> Biểu đồ phụ tải (Live)
                  </h3>
                  <div className="flex gap-5">
                    <span className="text-[10px] font-bold text-blue-500 uppercase">Thiết bị 01: {data.sub1}W</span>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase">Thiết bị 02: {data.sub2}W</span>
                  </div>
                </div>
                <LineChart data={chartData} />
              </div>

              <div className="space-y-8">
                <SystemStatus isAlert={leakagePower > 15 || data.master > config.threshold} />
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-8 tracking-widest">Trung tâm an ninh</h4>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                      <span className="text-[10px] font-black text-slate-500 uppercase">Chế độ bảo vệ</span>
                      <button
                        onClick={() => update(ref(db, roomPath), { isSecurityOn: !config.isSecurityOn })}
                        className={`w-14 h-7 rounded-full transition-all duration-300 ${config.isSecurityOn ? "bg-emerald-500 shadow-lg shadow-emerald-100" : "bg-slate-300"} relative`}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${config.isSecurityOn ? "right-1" : "left-1"}`} />
                      </button>
                    </div>
                    <button className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-xl hover:bg-blue-700 transition-colors">
                      <CreditCard size={18} className="inline mr-2" /> Nạp thêm ngân sách
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <IncidentLogs logs={logs} />
          </div>
        )}

        {view === "rooms" && isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
            {roomsList.map((room) => (
              <div
                key={room.id}
                onClick={() => {
                  setRoomPath(`phongtro/${room.id}`);
                  setView("overview");
                }}
                className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:border-blue-500 transition-all cursor-pointer group hover:shadow-xl"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Home size={24} />
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">ACTIVE</span>
                </div>
                <h4 className="font-black text-slate-900 uppercase text-sm mb-1">{room.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest mb-6">UID: {room.id.substring(0, 10)}...</p>
                <div className="pt-6 border-t border-slate-50 flex justify-between items-center text-[10px] font-black uppercase text-blue-600">
                  <span>Truy cập giám sát phòng này →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "history" && (
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kỳ hóa đơn</th>
                  <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiêu thụ (kWh)</th>
                  <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-blue-600">Thành tiền</th>
                  <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {billHistory.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-8 font-black text-slate-700 uppercase text-xs">{bill.month}</td>
                    <td className="p-8 font-bold text-slate-500">{bill.kwh}</td>
                    <td className="p-8 font-black text-blue-600 text-sm font-italic">{bill.amount} đ</td>
                    <td className="p-8 text-center">
                      <span className="bg-emerald-50 text-emerald-600 px-5 py-2 rounded-full text-[9px] font-black uppercase border border-emerald-100">Đã thanh toán</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
