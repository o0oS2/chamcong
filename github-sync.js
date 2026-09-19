const API_URL = "https://tinhluong.o0os2.workers.dev";

let currentUser = localStorage.getItem("cc_currentUser") || null;
let saveTimer = null;

document.addEventListener("DOMContentLoaded", function () {
  checkLoginState();
  bindGlobalAutoSave();
});

function bindGlobalAutoSave() {
  document.addEventListener("input", function (e) {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA")) {
      if (e.target.id === "authUsername" || e.target.id === "authPassword") return;
      // Chỉ Tab Chấm Công mới đồng bộ lên máy chủ; Tab Tính Lương không lưu server
      if (!e.target.closest || !e.target.closest("#paneChamCong")) return;
      window.autoSaveUserData();
    }
  });

  document.addEventListener("change", function (e) {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT")) {
      if (e.target.id === "authUsername" || e.target.id === "authPassword") return;
      if (!e.target.closest || !e.target.closest("#paneChamCong")) return;
      window.autoSaveUserData();
    }
  });
}

function checkLoginState() {
  const form = document.getElementById("loginFormArea");
  const info = document.getElementById("userInfoArea");
  const lbl = document.getElementById("lblUsername");

  if (currentUser) {
    if (form) form.style.display = "none";
    if (info) info.style.display = "flex";
    if (lbl) lbl.textContent = currentUser;
    loadUserDataFromCloud();
  } else {
    if (form) form.style.display = "flex";
    if (info) info.style.display = "none";
  }

  if (typeof window.updateCcLoginNotice === "function") window.updateCcLoginNotice();
}

// 1. ĐĂNG KÝ
window.handleRegister = async function() {
  const u = document.getElementById("authUsername")?.value.trim();
  const p = document.getElementById("authPassword")?.value.trim();
  if (!u || !p) return alert("Vui lòng nhập tài khoản và mật khẩu!");

  // Ghi nhớ tab đang mở trước khi đăng ký, để giữ nguyên sau khi xử lý xong
  const tabDangMo = document.getElementById("paneChamCong")?.classList.contains("active")
    ? "tabChamCong" : "tabLuong";

  const btn = document.querySelector("button[onclick*='handleRegister']") || (window.event ? window.event.target : null);
  const originalText = btn ? btn.innerText : "Đăng ký";
  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Đang đăng ký...";
  }

  try {
    const res = await fetch(`${API_URL}?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      currentUser = u;
      localStorage.setItem("cc_currentUser", u);
      alert("Đăng ký thành công!");
      checkLoginState();
      // Ép quay lại đúng tab đang mở trước đó, không để tự nhảy về Tính Lương
      if (typeof switchTab === "function") switchTab(tabDangMo);
    } else {
      alert(data.error || "Đăng ký thất bại!");
    }
  } catch {
    alert("Không thể kết nối đến máy chủ Cloudflare Worker!");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  }
};

// 2. ĐĂNG NHẬP
window.handleLogin = async function() {
  const u = document.getElementById("authUsername")?.value.trim();
  const p = document.getElementById("authPassword")?.value.trim();
  if (!u || !p) return alert("Vui lòng nhập tài khoản và mật khẩu!");

  // Ghi nhớ tab đang mở trước khi đăng nhập, để giữ nguyên sau khi đăng nhập xong
  const tabDangMo = document.getElementById("paneChamCong")?.classList.contains("active")
    ? "tabChamCong" : "tabLuong";

  const btn = document.querySelector("button[onclick*='handleLogin']") || (window.event ? window.event.target : null);
  const originalText = btn ? btn.innerText : "Đăng nhập";
  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Đang đăng nhập...";
  }

  try {
    const res = await fetch(`${API_URL}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      currentUser = u;
      localStorage.setItem("cc_currentUser", u);
      checkLoginState();
      // Ép quay lại đúng tab đang mở trước đó, không để tự nhảy về Tính Lương
      if (typeof switchTab === "function") switchTab(tabDangMo);
    } else {
      alert(data.error || "Sai tài khoản hoặc mật khẩu!");
    }
  } catch {
    alert("Không thể kết nối máy chủ Cloudflare Worker!");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  }
};

