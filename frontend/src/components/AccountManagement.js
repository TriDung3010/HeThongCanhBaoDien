import React, { useState } from "react";
import { db, auth } from "../firebase";
import { ref, update, remove, push, set } from "firebase/database";
import {
  updatePassword,
  updateEmail,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { UserCog, UserPlus } from "lucide-react";

export default function AccountManagement({
  isAdmin,
  allRoomsData,
  currentUserEmail,
  currentRoomName,
  roomPath,
  emptyRoomsList,
  roomInfo,
}) {
  // STATE ADMIN
  const [editingRoom, setEditingRoom] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccPassword, setNewAccPassword] = useState("");
  const [newAccName, setNewAccName] = useState("");
  const [newAccPhone, setNewAccPhone] = useState("");
  const [selectedRoomForNewAcc, setSelectedRoomForNewAcc] = useState("");

  // STATE USER
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [userFullName, setUserFullName] = useState(roomInfo?.fullName || "");
  const [userPhone, setUserPhone] = useState(roomInfo?.phone || "");

  const displayUsername = currentUserEmail.includes("@smartgrid.com")
    ? currentUserEmail.split("@")[0]
    : currentUserEmail;

  // HÀM ADMIN: LƯU SỬA KHÁCH
  const handleSaveEditRoom = () => {
    if (!editingRoom.name.trim())
      return alert("Tên phòng không được để trống!");
    update(ref(db, `phongtro/${editingRoom.uid}`), {
      roomName: editingRoom.name,
      fullName: editingRoom.fullName || "",
      phone: editingRoom.phone || "",
      budget: Number(editingRoom.budget) || 0,
      isPowerOn: (Number(editingRoom.budget) || 0) > 0 ? true : false,
    }).then(() => {
      alert("Đã cập nhật thông tin tài khoản thành công!");
      setEditingRoom(null);
    });
  };

  // HÀM ADMIN: XÓA KHÁCH
  const handleEvictRoom = (uid, roomName) => {
    if (
      window.confirm(
        `Thu hồi ${roomName}? Dữ liệu khách sẽ bị xóa và phòng trở thành Phòng Trống.`,
      )
    ) {
      push(ref(db, "availableRooms"), { name: roomName }).then(() => {
        remove(ref(db, `phongtro/${uid}`));
        alert("Đã xóa tài khoản và thu hồi phòng thành công!");
      });
    }
  };

  // HÀM ADMIN: THÊM KHÁCH MỚI
  const handleAddAccount = async () => {
    if (!newAccEmail || !newAccPassword || !selectedRoomForNewAcc)
      return alert("Vui lòng điền đủ Tên đăng nhập, Mật khẩu và Chọn phòng!");

    if (
      window.confirm(
        "Bảo mật Firebase: Để tạo tài khoản mới thành công, hệ thống sẽ tự động đăng xuất Admin. Đồng chí có muốn tiếp tục tạo?",
      )
    ) {
      try {
        const emailToUse = newAccEmail.includes("@")
          ? newAccEmail
          : `${newAccEmail}@smartgrid.com`;
        const userCred = await createUserWithEmailAndPassword(
          auth,
          emailToUse,
          newAccPassword,
        );

        const roomData = emptyRoomsList.find(
          (r) => r.id === selectedRoomForNewAcc,
        );

        await set(ref(db, `phongtro/${userCred.user.uid}`), {
          roomName: roomData.name,
          fullName: newAccName,
          phone: newAccPhone,
          budget: 0,
          currentPower: 0,
          totalDevicePower: 0,
          isPowerOn: false,
          isSecurityOn: false,
          threshold: 2000,
          deviceList: [],
        });

        await remove(ref(db, `availableRooms/${selectedRoomForNewAcc}`));
        alert(
          "Tạo tài khoản thành công! Đang chuyển hướng ra màn hình đăng nhập...",
        );
      } catch (err) {
        alert("Lỗi: " + err.message);
      }
    }
  };

  // HÀM USER: CẬP NHẬT HỒ SƠ
  const handleUpdateProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      let isUpdated = false;

      // Đổi thông tin phụ (DB)
      if (
        userFullName !== roomInfo?.fullName ||
        userPhone !== roomInfo?.phone
      ) {
        await update(ref(db, roomPath), {
          fullName: userFullName,
          phone: userPhone,
        });
        isUpdated = true;
      }

      // Đổi Auth
      if (newUsername.trim()) {
        const newEmail = newUsername.includes("@")
          ? newUsername
          : `${newUsername}@smartgrid.com`;
        await updateEmail(user, newEmail);
        isUpdated = true;
      }
      if (newPassword.trim()) {
        await updatePassword(user, newPassword);
        isUpdated = true;
      }

      if (isUpdated) {
        alert("Cập nhật thông tin thành công!");
        setNewUsername("");
        setNewPassword("");
      } else {
        alert("Chưa có thông tin nào được thay đổi.");
      }
    } catch (error) {
      if (error.message.includes("requires-recent-login")) {
        alert(
          "⚠️ Bảo mật Firebase: Vui lòng ĐĂNG XUẤT và ĐĂNG NHẬP LẠI để xác thực quyền!",
        );
      } else {
        alert("Lỗi: " + error.message);
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-700">
      {/* MODAL ADMIN: THÊM TÀI KHOẢN MỚI */}
      {isAddingUser && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-6">
              Tạo tài khoản khách
            </h3>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Tên đăng nhập..."
                  value={newAccEmail}
                  onChange={(e) => setNewAccEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-3 text-sm font-bold outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Mật khẩu (ít nhất 6 ký tự)..."
                  value={newAccPassword}
                  onChange={(e) => setNewAccPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-3 text-sm font-bold outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Họ và tên..."
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-3 text-sm font-bold outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Số điện thoại..."
                  value={newAccPhone}
                  onChange={(e) => setNewAccPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-3 text-sm font-bold outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <select
                  value={selectedRoomForNewAcc}
                  onChange={(e) => setSelectedRoomForNewAcc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="">-- Chọn phòng gán cho khách --</option>
                  {emptyRoomsList.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsAddingUser(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-[1.25rem] font-black text-[10px] uppercase hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddAccount}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-[1.25rem] font-black text-[10px] uppercase hover:bg-blue-500"
                >
                  Tạo tài khoản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADMIN: SỬA TÀI KHOẢN KHÁCH */}
      {editingRoom && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-6">
              Cập nhật hồ sơ khách
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">
                  Tên phòng
                </label>
                <input
                  type="text"
                  value={editingRoom.name}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-3 text-sm font-bold outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={editingRoom.fullName}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, fullName: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-3 text-sm font-bold outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={editingRoom.phone}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, phone: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-3 text-sm font-bold outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">
                  Ngân sách (VNĐ)
                </label>
                <input
                  type="number"
                  value={editingRoom.budget}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, budget: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-3 text-sm font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  onClick={() => setEditingRoom(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black text-[10px] uppercase hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEditRoom}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase hover:bg-blue-500 shadow-lg"
                >
                  Lưu lại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin ? (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-10 overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-2xl">
                <UserCog size={24} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                Danh sách tài khoản khách
              </h2>
            </div>
            <button
              onClick={() => setIsAddingUser(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg transition-all"
            >
              <UserPlus size={16} /> Thêm tài khoản
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Phòng
                  </th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Khách thuê
                  </th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    SĐT
                  </th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Ngân sách dư
                  </th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Trạng thái
                  </th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Object.keys(allRoomsData).length > 0 ? (
                  Object.keys(allRoomsData).map((uid) => (
                    <tr key={uid} className="hover:bg-slate-50/50">
                      <td className="p-6 font-black text-slate-700 uppercase text-xs">
                        {allRoomsData[uid].roomName}
                      </td>
                      <td className="p-6 font-bold text-slate-700 text-xs">
                        {allRoomsData[uid].fullName || (
                          <span className="text-slate-400 italic">
                            Chưa cập nhật
                          </span>
                        )}
                      </td>
                      <td className="p-6 font-bold text-slate-500 text-xs">
                        {allRoomsData[uid].phone || "-"}
                      </td>
                      <td className="p-6 font-black text-blue-600 text-sm">
                        {Math.round(
                          allRoomsData[uid].budget || 0,
                        ).toLocaleString()}{" "}
                        <span className="text-[10px]">VNĐ</span>
                      </td>
                      <td className="p-6 text-center">
                        <span
                          className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border ${allRoomsData[uid].isPowerOn ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}
                        >
                          {allRoomsData[uid].isPowerOn
                            ? "Đang Cấp Điện"
                            : "Bị Cắt Điện"}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() =>
                              setEditingRoom({
                                uid,
                                name: allRoomsData[uid].roomName,
                                budget: allRoomsData[uid].budget || 0,
                                fullName: allRoomsData[uid].fullName || "",
                                phone: allRoomsData[uid].phone || "",
                              })
                            }
                            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() =>
                              handleEvictRoom(uid, allRoomsData[uid].roomName)
                            }
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-10 text-center text-slate-400 font-bold italic text-sm"
                    >
                      Chưa có khách thuê nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-10 max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-6">
            <div className="bg-blue-50 p-3 rounded-2xl">
              <UserCog size={24} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              Hồ sơ cá nhân
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Tên đăng nhập
              </span>
              <span className="font-black text-slate-800">
                {displayUsername}
              </span>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Vị trí căn hộ
              </span>
              <span className="font-black text-blue-600 uppercase text-lg">
                {currentRoomName}
              </span>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-100 pt-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">
              Cập nhật thông tin cá nhân
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Họ và tên..."
                value={userFullName}
                onChange={(e) => setUserFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Số điện thoại..."
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Đổi Tên đăng nhập mới..."
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
              />
              <input
                type="password"
                placeholder="Đổi Mật khẩu mới..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleUpdateProfile}
              className="w-full bg-slate-900 hover:bg-blue-600 text-white font-black py-5 rounded-[1.5rem] uppercase tracking-widest text-[11px] mt-6 shadow-xl transition-all"
            >
              Lưu thông tin hồ sơ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
