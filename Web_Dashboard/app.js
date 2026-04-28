import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue, off } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDYF9eGuOHZv2YY0_lOsN-mE0qNWt_icU0",
    authDomain: "hethongcanhbaodien.firebaseapp.com",
    databaseURL: "https://hethongcanhbaodien-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hethongcanhbaodien",
    storageBucket: "hethongcanhbaodien.firebasestorage.app",
    messagingSenderId: "954409445146",
    appId: "1:954409445146:web:8b604133e1a10cb89c2ea3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let isLoginMode = true;
let currentUserPath = "";
let currentPower = 0;
let threshold = 2000; 
let budget = 50000;
let initialBudget = 50000;   
let totalKwh = 0.000;
let estimatedBill = 0;
const pricePerKwh = 2500; 
let warned20 = false, warned10 = false, warned5 = false;
let systemInterval;
let isSecurityOn = false;
let alertState = "NORMAL";

Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'Inter';

const ctxPower = document.getElementById('powerChart').getContext('2d');
const powerChart = new Chart(ctxPower, {
    type: 'line',
    data: {
        labels: ['Bắt đầu'],
        datasets: [{
            label: 'Công suất (W)',
            data: [0],
            borderColor: '#00d2ff', backgroundColor: 'rgba(0, 210, 255, 0.1)',
            borderWidth: 2, fill: true, tension: 0.4,
            pointBackgroundColor: '#00d2ff', pointRadius: 4
        }]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 5000 } }, animation: { duration: 0 } }
});

const ctxMonthly = document.getElementById('monthlyChart').getContext('2d');
const monthlyChart = new Chart(ctxMonthly, {
    type: 'bar',
    data: {
        labels: ['T3', 'T4', 'T5', 'T6', 'T7', 'CN', 'Hôm nay'],
        datasets: [{ label: 'Điện năng (kWh)', data: [12, 19, 15, 17, 14, 22, 0], backgroundColor: '#2ecc71', borderRadius: 5 }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

document.addEventListener('DOMContentLoaded', () => {
    const authScreen = document.getElementById('auth-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const btnAction = document.getElementById('btn-action');
    const toggleAuth = document.getElementById('toggle-auth');
    const authTitle = document.getElementById('auth-title');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const authError = document.getElementById('auth-error');
    const btnLogout = document.getElementById('btn-logout');
    const userEmailTxt = document.getElementById('user-email');
    const adminRoomManager = document.getElementById('admin-room-manager');

    toggleAuth.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        authTitle.innerText = isLoginMode ? "ĐĂNG NHẬP HỆ THỐNG" : "TẠO TÀI KHOẢN MỚI";
        btnAction.innerText = isLoginMode ? "ĐĂNG NHẬP" : "ĐĂNG KÝ";
        toggleAuth.innerText = isLoginMode ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập";
        authError.style.display = 'none';
    });

    btnAction.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        if(email === "" || password === "") { 
            authError.innerText = "Vui lòng nhập đầy đủ thông tin!"; 
            authError.style.display = 'block'; return; 
        }
        btnAction.innerText = "Đang xử lý...";
        if (isLoginMode) {
            signInWithEmailAndPassword(auth, email, password).catch(handleAuthError);
        } else {
            createUserWithEmailAndPassword(auth, email, password).catch(handleAuthError);
        }
    });

    function handleAuthError(error) {
        if(error.code === 'auth/email-already-in-use') authError.innerText = "Email đã tồn tại!";
        else if(error.code === 'auth/weak-password') authError.innerText = "Mật khẩu quá ngắn (>=6 ký tự)!";
        else authError.innerText = "Sai tài khoản hoặc mật khẩu!";
        authError.style.display = 'block';
        btnAction.innerText = isLoginMode ? "ĐĂNG NHẬP" : "ĐĂNG KÝ";
    }

    btnLogout.addEventListener('click', () => { signOut(auth); });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            authScreen.style.display = 'none';
            dashboardScreen.style.display = 'block';
            userEmailTxt.innerText = user.email;

            const ADMIN_EMAIL = "tridung30102004@gmail.com";
            const isAdmin = (user.email === ADMIN_EMAIL);
            const roleBadge = document.getElementById('user-role');
            const btnSaveBill = document.getElementById('btn-save-bill');
            const cardConfig = document.getElementById('card-config');
            const slider = document.getElementById('slider-power');

            if (isAdmin) {
                roleBadge.innerText = "ADMIN";
                roleBadge.className = "role-badge role-admin";
                adminRoomManager.style.display = 'block';
                btnSaveBill.style.display = 'block';
                cardConfig.style.display = 'block';
                if (slider) slider.disabled = false;

                currentUserPath = `phongtro/${adminRoomManager.value}`;
                adminRoomManager.onchange = () => {
                    currentUserPath = `phongtro/${adminRoomManager.value}`;
                    resetDashboard();
                    startSystem();
                };
            } else {
                roleBadge.innerText = "USER";
                roleBadge.className = "role-badge role-user";
                adminRoomManager.style.display = 'none';
                btnSaveBill.style.display = 'none';
                cardConfig.style.display = 'none';
                if (slider) slider.disabled = true;
                currentUserPath = `phongtro/${user.uid}`;
            }

            startSystem(); 
        } else {
            authScreen.style.display = 'flex';
            dashboardScreen.style.display = 'none';
            resetDashboard();
        }
    });
});

