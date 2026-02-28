import { initAuth } from "./auth.js";
import { IndexController } from "./controllers/IndexController.js";

document.addEventListener("DOMContentLoaded", () => {
  // 初始化會員功能
  initAuth();

  // 初始化首頁主邏輯
  const controller = new IndexController();
  controller.init();
});