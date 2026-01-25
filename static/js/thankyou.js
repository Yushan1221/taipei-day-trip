import { initAuth } from "./auth.js";
import { ThankyouController } from "./controllers/ThankyouController.js";

window.addEventListener("DOMContentLoaded", () => {
    // 驗證登入，渲染導覽列
    initAuth();

    // 啟動 Thankyou 頁面邏輯
    const controller = new ThankyouController();
    controller.init();
});