function resetDashboard() {
    if(systemInterval) clearInterval(systemInterval);
    off(ref(db, `${currentUserPath}/currentPower`));
    totalKwh = 0; estimatedBill = 0; budget = 50000;
    powerChart.data.labels = ['Bắt đầu'];
    powerChart.data.datasets[0].data = [0];
    powerChart.update();
    document.getElementById('event-log').innerHTML = '';
}

function startSystem() {
    const slider = document.getElementById('slider-power');
    const txtPower = document.getElementById('txt-power');
    const btnSecurity = document.getElementById('btn-security');
    
    alertState = "NORMAL";
    isSecurityOn = false;
    if(btnSecurity) btnSecurity.checked = false;

    logEvent(`🏠 Đang tải dữ liệu: ${currentUserPath}`);

    if (slider) {
        slider.oninput = function() {
            set(ref(db, `${currentUserPath}/currentPower`), parseInt(this.value));
        };
    }

    if (btnSecurity) {
        btnSecurity.onchange = function() {
            isSecurityOn = this.checked;
            document.getElementById('security-note').innerText = isSecurityOn ? "Đang giám sát (Chống trộm)" : "Đang tắt";
            document.getElementById('security-note').style.color = isSecurityOn ? "#2ecc71" : "#94a3b8";
            logEvent(isSecurityOn ? "🛡️ BẬT chống trộm" : "🔓 TẮT chống trộm");
            checkThreshold(currentPower);
        };
    }

    onValue(ref(db, `${currentUserPath}/currentPower`), (snapshot) => {
        const data = snapshot.val();
        if (data !== null) {
            currentPower = data;
            txtPower.innerText = currentPower;
            if (slider) slider.value = currentPower;
            checkThreshold(currentPower);
        }
    });

    loadBillingHistory();

    systemInterval = setInterval(() => {
        updatePowerChart(currentPower);
        if (currentPower > 0) {
            let kwhGained = (currentPower / 1000) / 3600 * 100;
            totalKwh += kwhGained; 
            document.getElementById('txt-kwh').innerText = totalKwh.toFixed(3);
            monthlyChart.data.datasets[0].data[6] = parseFloat(totalKwh.toFixed(3));
            monthlyChart.update();
            estimatedBill = totalKwh * pricePerKwh;
            document.getElementById('txt-bill').innerText = Math.round(estimatedBill).toLocaleString();
            budget -= (kwhGained * pricePerKwh); 
            document.getElementById('txt-budget').innerText = Math.max(0, Math.round(budget)).toLocaleString();
            checkBudget();
        }
    }, 1000);
}

