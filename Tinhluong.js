document.addEventListener("DOMContentLoaded", function () {
  // === Khởi tạo select tháng, năm theo logic của bạn ===
  const thangSelect = document.getElementById("thang");
  const namSelect = document.getElementById("nam");

  // Lấy ngày hiện tại
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const currentDate = today.getDate();

  // Xác định tháng mặc định
  let defaultMonth;
  if (currentDate < 11) {
    defaultMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  } else {
    defaultMonth = currentMonth;
  }

  // Xác định năm mặc định
  let defaultYear;
  if (currentMonth === 1 && currentDate < 11) {
    defaultYear = currentYear - 1;
  } else {
    defaultYear = currentYear;
  }

  // Gán tháng (1-12)
  for (let i = 1; i <= 12; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = i.toString().padStart(2, '0');
    if (i === defaultMonth) option.selected = true;
    thangSelect.appendChild(option);
  }

  // Gán năm
  for (let y = currentYear - 1; y <= currentYear + 1; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.text = y;
    if (y === defaultYear) option.selected = true;
    namSelect.appendChild(option);
  }

  // === Phần định dạng số cho tất cả input tiền ===
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function parseNumber(str) {
    return parseInt(str.replace(/\./g, "")) || 0;
  }

  const moneyInputIds = [
    "luongCoBan", "pcABC", "pcChuyenCan", "pcThamNien",
    "pcChucVu", "pcDiLai", "pcDienThoai", "pcTreEm", "pcKhac"
  ];

  moneyInputIds.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener("input", function(e) {
        let value = e.target.value.replace(/\./g, "");
        value = value.replace(/[^0-9]/g, "");
        if (value) e.target.value = formatNumber(value);
        tinhLuong();
      });

      input.addEventListener("blur", function(e) {
        let value = parseNumber(e.target.value);
        if (value > 0) e.target.value = formatNumber(value);
        tinhLuong();
      });

      input.addEventListener("focus", function(e) {
        let value = parseNumber(e.target.value);
        if (value > 0) e.target.value = value.toString();
      });
    }
  });

  const defaultValues = {
    pcDiLai: 500000,
    pcChuyenCan: 200000,
    pcThamNien: 600000
  };

  Object.keys(defaultValues).forEach(id => {
    const input = document.getElementById(id);
    if (input) input.value = formatNumber(defaultValues[id]);
  });

  function tinhNgayCongChuan() {
    const thang = +document.getElementById("thang")?.value || 1;
    const nam = +document.getElementById("nam")?.value || new Date().getFullYear();
    const soNgayTrongThang = new Date(nam, thang, 0).getDate();

    let soNgayChuNhat = 0;
    for (let d = 1; d <= soNgayTrongThang; d++) {
      const ngayTrongTuan = new Date(nam, thang - 1, d).getDay();
      if (ngayTrongTuan === 0) soNgayChuNhat++;
    }

    let ngayCongChuan = soNgayTrongThang - soNgayChuNhat;
    if (ngayCongChuan === 27) ngayCongChuan = 26;
    return ngayCongChuan;
  }

  const inputs = Array.from(document.querySelectorAll("#tabLuong input, #tabLuong select, #luongCoBan, #thang, #nam"));
  inputs.forEach((input, index) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const next = inputs[index + 1];
        if (next) next.focus();
      }
    });
    
    if (!moneyInputIds.includes(input.id)) {
      input.addEventListener("input", tinhLuong);
      input.addEventListener("change", tinhLuong);
    }
  });

  ["thang", "nam"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", function () {
        tinhLuong();
        renderLichChamCong();
      });
    }
  });

  function tinhLuong() {
    const luongCoBan = parseNumber(document.getElementById("luongCoBan")?.value || "0");
    const ngayCongChuan = tinhNgayCongChuan();

    const phuCapThamNien = parseNumber(document.getElementById("pcThamNien")?.value || "0");
    const phuCapChucVu = parseNumber(document.getElementById("pcChucVu")?.value || "0");
    const hoTroDiLai = parseNumber(document.getElementById("pcDiLai")?.value || "0");

    const luongNgayCong = ngayCongChuan > 0 ? luongCoBan / ngayCongChuan : 0;
    const luongTangCa = ngayCongChuan > 0 ? (luongCoBan + phuCapThamNien + phuCapChucVu + hoTroDiLai) / ngayCongChuan / 8 : 0;
    const troCapDem = luongTangCa;

    function updateTien(idSo, idTien, calc) {
      const val = +document.getElementById(idSo)?.value || 0;
      const tien = Math.round(calc(val));
      if(document.getElementById(idTien)) {
        document.getElementById(idTien).textContent = tien.toLocaleString("vi-VN");
      }
      return tien;
    }

    let tong = 0;
    tong += updateTien("ngayCong", "tienNgayCong", so => luongNgayCong * so);
    tong += updateTien("tc150", "tienTC150", so => luongTangCa * 1.5 * so);
    tong += updateTien("tc200", "tienTC200", so => luongTangCa * 2 * so);
    tong += updateTien("tcDem30", "tienDem30", so => troCapDem * 0.3 * so);
    tong += updateTien("ngayCong200", "tienCong200", so => luongNgayCong * 2 * so);
    tong += updateTien("tc300", "tienTC300", so => luongTangCa * 3 * so);
    tong += updateTien("tc340", "tienTC340", so => luongTangCa * 3.4 * so);
    tong += updateTien("tcDem70", "tienDem70", so => troCapDem * 0.7 * so);
    tong += updateTien("thongca380", "tienthongca380", so => luongTangCa * 3.8 * so);
    tong += updateTien("phepNam", "tienPhepNam", so => luongNgayCong * so);
    tong += updateTien("le", "tienLe", so => luongNgayCong * so);

    const tienNgayLeTet = calcBangPhu(luongNgayCong, luongTangCa, troCapDem);
    if(document.getElementById("tienNgayLeTet")) {
      document.getElementById("tienNgayLeTet").textContent = tienNgayLeTet.toLocaleString("vi-VN");
    }
    tong += tienNgayLeTet;

    const phuCaps = [
      "pcABC", "pcChuyenCan", "pcThamNien",
      "pcChucVu", "pcDiLai", "pcDienThoai",
      "pcTreEm", "pcKhac"
    ];
    phuCaps.forEach(id => {
      const val = parseNumber(document.getElementById(id)?.value || "0");
      tong += val;
    });

    if(document.getElementById("tongLuong")) {
      document.getElementById("tongLuong").textContent = Math.round(tong).toLocaleString("vi-VN");
    }

    const luongDongBH = luongCoBan + phuCapThamNien + phuCapChucVu;
    const tienTruBHXH = Math.round(luongDongBH * 0.105);
    const tienTruCD = Math.round(luongDongBH * 0.005);
    if(document.getElementById("tienTruBHXH")) {
      document.getElementById("tienTruBHXH").textContent = tienTruBHXH.toLocaleString("vi-VN");
    }
    if(document.getElementById("tienTruCD")) {
      document.getElementById("tienTruCD").textContent = tienTruCD.toLocaleString("vi-VN");
    }

    const thucLinh = Math.round(tong) - tienTruBHXH - tienTruCD;
    if(document.getElementById("thucLinh")) {
      document.getElementById("thucLinh").textContent = thucLinh.toLocaleString("vi-VN");
    }
  }

  function calcBangPhu(luongNgayCong, luongTangCa, troCapDem) {
    function phuLuong(soGioId, heSoId, rowTienId, loaiLuong) {
      const gio = +document.getElementById(soGioId)?.value || 0;
      const heSo = +document.getElementById(heSoId)?.value || 0;
      let donGia = 0;
      if (loaiLuong === "hanhChinh" || loaiLuong === "dem") {
        donGia = luongNgayCong / 800;
      } else if (loaiLuong === "tangCa") {
        donGia = luongTangCa / 100;
      }
      const tien = Math.round(gio * heSo * donGia);
      if(document.getElementById(rowTienId)) {
        document.getElementById(rowTienId).textContent = tien.toLocaleString("vi-VN");
      }
      return tien;
    }

    let tongPhu = 0;
    tongPhu += phuLuong("soGioHanhChinh1", "phuLuongHanhChinh", "tienHanhChinh", "hanhChinh");
    tongPhu += phuLuong("soGioTangCa1", "phuLuongTangCa", "tienTangCa", "tangCa");
    tongPhu += phuLuong("soGioDem1", "phuLuongDem", "tienTroCapDem", "dem");
    tongPhu += phuLuong("soGioHanhChinh2", "phuLuongHanhChinh2", "tienHanhChinh2", "hanhChinh");
    tongPhu += phuLuong("soGioTangCa2", "phuLuongTangCa2", "tienTangCa2", "tangCa");
    tongPhu += phuLuong("soGioDem2", "phuLuongDem2", "tienTroCapDem2", "dem");
    return tongPhu;
  }

  // =========================================================================
  // === LOGIC LỊCH CHẤM CÔNG: XOAY CA 2 TUẦN, ĐẢO CA, TỐI ƯU GIAO DIỆN ===
  // =========================================================================

  const DSHanhChinh = [
    "Đi làm đủ",
    "Muộn 1h", "Muộn 1.5h", "Muộn 2h", "Muộn 2.5h", "Muộn 3h", "Muộn 3.5h",
    "Về sớm 1h", "Về sớm 1.5h", "Về sớm 2h", "Về sớm 2.5h", "Về sớm 3h", "Về sớm 3.5h",
    "1/2 phép năm", "Phép năm", "Nghỉ buổi sáng", "Nghỉ buổi chiều"
  ];

  const DSTangCa = ["0"];
  for (let h = 0.5; h <= 10; h += 0.5) {
    DSTangCa.push(h.toString());
  }

  const DSTangCaGiuaGio = ["0", "0.5", "1", "1.5", "2"];

  // Mốc bắt đầu: Thứ Hai 07/09/2026 bắt đầu ca ĐÊM
  const MOC_CA_DEM = new Date(2026, 8, 7);
  let isDaoCa = false;

  // Thuật toán xác định ca làm việc
  function xacDinhCa(y, m, d) {
    const curDate = new Date(y, m - 1, d);
    const dayOfWeek = curDate.getDay(); // 0 là Chủ nhật

    if (dayOfWeek === 0) {
      return "nghi"; // Chủ nhật nghỉ
    }

    // Tính khoảng cách ngày so với mốc 07/09/2026
    const diffTime = curDate.getTime() - MOC_CA_DEM.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Chu kỳ 28 ngày: 14 ngày đêm (0-13) và 14 ngày ngày (14-27)
    let mod = diffDays % 28;
    if (mod < 0) mod += 28;

    let ca = (mod < 14) ? "dem" : "ngay";

    if (isDaoCa) {
      ca = (ca === "dem") ? "ngay" : "dem";
    }
    return ca;
  }

  // Nút đảo ca
  window.toggleDaoCa = function() {
    isDaoCa = !isDaoCa;
    const btn = document.getElementById("btnDaoCa");
    const lbl = document.getElementById("lblDaoCa");
    if (isDaoCa) {
      btn.classList.add("active");
      lbl.textContent = "Đã đảo (Bấm về gốc)";
    } else {
      btn.classList.remove("active");
      lbl.textContent = "Đảo ca ngày/đêm";
    }
    renderLichChamCong();
  };

  // Thuật toán Âm lịch Jean Meeus UTC+7
  const TZ = 7;
  const PI = Math.PI;
  function INT(d) { return Math.floor(d); }

  function jdFromDate(dd, mm, yy) {
    const a = INT((14 - mm) / 12);
    const y = yy + 4800 - a;
    const m = mm + 12 * a - 3;
    return dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  }

  function NewMoon(k) {
    const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
    let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M) - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr) - 0.0004 * Math.sin(dr * 3 * Mpr) + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr)) - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M)) - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr)) + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    let deltat;
    if (T < -11) deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
    else deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
    return Jd1 + C1 - deltat;
  }

  function SunLongitude(jdn) {
    const T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = PI / 180;
    const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M) + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
    let L = (L0 + DL) * dr;
    L = L - PI * 2 * INT(L / (PI * 2));
    return L;
  }

  function getNewMoonDay(k, tz) { return INT(NewMoon(k) + 0.5 + tz / 24); }
  function getSunLongitude(dayNumber, tz) { return INT(SunLongitude(dayNumber - 0.5 - tz / 24) / PI * 6); }

  function getLunarMonth11(yy, tz) {
    const off = jdFromDate(31, 12, yy) - 2415021;
    let k = INT(off / 29.530588853);
    let nm = getNewMoonDay(k, tz);
    const sunLong = getSunLongitude(nm, tz);
    if (sunLong >= 9) k--;
    return getNewMoonDay(k, tz);
  }

  function getLeapMonthOffset(a11, tz) {
    const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last = 0, i = 1;
    let arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
    do { last = arc; i++; arc = getSunLongitude(getNewMoonDay(k + i, tz), tz); } while (arc !== last && i < 14);
    return i - 1;
  }

  function convertSolar2Lunar(dd, mm, yy, tz) {
    const dayNumber = jdFromDate(dd, mm, yy);
    const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = getNewMoonDay(k + 1, tz);
    if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz);
    let a11 = getLunarMonth11(yy, tz);
    let b11 = a11;
    let lunarYear;
    if (a11 >= monthStart) { lunarYear = yy; a11 = getLunarMonth11(yy - 1, tz); }
    else { lunarYear = yy + 1; b11 = getLunarMonth11(yy + 1, tz); }
    const lunarDay = dayNumber - monthStart + 1;
    const diff = INT((monthStart - a11) / 29);
    let lunarLeap = 0;
    let lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
      const leapMonthDiff = getLeapMonthOffset(a11, tz);
      if (diff >= leapMonthDiff) { lunarMonth = diff + 10; if (diff === leapMonthDiff) lunarLeap = 1; }
    }
    if (lunarMonth > 12) lunarMonth -= 12;
    if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
    return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap === 1 };
  }

  // Render lưới lịch tháng vừa khít màn hình điện thoại
  function renderLichChamCong() {
    const thang = +document.getElementById("thang")?.value || 1;
    const nam = +document.getElementById("nam")?.value || new Date().getFullYear();
    const grid = document.getElementById("chamCongGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const firstDate = new Date(nam, thang - 1, 1);
    const totalDays = new Date(nam, thang, 0).getDate();

    // Thứ Hai = 0 ... Chủ Nhật = 6
    let startDay = firstDate.getDay() - 1;
    if (startDay === -1) startDay = 6;

    let dayCounter = 1;
    let totalCells = Math.ceil((startDay + totalDays) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      if (i < startDay || dayCounter > totalDays) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "day-card empty";
        grid.appendChild(emptyCell);
      } else {
        const cell = document.createElement("div");
        const ca = xacDinhCa(nam, thang, dayCounter);
        
        let caClass = "ca-ngay";
        let caText = "Ca ngày";
        if (ca === "dem") {
          caClass = "ca-dem";
          caText = "Ca đêm";
        } else if (ca === "nghi") {
          caClass = "ca-nghi";
          caText = "Nghỉ CN";
        }

        cell.className = `day-card ${caClass}`;

        const lunar = convertSolar2Lunar(dayCounter, thang, nam, TZ);
        const lunarLabel = (lunar.day === 1) ? `${lunar.day}/${lunar.month}` : `${lunar.day}`;

        let htmlInner = `
          <div class="day-top">
            <span class="solar-num">${dayCounter}</span>
            <span class="lunar-num">${lunarLabel}</span>
          </div>
          <div class="day-sub-label">${caText}</div>
          <div class="form-group-mini">
            <select class="select-hc" title="Giờ hành chính">
              ${DSHanhChinh.map(item => `<option value="${item}">${item}</option>`).join('')}
            </select>
          </div>
          <div class="form-group-mini">
            <select class="select-ot" title="Tăng ca">
              ${DSTangCa.map(item => `<option value="${item}">${item === '0' ? 'TC: 0' : 'TC: ' + item + 'h'}</option>`).join('')}
            </select>
          </div>
        `;

        // Chỉ ca đêm mới hiện tăng ca giữa giờ đêm
        if (ca === "dem") {
          htmlInner += `
            <div class="form-group-mini">
              <select class="select-mid-ot" title="Tăng ca giữa giờ đêm">
                ${DSTangCaGiuaGio.map(item => `<option value="${item}">${item === '0' ? 'Đêm: 0' : 'Đêm: ' + item + 'h'}</option>`).join('')}
              </select>
            </div>
          `;
        }

        cell.innerHTML = htmlInner;
        grid.appendChild(cell);
        dayCounter++;
      }
    }
  }

  // Khởi chạy tính lương và vẽ lịch
  tinhLuong();
  renderLichChamCong();
});