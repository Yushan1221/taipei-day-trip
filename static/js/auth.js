// 初始化導覽列跟登入/註冊邏輯
export async function initAuth() {
    // 初始預設彈窗格式
    injectDialogModel();
    // "關閉彈窗"功能
    addCloseDialogEvent();
    // 彈窗登入/註冊狀態切換
    changeDialogStatus();
    // 連接登入/註冊 API
    initAuthApi();

    // 確認登入狀態並 render 右上角 UI
    await checkLoginStatus();
}


// 驗證 token 取得會員資料
export async function getUserInfo() {
    // 若沒有 token 就直接不用發送請求
    const token = localStorage.getItem("jwt_token");
    if (!token) return { data: null };

    try {
        const response = await fetch("/api/user/auth",{
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        return await response.json();
    }
    catch (err) {
        console.error("取得會員資料錯誤：", err);
        return { data: null }; // 發生錯誤時視為未登入
    }
}

// 開啟登入彈窗
export function openLoginDialog() {
    const dialog = document.getElementById("dialog");
    const backdrop = document.getElementById("backdrop");
    // 重製回登入狀態
    resetDialogStatus("sign-in");
    backdrop.style.display = "block";
    dialog.classList.remove("hide"); // 避免原本有 hide
    dialog.classList.add("show");
}

// 確認登入狀態後更新 UI
async function checkLoginStatus() {
    // 取得會員資料
    const userInfo = await getUserInfo();

    const authContainer = document.getElementById("menu_auth-container");
    const menuBookingBtn = document.getElementById("menu_booking-btn");
    // 更新右上角UI
    if (!userInfo || userInfo.data === null) { // 未登入狀態
        authContainer.innerHTML = `<span id="menu_signin-btn">登入/註冊</span>`;
        // 新增登入按鈕觸發事件 => 開啟登入彈窗
        document.getElementById("menu_signin-btn").addEventListener("click", () => openLoginDialog());
        // 新增預定行程按鈕觸發事件 => 開啟登入彈窗
        menuBookingBtn.addEventListener("click", () => openLoginDialog());
    }
    else { // 已登入狀態
        authContainer.innerHTML = `<span id="menu_signout-btn">登出系統</span>`;
        // 登出按鈕加上登出功能
        document.getElementById("menu_signout-btn").addEventListener("click", () => handleSignOut());
        // 新增預定行程按鈕觸發事件 => 導到預定行程頁面
        menuBookingBtn.addEventListener("click", () => {
            window.location.href = "/booking";
        });
    }
}

// 初始預設彈窗格式
function injectDialogModel() {
    const dialogHtml = `
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

    document.body.insertAdjacentHTML("beforeend", dialogHtml)
}

// 切換彈窗登入/註冊狀態
function changeDialogStatus() {
    const statusChangeBtn = document.getElementById("status-change-btn");
    statusChangeBtn.onclick = () => {
        const currentMode = document.getElementById("dialog-btn").dataset.mode;
        const nextMode = currentMode === "sign-in" ? "sign-up" : "sign-in";

        // 根據狀態切換彈窗內容
        resetDialogStatus(nextMode);
    }
}

// 關閉彈窗事件
function addCloseDialogEvent() {
    const dialogCloseBtn = document.getElementById("dialog-close-btn");
    const dialog = document.getElementById("dialog");
    const backdrop = document.getElementById("backdrop");
    
    // 關閉彈窗
    const closeDialog = () => {
        backdrop.style.display = "none";
        dialog.classList.add("hide");

        dialog.onanimationend = (e) => {
            // 確保是"淡出"的動畫結束再執行
            if (e.animationName === "fadeOut") {
                dialog.classList.remove("show"); // 移除 show，這時 display 會變回 none
            }
        }
    }

    // 點擊關閉按鈕關閉彈窗
    dialogCloseBtn.onclick = closeDialog;
    // 點擊 backdrop 也能關閉彈窗
    backdrop.onclick = closeDialog;
}

// 連接登入/註冊 API
function initAuthApi() {
    const authForm = document.getElementById("auth-form");
    const dialogBtn = document.getElementById("dialog-btn");
    const dialogAlert = document.getElementById("dialog-alert");
    const dialogAlertText = document.getElementById("dialog-alert-text");
    const dialogCorrect = document.getElementById("dialog-correct");
    const dialog = document.getElementById("dialog");
    const backdrop = document.getElementById("backdrop");


    authForm.addEventListener("submit", async (e) => {
        // 防止表單預設送出
        e.preventDefault();
        // 檢查所有表單欄位必填
        if (!e.target.reportValidity()) return;

        const name = document.getElementById("dialog-name").value;
        const email = document.getElementById("dialog-email").value.trim();
        const password = document.getElementById("dialog-password").value.trim();

        if (dialogBtn.dataset.mode === "sign-in") { // 登入帳戶 API
            try {
                const response = await fetch("/api/user/auth", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ "email": email, "password": password })
                });
                
                // 錯誤處理
                if (response.status === 400) {
                    dialogAlert.style.display = "block";
                    dialogCorrect.style.display = "none";
                    dialogAlertText.innerText = " 電子信箱或密碼錯誤，請重新輸入。";
                    return;
                }
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                const result = await response.json();
                // 將 token 存入 localStorage
                localStorage.setItem("jwt_token", result.token);
                // 關閉彈窗
                backdrop.style.display = "none";
                dialog.style.display = "none";

                // refresh 登入狀態
                location.reload();
            } catch (err) {
                console.error("登入會員錯誤：", err);
                dialogAlert.style.display = "block";
                dialogCorrect.style.display = "none";
                dialogAlertText.innerText = " 系統錯誤，請稍後再試。";
            }
        }
        else if (dialogBtn.dataset.mode === "sign-up") { // 註冊帳戶 API
            try {
                const response = await fetch("/api/user", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ "name": name, "email": email, "password": password })
                });

                // 錯誤處理
                if (response.status === 400) {
                    dialogAlert.style.display = "block";
                    dialogCorrect.style.display = "none";
                    dialogAlertText.innerText = " 此電子郵件信箱已被註冊，請更換其他信箱。";
                    return;
                }
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }
                const result = await response.json();
                // 顯示註冊成功訊息
                dialogAlert.style.display = "none";
                dialogCorrect.style.display = "block";

            } catch (err) {
                console.error("註冊會員錯誤：", err);
                dialogAlert.style.display = "block";
                dialogCorrect.style.display = "none";
                dialogAlertText.innerText = " 系統錯誤，請稍後再試。";
            }
        }
    });
    
}

// 重製彈窗狀態
function resetDialogStatus(status) { // status: "sign-in" or "sign-up"
    const statusChangeBtn = document.getElementById("status-change-btn");
    const dialogTitle = document.getElementById("dialog-title");
    const dialogName = document.getElementById("dialog-name");
    const dialogBtn = document.getElementById("dialog-btn");
    const dialogText = document.getElementById("dialog-prompt-text");

    // 清空所有輸入欄位
    const name = document.getElementById("dialog-name");
    const email = document.getElementById("dialog-email");
    const password = document.getElementById("dialog-password"); 
    if (name) name.value = "";
    if (email) email.value = "";
    if (password) password.value = "";

    // 隱藏提示訊息
    const dialogAlert = document.getElementById("dialog-alert");
    const dialogCorrect = document.getElementById("dialog-correct");
    dialogAlert.style.display = "none";
    dialogCorrect.style.display = "none";
    
    if (status === "sign-in") { // 登入頁面
        dialogBtn.dataset.mode = "sign-in";
        dialogBtn.innerText = "登入帳戶";
        dialogTitle.innerText = "登入會員帳號";
        dialogName.style.display = "none";
        dialogName.required = false;
        dialogText.innerText = "還沒有帳戶？"
        statusChangeBtn.innerText = "點此註冊";
    }
    else if (status === "sign-up") { // 註冊頁面
        // 切換成註冊頁面    
        dialogBtn.dataset.mode = "sign-up";   
        dialogBtn.innerText = "註冊新帳戶";
        dialogTitle.innerText = "註冊會員帳號";
        dialogName.style.display = "block";
        dialogName.required = true;
        dialogText.innerText = "已經有帳戶了？"
        statusChangeBtn.innerText = "點此登入";
    }
}


// 登出系統
function handleSignOut() {
    localStorage.removeItem("jwt_token");
    // refresh 登出狀態
    alert("已成功登出系統！");
    location.reload();
}
