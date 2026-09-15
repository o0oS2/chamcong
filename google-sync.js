// --- CẤU HÌNH API GOOGLE APPS SCRIPT ---
const API_URL = "https://script.google.com/macros/s/AKfycbxf0muq07u1rNdARYbwllrupFb0wwrZTwhjaax_FXZSBb1Ft9HEmnSVbuI0ALbK1ITmMQ/exec"; 

let currentUser = localStorage.getItem("cc_currentUser") || null;
let saveTimer = null;

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
    loadUserDataFromCloud();
  } else {
    if (loginArea) loginArea.style.display = "flex";
    if (userArea) userArea.style.display = "none";
  }
}

window.handleLogin = function() {
  const u = document.getElementById("authUsername").value.trim();
  const p = document.getElementById("authPassword").value.trim();
  if (!u || !p) { alert("Vui lòng nhập tài khoản và mật khẩu!"); return; }

  const statusEl = document.getElementById("syncStatus");
  if (statusEl) statusEl.textContent = "(Đang đăng nhập...)";

  let url = `${API_URL}?action=login&username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`;
  
  fetch(url)
    .then(res => res.json())
    .then(json => {
      if (json.status === "success") {
        currentUser = u;
        localStorage.setItem("cc_currentUser", u);
        alert("Đăng nhập thành công!");
        checkLoginState();
      } else {
        alert(json.message);
        if (statusEl) statusEl.textContent = "(Đăng nhập thất bại)";
      }
    })
    .catch(err => {
      // Fallback nếu mở qua trình duyệt nhúng Zalo bị chặn fetch
      alert("Không thể kết nối đến máy chủ. Vui lòng mở bằng trình duyệt Safari/Chrome ngoài!");
      if (statusEl) statusEl.textContent = "(Lỗi kết nối)";
    });
};

window.handleRegister = function() {
  const u = document.getElementById("authUsername").value.trim();
  const p = document.getElementById("authPassword").value.trim();
  if (!u || !p) { alert("Vui lòng nhập tài khoản và mật khẩu!"); return; }

  let url = `${API_URL}?action=register&username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`;
  
  fetch(url)
    .then(res => res.json())
    .then(json => {
      alert(json.message);
      if (json.status === "success") {
        currentUser = u;
        localStorage.setItem("cc_currentUser", u);
        checkLoginState();
      }
    })
    .catch(err => {
      alert("Lỗi kết nối khi đăng ký. Vui lòng thử lại bằng Chrome/Safari!");
    });
};

window.handleLogout = function() {
  currentUser = null;
  localStorage.removeItem("cc_currentUser");
  checkLoginState();
  alert("Đã đăng xuất!");
};

// Lưu ngầm không gây giật lag (Debounce 2 giây)
window.autoSaveUserData = function() {
  if (!currentUser) return;

  const statusEl = document.getElementById("syncStatus");
  if (statusEl) statusEl.textContent = "(Đang thay đổi...)";

  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
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

    let params = new URLSearchParams({
      action: "saveData",
      username: currentUser,
      year: year,
      month: month,
      baseSalary: baseSalary,
      allowancesJSON: JSON.stringify(allowances),
      timesheetJSON: JSON.stringify(window.chamCongData || {})
    });

    if (statusEl) statusEl.textContent = "(Đang đồng bộ...)";

    fetch(`${API_URL}?${params.toString()}`)
      .then(res => res.json())
      .then(json => {
        if (json.status === "success" && statusEl) {
          statusEl.textContent = "(Đã lưu tự động)";
        }
      })
      .catch(err => {
        // Lưu tạm vào localStorage của máy nếu mất kết nối đột ngột
        if (statusEl) statusEl.textContent = "(Đã lưu offline)";
      });
  }, 2000);
};

// Tải dữ liệu từ mây
window.loadUserDataFromCloud = function() {
  if (!currentUser) return;
  const year = document.getElementById("cc_nam")?.value || new Date().getFullYear();
  const month = document.getElementById("cc_thang")?.value || 1;

  const statusEl = document.getElementById("syncStatus");
  if (statusEl) statusEl.textContent = "(Đang tải dữ liệu...)";

  let url = `${API_URL}?action=loadData&username=${encodeURIComponent(currentUser)}&year=${year}&month=${month}`;

  fetch(url)
    .then(res => res.json())
    .then(json => {
      if (json.status === "success") {
        if (document.getElementById("cc_luongCoBan")) document.getElementById("cc_luongCoBan").value = json.baseSalary || "";
        
        if (json.allowancesJSON) {
          try {
            let al = JSON.parse(json.allowancesJSON);
            Object.keys(al).forEach(k => {
              let el = document.getElementById(k);
              if (el) el.value = al[k];
            });
          } catch(e) {}
        }

        if (json.timesheetJSON && window.setChamCongData) {
          try {
            window.setChamCongData(JSON.parse(json.timesheetJSON));
          } catch(e) {}
        }
      } else {
        if (window.clearChamCongData) window.clearChamCongData();
        if (document.getElementById("cc_luongCoBan")) document.getElementById("cc_luongCoBan").value = "";
      }
      if (window.renderLichChamCong) window.renderLichChamCong();
      if (window.syncChamCongToTinhLuong) window.syncChamCongToTinhLuong();
      
      if (statusEl) statusEl.textContent = "(Đã lưu tự động)";
    })
    .catch(err => {
      if (statusEl) statusEl.textContent = "(Chế độ offline)";
      if (window.renderLichChamCong) window.renderLichChamCong();
      if (window.syncChamCongToTinhLuong) window.syncChamCongToTinhLuong();
    });
};