// 3. ĐĂNG XUẤT
window.handleLogout = function() {
  currentUser = null;
  localStorage.removeItem("cc_currentUser");

  // Chỉ xóa mật khẩu trong ô nhập liệu, giữ lại tên đăng nhập
  const pwdInput = document.getElementById("authPassword");
  if (pwdInput) pwdInput.value = "";

  // Xóa sạch dữ liệu Tab Chấm Công khi đăng xuất, tránh lộ/lẫn dữ liệu sang tài khoản khác
  clearChamCongTabData();

  checkLoginState();

  // Hiện lại cảnh báo "Đăng nhập để lưu thông tin"
  const notice = document.getElementById("ccLoginNotice");
  if (notice) notice.style.display = "flex";
  if (typeof window.updateCcLoginNotice === "function") window.updateCcLoginNotice();

  alert("Đã đăng xuất!");
};

// 4. ĐỔI MẬT KHẨU
window.handleChangePassword = async function() {
  if (!currentUser) return alert("Bạn cần đăng nhập trước!");

  const oldPwd = document.getElementById("cpOldPwd")?.value.trim() || "";
  const newPwd = document.getElementById("cpNewPwd")?.value.trim() || "";
  const confirmPwd = document.getElementById("cpConfirmPwd")?.value.trim() || "";

  if (!oldPwd || !newPwd || !confirmPwd) return alert("Vui lòng nhập đầy đủ thông tin!");
  if (newPwd.length < 4) return alert("Mật khẩu mới phải có ít nhất 4 ký tự!");
  if (newPwd !== confirmPwd) return alert("Mật khẩu mới xác nhận không khớp!");
  if (newPwd === oldPwd) return alert("Mật khẩu mới phải khác mật khẩu hiện tại!");

  const btn = document.querySelector("button[onclick*='handleChangePassword']");
  const originalText = btn ? btn.innerText : "Xác nhận đổi mật khẩu";
  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Đang xử lý...";
  }

  try {
    const res = await fetch(`${API_URL}?action=changepassword`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser, oldPassword: oldPwd, newPassword: newPwd })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      alert("Đổi mật khẩu thành công!");
      ["cpOldPwd", "cpNewPwd", "cpConfirmPwd"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      if (typeof window.closeChangePwdModal === "function") window.closeChangePwdModal();
    } else {
      alert(data.error || "Đổi mật khẩu thất bại! Sai mật khẩu hiện tại hoặc lỗi máy chủ.");
    }
  } catch {
    alert("Không thể kết nối đến máy chủ Cloudflare Worker!");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  }
};

function clearChamCongTabData() {
  if (window.clearChamCongData) window.clearChamCongData();
  window.currentShiftMode = "chuan";
  window.daoCaStep = 0;
  window.batThuongMonths = {};
  window.batThuongDemDays = {};

  const ccIds = [
    "cc_luongCoBan", "cc_ngayCong", "cc_tc150", "cc_tc200", "cc_tcDem30",
    "cc_ngayCong200", "cc_tc300", "cc_tc340", "cc_tcDem70", "cc_thongca380", "cc_phepNam", "cc_le",
    "cc_pcABC", "cc_pcChuyenCan", "cc_pcThamNien", "cc_pcChucVu", "cc_pcDiLai", "cc_pcDienThoai", "cc_pcTreEm", "cc_pcKhac",
    "cc_soGioHanhChinh1", "cc_phuLuongHanhChinh", "cc_soGioTangCa1", "cc_phuLuongTangCa", "cc_soGioDem1", "cc_phuLuongDem",
    "cc_soGioHanhChinh2", "cc_phuLuongHanhChinh2", "cc_soGioTangCa2", "cc_phuLuongTangCa2", "cc_soGioDem2", "cc_phuLuongDem2"
  ];
  ccIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  if (typeof window.applyDefaultAllowances === "function") window.applyDefaultAllowances();
  if (typeof window.updateDaoCaButtonUI === "function") window.updateDaoCaButtonUI();
  if (window.renderLichChamCong) window.renderLichChamCong();
  if (window.syncChamCongToTinhLuong) window.syncChamCongToTinhLuong();
  else if (typeof window.triggerCcComputeEngine === "function") window.triggerCcComputeEngine();
}

