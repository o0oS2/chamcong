document.addEventListener("DOMContentLoaded", function () {
  // === Khởi tạo select tháng, năm[cite: 4] ===
  const thangSelect = document.getElementById("thang");
  const namSelect = document.getElementById("nam");

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const currentDate = today.getDate();

  let defaultMonth;
  if (currentDate < 11) {
    defaultMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  } else {
    defaultMonth = currentMonth;
  }

  let defaultYear;
  if (currentMonth === 1 && currentDate < 11) {
    defaultYear = currentYear - 1;
  } else {
    defaultYear = currentYear;
  }

  for (let i = 1; i <= 12; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = i.toString().padStart(2, '0');
    if (i === defaultMonth) option.selected = true;
    thangSelect.appendChild(option);
  }

  for (let y = currentYear - 1; y <= currentYear + 1; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.text = y;
    if (y === defaultYear) option.selected = true;
    namSelect.appendChild(option);
  }

  // === Định dạng số cho tất cả input tiền[cite: 4] ===
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
  // === LỊCH CHẤM CÔNG: VIẾT TẮT M 1.5, V 1.5, CHỈ HIỆN SỐ GỌN GÀNG ===
  // =========================================================================

  // Mốc bắt đầu: Thứ Hai 07/09/2026 bắt đầu ca ĐÊM
  const MOC_CA_DEM = new Date(2026, 8, 7);
  let isDaoCa = false;

  // Cập nhật viết tắt: M 1, M 1.5 ..., V 1, V 1.5 ...
  const DSHanhChinhFull = [
    { label: "Đi làm đủ", short: "", deduct: 0 },
    { label: "Nghỉ", short: "Nghỉ", deduct: 8 },
    { label: "Muộn 1h", short: "M 1", deduct: 1 },
    { label: "Muộn 1.5h", short: "M 1.5", deduct: 1.5 },
    { label: "Muộn 2h", short: "M 2", deduct: 2 },
    { label: "Muộn 2.5h", short: "M 2.5", deduct: 2.5 },
    { label: "Muộn 3h", short: "M 3", deduct: 3 },
    { label: "Muộn 3.5h", short: "M 3.5", deduct: 3.5 },
    { label: "Về sớm 1h", short: "V 1", deduct: 1 },
    { label: "Về sớm 1.5h", short: "V 1.5", deduct: 1.5 },
    { label: "Về sớm 2h", short: "V 2", deduct: 2 },
    { label: "Về sớm 2.5h", short: "V 2.5", deduct: 2.5 },
    { label: "Về sớm 3h", short: "V 3", deduct: 3 },
    { label: "Về sớm 3.5h", short: "V 3.5", deduct: 3.5 },
    { label: "1/2 phép năm", short: "½PN", deduct: 4 },
    { label: "Phép năm", short: "PN", deduct: 8 },
    { label: "Nghỉ buổi sáng", short: "NS", deduct: 4 },
    { label: "Nghỉ buổi chiều", short: "NC", deduct: 4 }
  ];

  const DSTangCaFull = [];
  for (let h = 0; h <= 10; h += 0.5) {
    DSTangCaFull.push(h.toString());
  }

  const DSMidOtFull = ["0", "0.5", "1", "1.5", "2"];
  const chamCongData = {};

  function xacDinhCa(y, m, d) {
    const curDate = new Date(y, m - 1, d);
    const dayOfWeek = curDate.getDay();

    if (dayOfWeek === 0) return "nghi"; // Chủ nhật

    const diffTime = curDate.getTime() - MOC_CA_DEM.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let mod = diffDays % 28;
    if (mod < 0) mod += 28;

    let ca = (mod < 14) ? "dem" : "ngay";
    if (isDaoCa) ca = (ca === "dem") ? "ngay" : "dem";
    return ca;
  }

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

  // Thuật toán Âm lịch Jean Meeus UTC+7[cite: 3]
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

  // Quản lý Modal chọn giá trị
  let currentPickContext = null;

  window.openPicker = function(day, type) {
    currentPickContext = { day, type };
    const overlay = document.getElementById("pickerOverlay");
    const title = document.getElementById("pickerTitle");
    const body = document.getElementById("pickerBody");

    body.innerHTML = "";
    overlay.style.display = "flex";

    if (type === "hc") {
      title.textContent = `Ngày ${day}: Giờ hành chính`;
      body.className = "picker-body list-mode";
      DSHanhChinhFull.forEach(item => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "picker-btn";
        btn.textContent = item.label;
        btn.onclick = () => selectPickValue(item);
        body.appendChild(btn);
      });
    } else if (type === "ot") {
      title.textContent = `Ngày ${day}: Tăng ca (giờ)`;
      body.className = "picker-body";
      DSTangCaFull.forEach(val => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "picker-btn";
        btn.textContent = val;
        btn.onclick = () => selectPickValue(val);
        body.appendChild(btn);
      });
    } else if (type === "mid-ot") {
      title.textContent = `Ngày ${day}: TC giữa giờ đêm`;
      body.className = "picker-body";
      DSMidOtFull.forEach(val => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "picker-btn";
        btn.textContent = val;
        btn.onclick = () => selectPickValue(val);
        body.appendChild(btn);
      });
    }
  };

  function selectPickValue(val) {
    if (!currentPickContext) return;
    const { day, type } = currentPickContext;

    const thang = +document.getElementById("thang")?.value || 1;
    const nam = +document.getElementById("nam")?.value || new Date().getFullYear();
    const ca = xacDinhCa(nam, thang, day);

    if (!chamCongData[day]) {
      const defaultHc = (ca === "nghi") 
        ? { label: "Nghỉ", short: "Nghỉ", deduct: 8 }
        : { label: "Đi làm đủ", short: "", deduct: 0 };

      chamCongData[day] = { hc: defaultHc, ot: "0", midOt: "0" };
    }

    if (type === "hc") {
      chamCongData[day].hc = val;
    } else if (type === "ot") {
      chamCongData[day].ot = val;
    } else if (type === "mid-ot") {
      chamCongData[day].midOt = val;
    }

    forceClosePicker();
    updateDayDisplay(day);
    dongBoVaoBangLuong();
  }

  window.closePicker = function(e) {
    if (e.target.id === "pickerOverlay") forceClosePicker();
  };

  window.forceClosePicker = function() {
    document.getElementById("pickerOverlay").style.display = "none";
    currentPickContext = null;
  };

  function updateDayDisplay(day) {
    const data = chamCongData[day];
    if (!data) return;

    const elHc = document.getElementById(`hc_val_${day}`);
    const elOt = document.getElementById(`ot_val_${day}`);
    const elMidOt = document.getElementById(`mid_ot_val_${day}`);

    if (elHc) elHc.textContent = data.hc.short;
    if (elOt) elOt.textContent = data.ot;
    if (elMidOt) elMidOt.textContent = data.midOt;
  }

  // Tự động bù trừ và đẩy sang bảng tính lương[cite: 4]
  function dongBoVaoBangLuong() {
    let tongGioCongThuc = 0;
    let tongGioTC150 = 0;
    let tongGioTCDem200 = 0;
    let tongGioTroCapDem30 = 0;
    let tongPhepNam = 0;

    const thang = +document.getElementById("thang")?.value || 1;
    const nam = +document.getElementById("nam")?.value || new Date().getFullYear();
    const totalDays = new Date(nam, thang, 0).getDate();

    for (let d = 1; d <= totalDays; d++) {
      const ca = xacDinhCa(nam, thang, d);
      
      const defaultHc = (ca === "nghi") 
        ? { label: "Nghỉ", short: "Nghỉ", deduct: 8 }
        : { label: "Đi làm đủ", short: "", deduct: 0 };

      const data = chamCongData[d] || { hc: defaultHc, ot: "0", midOt: "0" };
      const deductHours = data.hc.deduct || 0;
      const otHours = parseFloat(data.ot) || 0;
      const midOtHours = parseFloat(data.midOt) || 0;

      // Tính giờ công chuẩn: ngày thường 8h, Chủ Nhật mặc định Nghỉ là 8-8=0h công
      const gioChuanNgay = Math.max(0, 8 - deductHours);
      tongGioCongThuc += gioChuanNgay;

      if (ca === "dem") {
        tongGioTroCapDem30 += (gioChuanNgay > 0) ? 6 : 0;
        tongGioTCDem200 += midOtHours;
        tongGioTC150 += otHours;
      } else {
        tongGioTC150 += otHours;
      }

      if (data.hc.label === "Phép năm") tongPhepNam += 1;
      if (data.hc.label === "1/2 phép năm") tongPhepNam += 0.5;
    }

    const inpNgayCong = document.getElementById("ngayCong");
    const inpTc150 = document.getElementById("tc150");
    const inpTc200 = document.getElementById("tc200");
    const inpTcDem30 = document.getElementById("tcDem30");
    const inpPhepNam = document.getElementById("phepNam");

    if (inpNgayCong) inpNgayCong.value = (tongGioCongThuc / 8).toFixed(1).replace(".0", "");
    if (inpTc150) inpTc150.value = tongGioTC150.toString();
    if (inpTc200) inpTc200.value = tongGioTCDem200.toString();
    if (inpTcDem30) inpTcDem30.value = tongGioTroCapDem30.toString();
    if (inpPhepNam) inpPhepNam.value = tongPhepNam.toString();

    tinhLuong();
  }

  // Render lịch chấm công
  function renderLichChamCong() {
    const thang = +document.getElementById("thang")?.value || 1;
    const nam = +document.getElementById("nam")?.value || new Date().getFullYear();
    const grid = document.getElementById("chamCongGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const firstDate = new Date(nam, thang - 1, 1);
    const totalDays = new Date(nam, thang, 0).getDate();

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
        if (ca === "dem") {
          caClass = "ca-dem";
        } else if (ca === "nghi") {
          caClass = "ca-nghi";
        }

        cell.className = `day-card ${caClass}`;

        const lunar = convertSolar2Lunar(dayCounter, thang, nam, TZ);
        const lunarLabel = (lunar.day === 1) ? `${lunar.day}/${lunar.month}` : `${lunar.day}`;

        // Chủ Nhật mặc định Nghỉ (hiển thị chữ 'Nghỉ', trừ 8h công), ngày thường mặc định Đi làm đủ (để trống)
        if (!chamCongData[dayCounter]) {
          const defaultHc = (ca === "nghi") 
            ? { label: "Nghỉ", short: "Nghỉ", deduct: 8 }
            : { label: "Đi làm đủ", short: "", deduct: 0 };

          chamCongData[dayCounter] = {
            hc: defaultHc,
            ot: "0",
            midOt: "0"
          };
        }
        const data = chamCongData[dayCounter];

        let htmlInner = `
          <div class="day-top">
            <span class="solar-num">${dayCounter}</span>
            <span class="lunar-num">${lunarLabel}</span>
          </div>
          <div class="input-cell-val cell-hc" id="hc_val_${dayCounter}" onclick="openPicker(${dayCounter}, 'hc')" title="Giờ hành chính">${data.hc.short}</div>
          <div class="input-cell-val cell-ot" id="ot_val_${dayCounter}" onclick="openPicker(${dayCounter}, 'ot')" title="Tăng ca">${data.ot}</div>
        `;

        // Chỉ ca đêm mới hiện ô tăng ca giữa giờ đêm
        if (ca === "dem") {
          htmlInner += `
            <div class="input-cell-val cell-mid-ot" id="mid_ot_val_${dayCounter}" onclick="openPicker(${dayCounter}, 'mid-ot')" title="Tăng ca giữa giờ đêm">${data.midOt}</div>
          `;
        }

        cell.innerHTML = htmlInner;
        grid.appendChild(cell);
        dayCounter++;
      }
    }
  }

  tinhLuong();
  renderLichChamCong();
});