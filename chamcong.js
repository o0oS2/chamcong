document.addEventListener("DOMContentLoaded", function () {
  const MOC_CA_DEM = new Date(2026, 8, 7); // Mốc chuẩn: 07/09/2026 bắt đầu ca đêm
  // Chế độ ca: 'chuan' (2 tuần đổi), 'dao' (đã đảo ca), 'chuyen_ngay' (chuyên ca ngày)
  // Không lưu ở localStorage: chế độ ca được lưu/đọc từ dữ liệu trên server (xem github-sync.js)
  window.currentShiftMode = window.currentShiftMode || "chuan";

  const DSHanhChinhChung = [
    { label: "Đi làm đủ", short: "Đi làm đủ", type: "du", value: 0, allowSunday: true },
    { label: "Nghỉ", short: "Nghỉ", type: "nghi", value: 8, allowSunday: true },
    { label: "Nghỉ sáng", short: "Nghỉ sáng", type: "nghi_sang", value: 4, allowSunday: true },
    { label: "Nghỉ chiều", short: "Nghỉ chiều", type: "nghi_chieu", value: 4, allowSunday: true },
    { label: "Phép năm", short: "PN", type: "pn", value: 8, allowSunday: false },
    { label: "1/2 phép năm", short: "½PN", type: "pn_nua", value: 4, allowSunday: false }
  ];

  const DSMuon = [1, 1.5, 2, 2.5, 3, 3.5].map(v => ({
    label: `Muộn ${v} giờ`, short: `Muộn ${v}`, type: "muon", value: v, allowSunday: true
  }));

  const DSVeSom = [1, 1.5, 2, 2.5, 3, 3.5].map(v => ({
    label: `Về sớm ${v} giờ`, short: `Về sớm ${v}`, type: "vesom", value: v, allowSunday: true
  }));

  const DSTangCaFull = [];
  for (let h = 0; h <= 10; h += 0.5) {
    DSTangCaFull.push(h.toString());
  }

  const DSMidOtFull = ["0", "1"];
  const chamCongData = {};

  window.chamCongData = chamCongData;
  window.setChamCongData = function(data) {
    Object.keys(chamCongData).forEach(k => delete chamCongData[k]);
    Object.assign(chamCongData, data || {});
  };
  window.clearChamCongData = function() {
    Object.keys(chamCongData).forEach(k => delete chamCongData[k]);
  };

  function getActiveMonth() {
    return window.selectedMonth || (new Date().getMonth() + 1);
  }

  function getActiveYear() {
    return window.selectedYear || new Date().getFullYear();
  }

  // Xác định ca làm việc
  function xacDinhCa(y, m, d) {
    const curDate = new Date(y, m - 1, d);
    const dayOfWeek = curDate.getDay();

    if (window.currentShiftMode === "chuyen_ngay") {
      return (dayOfWeek === 0) ? "nghi" : "ngay";
    }

    const diffTime = curDate.getTime() - MOC_CA_DEM.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let mod = diffDays % 28;
    if (mod < 0) mod += 28;

    let ca = (mod < 14) ? "dem" : "ngay";
    if (window.currentShiftMode === "dao") {
      ca = (ca === "dem") ? "ngay" : "dem";
    }
    
    if (dayOfWeek === 0) {
      return (ca === "dem") ? "dem" : "nghi";
    }
    return ca;
  }

 // Cập nhật nhãn ca bên cạnh nút Đổi ca (Chỉ hiển thị: Ca ngày hoặc Ca đêm)
  window.updateDaoCaButtonUI = function() {
    const lblKetQua = document.getElementById("lblKetQuaCa");
    if (!lblKetQua) return;

    if (window.currentShiftMode === "chuyen_ngay") {
      lblKetQua.textContent = "đang làm chuyên ngày";
      lblKetQua.style.color = "#059669";
      lblKetQua.style.background = "#ecfdf5";
      lblKetQua.style.borderColor = "#a7f3d0";
      return;
    }

    const today = new Date();
    const caHomNay = xacDinhCa(today.getFullYear(), today.getMonth() + 1, today.getDate());

    // Dù là Chủ nhật hay Ngày lễ, nếu ca làm là đêm thì hiển thị Ca đêm, ngược lại hiển thị Ca ngày
    if (caHomNay === "dem") {
      lblKetQua.textContent = "đang làm ca đêm";
      lblKetQua.style.color = "#1e293b";
      lblKetQua.style.background = "#e2e8f0";
      lblKetQua.style.borderColor = "#cbd5e1";
    } else {
      lblKetQua.textContent = "đang làm ca ngày";
      lblKetQua.style.color = "#b45309";
      lblKetQua.style.background = "#fffdf5";
      lblKetQua.style.borderColor = "#fce7b2";
    }
  };

  // Kiểm tra dữ liệu sửa đổi để quyết định có cảnh báo hay không
  function hasUserModifiedData() {
    const thang = getActiveMonth();
    const nam = getActiveYear();
    const totalDays = new Date(nam, thang, 0).getDate();

    for (let d = 1; d <= totalDays; d++) {
      const data = chamCongData[d];
      if (!data) continue;
      const curDate = new Date(nam, thang - 1, d);
      const dayOfWeek = curDate.getDay();
      const lunar = convertSolar2Lunar(d, thang, nam, TZ);
      const holiday = isHoliday(d, thang, nam, lunar);
      const ca = xacDinhCa(nam, thang, d);

      const defaultHcType = (dayOfWeek === 0 || holiday) ? "nghi" : "du";
      const defaultOt = (ca === "dem" && dayOfWeek !== 0 && !holiday) ? "1" : "0";

      if (data.hc && data.hc.type !== defaultHcType) return true;
      if (data.ot && data.ot !== defaultOt) return true;
      if (data.midOt && data.midOt !== "0") return true;
    }
    return false;
  }

  // Khi sang tháng/năm mới (chưa có dữ liệu lưu sẵn): chỉ xóa lịch chấm công
  // và bảng "Lương ngày lễ, tết" (cả 2 tab), GIỮ NGUYÊN lương cơ bản & các phụ cấp
  window.clearAttendanceAndHolidayForNewMonth = function() {
    Object.keys(chamCongData).forEach(k => delete chamCongData[k]);
    renderLichChamCong();

    const holidayIds = [
      "soGioHanhChinh1", "phuLuongHanhChinh", "soGioTangCa1", "phuLuongTangCa", "soGioDem1", "phuLuongDem",
      "soGioHanhChinh2", "phuLuongHanhChinh2", "soGioTangCa2", "phuLuongTangCa2", "soGioDem2", "phuLuongDem2",
      "cc_soGioHanhChinh1", "cc_phuLuongHanhChinh", "cc_soGioTangCa1", "cc_phuLuongTangCa", "cc_soGioDem1", "cc_phuLuongDem",
      "cc_soGioHanhChinh2", "cc_phuLuongHanhChinh2", "cc_soGioTangCa2", "cc_phuLuongTangCa2", "cc_soGioDem2", "cc_phuLuongDem2"
    ];
    holidayIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    syncChamCongToTinhLuong();
    if (typeof window.tinhLuong === "function") window.tinhLuong();
    triggerCcComputeEngine();
  };

  // Đổi ca xoay vòng 3 nấc
  window.toggleDaoCa = function() {
    if (hasUserModifiedData()) {
      const xacNhan = confirm("CẢNH BÁO:\nThay đổi chế độ ca sẽ thiết lập lại toàn bộ dữ liệu chấm công đã sửa trong tháng này.\n\nBấm [OK] để tiếp tục.\nBấm [Hủy] để giữ nguyên.");
      if (!xacNhan) return;
    }

    if (window.currentShiftMode === "chuan") {
      window.currentShiftMode = "dao";
    } else if (window.currentShiftMode === "dao") {
      window.currentShiftMode = "chuyen_ngay";
    } else {
      window.currentShiftMode = "chuan";
    }

    updateDaoCaButtonUI();
    Object.keys(chamCongData).forEach(k => delete chamCongData[k]);
    renderLichChamCong();
    syncChamCongToTinhLuong();
    if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
  };

  // Thuật toán âm lịch
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
    let deltat = (T < -11) ? (0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3) : (-0.000278 + 0.000265 * T + 0.000262 * T2);
    return Jd1 + C1 - deltat;
  }

  function SunLongitude(jdn) {
    const T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = PI / 180;
    const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M) + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
    let L = (L0 + DL) * dr;
    return L - PI * 2 * INT(L / (PI * 2));
  }

  function getNewMoonDay(k, tz) { return INT(NewMoon(k) + 0.5 + tz / 24); }
  function getSunLongitude(dayNumber, tz) { return INT(SunLongitude(dayNumber - 0.5 - tz / 24) / PI * 6); }

  function getLunarMonth11(yy, tz) {
    const off = jdFromDate(31, 12, yy) - 2415021;
    let k = INT(off / 29.530588853);
    let nm = getNewMoonDay(k, tz);
    if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz);
    return nm;
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

  function isHoliday(d, m, y, lunar) {
    const solarKey = `${d}-${m}`;
    const lunarKey = `${lunar.day}-${lunar.month}`;
    const solarHolidays = ["1-1", "30-4", "1-5", "2-9", "24-11"];
    if (solarHolidays.includes(solarKey)) return true;
    if (!lunar.leap && lunarKey === "10-3") return true;
    if (!lunar.leap && lunar.month === 1 && [1, 2, 3].includes(lunar.day)) return true;

    const nextDay = new Date(y, m - 1, d + 1);
    const nextLunar = convertSolar2Lunar(nextDay.getDate(), nextDay.getMonth() + 1, nextDay.getFullYear(), TZ);
    if (!nextLunar.leap && nextLunar.month === 1 && nextLunar.day === 1) {
      if (!lunar.leap && lunar.month === 12 && (lunar.day === 29 || lunar.day === 30)) return true;
    }
    return false;
  }

  let currentPickContext = null;

  // Cửa sổ popup chọn Giờ hành chính / Tăng ca
  window.openPicker = function(day, type) {
    currentPickContext = { day, type };
    const overlay = document.getElementById("pickerOverlay");
    const title = document.getElementById("pickerTitle");
    const body = document.getElementById("pickerBody");

    const thang = getActiveMonth();
    const nam = getActiveYear();
    const curDate = new Date(nam, thang - 1, day);
    const dayOfWeek = curDate.getDay();
    const lunar = convertSolar2Lunar(day, thang, nam, TZ);
    const holiday = isHoliday(day, thang, nam, lunar);
    const isSundayOrHoliday = (dayOfWeek === 0 || holiday);

    body.innerHTML = "";
    overlay.style.display = "flex";

    if (type === "hc") {
      title.textContent = `Ngày ${day}: Giờ hành chính`;
      body.className = "picker-body";
      body.style.gridTemplateColumns = "repeat(2, 1fr)";

      const list = [];
      DSHanhChinhChung.forEach(item => {
        if (!isSundayOrHoliday || item.allowSunday) list.push(item);
      });
      DSMuon.forEach(item => list.push(item));
      DSVeSom.forEach(item => list.push(item));

      list.forEach(item => {
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
      body.style.gridTemplateColumns = "repeat(4, 1fr)";
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
      body.style.gridTemplateColumns = "repeat(2, 1fr)";
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

    const thang = getActiveMonth();
    const nam = getActiveYear();
    const curDate = new Date(nam, thang - 1, day);
    const dayOfWeek = curDate.getDay();
    const lunar = convertSolar2Lunar(day, thang, nam, TZ);
    const holiday = isHoliday(day, thang, nam, lunar);
    const ca = xacDinhCa(nam, thang, day);

    if (!chamCongData[day]) {
      const defaultOt = (ca === "dem" && dayOfWeek !== 0 && !holiday) ? "1" : "0";
      const defaultHc = (dayOfWeek === 0 || holiday) 
        ? { label: "Nghỉ", short: "Nghỉ", type: "nghi", value: 8, allowSunday: true }
        : { label: "Đi làm đủ", short: "Đi làm đủ", type: "du", value: 0, allowSunday: true };
      chamCongData[day] = { hc: defaultHc, ot: defaultOt, midOt: "0" };
    }

    if (type === "hc") {
      chamCongData[day].hc = val;
      if (ca === "dem") {
        if (val.type === "du" || val.type === "muon") {
          chamCongData[day].ot = "1";
        } else {
          chamCongData[day].ot = "0";
        }
      }
    } else if (type === "ot") {
      chamCongData[day].ot = val;
    } else if (type === "mid-ot") {
      chamCongData[day].midOt = val;
    }

    forceClosePicker();
    updateDayDisplay(day);
    syncChamCongToTinhLuong();
    
    if (typeof window.autoSaveUserData === "function") {
      window.autoSaveUserData();
    }
  }

  window.closePicker = function(e) {
    if (e.target.id === "pickerOverlay") forceClosePicker();
  };

  window.forceClosePicker = function() {
    const overlay = document.getElementById("pickerOverlay");
    if (overlay) overlay.style.display = "none";
    currentPickContext = null;
  };

  // "Đi làm đủ" -> xanh (hc-full); Muộn/Về sớm/Nghỉ (mọi kiểu nghỉ) -> đỏ nhạt (hc-off)
  // để nhìn vào ô là biết ngay hôm đó có nghỉ/muộn/về sớm hay không.
  function getHcStatusClass(hcType) {
    return hcType === "du" ? "hc-full" : "hc-off";
  }

  function updateDayDisplay(day) {
    const data = chamCongData[day];
    if (!data) return;
    const elHc = document.getElementById(`hc_val_${day}`);
    const elOt = document.getElementById(`ot_val_${day}`);
    const elMidOt = document.getElementById(`mid_ot_val_${day}`);
    if (elHc) {
      elHc.textContent = data.hc.short;
      elHc.classList.remove("hc-full", "hc-off");
      elHc.classList.add(getHcStatusClass(data.hc.type));
    }
    if (elOt) elOt.textContent = data.ot;
    if (elMidOt) elMidOt.textContent = data.midOt;
  }

  // Vẽ lịch chấm công
  window.renderLichChamCong = function() {
    const thang = getActiveMonth();
    const nam = getActiveYear();
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
        const curDate = new Date(nam, thang - 1, dayCounter);
        const dayOfWeek = curDate.getDay();
        const lunar = convertSolar2Lunar(dayCounter, thang, nam, TZ);
        const holiday = isHoliday(dayCounter, thang, nam, lunar);
        const ca = xacDinhCa(nam, thang, dayCounter);
        
        let caClass = "ca-ngay";
        if (dayOfWeek === 0 || holiday) caClass = "ca-nghi";
        else if (ca === "dem") caClass = "ca-dem";

        cell.className = `day-card ${caClass} ${ca === "dem" ? "shift-tall" : "shift-short"}`;
        const lunarLabel = (lunar.day === 1) ? `${lunar.day}/${lunar.month}` : `${lunar.day}`;

        if (!chamCongData[dayCounter]) {
          const defaultHc = (dayOfWeek === 0 || holiday) 
            ? { label: "Nghỉ", short: "Nghỉ", type: "nghi", value: 8, allowSunday: true }
            : { label: "Đi làm đủ", short: "Đi làm đủ", type: "du", value: 0, allowSunday: true };
          const defaultOt = (ca === "dem" && dayOfWeek !== 0 && !holiday) ? "1" : "0";

          chamCongData[dayCounter] = {
            hc: defaultHc,
            ot: defaultOt,
            midOt: "0"
          };
        }
        const data = chamCongData[dayCounter];

        let htmlInner = `
          <div class="day-top">
            <span class="solar-num">${dayCounter}</span>
            <span class="lunar-num">${lunarLabel}</span>
          </div>
          <div class="input-cell-val cell-hc ${getHcStatusClass(data.hc.type)}" id="hc_val_${dayCounter}" onclick="openPicker(${dayCounter}, 'hc')" title="Giờ hành chính">${data.hc.short}</div>
          <div class="input-cell-val cell-ot" id="ot_val_${dayCounter}" onclick="openPicker(${dayCounter}, 'ot')" title="Tăng ca">${data.ot}</div>
        `;

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
  };

  // Đồng bộ số liệu sang bảng tính lương
  window.syncChamCongToTinhLuong = function() {
    let tongNgayCong100 = 0;
    let tongTC150 = 0;
    let tongTC200 = 0;
    let tongTCDem30 = 0;
    let tongNgayCong200 = 0;
    let tongTC300 = 0;
    let tongTC340 = 0;
    let tongTCDem70 = 0;
    let tongPhepNam = 0;
    let tongNgayLe = 0;

    const thang = getActiveMonth();
    const nam = getActiveYear();
    const totalDays = new Date(nam, thang, 0).getDate();

    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(nam, thang - 1, d);
      const dayOfWeek = curDate.getDay(); 
      const ca = xacDinhCa(nam, thang, d);
      const lunar = convertSolar2Lunar(d, thang, nam, TZ);
      const holiday = isHoliday(d, thang, nam, lunar);

      const defaultHc = (dayOfWeek === 0 || holiday) 
        ? { label: "Nghỉ", short: "Nghỉ", type: "nghi", value: 8, allowSunday: true }
        : { label: "Đi làm đủ", short: "Đi làm đủ", type: "du", value: 0, allowSunday: true };
      const defaultOt = (ca === "dem" && dayOfWeek !== 0 && !holiday) ? "1" : "0";

      const data = chamCongData[d] || { hc: defaultHc, ot: defaultOt, midOt: "0" };
      const hcType = data.hc?.type || "du";
      const hcVal = data.hc?.value || 0;
      const otVal = parseFloat(data.ot) || 0;
      const midOtVal = parseFloat(data.midOt) || 0;

      if (hcType === "pn") tongPhepNam += 1;
      if (hcType === "pn_nua") tongPhepNam += 0.5;
      if (holiday) tongNgayLe += 1;

      if (ca === "ngay" && dayOfWeek >= 1 && dayOfWeek <= 6) {
        if (hcType === "du") {
          tongNgayCong100 += 1;
        } else if (hcType === "muon" || hcType === "vesom") {
          tongNgayCong100 += Math.max(0, (8 - hcVal) / 8);
        } else if (hcType === "nghi_sang" || hcType === "nghi_chieu" || hcType === "pn_nua") {
          tongNgayCong100 += 0.5;
        }
        tongTC150 += otVal;
      }

      if (ca === "dem" && dayOfWeek >= 1 && dayOfWeek <= 5) {
        if (hcType === "du") {
          tongNgayCong100 += 1;
        } else if (hcType === "muon" || hcType === "vesom") {
          tongNgayCong100 += Math.max(0, (8 - hcVal) / 8);
        } else if (hcType === "nghi_sang" || hcType === "nghi_chieu" || hcType === "pn_nua") {
          tongNgayCong100 += 0.5;
        }

        if (otVal > 2) {
          tongTC150 += (otVal - 2);
        }
        tongTC200 += Math.min(2, otVal) + midOtVal;

        let dem30 = 6;
        if (hcType === "muon" && hcVal > 2) {
          dem30 = 6 + 2 - hcVal;
        } else if (hcType === "vesom" && hcVal > 1) {
          dem30 = 6 - hcVal;
        } else if (hcType === "nghi_sang" || hcType === "nghi_chieu") {
          dem30 = 3;
        } else if (hcType === "nghi" || hcType === "pn") {
          dem30 = 0;
        }
        tongTCDem30 += Math.max(0, dem30);
      }

      if (ca === "dem" && dayOfWeek === 6) {
        let cong100_t7 = 0.5;
        if (hcType === "muon") cong100_t7 = Math.max(0, (4 - hcVal) / 8);
        else if (hcType === "nghi_sang" || hcType === "nghi" || hcType === "pn") cong100_t7 = 0;
        tongNgayCong100 += cong100_t7;

        let cong200_t7 = 0.5;
        if (hcType === "vesom") cong200_t7 = Math.max(0, (4 - hcVal) / 8);
        else if (hcType === "nghi_chieu" || hcType === "nghi" || hcType === "pn") cong200_t7 = 0;
        tongNgayCong200 += cong200_t7;

        let dem30_t7 = 2;
        if (hcType === "muon" && hcVal > 2) dem30_t7 = 2 + 2 - hcVal;
        else if (hcType === "nghi_sang" || hcType === "nghi" || hcType === "pn") dem30_t7 = 0;
        tongTCDem30 += Math.max(0, dem30_t7);

        tongTC340 += otVal + midOtVal;

        let dem70_t7 = 4;
        if (hcType === "vesom") dem70_t7 = Math.max(0, 4 - hcVal);
        else if (hcType === "nghi_chieu" || hcType === "nghi" || hcType === "pn") dem70_t7 = 0;
        tongTCDem70 += dem70_t7;
      }

      if (dayOfWeek === 0 || holiday) {
        if (ca !== "dem" && hcType !== "nghi") {
          let cong200_cn = 1;
          if (hcType === "muon" || hcType === "vesom") {
            cong200_cn = Math.max(0, (8 - hcVal) / 8);
          } else if (hcType === "nghi_sang" || hcType === "nghi_chieu") {
            cong200_cn = 0.5;
          }
          tongNgayCong200 += cong200_cn;
          tongTC300 += otVal;
        }

        if (ca === "dem" && hcType !== "nghi") {
          let cong200_dem_cn = 0.5;
          if (hcType === "muon") cong200_dem_cn = Math.max(0, (4 - hcVal) / 8);
          else if (hcType === "nghi_sang") cong200_dem_cn = 0;
          tongNgayCong200 += cong200_dem_cn;

          let cong100_dem_cn = 0.5;
          if (hcType === "vesom") cong100_dem_cn = Math.max(0, (4 - hcVal) / 8);
          else if (hcType === "nghi_chieu") cong100_dem_cn = 0;
          tongNgayCong100 += cong100_dem_cn;

          if (otVal > 2) {
            tongTC150 += (otVal - 2);
          }
          tongTC200 += Math.min(2, otVal) + midOtVal;

          let dem30_cn = 4;
          if (hcType === "vesom") dem30_cn = Math.max(0, 4 - hcVal);
          else if (hcType === "nghi_sang") dem30_cn = 0;
          tongTCDem30 += dem30_cn;
        }
      }
    }

    const elNgayCong = document.getElementById("cc_ngayCong");
    const elTc150 = document.getElementById("cc_tc150");
    const elTc200 = document.getElementById("cc_tc200");
    const elTcDem30 = document.getElementById("cc_tcDem30");
    const elNgayCong200 = document.getElementById("cc_ngayCong200");
    const elTc300 = document.getElementById("cc_tc300");
    const elTc340 = document.getElementById("cc_tc340");
    const elTcDem70 = document.getElementById("cc_tcDem70");
    const elPhepNam = document.getElementById("cc_phepNam");
    const elLe = document.getElementById("cc_le");

    if (elNgayCong) elNgayCong.value = tongNgayCong100.toFixed(2).replace(/\.?0+$/, "");
    if (elTc150) elTc150.value = tongTC150.toString();
    if (elTc200) elTc200.value = tongTC200.toString();
    if (elTcDem30) elTcDem30.value = tongTCDem30.toString();
    if (elNgayCong200) elNgayCong200.value = tongNgayCong200.toFixed(2).replace(/\.?0+$/, "");
    if (elTc300) elTc300.value = tongTC300.toString();
    if (elTc340) elTc340.value = tongTC340.toString();
    if (elTcDem70) elTcDem70.value = tongTCDem70.toString();
    if (elPhepNam) elPhepNam.value = tongPhepNam.toString();
    if (elLe) elLe.value = tongNgayLe.toString();

    triggerCcComputeEngine();
  };

  // Tính lương chấm công và bảng phụ lễ tết
  window.triggerCcComputeEngine = function() {
    const getVal = (id) => parseInt((document.getElementById(id)?.value || "0").toString().replace(/\./g, "")) || 0;
    const getFloat = (id) => parseFloat(document.getElementById(id)?.value || "0") || 0;

    const lcb = getVal("cc_luongCoBan");
    const thang = getActiveMonth();
    const nam = getActiveYear();

    const soNgayTrongThang = new Date(nam, thang, 0).getDate();
    let soNgayChuNhat = 0;
    for (let d = 1; d <= soNgayTrongThang; d++) {
      if (new Date(nam, thang - 1, d).getDay() === 0) soNgayChuNhat++;
    }
    let ncChuandef = soNgayTrongThang - soNgayChuNhat;
    if (ncChuandef === 27) ncChuandef = 26;

    const pcThamNien = getVal("cc_pcThamNien");
    const pcChucVu = getVal("cc_pcChucVu");
    const hoTroDiLai = getVal("cc_pcDiLai");

    const luongNgayCong = ncChuandef > 0 ? lcb / ncChuandef : 0;
    const luongTC = ncChuandef > 0 ? (lcb + pcThamNien + pcChucVu + hoTroDiLai) / ncChuandef / 8 : 0;
    const troCapDemVal = luongTC;

    function setTien(idTien, amt) {
      const el = document.getElementById(idTien);
      if (el) el.textContent = Math.round(amt).toLocaleString("vi-VN");
      return Math.round(amt);
    }

    let tong = 0;
    tong += setTien("cc_tienNgayCong", luongNgayCong * getFloat("cc_ngayCong"));
    tong += setTien("cc_tienTC150", luongTC * 1.5 * getFloat("cc_tc150"));
    tong += setTien("cc_tienTC200", luongTC * 2 * getFloat("cc_tc200"));
    tong += setTien("cc_tienDem30", troCapDemVal * 0.3 * getFloat("cc_tcDem30"));
    tong += setTien("cc_tienCong200", luongNgayCong * 2 * getFloat("cc_ngayCong200"));
    tong += setTien("cc_tienTC300", luongTC * 3 * getFloat("cc_tc300"));
    tong += setTien("cc_tienTC340", luongTC * 3.4 * getFloat("cc_tc340"));
    tong += setTien("cc_tienDem70", troCapDemVal * 0.7 * getFloat("cc_tcDem70"));
    tong += setTien("cc_tienthongca380", luongTC * 3.8 * getFloat("cc_thongca380"));
    tong += setTien("cc_tienPhepNam", luongNgayCong * getFloat("cc_phepNam"));
    tong += setTien("cc_tienLe", luongNgayCong * getFloat("cc_le"));

    // Bảng phụ Lễ Tết Chấm Công
    let tienTet = 0;
    function phuLuongCc(soGioId, heSoId, rowTienId, loaiLuong) {
      const gio = getFloat(soGioId);
      const heSo = getFloat(heSoId);
      let donGia = 0;
      if (loaiLuong === "hanhChinh" || loaiLuong === "dem") {
        donGia = luongNgayCong / 800;
      } else if (loaiLuong === "tangCa") {
        donGia = luongTC / 100;
      }
      const tien = Math.round(gio * heSo * donGia);
      setTien(rowTienId, tien);
      return tien;
    }

    tienTet += phuLuongCc("cc_soGioHanhChinh1", "cc_phuLuongHanhChinh", "cc_tienHanhChinh", "hanhChinh");
    tienTet += phuLuongCc("cc_soGioTangCa1", "cc_phuLuongTangCa", "cc_tienTangCa", "tangCa");
    tienTet += phuLuongCc("cc_soGioDem1", "cc_phuLuongDem", "cc_tienTroCapDem", "dem");
    tienTet += phuLuongCc("cc_soGioHanhChinh2", "cc_phuLuongHanhChinh2", "cc_tienHanhChinh2", "hanhChinh");
    tienTet += phuLuongCc("cc_soGioTangCa2", "cc_phuLuongTangCa2", "cc_tienTangCa2", "tangCa");
    tienTet += phuLuongCc("cc_soGioDem2", "cc_phuLuongDem2", "cc_tienTroCapDem2", "dem");

    setTien("cc_tienNgayLeTet", tienTet);
    tong += tienTet;

    ["cc_pcABC", "cc_pcChuyenCan", "cc_pcThamNien", "cc_pcChucVu", "cc_pcDiLai", "cc_pcDienThoai", "cc_pcTreEm", "cc_pcKhac"].forEach(pid => {
      tong += getVal(pid);
    });

    setTien("cc_tongLuong", tong);

    const luongBH = lcb + getVal("cc_pcThamNien") + getVal("cc_pcChucVu");
    const bhxh = setTien("cc_tienTruBHXH", luongBH * 0.105);
    const congDoan = setTien("cc_tienTruCD", luongBH * 0.005);

    setTien("cc_thucLinh", tong - bhxh - congDoan);
  };

  // Popup menu chọn Tháng hoặc Năm
  window.openDateMenu = function(type, isChamCongTab = false) {
    const overlay = document.getElementById("pickerOverlay");
    const body = document.getElementById("pickerBody");
    const title = document.getElementById("pickerTitle");
    if (!overlay || !body) return;

    body.innerHTML = "";
    overlay.style.display = "flex";

    if (type === "month") {
      title.innerText = "Chọn Tháng";
      body.style.gridTemplateColumns = "repeat(3, 1fr)";
      const curMonth = getActiveMonth();

      for (let m = 1; m <= 12; m++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "picker-btn";
        if (m === curMonth) {
          btn.style.background = "#007bff";
          btn.style.color = "#fff";
        }
        btn.innerText = `Tháng ${m.toString().padStart(2, '0')}`;
        btn.onclick = () => {
          window.selectedMonth = m;
          if (typeof window.updateDateDisplays === "function") window.updateDateDisplays();
          forceClosePicker();

          if (typeof window.loadUserDataFromCloud === "function" && localStorage.getItem("cc_currentUser")) {
            window.loadUserDataFromCloud();
          } else {
            window.clearAttendanceAndHolidayForNewMonth();
          }
        };
        body.appendChild(btn);
      }
    } else if (type === "year") {
      title.innerText = "Chọn Năm";
      body.style.gridTemplateColumns = "repeat(4, 1fr)";
      const curYear = getActiveYear();
      const maxYear = new Date().getFullYear() + 1;

      for (let y = 2020; y <= maxYear; y++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "picker-btn";
        if (y === curYear) {
          btn.style.background = "#007bff";
          btn.style.color = "#fff";
        }
        btn.innerText = y;
        btn.onclick = () => {
          window.selectedYear = y;
          if (typeof window.updateDateDisplays === "function") window.updateDateDisplays();
          forceClosePicker();

          if (typeof window.loadUserDataFromCloud === "function" && localStorage.getItem("cc_currentUser")) {
            window.loadUserDataFromCloud();
          } else {
            window.clearAttendanceAndHolidayForNewMonth();
          }
        };
        body.appendChild(btn);
      }
    }
  };

  // Xóa riêng dữ liệu Tab Chấm Công
  window.clearDataTabChamCong = function() {
    if (!confirm("Bạn có chắc chắn muốn xóa lịch chấm công và bảng lương tạo từ chấm công của tháng này?")) return;

    Object.keys(chamCongData).forEach(k => delete chamCongData[k]);
    renderLichChamCong();

    const ids = [
      "cc_luongCoBan", "cc_ngayCong", "cc_tc150", "cc_tc200", "cc_tcDem30", 
      "cc_ngayCong200", "cc_tc300", "cc_tc340", "cc_tcDem70", "cc_thongca380", "cc_phepNam", "cc_le",
      "cc_pcABC", "cc_pcChucVu", "cc_pcDiLai", "cc_pcKhac",
      "cc_soGioHanhChinh1", "cc_phuLuongHanhChinh", "cc_soGioTangCa1", "cc_phuLuongTangCa", "cc_soGioDem1", "cc_phuLuongDem",
      "cc_soGioHanhChinh2", "cc_phuLuongHanhChinh2", "cc_soGioTangCa2", "cc_phuLuongTangCa2", "cc_soGioDem2", "cc_phuLuongDem2"
    ];

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    if (typeof window.applyDefaultAllowances === "function") {
      window.applyDefaultAllowances();
    }

    triggerCcComputeEngine();
    if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
    alert("Đã xóa sạch dữ liệu bảng Chấm Công!");
  };

  // Khởi chạy khi nạp trang
  updateDaoCaButtonUI();
  renderLichChamCong();
  syncChamCongToTinhLuong();

  const ccPane = document.getElementById("paneChamCong");
  if (ccPane) {
    ccPane.querySelectorAll("input, select").forEach(inp => {
      inp.addEventListener("input", () => {
        triggerCcComputeEngine();
        if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
      });
      inp.addEventListener("change", () => {
        triggerCcComputeEngine();
        if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
      });
    });
  }
});