// 5. TỰ ĐỘNG LƯU
window.autoSaveUserData = function() {
  if (!currentUser) return;
  const statusEl = document.getElementById("syncStatus");
  if (statusEl) statusEl.textContent = "Đang thay đổi...";

  // Debounce: chỉ thực sự gửi lên server sau khi người dùng ngừng gõ/chỉnh sửa 2 giây,
  // tránh gọi API liên tục gây quá tải mỗi lần gõ phím.
  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(async () => {
    const year = window.selectedYear || new Date().getFullYear();
    const month = window.selectedMonth || 1;
    const monthKey = `${year}_${month}`;

    const allowances = {
      cc_pcABC: document.getElementById("cc_pcABC")?.value || "",
      cc_pcChuyenCan: document.getElementById("cc_pcChuyenCan")?.value || "",
      cc_pcThamNien: document.getElementById("cc_pcThamNien")?.value || "",
      cc_pcChucVu: document.getElementById("cc_pcChucVu")?.value || "",
      cc_pcDiLai: document.getElementById("cc_pcDiLai")?.value || "",
      cc_pcDienThoai: document.getElementById("cc_pcDienThoai")?.value || "",
      cc_pcTreEm: document.getElementById("cc_pcTreEm")?.value || "",
      cc_pcKhac: document.getElementById("cc_pcKhac")?.value || ""
    };

    const extraInputs = {};
    const excludeIds = [
      "cc_luongCoBan",
      "cc_pcABC", "cc_pcChuyenCan", "cc_pcThamNien", "cc_pcChucVu",
      "cc_pcDiLai", "cc_pcDienThoai", "cc_pcTreEm", "cc_pcKhac"
    ];

    // Chỉ lấy dữ liệu các ô thuộc Tab Chấm Công (id bắt đầu bằng "cc_").
    // Tab Tính Lương không đồng bộ lên máy chủ.
    document.querySelectorAll("input, select, textarea").forEach(el => {
      if (el.id && el.id.startsWith("cc_") && !excludeIds.includes(el.id)) {
        if (el.type === "checkbox" || el.type === "radio") {
          extraInputs[el.id] = el.checked;
        } else {
          extraInputs[el.id] = el.value;
        }
      }
    });

    // Chế độ ca bất thường lưu riêng theo từng tháng ở phía chamcong.js (key "nam-thang"),
    // nên khi lưu lên server chỉ lấy đúng phần của tháng đang xem để nhét vào record của tháng đó.
    const batThuongKey = `${year}-${month}`;
    const dangBatThuong = !!(window.batThuongMonths && window.batThuongMonths[batThuongKey]);
    const ngayCaDemBatThuong = (window.batThuongDemDays && window.batThuongDemDays[batThuongKey]) || [];

    const payload = {
      base_salary: document.getElementById("cc_luongCoBan")?.value || "",
      allowances: allowances,
      extra_fields: extraInputs,
      timesheet: window.chamCongData || {},
      shift_mode: window.currentShiftMode || "chuan",
      dao_ca_step: typeof window.daoCaStep === "number" ? window.daoCaStep : 0,
      bat_thuong: {
        active: dangBatThuong,
        dem_days: ngayCaDemBatThuong
      },
      updated_at: new Date().toISOString()
    };

    if (statusEl) statusEl.textContent = "Đang lưu...";

    try {
      const res = await fetch(`${API_URL}?action=save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser, monthKey, payload })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (statusEl) statusEl.textContent = "Đã lưu";
      } else {
        if (statusEl) statusEl.textContent = "Lỗi lưu: " + (data.error || "server");
      }
    } catch {
      if (statusEl) statusEl.textContent = "Mất kết nối";
    }
  }, 2000);
};

// Đổ dữ liệu 1 record (lương, phụ cấp, các ô khác, chấm công) vào form
function applyRecordToForm(record, formatFn) {
  const formattedSalary = formatFn(record.base_salary || "");
  if (document.getElementById("cc_luongCoBan")) document.getElementById("cc_luongCoBan").value = formattedSalary;

  if (record.allowances) {
    Object.keys(record.allowances).forEach(k => {
      const el = document.getElementById(k);
      if (el) {
        if (["cc_pcABC", "cc_pcChucVu", "cc_pcDiLai", "cc_pcKhac"].includes(k)) {
          el.value = formatFn(record.allowances[k]);
        } else {
          el.value = record.allowances[k];
        }
      }
    });
  }

  if (record.extra_fields) {
    Object.keys(record.extra_fields).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (el.type === "checkbox" || el.type === "radio") {
          el.checked = Boolean(record.extra_fields[id]);
        } else {
          el.value = record.extra_fields[id];
        }
      }
    });
  }

  if (record.timesheet && window.setChamCongData) {
    window.setChamCongData(record.timesheet);
  }

  if (record.shift_mode) {
    window.currentShiftMode = record.shift_mode;
  }
  if (typeof record.dao_ca_step === "number") {
    window.daoCaStep = record.dao_ca_step;
  }

  // Khôi phục chế độ ca bất thường đúng cho tháng vừa tải (key "nam-thang" của chamcong.js)
  const namDangXem = window.selectedYear || new Date().getFullYear();
  const thangDangXem = window.selectedMonth || 1;
  const batThuongKey = `${namDangXem}-${thangDangXem}`;
  window.batThuongMonths = window.batThuongMonths || {};
  window.batThuongDemDays = window.batThuongDemDays || {};

  if (record.bat_thuong && record.bat_thuong.active) {
    window.batThuongMonths[batThuongKey] = true;
    window.batThuongDemDays[batThuongKey] = record.bat_thuong.dem_days || [];
  } else {
    delete window.batThuongMonths[batThuongKey];
    delete window.batThuongDemDays[batThuongKey];
  }

  if (typeof window.updateDaoCaButtonUI === "function") window.updateDaoCaButtonUI();
}

// Lấy lương & phụ cấp (trừ chuyên cần) từ tháng trước để đổ sẵn vào tháng mới chưa có dữ liệu
async function carryOverFromPrevMonth(year, month, formatFn) {
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 1) { prevMonth = 12; prevYear = year - 1; }
  const prevKey = `${prevYear}_${prevMonth}`;

  try {
    const res = await fetch(`${API_URL}?action=load&user=${encodeURIComponent(currentUser)}&monthKey=${prevKey}`);
    const prevRecord = await res.json();
    if (!prevRecord) return;

    const formattedSalary = formatFn(prevRecord.base_salary || "");
    if (document.getElementById("cc_luongCoBan")) document.getElementById("cc_luongCoBan").value = formattedSalary;

    if (prevRecord.allowances) {
      Object.keys(prevRecord.allowances).forEach(k => {
        if (k === "cc_pcChuyenCan") return; // Chuyên cần không giữ, để tính lại theo mặc định
        const el = document.getElementById(k);
        if (el) {
          if (["cc_pcABC", "cc_pcChucVu", "cc_pcDiLai", "cc_pcKhac"].includes(k)) {
            el.value = formatFn(prevRecord.allowances[k]);
          } else {
            el.value = prevRecord.allowances[k];
          }
        }
      });
    }

    if (prevRecord.shift_mode) {
      window.currentShiftMode = prevRecord.shift_mode;
    }
    if (typeof prevRecord.dao_ca_step === "number") {
      window.daoCaStep = prevRecord.dao_ca_step;
    }
    if (typeof window.updateDaoCaButtonUI === "function") window.updateDaoCaButtonUI();
  } catch {
    // Không có/không lấy được dữ liệu tháng trước thì bỏ qua, giữ nguyên form trống
  }
}

// 6. TẢI DỮ LIỆU ĐÚNG THÁNG
window.loadUserDataFromCloud = async function() {
  if (!currentUser) return;
  const year = window.selectedYear || new Date().getFullYear();
  const month = window.selectedMonth || 1;
  const monthKey = `${year}_${month}`;

  const statusEl = document.getElementById("syncStatus");
  if (statusEl) statusEl.textContent = "Đang nạp...";

  const formatFn = window.formatSalaryNumber || function(v){ return v; };

  try {
    const res = await fetch(`${API_URL}?action=load&user=${encodeURIComponent(currentUser)}&monthKey=${monthKey}`);
    const record = await res.json();

    if (record) {
      applyRecordToForm(record, formatFn);
    } else {
      // Tháng mới chưa có dữ liệu: xóa trắng lịch chấm công & các ô, sau đó giữ lại
      // lương + phụ cấp (trừ chuyên cần) từ tháng liền trước
      if (window.clearChamCongData) window.clearChamCongData();

      // Đảm bảo tháng mới không dính chế độ ca bất thường còn sót lại trong bộ nhớ
      const batThuongKeyThangMoi = `${year}-${month}`;
      window.batThuongMonths = window.batThuongMonths || {};
      window.batThuongDemDays = window.batThuongDemDays || {};
      delete window.batThuongMonths[batThuongKeyThangMoi];
      delete window.batThuongDemDays[batThuongKeyThangMoi];

      const excludeIds = ["authUsername", "authPassword"];
      document.querySelectorAll("input, select, textarea").forEach(el => {
        if (el.id && !excludeIds.includes(el.id)) {
          if (el.type === "checkbox" || el.type === "radio") el.checked = false;
          else el.value = "";
        }
      });

      await carryOverFromPrevMonth(year, month, formatFn);

      if (typeof window.applyDefaultAllowances === "function") {
        window.applyDefaultAllowances();
      }
    }

    if (typeof window.updateDateDisplays === "function") window.updateDateDisplays();
    if (window.renderLichChamCong) window.renderLichChamCong();
    if (window.syncChamCongToTinhLuong) window.syncChamCongToTinhLuong();
    if (typeof window.tinhLuong === "function") window.tinhLuong();
    if (typeof window.triggerCcComputeEngine === "function") window.triggerCcComputeEngine();

    if (statusEl) statusEl.textContent = "Đã đồng bộ";
  } catch {
    if (statusEl) statusEl.textContent = "Lỗi nạp dữ liệu";
  }
};

// 7. THỐNG KÊ CHẤM CÔNG (footer): tổng tài khoản + số người đang dùng
// - Khi đang mở Tab Chấm Công, cứ mỗi CC_PING_INTERVAL gửi 1 "nhịp tim" lên máy chủ.
// - Máy chủ coi một thiết bị là "đang dùng" nếu có nhịp tim trong vài phút gần nhất.
// - Chỉ gửi một mã ngẫu nhiên của trình duyệt, không gửi tên tài khoản hay dữ liệu chấm công.
const CC_PING_INTERVAL = 60 * 1000;
let ccStatsTimer = null;

function getCcSessionId() {
  let sid = null;
  try { sid = localStorage.getItem("cc_sid"); } catch {}
  if (!sid) {
    sid = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { localStorage.setItem("cc_sid", sid); } catch {}
  }
  return sid;
}

function renderCcStats(data) {
  const totalEl = document.getElementById("ccTotalUsers");
  const onlineEl = document.getElementById("ccOnlineUsers");
  if (totalEl && typeof data.totalUsers !== "undefined") {
    totalEl.textContent = Number(data.totalUsers).toLocaleString("vi-VN");
  }
  if (onlineEl && typeof data.online !== "undefined") {
    onlineEl.textContent = Number(data.online).toLocaleString("vi-VN");
  }
}

function markCcStatsUnavailable() {
  // Chỉ đổi những ô chưa có số, giữ nguyên số cũ nếu đã hiển thị trước đó
  ["ccTotalUsers", "ccOnlineUsers"].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.textContent === "...") el.textContent = "—";
  });
}

async function pingCcStats() {
  if (document.hidden) return; // tab trình duyệt đang ẩn thì không tính là đang dùng
  try {
    const res = await fetch(`${API_URL}?action=ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sid: getCcSessionId() })
    });
    const data = await res.json();
    if (res.ok && data && data.ok) renderCcStats(data);
    else markCcStatsUnavailable();
  } catch {
    markCcStatsUnavailable();
  }
}

window.startCcStats = function() {
  if (ccStatsTimer) clearInterval(ccStatsTimer);
  pingCcStats();
  ccStatsTimer = setInterval(pingCcStats, CC_PING_INTERVAL);
};

window.stopCcStats = function() {
  if (ccStatsTimer) clearInterval(ccStatsTimer);
  ccStatsTimer = null;
};

// Quay lại tab trình duyệt khi đang ở Tab Chấm Công thì cập nhật ngay
document.addEventListener("visibilitychange", function () {
  if (!document.hidden && ccStatsTimer) pingCcStats();
});
