import { initAuth } from "./auth.js";
import { BookingController } from "./controllers/BookingController.js";

window.addEventListener("DOMContentLoaded", () => {
    // 驗證登入，渲染導覽列
    initAuth();

    // 啟動 Booking 頁面邏輯
    const controller = new BookingController();
    controller.init();
});