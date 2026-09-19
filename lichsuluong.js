// ==================== LỊCH SỬ LƯƠNG ====================
let shSelectedYear = new Date().getFullYear();
let shYearDataCache = {}; // year -> { monthsData, total }

// Hàm tính lương THỰC LĨNH từ 1 payload lưu trên máy chủ
function calculateTotalSalaryFromRecord(record, month, year) {
  if (!record) return 0;

  const getVal = (v) => parseInt((v || "0").toString().replace(/\./g, "")) || 0;
  const getFloat = (v) => parseFloat(v || "0") || 0;

  const lcb = getVal(record.base_salary);
  if (lcb === 0) return 0;

  const ef = record.extra_fields || {};
  const allowances = record.allowances || {};

  // 1. Tính ngày công chuẩn của tháng (theo đúng chamcong.js)
  const m = month || 1;
  const y = year || new Date().getFullYear();
  const soNgayTrongThang = new Date(y, m, 0).getDate();
  let soNgayChuNhat = 0;
  for (let d = 1; d <= soNgayTrongThang; d++) {
    if (new Date(y, m - 1, d).getDay() === 0) soNgayChuNhat++;
  }
  let ncChuandef = soNgayTrongThang - soNgayChuNhat;
  if (ncChuandef === 27) ncChuandef = 26;

  // 2. Lấy các khoản phụ cấp tính vào tăng ca và bảo hiểm
  const pcThamNien = getVal(allowances["cc_pcThamNien"]);
  const pcChucVu = getVal(allowances["cc_pcChucVu"]);
  const hoTroDiLai = getVal(allowances["cc_pcDiLai"]);

  const luongNgayCong = ncChuandef > 0 ? lcb / ncChuandef : 0;
  const luongTC = ncChuandef > 0 ? (lcb + pcThamNien + pcChucVu + hoTroDiLai) / ncChuandef / 8 : 0;
  const troCapDemVal = luongTC;

  // 3. Tính tổng thu nhập
  let tongThuNhap = 0;
  tongThuNhap += luongNgayCong * getFloat(ef["cc_ngayCong"]);
  tongThuNhap += luongTC * 1.5 * getFloat(ef["cc_tc150"]);
  tongThuNhap += luongTC * 2 * getFloat(ef["cc_tc200"]);
  tongThuNhap += troCapDemVal * 0.3 * getFloat(ef["cc_tcDem30"]);
  tongThuNhap += luongNgayCong * 2 * getFloat(ef["cc_ngayCong200"]);
  tongThuNhap += luongTC * 3 * getFloat(ef["cc_tc300"]);
  tongThuNhap += luongTC * 3.4 * getFloat(ef["cc_tc340"]);
  tongThuNhap += troCapDemVal * 0.7 * getFloat(ef["cc_tcDem70"]);
  tongThuNhap += luongTC * 3.8 * getFloat(ef["cc_thongca380"]);
  tongThuNhap += luongNgayCong * getFloat(ef["cc_phepNam"]);
  tongThuNhap += luongNgayCong * getFloat(ef["cc_le"]);

  // Bảng phụ Lễ Tết Chấm Công
  function phuLuongCc(soGioKey, heSoKey, loaiLuong) {
    const gio = getFloat(ef[soGioKey]);
    const heSo = getFloat(ef[heSoKey]);
    let donGia = 0;
    if (loaiLuong === "hanhChinh" || loaiLuong === "dem") {
      donGia = luongNgayCong / 800;
    } else if (loaiLuong === "tangCa") {
      donGia = luongTC / 100;
    }
    return Math.round(gio * heSo * donGia);
  }

  let tienTet = 0;
  tienTet += phuLuongCc("cc_soGioHanhChinh1", "cc_phuLuongHanhChinh", "hanhChinh");
  tienTet += phuLuongCc("cc_soGioTangCa1", "cc_phuLuongTangCa", "tangCa");
  tienTet += phuLuongCc("cc_soGioDem1", "cc_phuLuongDem", "dem");
  tienTet += phuLuongCc("cc_soGioHanhChinh2", "cc_phuLuongHanhChinh2", "hanhChinh");
  tienTet += phuLuongCc("cc_soGioTangCa2", "cc_phuLuongTangCa2", "tangCa");
  tienTet += phuLuongCc("cc_soGioDem2", "cc_phuLuongDem2", "dem");
  tongThuNhap += tienTet;

  // Cộng tất cả phụ cấp
  ["cc_pcABC", "cc_pcChuyenCan", "cc_pcThamNien", "cc_pcChucVu", "cc_pcDiLai", "cc_pcDienThoai", "cc_pcTreEm", "cc_pcKhac"].forEach(pid => {
    tongThuNhap += getVal(allowances[pid]);
  });

  // 4. Khấu trừ BHXH (10.5%) và Công đoàn (0.5%) chuẩn theo chamcong.js
  const luongBH = lcb + pcThamNien + pcChucVu;
  const bhxh = Math.round(luongBH * 0.105);
  const congDoan = Math.round(luongBH * 0.005);

  const thucLinh = Math.round(tongThuNhap) - bhxh - congDoan;
  return thucLinh > 0 ? thucLinh : 0;
}

