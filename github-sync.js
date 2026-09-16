// Đường dẫn Worker API chính xác (không có dấu / ở cuối)
const API_URL = "https://api-chamcong.o0os2.workers.dev";

let currentUser = localStorage.getItem("cc_currentUser") || null;
let saveTimer = null;

document.addEventListener("DOMContentLoaded", function () {
  checkLoginState();
  bindMonthYearEvents();
  bindGlobalAutoSave(); // Bắt mọi thao tác nhập liệu trên trang (kể cả bảng lễ tết)
});

// Bắt sự kiện khi người dùng đổi Tháng hoặc Năm -> Tự động nạp dữ liệu tháng đó
function bindMonthYearEvents() {
  const m = document.getElementById("cc_thang");
  const y = document.getElementById("cc_nam");
  if (m) m.addEventListener("change", loadUserDataFromCloud);
  if (y) y.addEventListener("change", loadUserDataFromCloud);
}

// Bắt tự động mọi thay đổi input/select trên toàn trang để kích hoạt auto-save
function bindGlobalAutoSave() {
  document.addEventListener("input", function (e) {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA")) {
      if (e.target.id === "authUsername" || e.target.id === "authPassword") return;
      window.autoSaveUserData();
    }
  });

  document.addEventListener("change", function (e) {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT")) {
      if (e.target.id === "cc_thang" || e.target.id === "cc_nam") return;
      if (e.target.id === "authUsername" || e.target.id === "authPassword") return;
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
}

// 1. ĐĂNG KÝ
window.handleRegister = async function() {
  const u = document.getElementById("authUsername")?.value.trim();
  const p = document.getElementById("authPassword")?.value.trim();
  if (!u || !p) return alert("Vui lòng nhập tài khoản và mật khẩu!");

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
    } else {
      alert(data.error || "Đăng ký thất bại!");
    }
  } catch {
    alert("Không thể kết nối đến máy chủ Cloudflare Worker!");
  }
};

// 2. ĐĂNG NHẬP
window.handleLogin = async function() {
  const u = document.getElementById("authUsername")?.value.trim();
  const p = document.getElementById("authPassword")?.value.trim();
  if (!u || !p) return alert("Vui lòng nhập tài khoản và mật khẩu!");

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
      alert("Đăng nhập thành công!");
      checkLoginState();
    } else {
      alert(data.error || "Sai tài khoản hoặc mật khẩu!");
    }
  } catch {
    alert("Không thể kết nối máy chủ Cloudflare Worker!");
  }
};

// 3. ĐĂNG XUẤT
window.handleLogout = function() {
  currentUser = null;
  localStorage.removeItem("cc_currentUser");
  checkLoginState();
  alert("Đã đăng xuất!");
  if (typeof switchTab === "function") switchTab('tabLuong');
};

// 4. TỰ ĐỘNG LƯU DỮ LIỆU THÁNG (Đã gom sạch cả bảng Lễ Tết)
window.autoSaveUserData = function() {
  if (!currentUser) return;
  const statusEl = document.getElementById("syncStatus");
  if (statusEl) statusEl.textContent = "(Đang thay đổi...)";

  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(async () => {
    const year = document.getElementById("cc_nam")?.value || new Date().getFullYear();
    const month = document.getElementById("cc_thang")?.value || 1;
    const monthKey = `${year}_${month}`;

    // Phụ cấp chính
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

    // Quét toàn bộ input/select của bảng phụ (lương lễ tết, thưởng...)
    const extraInputs = {};
    const excludeIds = [
      "authUsername", "authPassword", "cc_nam", "cc_thang", "cc_luongCoBan",
      "cc_pcABC", "cc_pcChuyenCan", "cc_pcThamNien", "cc_pcChucVu",
      "cc_pcDiLai", "cc_pcDienThoai", "cc_pcTreEm", "cc_pcKhac"
    ];

    document.querySelectorAll("input, select, textarea").forEach(el => {
      if (el.id && !excludeIds.includes(el.id)) {
        if (el.type === "checkbox" || el.type === "radio") {
          extraInputs[el.id] = el.checked;
        } else {
          extraInputs[el.id] = el.value;
        }
      }
    });

    const payload = {
      base_salary: document.getElementById("cc_luongCoBan")?.value || "0",
      allowances: allowances,
      extra_fields: extraInputs,
      timesheet: window.chamCongData || {},
      updated_at: new Date().toISOString()
    };

    if (statusEl) statusEl.textContent = "(Đang lưu...)";

    try {
      const res = await fetch(`${API_URL}?action=save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser, monthKey, payload })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (statusEl) statusEl.textContent = "(Đã lưu tự động)";
      } else {
        if (statusEl) statusEl.textContent = "(Lỗi lưu: " + (data.error || "server") + ")";
      }
    } catch {
      if (statusEl) statusEl.textContent = "(Mất kết nối)";
    }
  }, 1500);
};

// 5. TẢI DỮ LIỆU ĐÚNG THÁNG
window.loadUserDataFromCloud = async function() {
  if (!currentUser) return;
  const year = document.getElementById("cc_nam")?.value || new Date().getFullYear();
  const month = document.getElementById("cc_thang")?.value || 1;
  const monthKey = `${year}_${month}`;

  const statusEl = document.getElementById("syncStatus");
  if (statusEl) statusEl.textContent = "(Đang tải...)";

  try {
    const res = await fetch(`${API_URL}?action=load&user=${encodeURIComponent(currentUser)}&monthKey=${monthKey}`);
    const record = await res.json();

    if (record) {
      // 1. Phục hồi Lương cơ bản
      if (document.getElementById("cc_luongCoBan")) {
        document.getElementById("cc_luongCoBan").value = record.base_salary || "";
      }

      // 2. Phục hồi Phụ cấp
      if (record.allowances) {
        Object.keys(record.allowances).forEach(k => {
          const el = document.getElementById(k);
          if (el) el.value = record.allowances[k];
        });
      }

      // 3. Phục hồi Bảng phụ Lễ Tết và các ô mở rộng
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

      // 4. Phục hồi Lịch chấm công
      if (record.timesheet && window.setChamCongData) {
        window.setChamCongData(record.timesheet);
      }
    } else {
      // Tháng mới: làm sạch dữ liệu
      if (window.clearChamCongData) window.clearChamCongData();
      if (document.getElementById("cc_luongCoBan")) {
        document.getElementById("cc_luongCoBan").value = "";
      }

      const excludeIds = ["authUsername", "authPassword", "cc_nam", "cc_thang"];
      document.querySelectorAll("input, select, textarea").forEach(el => {
        if (el.id && !excludeIds.includes(el.id)) {
          if (el.type === "checkbox" || el.type === "radio") el.checked = false;
          else el.value = "";
        }
      });
    }

    // Cập nhật lại giao diện và tính toán
    if (window.renderLichChamCong) window.renderLichChamCong();
    if (window.syncChamCongToTinhLuong) window.syncChamCongToTinhLuong();
    if (typeof window.tinhLuongLeTet === "function") window.tinhLuongLeTet();
    if (typeof window.tinhLuong === "function") window.tinhLuong();

    if (statusEl) statusEl.textContent = "(Đã tải xong)";
  } catch {
    if (statusEl) statusEl.textContent = "(Lỗi tải dữ liệu)";
  }
};
