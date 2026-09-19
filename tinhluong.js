// Thiết lập ngày tháng toàn cục theo quy tắc ngày 10
const curDateObj = new Date();
const cMonth = curDateObj.getMonth() + 1;
const cYear = curDateObj.getFullYear();
const cDate = curDateObj.getDate();

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
    if (!num && num !== 0) return "";
    let str = num.toString().replace(/\./g, "").replace(/[^0-9]/g, "");
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function parseNumber(str) {
    return parseInt((str || "").toString().replace(/\./g, "")) || 0;
  }

  window.parseSalaryNumber = parseNumber;
  window.formatSalaryNumber = formatNumber;

  // Danh sách các ô tiền có dấu chấm phân cách
  const moneyInputIds = [
    "luongCoBan", "cc_luongCoBan",
    "pcABC", "cc_pcABC",
    "pcChucVu", "cc_pcChucVu",
    "pcDiLai", "cc_pcDiLai",
    "pcKhac", "cc_pcKhac"
  ];

  moneyInputIds.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener("input", function(e) {
        let val = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
        e.target.value = formatNumber(val);
        tinhLuong();
        if (typeof window.triggerCcComputeEngine === "function") window.triggerCcComputeEngine();
        if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
      });

      input.addEventListener("blur", function(e) {
        let val = parseNumber(e.target.value);
        if (val > 0) e.target.value = formatNumber(val);
        tinhLuong();
        if (typeof window.triggerCcComputeEngine === "function") window.triggerCcComputeEngine();
        if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
      });

      input.addEventListener("focus", function(e) {
        let val = parseNumber(e.target.value);
        if (val > 0) e.target.value = val.toString();
      });
    }
  });

  // Tự điền giá trị mặc định cho các phụ cấp
  window.applyDefaultAllowances = function() {
    ["pcDiLai", "cc_pcDiLai"].forEach(id => {
      const el = document.getElementById(id);
      if (el && (!el.value || el.value === "0")) {
        el.value = formatNumber(500000);
      }
    });

    ["pcChuyenCan", "cc_pcChuyenCan"].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value) {
        el.value = "200.000";
      }
    });

    ["pcThamNien", "cc_pcThamNien"].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value) {
        el.value = "600.000";
      }
    });
  };

  window.applyDefaultAllowances();

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

  // Xóa trắng riêng Tab Tính Lương
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

    window.applyDefaultAllowances();
    tinhLuong();
    if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
    alert("Đã xóa sạch dữ liệu bảng Tính Lương!");
  };
  // ================= TỰ ĐỘNG GỢI Ý 5 MỨC ABC THEO LCB =================
  function roundToThousand(val) {
    return Math.round(val / 1000) * 1000;
  }

  function handleAutoSuggestABC(salaryVal, targetAbcId, targetDatalistId) {
    const lcbNum = parseNumber(salaryVal);
    const abcInput = document.getElementById(targetAbcId);
    const datalist = document.getElementById(targetDatalistId);
    if (!datalist || !abcInput) return;

    datalist.innerHTML = "";

    // Tìm dữ liệu lương từ SALARY_CONFIG
    const salaryList = (window.SALARY_CONFIG && window.SALARY_CONFIG.data) ? window.SALARY_CONFIG.data : [];
    const matched = salaryList.find(item => item.lcb === lcbNum);

    if (matched && matched.congC > 0) {
      const c = matched.congC;
      const levels = [
        { name: "A (150%)", val: roundToThousand(c * 1.5) },
        { name: "B (130%)", val: roundToThousand(c * 1.3) },
        { name: "C (100%)", val: c },
        { name: "D (70%)",  val: roundToThousand(c * 0.7) },
        { name: "E (50%)",  val: roundToThousand(c * 0.5) }
      ];

      // Đổ 5 mức gợi ý vào datalist
      levels.forEach(lvl => {
        const opt = document.createElement("option");
        opt.value = formatNumber(lvl.val);
        opt.label = `Mức ${lvl.name}`;
        datalist.appendChild(opt);
      });

      // 1. Tự động điền sẵn mức C
      abcInput.value = formatNumber(c);

      // Lưu giá trị mặc định vào dataset để khi blur nếu bỏ trống sẽ khôi phục lại
      abcInput.dataset.defaultC = formatNumber(c);

      // 2. Gắn sự kiện: khi bấm/focus vào thì xóa trắng dữ liệu để datalist tự bung ra
      if (!abcInput.dataset.hasAbcFocusListener) {
        abcInput.dataset.hasAbcFocusListener = "true";

        abcInput.addEventListener("focus", function() {
          this.value = ""; // Xóa dữ liệu để hiển thị toàn bộ 5 mức trong datalist
        });

        abcInput.addEventListener("blur", function() {
          // Nếu bấm ra ngoài mà không chọn gì thì khôi phục lại mức C mặc định
          if (!this.value.trim() && this.dataset.defaultC) {
            this.value = this.dataset.defaultC;
          }
          if (typeof window.tinhLuong === "function") window.tinhLuong();
          if (typeof window.triggerCcComputeEngine === "function") window.triggerCcComputeEngine();
          if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
        });
      }

      // Cập nhật lại số tiền
      if (typeof window.tinhLuong === "function") window.tinhLuong();
      if (typeof window.triggerCcComputeEngine === "function") window.triggerCcComputeEngine();
      if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
    }
  }

  // Lắng nghe ô LCB ở Tab Tính Lương
  const lcbInput = document.getElementById("luongCoBan");
  if (lcbInput) {
    lcbInput.addEventListener("change", function() {
      handleAutoSuggestABC(this.value, "pcABC", "list_pcABC");
    });
    lcbInput.addEventListener("blur", function() {
      handleAutoSuggestABC(this.value, "pcABC", "list_pcABC");
    });
  }

  // Lắng nghe ô LCB ở Tab Chấm Công
  const ccLcbInput = document.getElementById("cc_luongCoBan");
  if (ccLcbInput) {
    ccLcbInput.addEventListener("change", function() {
      handleAutoSuggestABC(this.value, "cc_pcABC", "list_cc_pcABC");
    });
    ccLcbInput.addEventListener("blur", function() {
      handleAutoSuggestABC(this.value, "cc_pcABC", "list_cc_pcABC");
    });
  }
