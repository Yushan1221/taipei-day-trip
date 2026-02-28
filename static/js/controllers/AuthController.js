import { UserModel } from "../models/UserModel.js";
import { AuthView } from "../views/AuthView.js";

export class AuthController {
    constructor() {
        this.model = new UserModel();
        this.view = new AuthView();
    }

    async init() {
        // 檢查登入狀態並更新 UI
        await this.checkLoginStatus();

        // 綁定事件
        this.setupEventListeners();
    }

    // 給外部呼叫用的方法
    openLoginDialog() {
        this.view.showDialog();
    }

    // 檢查狀態
    async checkLoginStatus() {
        const userInfo = await this.model.getUserInfo();
        const isLoggedIn = userInfo && userInfo.data !== null;

        // 更新 Navbar
        this.view.renderNavbar(isLoggedIn);
        this.setupNavbarEvents(isLoggedIn);

        return userInfo; // 回傳給需要的外部程式
    }

    // 處理表單送出
    async handleSubmit(e) {
        e.preventDefault();
        const { name, email, password } = this.view.getInputs();
        const mode = this.view.getMode();

        if (mode === "sign-in") {
            const result = await this.model.login(email, password);
            if (result.ok) {
                this.model.setToken(result.token);
                location.reload();
            } else {
                this.view.showError(result.message || "電子信箱或密碼錯誤");
            }
        } else {
            const result = await this.model.register(name, email, password);
            if (result.ok) {
                this.view.showSuccess("註冊成功，請登入");
                // 可以選擇自動切換回登入模式
                // this.view.toggleMode(); 
            } else {
                this.view.showError(result.message || "註冊失敗");
            }
        }
    }

    handleLogout() {
        this.model.removeToken();
        location.reload();
        alert("已成功登出系統！");
    }

    setupEventListeners() {
        // 關閉按鈕
        this.view.closeBtn.addEventListener("click", () => this.view.hideDialog());
        this.view.backdrop.addEventListener("click", () => this.view.hideDialog());
        
        // 切換模式按鈕
        this.view.switchBtn.addEventListener("click", () => this.view.toggleMode());

        // 表單提交
        this.view.form.addEventListener("submit", (e) => this.handleSubmit(e));
    }

    setupNavbarEvents(isLoggedIn) {
        // Booking 按鈕邏輯
        this.view.menuBookingBtn.onclick = () => {
            if (isLoggedIn) {
                window.location.href = "/booking";
            } else {
                this.view.showDialog();
            }
        };

        // 登入/登出按鈕邏輯
        const authBtn = document.getElementById(isLoggedIn ? "menu_signout-btn" : "menu_signin-btn");
        if (authBtn) {
            authBtn.onclick = () => {
                if (isLoggedIn) {
                    this.handleLogout();
                } else {
                    this.view.showDialog();
                }
            };
        }
    }
}