// Hàm tính riêng tiền PHÉP NĂM từ 1 payload (dùng chung logic ngày công chuẩn)
function calculatePhepNamFromRecord(record, month, year) {
  if (!record) return 0;

  const getVal = (v) => parseInt((v || "0").toString().replace(/\./g, "")) || 0;
  const getFloat = (v) => parseFloat(v || "0") || 0;

  const lcb = getVal(record.base_salary);
  if (lcb === 0) return 0;

  const ef = record.extra_fields || {};

  const m = month || 1;
  const y = year || new Date().getFullYear();
  const soNgayTrongThang = new Date(y, m, 0).getDate();
  let soNgayChuNhat = 0;
  for (let d = 1; d <= soNgayTrongThang; d++) {
    if (new Date(y, m - 1, d).getDay() === 0) soNgayChuNhat++;
  }
  let ncChuandef = soNgayTrongThang - soNgayChuNhat;
  if (ncChuandef === 27) ncChuandef = 26;

  const luongNgayCong = ncChuandef > 0 ? lcb / ncChuandef : 0;

  return Math.round(luongNgayCong * getFloat(ef["cc_phepNam"]));
}

// Lấy dữ liệu 12 tháng của 1 năm (có cache để không gọi API lặp lại)
async function fetchYearSalaryData(year) {
  if (shYearDataCache[year]) return shYearDataCache[year];

  const user = (typeof currentUser !== "undefined" && currentUser) ? currentUser : localStorage.getItem("cc_currentUser");
  const apiUrl = (typeof API_URL !== "undefined") ? API_URL : "https://tinhluong.o0os2.workers.dev";

  const monthsData = {};

  if (user) {
    const fetchPromises = [];
    for (let m = 1; m <= 12; m++) {
      const monthKey = `${year}_${m}`;
      fetchPromises.push(
        fetch(`${apiUrl}?action=load&user=${encodeURIComponent(user)}&monthKey=${monthKey}`)
          .then(res => res.json())
          .then(data => { monthsData[m] = data; })
          .catch(() => { monthsData[m] = null; })
      );
    }
    await Promise.all(fetchPromises);
  }

  let total = 0;
  for (let m = 1; m <= 12; m++) {
    total += calculateTotalSalaryFromRecord(monthsData[m], m, year);
  }

  const result = { monthsData, total };
  shYearDataCache[year] = result;
  return result;
}

// Mở modal lịch sử lương
window.openSalaryHistoryModal = async function() {
  const overlay = document.getElementById("salaryHistoryOverlay");
  if (!overlay) return;

  shSelectedYear = new Date().getFullYear();
  overlay.style.display = "flex";

  const bar = document.getElementById("shYearsBar");
  if (bar) bar.innerHTML = `<div style="padding:8px; color:#64748b; font-size:12px;">⏳ Đang kiểm tra dữ liệu...</div>`;

  await renderSalaryHistoryYears();
  loadSalaryHistoryForYear(shSelectedYear);
};

// Đóng modal
window.closeSalaryHistoryModal = function(e) {
  if (e && e.target && e.target.id !== "salaryHistoryOverlay") return;
  const overlay = document.getElementById("salaryHistoryOverlay");
  if (overlay) overlay.style.display = "none";

  shYearDataCache = {};
};