function checkThreshold(power) {
    const alertBox = document.getElementById('alert-box');
    const powerCard = document.querySelector('.p-current');
    
    if (isSecurityOn && power > 50) {
        if (alertState !== "THEFT") {
            alertBox.innerHTML = '<span class="alert-badge" style="background:#ff4b2b;color:white;"><i class="fa-solid fa-user-ninja"></i> PHÁT HIỆN TRỘM ĐIỆN!</span>';
            powerCard.classList.add('warning-bg');
            logEvent(`🚨 BÁO ĐỘNG: Có dòng điện bất thường (${power}W)!`);
            alertState = "THEFT";
        }
    } else if (power > threshold) {
        if (alertState !== "OVERLOAD") {
            alertBox.innerHTML = '<span class="alert-badge"><i class="fa-solid fa-triangle-exclamation"></i> VƯỢT NGƯỠNG!</span>';
            powerCard.classList.add('warning-bg');
            logEvent(`⚠️ CẢNH BÁO: Quá tải (${power}W)!`);
            alertState = "OVERLOAD";
        }
    } else {
        if (alertState !== "NORMAL") {
            alertBox.innerHTML = '';
            powerCard.classList.remove('warning-bg');
            alertState = "NORMAL";
        }
    }
}

function updatePowerChart(power) {
    const timeString = new Date().toLocaleTimeString('vi-VN');
    powerChart.data.labels.push(timeString);
    powerChart.data.datasets[0].data.push(power);
    if (powerChart.data.labels.length > 15) {
        powerChart.data.labels.shift();
        powerChart.data.datasets[0].data.shift();
    }
    powerChart.update();
}

function checkBudget() {
    let percentLeft = (budget / initialBudget) * 100;
    if (budget <= 0) {
        budget = 0;
        logEvent("❌ NGẮT ĐIỆN: Hết ngân sách!");
        set(ref(db, `${currentUserPath}/currentPower`), 0); 
    }
}

window.saveMonthlyBill = function() {
    const adminRoomManager = document.getElementById('admin-room-manager');
    const roomName = adminRoomManager.options[adminRoomManager.selectedIndex].text;
    const now = new Date();
    const monthId = `month_${now.getMonth() + 1}_${now.getFullYear()}`;
    
    if (totalKwh <= 0) { alert("Phòng này chưa dùng điện!"); return; }

    const bill = {
        month: `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`,
        kwh: totalKwh.toFixed(3),
        amount: Math.round(estimatedBill).toLocaleString(),
        timestamp: Date.now()
    };

    set(ref(db, `${currentUserPath}/billingHistory/${monthId}`), bill).then(() => {
        logEvent(`✅ Đã chốt bill cho ${roomName}`);
        alert(`Đã chốt bill tháng ${now.getMonth()+1} cho ${roomName}`);
    });
};

function loadBillingHistory() {
    const billBody = document.getElementById('bill-history-body');
    onValue(ref(db, `${currentUserPath}/billingHistory`), (snapshot) => {
        billBody.innerHTML = '';
        const data = snapshot.val();
        if (data) {
            Object.values(data).sort((a, b) => b.timestamp - a.timestamp).forEach(bill => {
                billBody.innerHTML += `<tr><td><b>${bill.month}</b></td><td>${bill.kwh} kWh</td><td style="color:var(--primary)">${bill.amount} đ</td><td><span class="status-paid">ĐÃ THANH TOÁN</span></td></tr>`;
            });
        } else {
            billBody.innerHTML = '<tr><td colspan="4" style="text-align:center">Chưa có hóa đơn</td></tr>';
        }
    });
}

function logEvent(msg) {
    const logList = document.getElementById('event-log');
    const li = document.createElement('li');
    li.innerHTML = `<span style="color:var(--primary)">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
    logList.prepend(li); 
}

// Các hàm window khác giữ nguyên
window.saveThreshold = () => { 
    threshold = parseInt(document.getElementById('input-threshold').value); 
    logEvent(`⚙️ Ngưỡng mới: ${threshold}W`);
    alert("Đã lưu!");
};
window.addMoney = () => {
    document.getElementById('payment-modal').style.display = 'flex';
    setTimeout(() => {
        budget += 50000; initialBudget = budget;
        document.getElementById('payment-modal').style.display = 'none';
        logEvent("💰 Đã nạp 50,000đ");
    }, 2000);
};