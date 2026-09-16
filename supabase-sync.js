// --- CẤU HÌNH KẾT NỐI SUPABASE ---
const SUPABASE_URL = "https://txdnlqfxxhdskfbytyqo.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZG5scWZ4eGhkc2tmYnl0eXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMTcwNzIsImV4cCI6MjA1Njc5MzA3Mn0.your_anon_key_here"; // Dán đúng Key anon của anh

let currentUser = localStorage.getItem("cc_currentUser") || null;
let saveTimer = null;

document.addEventListener("DOMContentLoaded", function () {
  checkLoginState();
});

// Đồng bộ trạng thái giao diện: Ẩn form đăng nhập, hiện dòng "Xin chào"
function checkLoginState() {
  const loginForm = document.getElementById("loginFormArea");
  const userArea = document.getElementById("userInfoArea");
  const lblUser = document.getElementById("lblUsername");

  if (currentUser) {
    if (loginForm) loginForm.style.display = "none";
    if (userArea) userArea.style.display = "flex";
    if (lblUser) lblUser.textContent = currentUser;
    loadUserDataFromCloud();
  } else {
    if (loginForm) loginForm.style.display = "flex";
    if (userArea) userArea.style.display = "none";
  }
}

// Hàm gửi request Supabase chuẩn REST API
async function supabaseRequest(table, method = "GET", queryParams = "", bodyData = null) {
  const cleanUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${table}${queryParams}`;
  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": method === "POST" ? "return=representation" : ""
  };

  const options = { method, headers };
  if (bodyData) options.body = JSON.stringify(bodyData);

  try {
    const res = await fetch(cleanUrl, options);
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Supabase Error] ${res.status}:`, errText);
      return null;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  } catch (err) {
    console.error("[Network Error]:", err);
    return null;
  }
}

// Xử lý Đăng Ký
window.handleRegister = async function() {
  const uInput = document.getElementById("authUsername");
  const pInput = document.getElementById("authPassword");
  const u = uInput ? uInput.value.trim() : "";
  const p = pInput ? pInput.value.trim() : "";

  if (!u || !p) {
    alert("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
    return;
  }

  // 1. Kiểm tra tài khoản đã tồn tại chưa
  const check = await supabaseRequest("accounts", "GET", `?username=eq.${encodeURIComponent(u)}`);
  if (check === null) {
    alert("Lỗi kết nối Supabase! Kiểm tra lại URL hoặc Key anon.");
    return;
  }
  if (check.length > 0) {
    alert("Tài khoản này đã tồn tại, vui lòng chọn tên khác!");
    return;
  }

  // 2. Tạo tài khoản mới
  const res = await supabaseRequest("accounts", "POST", "", [{ username: u, password: p }]);
  if (res && res.length > 0) {
    currentUser = u;
    localStorage.setItem("cc_currentUser", u);
    alert("Đăng ký thành công!");
    if (uInput) uInput.value = "";
    if (pInput) pInput.value = "";
    checkLoginState();
  } else {
    alert("Không thể tạo tài khoản. Kiểm tra lại quyền bảng accounts trên Supabase!");
  }
};

// Xử lý Đăng Nhập
window.handleLogin = async function() {
  const uInput = document.getElementById("authUsername");
  const pInput = document.getElementById("authPassword");
  const u = uInput ? uInput.value.trim() : "";
  const p = pInput ? pInput.value.trim() : "";

  if (!u || !p) {
    alert("Vui lòng nhập tên đăng nhập và mật khẩu!");
    return;
  }

  const res = await supabaseRequest(
    "accounts",
    "GET",
    `?username=eq.${encodeURIComponent(u)}&password=eq.${encodeURIComponent(p)}`
  );

  if (res === null) {
    alert("Lỗi kết nối máy chủ! Kiểm tra lại internet hoặc cấu hình API.");
    return;
  }

  if (res.length > 0) {
    currentUser = u;
    localStorage.setItem("cc_currentUser", u);
    alert(`Đăng nhập thành công! Chào mừng ${u}`);
    if (uInput) uInput.value = "";
    if (pInput) pInput.value = "";
    checkLoginState();
  } else {
    alert("Sai tên đăng nhập hoặc mật khẩu!");
  }
};

// Xử lý Đăng Xuất
window.handleLogout = function() {
  currentUser = null;
  localStorage.removeItem("cc_currentUser");
  checkLoginState();
  alert("Đã đăng xuất tài khoản!");
};

// Tự động lưu ngầm khi người dùng thay đổi dữ liệu
window.autoSaveUserData = function() {
  if (!currentUser) return;
  const statusEl = document.getElementById("syncStatus");
  if (statusEl) statusEl.textContent = "(Đang thay đổi...)";

  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(async () => {
    const year = document.getElementById("cc_nam")?.value || new Date().getFullYear();
    const month = document.getElementById("cc_thang")?.value || 1;
    const baseSalary = document.getElementById("cc_luongCoBan")?.value || "0";

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

    const dataPayload = [{
      username: currentUser,
      year: parseInt(year),
      month: parseInt(month),
      base_salary: baseSalary,
      allowances_json: JSON.stringify(allowances),
      timesheet_json: JSON.stringify(window.chamCongData || {}),
      updated_at: new Date().toISOString()
    }];

    if (statusEl) statusEl.textContent = "(Đang lưu...)";

    const cleanUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/timesheets`;
    const headers = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates"
    };

    try {
      const res = await fetch(cleanUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(dataPayload)
      });

      if (res.ok) {
        if (statusEl) statusEl.textContent = "(Đã lưu tự động)";
      } else {
        if (statusEl) statusEl.textContent = "(Lỗi lưu mây)";
      }
    } catch (e) {
      if (statusEl) statusEl.textContent = "(Mất kết nối)";
    }
  }, 1500);
};

// Tải dữ liệu người dùng từ Cloud
window.loadUserDataFromCloud = async function() {
  if (!currentUser) return;
  const year = document.getElementById("cc_nam")?.value || new Date().getFullYear();
  const month = document.getElementById("cc_thang")?.value || 1;

  const statusEl = document.getElementById("syncStatus");
  if (statusEl) statusEl.textContent = "(Đang tải dữ liệu...)";

  const res = await supabaseRequest(
    "timesheets", 
    "GET", 
    `?username=eq.${encodeURIComponent(currentUser)}&year=eq.${year}&month=eq.${month}`
  );

  if (res && res.length > 0) {
    const row = res[0];
    if (document.getElementById("cc_luongCoBan")) {
      document.getElementById("cc_luongCoBan").value = row.base_salary || "";
    }
    
    if (row.allowances_json) {
      try {
        const al = JSON.parse(row.allowances_json);
        Object.keys(al).forEach(k => {
          const el = document.getElementById(k);
          if (el) el.value = al[k];
        });
      } catch(e) {}
    }

    if (row.timesheet_json && window.setChamCongData) {
      try {
        window.setChamCongData(JSON.parse(row.timesheet_json));
      } catch(e) {}
    }
  } else {
    if (window.clearChamCongData) window.clearChamCongData();
    if (document.getElementById("cc_luongCoBan")) document.getElementById("cc_luongCoBan").value = "";
  }

  if (window.renderLichChamCong) window.renderLichChamCong();
  if (window.syncChamCongToTinhLuong) window.syncChamCongToTinhLuong();
  if (statusEl) statusEl.textContent = "(Đã lưu tự động)";
};
