// Cập nhật kết quả ca hiển thị bên cạnh nút Đổi ca
  window.updateDaoCaButtonUI = function() {
    const lblKetQua = document.getElementById("lblKetQuaCa");
    if (!lblKetQua) return;

    if (window.currentShiftMode === "chuyen_ngay") {
      lblKetQua.textContent = "Chuyên ngày";
      lblKetQua.style.color = "#059669"; // Màu xanh lá
      lblKetQua.style.background = "#ecfdf5";
      lblKetQua.style.borderColor = "#a7f3d0";
      return;
    }

    // Lấy ngày, tháng, năm thực tế của ngày hôm nay
    const today = new Date();
    const todayY = today.getFullYear();
    const todayM = today.getMonth() + 1;
    const todayD = today.getDate();

    // Xác định ca thực tế của hôm nay theo chế độ ca hiện tại
    const caHomNay = xacDinhCa(todayY, todayM, todayD);

    if (caHomNay === "dem") {
      lblKetQua.textContent = "Hôm nay: Ca đêm";
      lblKetQua.style.color = "#1e293b"; // Màu tối của ca đêm
      lblKetQua.style.background = "#e2e8f0";
      lblKetQua.style.borderColor = "#cbd5e1";
    } else {
      lblKetQua.textContent = "Hôm nay: Ca ngày";
      lblKetQua.style.color = "#b45309"; // Màu vàng cam ấm của ca ngày
      lblKetQua.style.background = "#fffdf5";
      lblKetQua.style.borderColor = "#fce7b2";
    }
  };
