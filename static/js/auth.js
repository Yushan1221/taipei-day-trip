import { AuthController } from "./controllers/AuthController.js";

// Controller 實體
const authController = new AuthController();

// 初始化
export async function initAuth() {
    await authController.init();
}

// 取得使用者資料
export async function getUserInfo() {
    return await authController.model.getUserInfo();
}

// 開啟登入視窗
export function openLoginDialog() {
    authController.openLoginDialog();
}