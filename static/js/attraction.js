import { initAuth } from "./auth.js";
import { AttractionController } from "./controllers/AttractionController.js";

document.addEventListener("DOMContentLoaded", () => {
    // 驗證登入，渲染導覽列 (共用模組)
    initAuth();

    // 啟動景點頁面邏輯
    const controller = new AttractionController();
    controller.init();
});