// Vẽ thanh danh sách các năm từ 2020 đến năm hiện tại
async function renderSalaryHistoryYears() {
  const bar = document.getElementById("shYearsBar");
  if (!bar) return;

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2020; y <= currentYear; y++) years.push(y);

  await Promise.all(
    years.filter(y => y !== currentYear).map(y => fetchYearSalaryData(y))
  );

  const visibleYears = years.filter(y => y === currentYear || (shYearDataCache[y] && shYearDataCache[y].total > 0));

  if (!visibleYears.includes(shSelectedYear)) {
    shSelectedYear = currentYear;
  }

  bar.innerHTML = "";
  visibleYears.forEach(y => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `sh-year-btn ${y === shSelectedYear ? "active" : ""}`;
    btn.textContent = `Năm ${y}`;
    btn.onclick = () => {
      shSelectedYear = y;
      renderSalaryHistoryYears();
      loadSalaryHistoryForYear(y);
    };
    bar.appendChild(btn);
  });

  setTimeout(() => {
    const activeBtn = bar.querySelector(".sh-year-btn.active");
    if (activeBtn) activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, 50);
}

// Tải lương của 12 tháng trong năm — chỉ hiện tháng có thực lĩnh > 0
// Hiển thị dạng bảng: Tháng / Phép Năm / Thu nhập
async function loadSalaryHistoryForYear(year) {
  const listEl = document.getElementById("shMonthsList");
  if (!listEl) return;

  listEl.innerHTML = `<div style="text-align:center; padding: 20px; color:#64748b; font-size:13px;">⏳ Đang tải dữ liệu năm ${year}...</div>`;

  const formatFn = window.formatSalaryNumber || function(v) { return (v || 0).toLocaleString("vi-VN"); };
  const { monthsData, total: totalYearSalary } = await fetchYearSalaryData(year);

  let hasAnyMonth = false;
  let totalPhepNamYear = 0;
  let rowsHtml = "";

  for (let m = 1; m <= 12; m++) {
    const totalMonth = calculateTotalSalaryFromRecord(monthsData[m], m, year);
    if (totalMonth <= 0) continue;

    hasAnyMonth = true;
    const phepNamMonth = calculatePhepNamFromRecord(monthsData[m], m, year);
    totalPhepNamYear += phepNamMonth;

    const mText = `Tháng ${m.toString().padStart(2, '0')}`;
    rowsHtml += `
      <tr class="sh-month-item" onclick="selectHistoryMonth(${m}, ${year})" title="Bấm để xem chi tiết chấm công Tháng ${m}/${year}">
        <td class="m-name">📅 ${mText}</td>
        <td class="m-phep">${formatFn(phepNamMonth)} đ</td>
        <td class="m-val">${formatFn(totalMonth)} đ</td>
      </tr>`;
  }

  if (!hasAnyMonth) {
    listEl.innerHTML = `<div style="text-align:center; padding: 24px; color:#94a3b8; font-size:13px;">📭 Chưa có dữ liệu lương cho năm ${year}</div>`;
    return;
  }

  listEl.innerHTML = `
    <table class="sh-table" style="width:100%; border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left; padding:6px;">Tháng</th>
          <th style="text-align:right; padding:6px;">Phép Năm</th>
          <th style="text-align:right; padding:6px;">Thu nhập</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
      <tfoot>
        <tr class="sh-total-box">
          <td style="padding:6px;">💵 Tổng năm ${year}</td>
          <td style="text-align:right; padding:6px;">${formatFn(totalPhepNamYear)} đ</td>
          <td style="text-align:right; padding:6px;">${formatFn(totalYearSalary)} đ</td>
        </tr>
      </tfoot>
    </table>`;
}

// Bấm vào tháng: đóng popup và tải lại tháng/năm đó
window.selectHistoryMonth = function(month, year) {
  const overlay = document.getElementById("salaryHistoryOverlay");
  if (overlay) overlay.style.display = "none";

  shYearDataCache = {};

  window.selectedMonth = month;
  window.selectedYear = year;

  if (typeof window.updateDateDisplays === "function") {
    window.updateDateDisplays();
  }

  const user = (typeof currentUser !== "undefined" && currentUser) ? currentUser : localStorage.getItem("cc_currentUser");
  if (typeof window.loadUserDataFromCloud === "function" && user) {
    window.loadUserDataFromCloud();
  } else if (typeof window.clearAttendanceAndHolidayForNewMonth === "function") {
    window.clearAttendanceAndHolidayForNewMonth();
  }
};
