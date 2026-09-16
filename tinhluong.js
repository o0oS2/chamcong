document.addEventListener("DOMContentLoaded", function () {
  const thangSelect = document.getElementById("thang");
  const namSelect = document.getElementById("nam");

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const currentDate = today.getDate();

  let defaultMonth = (currentDate < 11) ? (currentMonth === 1 ? 12 : currentMonth - 1) : currentMonth;
  let defaultYear = (currentMonth === 1 && currentDate < 11) ? currentYear - 1 : currentYear;

  // Gán tháng (1-12)
  if (thangSelect) {
    thangSelect.innerHTML = "";
    for (let i = 1; i <= 12; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.text = i.toString().padStart(2, '0');
      if (i === defaultMonth) option.selected = true;
      thangSelect.appendChild(option);
    }
  }

  // Gán năm: từ 2020 đến năm sau năm hiện tại (currentYear + 1)
  if (namSelect) {
    namSelect.innerHTML = "";
    for (let y = 2020; y <= currentYear + 1; y++) {
      const option = document.createElement("option");
      option.value = y;
      option.text = y;
      if (y === defaultYear) option.selected = true;
      namSelect.appendChild(option);
    }
  }

  updateDisplayMonthYearLabels();

  // === Định dạng số cho tất cả input tiền ===
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function parseNumber(str) {
    return parseInt((str || "").toString().replace(/\./g, "")) || 0;
  }

  window.parseSalaryNumber = parseNumber;
  window.formatSalaryNumber = formatNumber;

  const moneyInputIds = [
    "luongCoBan", "pcABC", "pcChuyenCan", "pcThamNien",
    "pcChucVu", "pcDiLai", "pcDienThoai", "pcTreEm", "pcKhac"
  ];

  moneyInputIds.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener("input", function(e) {
        let value = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
        if (value) e.target.value = formatNumber(value);
        tinhLuong();
        if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
      });

      input.addEventListener("blur", function(e) {
        let value = parseNumber(e.target.value);
        if (value > 0) e.target.value = formatNumber(value);
        tinhLuong();
        if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
      });

      input.addEventListener("focus", function(e) {
        let value = parseNumber(e.target.value);
        if (value > 0) e.target.value = value.toString();
      });
    }
  });

  // Giá trị mặc định phụ cấp
  const defaultValues = {
    pcDiLai: 500000,
    pcChuyenCan: 200000,
    pcThamNien: 600000
  };

  Object.keys(defaultValues).forEach(id => {
    const input = document.getElementById(id);
    if (input && !input.value) {
      input.value = formatNumber(defaultValues[id]);
    }
  });

  function tinhNgayCongChuan() {
    const thang = +document.getElementById("thang")?.value || 1;
    const nam = +document.getElementById("nam")?.value || new Date().getFullYear();

    const soNgayTrongThang = new Date(nam, thang, 0).getDate();
    let soNgayChuNhat = 0;
    for (let d = 1; d <= soNgayTrongThang; d++) {
      if (new Date(nam, thang - 1, d).getDay() === 0) soNgayChuNhat++;
    }

    let ngayCongChuan = soNgayTrongThang - soNgayChuNhat;
    if (ngayCongChuan === 27) ngayCongChuan = 26;
    return ngayCongChuan;
  }

  const inputs = Array.from(document.querySelectorAll("#paneLuong input, #paneLuong select"));
  inputs.forEach((input, index) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const next = inputs[index + 1];
        if (next) next.focus();
      }
    });
    
    if (!moneyInputIds.includes(input.id)) {
      input.addEventListener("input", () => {
        tinhLuong();
        if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
      });
      input.addEventListener("change", () => {
        tinhLuong();
        if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
      });
    }
  });

  ["thang", "nam"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", () => {
        updateDisplayMonthYearLabels();
        tinhLuong();
      });
    }
  });

  window.tinhLuong = function() {
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
      if (document.getElementById(idTien)) {
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
    if (document.getElementById("tienNgayLeTet")) {
      document.getElementById("tienNgayLeTet").textContent = tienNgayLeTet.toLocaleString("vi-VN");
    }
    tong += tienNgayLeTet;

    const phuCaps = [
      "pcABC", "pcChuyenCan", "pcThamNien",
      "pcChucVu", "pcDiLai", "pcDienThoai",
      "pcTreEm", "pcKhac"
    ];
    phuCaps.forEach(id => {
      tong += parseNumber(document.getElementById(id)?.value || "0");
    });

    if (document.getElementById("tongLuong")) {
      document.getElementById("tongLuong").textContent = Math.round(tong).toLocaleString("vi-VN");
    }

    const luongDongBH = luongCoBan + phuCapThamNien + phuCapChucVu;
    const tienTruBHXH = Math.round(luongDongBH * 0.105);
    const tienTruCD = Math.round(luongDongBH * 0.005);
    if (document.getElementById("tienTruBHXH")) {
      document.getElementById("tienTruBHXH").textContent = tienTruBHXH.toLocaleString("vi-VN");
    }
    if (document.getElementById("tienTruCD")) {
      document.getElementById("tienTruCD").textContent = tienTruCD.toLocaleString("vi-VN");
    }

    const thucLinh = Math.round(tong) - tienTruBHXH - tienTruCD;
    if (document.getElementById("thucLinh")) {
      document.getElementById("thucLinh").textContent = thucLinh.toLocaleString("vi-VN");
    }
  };

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
      if (document.getElementById(rowTienId)) {
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

  function updateDisplayMonthYearLabels() {
    const t = document.getElementById("thang")?.value || (new Date().getMonth() + 1);
    const n = document.getElementById("nam")?.value || new Date().getFullYear();
    const lblLuong = document.getElementById("displayMonthYearLuong");
    if (lblLuong) lblLuong.innerText = `Tháng ${t}/${n}`;
  }

  tinhLuong();
});
