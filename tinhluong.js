// Biến lưu trữ ngày tháng toàn cục cho cả hệ thống
const curDateObj = new Date();
const cMonth = curDateObj.getMonth() + 1;
const cYear = curDateObj.getFullYear();
const cDate = curDateObj.getDate();

// Quy tắc mùng 10: Sau mùng 10 là tháng hiện tại; mùng 10 đổ về trước là tháng trước
if (cDate <= 10) {
  window.selectedMonth = (cMonth === 1) ? 12 : cMonth - 1;
  window.selectedYear = (cMonth === 1) ? cYear - 1 : cYear;
} else {
  window.selectedMonth = cMonth;
  window.selectedYear = cYear;
}

document.addEventListener("DOMContentLoaded", function () {
  updateDateDisplays();

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
    const thang = window.selectedMonth || 1;
    const nam = window.selectedYear || new Date().getFullYear();

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

  // HÀM CHỈ XÓA DỮ LIỆU BẢNG TÍNH LƯƠNG (TAB 1)
  window.clearDataTabLuong = function() {
    if (!confirm("Bạn có chắc chắn muốn xóa dữ liệu bảng Tính Lương tháng này?")) return;

    const ids = [
      "luongCoBan", "ngayCong", "tc150", "tc200", "tcDem30", 
      "ngayCong200", "tc300", "tc340", "tcDem70", "thongca380", "phepNam", "le",
      "pcABC", "pcChucVu", "pcDiLai", "pcKhac",
      "soGioHanhChinh1", "phuLuongHanhChinh", "soGioTangCa1", "phuLuongTangCa", "soGioDem1", "phuLuongDem",
      "soGioHanhChinh2", "phuLuongHanhChinh2", "soGioTangCa2", "phuLuongTangCa2", "soGioDem2", "phuLuongDem2"
    ];

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    tinhLuong();
    if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
    alert("Đã xóa sạch dữ liệu bảng Tính Lương!");
  };

  tinhLuong();
});

// Cập nhật text hiển thị trên các ô chọn Tháng và Năm
window.updateDateDisplays = function() {
  const m = (window.selectedMonth || 1).toString().padStart(2, '0');
  const y = (window.selectedYear || new Date().getFullYear()).toString();

  const t1 = document.getElementById("txtThangLuong");
  const n1 = document.getElementById("txtNamLuong");
  const t2 = document.getElementById("txtThangCC");
  const n2 = document.getElementById("txtNamCC");

  if (t1) t1.innerText = m;
  if (n1) n1.innerText = y;
  if (t2) t2.innerText = m;
  if (n2) n2.innerText = y;
};
