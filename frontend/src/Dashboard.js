import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "./firebase";
import { ref, onValue, update, set, remove } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

import Sidebar from "./components/Sidebar";
import Overview from "./components/Overview";
import AccountManagement from "./components/AccountManagement";
import BillingHistory from "./components/BillingHistory";
import RoomManagement from "./components/RoomManagement";
import TheftSimulator from "./components/TheftSimulator";
import RoomsAdmin from "./components/RoomsAdmin";

export default function Dashboard() {
  const [view, setView] = useState("overview");
  const [data, setData] = useState({ master: 0, totalDevicePower: 0 });
  const [chartData, setChartData] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [roomPath, setRoomPath] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [roomsList, setRoomsList] = useState([]);
  const [activeDevices, setActiveDevices] = useState([]);

  // BỘ NHỚ VĨNH CỬU
  const [isStealing, setIsStealing] = useState(
    () => localStorage.getItem("ai_grid_isStealing") === "true",
  );
  const [stolenAmount, setStolenAmount] = useState(
    () => parseInt(localStorage.getItem("ai_grid_stolenAmount")) || 0,
  );

  const [billing, setBilling] = useState({ kwh: 0, cost: 0, budget: 0 });
  const pricePerKwh = 2500;
  const [config, setConfig] = useState({
    threshold: 2000,
    isSecurityOn: false,
  });
  const [isPowerOn, setIsPowerOn] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState("");

  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentRoomName, setCurrentRoomName] = useState("");
  const [allRoomsData, setAllRoomsData] = useState({});
  const [emptyRoomsList, setEmptyRoomsList] = useState([]);
  const [roomInfo, setRoomInfo] = useState({});

  const timerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("ai_grid_isStealing", isStealing);
    localStorage.setItem("ai_grid_stolenAmount", stolenAmount);
  }, [isStealing, stolenAmount]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserEmail(user.email);
        const isAd = user.email === "tridung30102004@gmail.com";
        setIsAdmin(isAd);

        if (isAd) {
          onValue(ref(db, "phongtro"), (snapshot) => {
            const roomsData = snapshot.val();
            if (roomsData) {
              // LỌC BỎ ADMIN: Không hiển thị phòng của Admin trong danh sách
              const filteredData = { ...roomsData };
              delete filteredData[user.uid];

              setAllRoomsData(filteredData);
              const list = Object.keys(filteredData).map((uid) => ({
                id: uid,
                name:
                  filteredData[uid].roomName ||
                  `Phòng UID: ${uid.substring(0, 5)}...`,
              }));
              setRoomsList(list);

              // Tự động chuyển roomPath sang phòng khách đầu tiên nếu đường dẫn đang trống hoặc đang kẹt ở phòng Admin
              setRoomPath((prevPath) => {
                if (!prevPath || prevPath === `phongtro/${user.uid}`) {
                  return list.length > 0 ? `phongtro/${list[0].id}` : "";
                }
                return prevPath;
              });
            } else {
              setRoomsList([]);
              setAllRoomsData({});
              setRoomPath("");
            }
          });

          onValue(ref(db, "availableRooms"), (snapshot) => {
            const emptyData = snapshot.val();
            if (emptyData)
              setEmptyRoomsList(
                Object.keys(emptyData).map((k) => ({
                  id: k,
                  name: emptyData[k].name,
                })),
              );
            else setEmptyRoomsList([]);
          });
        } else {
          setRoomPath(`phongtro/${user.uid}`);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!roomPath) return;

    const unsubscribeLive = onValue(ref(db, roomPath), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setRoomInfo(val);
        setCurrentRoomName(val.roomName || "");
        const power = val.currentPower || 0;
        const totalLegitimate = val.totalDevicePower || 0;

        setData({ master: power, totalDevicePower: totalLegitimate });
        setConfig({
          threshold: val.threshold || 2000,
          isSecurityOn: val.isSecurityOn || false,
        });

        if (val.budget !== undefined)
          setBilling((prev) => ({ ...prev, budget: val.budget }));
        setIsPowerOn(val.isPowerOn !== false);

        if (val.deviceList)
          setActiveDevices(val.deviceList.filter((d) => d.isOn));
        else setActiveDevices([]);

        if (isStealing && power === totalLegitimate && stolenAmount > 0) {
          update(ref(db, roomPath), {
            currentPower: totalLegitimate + stolenAmount,
          });
        }
      }
    });

    onValue(ref(db, `${roomPath}/billingHistory`), (snapshot) => {
      const val = snapshot.val();
      if (val)
        setBillHistory(
          Object.entries(val)
            .map(([id, item]) => ({ id, ...item }))
            .sort((a, b) => b.timestamp - a.timestamp),
        );
      else setBillHistory([]);
    });

    timerRef.current = setInterval(() => {
      setData((curr) => {
        setBilling((prev) => {
          if (curr.master > 0 && prev.budget > 0 && isPowerOn) {
            const kwhGained = curr.master / 1000 / 3600;
            return {
              ...prev,
              kwh: prev.kwh + kwhGained,
              cost: (prev.kwh + kwhGained) * pricePerKwh,
              budget: Math.max(0, prev.budget - kwhGained * pricePerKwh),
            };
          }
          return prev;
        });

        setChartData((prev) =>
          [
            ...prev,
            {
              time: new Date().toLocaleTimeString("vi-VN"),
              master: curr.master,
              totalBranches: curr.totalDevicePower,
            },
          ].slice(-15),
        );
        return curr;
      });
    }, 1000);

    return () => {
      unsubscribeLive();
      clearInterval(timerRef.current);
    };
  }, [roomPath, isPowerOn, isStealing, stolenAmount]);

  useEffect(() => {
    if (billing.budget <= 0 && isPowerOn && roomPath)
      update(ref(db, roomPath), { isPowerOn: false });
  }, [billing.budget, isPowerOn, roomPath]);

  const handleSaveBill = () => {
    if (billing.kwh <= 0.001) return alert("Chưa có dữ liệu tiêu thụ để chốt.");
    const monthId = `month_${new Date().getMonth() + 1}_${new Date().getFullYear()}_${Date.now()}`;
    set(ref(db, `${roomPath}/billingHistory/${monthId}`), {
      month: `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
      kwh: billing.kwh.toFixed(3),
      amount: Math.round(billing.cost).toLocaleString(),
      timestamp: Date.now(),
    }).then(() => {
      alert("Đã chốt hóa đơn thành công!");
      setBilling((prev) => ({ ...prev, kwh: 0, cost: 0 }));
    });
  };

  const handleDeleteBill = (billId) => {
    if (
      window.confirm(
        "Đồng chí có chắc chắn muốn xóa hóa đơn này không? Dữ liệu sẽ không thể khôi phục.",
      )
    ) {
      remove(ref(db, `${roomPath}/billingHistory/${billId}`)).then(() =>
        alert("Đã xóa hóa đơn!"),
      );
    }
  };

  const submitTopUp = () => {
    const amount = parseInt(topUpAmount);
    if (isNaN(amount) || amount <= 0)
      return alert("Vui lòng nhập số tiền hợp lệ lớn hơn 0!");
    const newBudget = billing.budget + amount;
    setBilling((prev) => ({ ...prev, budget: newBudget }));
    if (roomPath)
      update(ref(db, roomPath), { budget: newBudget, isPowerOn: true });
    alert(`Thành công! Đã nạp ${amount.toLocaleString()} VNĐ vào phòng.`);
    setTopUpAmount("");
  };

  const leakagePower = Math.max(0, data.master - data.totalDevicePower);

  return (
    <div className="flex bg-[#fdfdfe] h-screen overflow-hidden font-sans text-slate-800 relative">
      <Sidebar isAdmin={isAdmin} setView={setView} currentView={view} />

      <main className="flex-1 h-full overflow-y-auto p-10 custom-scrollbar">
        <header className="flex justify-between items-center mb-10 bg-white/70 backdrop-blur-md p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/40">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
              AI <span className="text-blue-600">GRID PRO</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">
              {isAdmin
                ? "Hệ thống Quản trị tòa nhà"
                : "Cổng thông tin khách thuê"}
            </p>
          </div>

          <div className="flex gap-4">
            {isAdmin && view !== "accounts" && view !== "rooms" && (
              <select
                value={roomPath ? roomPath.split("/")[1] : ""}
                onChange={(e) => setRoomPath(`phongtro/${e.target.value}`)}
                className="bg-slate-100 border-none rounded-2xl px-6 py-3 font-bold text-xs text-blue-600 outline-none shadow-sm cursor-pointer"
              >
                {roomsList.length > 0 ? (
                  roomsList.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))
                ) : (
                  <option value="">Không có phòng khách nào</option>
                )}
              </select>
            )}
            {view === "overview" && (
              <button
                onClick={handleSaveBill}
                className="bg-slate-950 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-transform disabled:opacity-50"
                disabled={!roomPath}
              >
                Chốt hóa đơn
              </button>
            )}
          </div>
        </header>

        {view === "overview" &&
          (roomPath ? (
            <Overview
              billing={billing}
              pricePerKwh={pricePerKwh}
              leakagePower={leakagePower}
              config={config}
              data={data}
              chartData={chartData}
              activeDevices={activeDevices}
              roomPath={roomPath}
              topUpAmount={topUpAmount}
              setTopUpAmount={setTopUpAmount}
              submitTopUp={submitTopUp}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400">
              <p className="font-bold uppercase tracking-widest text-sm">
                Chưa có khách thuê nào trong hệ thống
              </p>
              <p className="text-xs mt-2">
                Vui lòng tạo phòng trống và đăng ký tài khoản cho khách.
              </p>
            </div>
          ))}

        {view === "devices" && (
          <RoomManagement roomUID={roomPath ? roomPath.split("/")[1] : null} />
        )}

        {view === "rooms" && isAdmin && (
          <RoomsAdmin emptyRoomsList={emptyRoomsList} />
        )}

        {view === "accounts" && (
          <AccountManagement
            isAdmin={isAdmin}
            allRoomsData={allRoomsData}
            currentUserEmail={currentUserEmail}
            currentRoomName={currentRoomName}
            roomPath={roomPath}
            emptyRoomsList={emptyRoomsList}
            roomInfo={roomInfo}
          />
        )}

        {view === "history" && (
          <BillingHistory
            billHistory={billHistory}
            isAdmin={isAdmin}
            handleDeleteBill={handleDeleteBill}
          />
        )}

        {view === "theft" && (
          <TheftSimulator
            roomUID={roomPath ? roomPath.split("/")[1] : null}
            isStealing={isStealing}
            setIsStealing={setIsStealing}
            stolenAmount={stolenAmount}
            setStolenAmount={setStolenAmount}
            totalDevicePower={data.totalDevicePower}
          />
        )}
      </main>
    </div>
  );
}
