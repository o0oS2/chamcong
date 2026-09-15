// --- CẤU HÌNH API GOOGLE APPS SCRIPT ---
const API_URL = "https://script.google.com/macros/s/AKfycbxf0muq07u1rNdARYbwllrupFb0wwrZTwhjaax_FXZSBb1f79HEmnSVbuI0ALbK1ITmMQ/exec"; 

let currentUser = localStorage.getItem("cc_currentUser") || null;

document.addEventListener("DOMContentLoaded", function () {
  checkLoginState();
});

function checkLoginState() {
  const loginArea = document.getElementById("loginFormArea");
  const userArea = document.getElementById("userInfoArea");
  const lblUser = document.getElementById("lblUsername");

  if (currentUser) {
    if (loginArea) loginArea.style.display = "none";
    if (userArea) userArea.style.display = "flex";
    if (lblUser) lblUser.textContent = currentUser;
    if (typeof loadUserDataFromCloud === "function") {
      loadUserDataFromCloud();
    }
  } else {
    if (loginArea) loginArea.style.display = "flex";
    if (userArea) userArea.style.display = "none";
  }
}

window.handleLogin = async function() {
  const u = document.getElementById("authUsername").value.trim();
  const p = document.getElementById("authPassword").value.trim();
  if (!u || !p) { alert("Vui lòng nhập tài khoản và mật khẩu!"); return; }

  try {
    let res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "login", username: u, password: p })
    });
    let json = await res.json();
    if (json.status === "success") {
      currentUser = u;
      localStorage.setItem("cc_currentUser", u);
      alert("Đăng nhập thành công!");
      checkLoginState();
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert("Lỗi kết nối server!");
  }
};

window.handleRegister = async function() {
  const u = document.getElementById("authUsername").value.trim();
  const p = document.getElementById("authPassword").value.trim();
  if (!u || !p) { alert("Vui lòng nhập tài khoản và mật khẩu!"); return; }

  try {
    let res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "register", username: u, password: p })
    });
    let json = await res.json();
    alert(json.message);
    if (json.status === "success") {
      currentUser = u;
      localStorage.setItem("cc_currentUser", u);
      checkLoginState();
    }
  } catch (err) {
    alert("Lỗi kết nối server!");
  }
};

window.handleLogout = function() {
  currentUser = null;
  localStorage.removeItem("cc_currentUser");
  checkLoginState();
  alert("Đăng xuất thành công!");
};

// Tự động lưu dữ liệu lên Cloud
window.autoSaveUserData = function() {
  if (!currentUser) return;
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

  const payload = {
    action: "saveData",
    username: currentUser,
    year: year,
    month: month,
    baseSalary: baseSalary,
    allowancesJSON: JSON.stringify(allowances),
    timesheetJSON: JSON.stringify(window.chamCongData || {})
  };

  const statusEl = document.getElementById("syncStatus");
  if (statusEl) statusEl.textContent = "(Đang lưu...)";

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(res => res.json()).then(json => {
    if (json.status === "success" && statusEl) {
      statusEl.textContent = "(Đã lưu tự động)";
    }
  }).catch(err => {
    if (statusEl) statusEl.textContent = "(Lỗi lưu dữ liệu)";
  });
};

// Tải dữ liệu từ Cloud
window.loadUserDataFromCloud = async function() {
  if (!currentUser) return;
  const year = document.getElementById("cc_nam")?.value || new Date().getFullYear();
  const month = document.getElementById("cc_thang")?.value || 1;

  try {
    let res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "loadData", username: currentUser, year: year, month: month })
    });
    let json = await res.json();
    if (json.status === "success") {
      if (document.getElementById("cc_luongCoBan")) document.getElementById("cc_luongCoBan").value = json.baseSalary || "";
      
      if (json.allowancesJSON) {
        let al = JSON.parse(json.allowancesJSON);
        Object.keys(al).forEach(k => {
          let el = document.getElementById(k);
          if (el) el.value = al[k];
        });
      }

      if (json.timesheetJSON && window.setChamCongData) {
        window.setChamCongData(JSON.parse(json.timesheetJSON));
      }
    } else {
      if (window.clearChamCongData) window.clearChamCongData();
      if (document.getElementById("cc_luongCoBan")) document.getElementById("cc_luongCoBan").value = "";
    }
    if (window.renderLichChamCong) window.renderLichChamCong();
    if (window.syncChamCongToTinhLuong) window.syncChamCongToTinhLuong();
  } catch (err) {
    console.error("Lỗi tải dữ liệu:", err);
  }
};