// ================= GỢI Ý LCB BẰNG DATALIST (1-3 KÝ TỰ, SỐ KHÔNG CHẤM) =================
  function setupLcbDatalist(inputId, datalistId, targetAbcId, targetDatalistAbcId) {
    const input = document.getElementById(inputId);
    const datalist = document.getElementById(datalistId);
    if (!input || !datalist) return;

    // 1. Khi bấm vào ô: lưu số cũ, xóa trắng ô và dọn sạch datalist để chưa bung gợi ý
    input.addEventListener("focus", function () {
      const cur = this.value.replace(/\./g, "").trim();
      if (cur) this.dataset.oldLcb = this.value;
      this.value = "";
      datalist.innerHTML = "";
    });

    // 2. Khi gõ phím:
    input.addEventListener("input", function () {
      const rawVal = this.value.replace(/\./g, "").replace(/[^0-9]/g, "");
      datalist.innerHTML = "";

      // Kiểm tra nếu người dùng bấm chọn trực tiếp 1 mức trong datalist (đủ 7-8 chữ số)
      const salaryList = (window.SALARY_CONFIG && window.SALARY_CONFIG.data) ? window.SALARY_CONFIG.data : [];
      const exactMatch = salaryList.find(item => item.lcb.toString() === rawVal);

      if (exactMatch) {
        this.value = formatNumber(exactMatch.lcb); // Tự thêm dấu chấm khi đã chọn
        handleAutoSuggestABC(this.value, targetAbcId, targetDatalistAbcId);
        if (typeof window.tinhLuong === "function") window.tinhLuong();
        if (typeof window.triggerCcComputeEngine === "function") window.triggerCcComputeEngine();
        if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
        return;
      }

      // CHỈ GỢI Ý KHI GÕ TỪ 1 ĐẾN 3 KÝ TỰ
      if (rawVal.length >= 1 && rawVal.length <= 3) {
        this.value = rawVal; // Giữ số thô để khớp hoàn toàn với option trong datalist

        const matchedList = salaryList.filter(item => item.lcb.toString().startsWith(rawVal));
        matchedList.forEach(item => {
          const opt = document.createElement("option");
          opt.value = item.lcb.toString(); // Gợi ý thuần số KHÔNG CÓ DẤU CHẤM
          datalist.appendChild(opt);
        });
      } else if (rawVal.length > 3) {
        // Từ ký tự thứ 4 trở đi: tự động format dấu chấm và đóng menu gợi ý
        this.value = formatNumber(rawVal);
        datalist.innerHTML = "";
      }
    });

    // 3. Khi bấm ra ngoài ô (blur): format dấu chấm hoặc phục hồi số cũ nếu trống
    input.addEventListener("blur", function () {
      datalist.innerHTML = "";
      const rawVal = this.value.replace(/\./g, "").replace(/[^0-9]/g, "");

      if (!rawVal && this.dataset.oldLcb) {
        this.value = this.dataset.oldLcb;
      } else if (rawVal) {
        this.value = formatNumber(rawVal);
      }

      handleAutoSuggestABC(this.value, targetAbcId, targetDatalistAbcId);
      if (typeof window.tinhLuong === "function") window.tinhLuong();
      if (typeof window.triggerCcComputeEngine === "function") window.triggerCcComputeEngine();
      if (typeof window.autoSaveUserData === "function") window.autoSaveUserData();
    });
  }

  // Kích hoạt cho cả 2 tab
  setupLcbDatalist("luongCoBan", "list_lcb", "pcABC", "list_pcABC");
  setupLcbDatalist("cc_luongCoBan", "list_cc_lcb", "cc_pcABC", "list_cc_pcABC");
  tinhLuong();
});

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
