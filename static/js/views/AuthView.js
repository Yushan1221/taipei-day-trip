export class AuthView {
    constructor() {
        // 為了避免重複插入 HTML，這一段邏輯在 init 時執行
        this.renderModal();
        
        // 抓取 DOM 元素
        this.dialog = document.getElementById("dialog");
        this.backdrop = document.getElementById("backdrop");
        this.form = document.getElementById("auth-form");
        this.closeBtn = document.getElementById("dialog-close-btn");
        this.submitBtn = document.getElementById("dialog-btn");
        this.title = document.getElementById("dialog-title");
        this.nameInput = document.getElementById("dialog-name");
        this.emailInput = document.getElementById("dialog-email");
        this.passwordInput = document.getElementById("dialog-password");
        this.switchBtn = document.getElementById("status-change-btn");
        this.promptText = document.getElementById("dialog-prompt-text");
        this.alertBox = document.getElementById("dialog-alert");
        this.alertText = document.getElementById("dialog-alert-text");
        this.correctBox = document.getElementById("dialog-correct");
        
        // Navbar 相關
        this.authContainer = document.getElementById("menu_auth-container");
        this.menuBookingBtn = document.getElementById("menu_booking-btn");
    }

    // 取得表單輸入
    getInputs() {
        return {
            name: this.nameInput.value,
            email: this.emailInput.value.trim(),
            password: this.passwordInput.value.trim()
        };
    }

    // 取得目前模式 (sign-in / sign-up)
    getMode() {
        return this.submitBtn.dataset.mode;
    }

    // 顯示彈窗
    showDialog() {
        this.resetForm("sign-in"); // 每次打開預設為登入
        this.backdrop.style.display = "block";
        this.dialog.classList.remove("hide");
        this.dialog.classList.add("show");
        this.dialog.style.display = "block";
    }

    // 關閉彈窗
    hideDialog() {
        this.backdrop.style.display = "none";
        this.dialog.classList.add("hide");
        this.dialog.classList.remove("show");
    }

    // 顯示錯誤訊息
    showError(message) {
        this.alertBox.style.display = "block";
        this.correctBox.style.display = "none";
        this.alertText.innerText = message;
    }

    // 顯示成功訊息
    showSuccess(message) {
        this.alertBox.style.display = "none";
        this.correctBox.style.display = "block";
        this.correctBox.innerText = message;
    }

    // 更新導覽列 (登入/登出狀態)
    renderNavbar(isLoggedIn) {
        if (isLoggedIn) {
            this.authContainer.innerHTML = `<span id="menu_signout-btn" class="menu_btn">登出系統</span>`;
        } else {
            this.authContainer.innerHTML = `<span id="menu_signin-btn" class="menu_btn">登入/註冊</span>`;
        }
    }

    // 切換 登入/註冊 模式 UI
    toggleMode() {
        const currentMode = this.getMode();
        const nextMode = currentMode === "sign-in" ? "sign-up" : "sign-in";
        this.resetForm(nextMode);
    }

    resetForm(mode) {
        // 清空欄位
        this.nameInput.value = "";
        this.emailInput.value = "";
        this.passwordInput.value = "";
        this.alertBox.style.display = "none";
        this.correctBox.style.display = "none";

        if (mode === "sign-in") {
            this.submitBtn.dataset.mode = "sign-in";
            this.submitBtn.innerText = "登入帳戶";
            this.title.innerText = "登入會員帳號";
            this.nameInput.style.display = "none";
            this.nameInput.required = false;
            this.promptText.innerText = "還沒有帳戶？";
            this.switchBtn.innerText = "點此註冊";
        } else {
            this.submitBtn.dataset.mode = "sign-up";
            this.submitBtn.innerText = "註冊新帳戶";
            this.title.innerText = "註冊會員帳號";
            this.nameInput.style.display = "block";
            this.nameInput.required = true;
            this.promptText.innerText = "已經有帳戶了？";
            this.switchBtn.innerText = "點此登入";
        }
    }

    renderModal() {
        // 防止重複渲染
        if (document.getElementById("dialog")) return; 
        const html = `
            <div class="backdrop" id="backdrop"></div>
            <div class="dialog" id="dialog">
                <div class="decorator-bar"></div>
                <form class="dialog-container" id="auth-form">
                    <div class="dialog-close-btn" id="dialog-close-btn"></div>
                    <div class="dialog-title font-h3 bold" id="dialog-title">登入會員帳號</div>
                    <input type="text" class="dialog-textbox" id="dialog-name" placeholder="輸入姓名" style="display:none;">
                    <input type="email" class="dialog-textbox" id="dialog-email" placeholder="輸入電子信箱" required>                
                    <input type="password" class="dialog-textbox" id="dialog-password" placeholder="輸入密碼" required>                
                    <button type="submit" class="dialog-btn font-btn" id="dialog-btn" data-mode="sign-in">登入帳戶</button>
                    <div class="dialog-text font-body" id="dialog-text">
                        <span id="dialog-prompt-text">還沒有帳戶？</span>
                        <div id="status-change-btn">點此註冊</div>
                    </div>
                    <div class="dialog-alert" id="dialog-alert">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span id="dialog-alert-text"><span>
                    </div>
                    <div class="dialog-correct" id="dialog-correct">會員註冊完成！</div>
                </form>
            </div>
        `; 
        document.body.insertAdjacentHTML("beforeend", html);
    }
}