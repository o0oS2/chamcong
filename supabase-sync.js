// --- CẤU HÌNH KẾT NỐI SUPABASE ---
const SUPABASE_URL = "https://txdnlqfxxhdskfbytyqo.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZG5scWZ4eGhkc2tmYnl0eXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMTcwNzIsImV4cCI6MjA1Njc5MzA3Mn0.your_anon_key_here"; // Giữ nguyên khóa anon chuẩn của anh

let currentUser = localStorage.getItem("cc_currentUser") || null;
let saveTimer = null;

document.addEventListener("DOMContentLoaded", function () {
  checkLoginState();
});

// Kiểm tra trạng thái đăng nhập để ẩn/hiện form đăng nhập và khu vực "Xin chào"
function checkLoginState() {
  const loginFormArea = document.getElementById("loginFormArea"); 
  const userInfoArea = document.getElementById("userInfoArea");     
  const lblUser = document.getElementById("lblUsername");
  const modal = document.getElementById("loginModalOverlay");

  if (currentUser) {
    if (loginFormArea) loginFormArea.style.display = "none";
    if (userInfoArea) userInfoArea.style.display = "flex";
    if (lblUser) lblUser.textContent = currentUser;
    if (modal) modal.style.display = "none";
    loadUserDataFromCloud();
  } else {
    if (loginFormArea) loginFormArea.style.display = "flex";
    if (userInfoArea) userInfoArea.style.display = "none";
  }
}

// Hàm gửi request tối ưu chống lỗi 404/405
async function supabaseRequest(table, method = "GET", queryParams = "", bodyData = null) {
  let url = `${SUPABASE_URL}/rest/v1/${table}${queryParams}`;
  let headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };

  let options = { method, headers };
  if (bodyData) options.body = JSON.stringify(bodyData);

  try {
    let response = await fetch(url, options);
    if (!response.ok) {
      let errText = await response.text();
      console.error("Supabase Error Status:", response.status, errText);
      return null;
    }
    let text = await response.text();
    return text ? JSON.parse(text) : [];
  } catch (err) {
    console.error("Network Error:", err);
    return null;
  }
}

// Đăng ký tài khoản
window.handleRegister = async function() {
  const u = document.getElementById("authUsername").value.trim();
  const p = document.getElementById("authPassword").value.trim();
  if (!u || !p) { alert("Vui lòng nhập tài khoản và mật khẩu!"); return; }

  let check = await supabaseRequest("accounts", "GET", `?username=eq.${encodeURIComponent(u)}`);
  if (check && check.length > 0) {
    alert("Tài khoản đã tồn tại!");
    return;
  }

  let res = await supabaseRequest("accounts", "POST", "", { username: u, password: p });
  if (res !== null) {
    currentUser = u;
    localStorage.setItem("cc_currentUser", u);
    alert("Đăng ký thành công!");
    
    const modal = document.getElementById("loginModalOverlay");
    if (modal) modal.style.display = "none";

    checkLoginState();
  } else {
    alert("Lỗi đăng ký! Kiểm tra lại kết nối Supabase.");
  }
};

// Đăng nhập tài khoản
window.handleLogin = async function() {
  const u = document.getElementById("authUsername").value.trim();
  const p = document.getElementById("authPassword").value.trim();
  if (!u || !p) { alert("Vui lòng nhập tài khoản và mật khẩu!"); return; }

  let res = await supabaseRequest("accounts", "GET", `?username=eq.${encodeURIComponent(u)}&password=eq.${encodeURIComponent(p)}`);
  
  if (res && res.length > 0) {
    currentUser = u;
    localStorage.setItem("cc_currentUser", u);
    alert("Đăng nhập thành công!");
    
    const modal = document.getElementById("loginModalOverlay");
    if (modal) modal.style.display = "none";

    checkLoginState();
  } else {
    alert("Sai tên đăng nhập hoặc mật khẩu!");
  }
};

// Đăng xuất tài khoản
window.handleLogout = function() {
  currentUser = null;
  localStorage.removeItem("cc_currentUser");
  
  const loginFormArea = document.getElementById("loginFormArea");
  const userInfoArea = document.getElementById("userInfoArea");
  if (loginFormArea) loginFormArea.style.display = "flex";
  if (userInfoArea) userInfoArea.style.display = "none";

  checkLoginState();
  alert("Đã đăng xuất!");
  switchTab('tabLuong');
};

// Lưu dữ liệu tự động ngầm không giật lag
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

    let dataPayload = {
      username: currentUser,
      year: parseInt(year),
      month: parseInt(month),
      base_salary: baseSalary,
      allowances_json: JSON.stringify(allowances),
      timesheet_json: JSON.stringify(window.chamCongData || {}),
      updated_at: new Date()
    };

    if (statusEl) statusEl.textContent = "(Đang đồng bộ...)";

    let headers = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates"
    };

    let res = await fetch(`${SUPABASE_URL}/rest/v1/timesheets`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(dataPayload)
    });

    if (res.ok) {
      if (statusEl) statusEl.textContent = "(Đã lưu tự động)";
    } else {
      if (statusEl) statusEl.textContent = "(Lỗi lưu mây)";
    }
  }, 2000);
};

// Tải dữ liệu từ Supabase theo tài khoản và tháng/năm
window.loadUserDataFromCloud = async function() {
  if (!currentUser) return;
  const year = document.getElementById("cc_nam")?.value || new Date().getFullYear();
  const month = document.getElementById("cc_thang")?.value || 1;

  const statusEl = document.getElementById("syncStatus");
  if (statusEl) statusEl.textContent = "(Đang tải dữ liệu...)";

  let res = await supabaseRequest("timesheets", "GET", `?username=eq.${encodeURIComponent(currentUser)}&year=eq.${year}&month=eq.${month}`);

  if (res && res.length > 0) {
    let row = res[0];
    if (document.getElementById("cc_luongCoBan")) document.getElementById("cc_luongCoBan").value = row.base_salary || "";
    
    if (row.allowances_json) {
      try {
        let al = JSON.parse(row.allowances_json);
        Object.keys(al).forEach(k => {
          let el = document.getElementById(k);
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
