import { initAuth, getUserInfo } from "./auth.js";
import { showErrorMessage, confirmDelete, showLoading, hideLoading } from "./utils.js";

window.addEventListener("DOMContentLoaded", () => {
    // 驗證登入，渲染導覽列
    initAuth();

    initBookingAPI();
    // 檢查付款欄位
    checkOrderFields();
});

async function initBookingAPI() {
    // 先轉圈圈
    showLoading();

    // 檢查登入狀態
    const user = await getUserInfo();
    if (!user || user.data === null) {
        window.location.href = "/";
        return;
    }

    // 渲染姓名
    const userName = document.getElementById("user-name");
    userName.innerText = user.data["name"];

    try {
        const token = localStorage.getItem("jwt_token");

        const response = await fetch("/api/booking",{
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 403) {
            showErrorMessage("未登入系統，請登入後再試。");
            return;
        }
        if(!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const booking =  await response.json();
        // 渲染預定行程資訊UI
        rederBookingUI(booking.data);
        
    }
    catch (err) {
        console.error("預定行程資料載入錯誤：", err);
        showErrorMessage("預定行程資料載入錯誤，請稍後再試。");
    }
    finally {
        // 停止轉圈圈
        hideLoading();
    }
}

// 渲染預定行程資訊UI
function rederBookingUI (data) {
    const bookingHidden = document.querySelectorAll(".booking-hidden");
    const nonBooking = document.getElementById("non-booking");
    if (data === null) {
        bookingHidden.forEach(e => e.style.display = "none");
        nonBooking.style.display = "block";
    }
    else {
        bookingHidden.forEach(e => e.style.display = "block");
        nonBooking.style.display = "none";
        const attrInfo = data["attraction"];
        const time = data.time === "morning" ? "早上 9 點到下午 12 點" : "下午 1 點到下午 4 點"
        const bookingHtml = `
            <div class="booking-container font-body margin-box">
                <div class="booking-img"><img src="${attrInfo.image}" alt="景點照片"></div>
                <div class="booking-info bold">
                    <div class="booking-info_title">台北一日遊：${attrInfo.name}</div>
                    <div class="booking-info_label">日期：<span>${data.date}</span></div>
                    <div class="booking-info_label">時間：<span>${time}</span></div>
                    <div class="booking-info_label">費用：<span>新台幣 ${data.price} 元</span></div>
                    <div class="booking-info_label">地點：<span>${attrInfo.address}</span></div>
                </div>
                <div class="delete-btn" id="delete-btn"></div>
            </div>
        `
        document.getElementById("booking-container").insertAdjacentHTML("beforeend", bookingHtml);

        // 刪除按鈕事件觸發
        document.getElementById("delete-btn").addEventListener("click", async () => {
            // 再次確認
            const ok = await confirmDelete("確定要刪除預定行程嗎？");
            if (!ok) return;
            // 刪除資料
            deleteBooking();
        });
    }
}

// 刪除行程
async function deleteBooking() {
    showLoading();
    try {
        const token = localStorage.getItem("jwt_token");
        const response = await fetch("/api/booking", {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 403) {
            showErrorMessage("未登入系統，請登入後再試。");
            return;
        }
        if(!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        location.reload();
    }
    catch {
        console.error("刪除預定行程資料錯誤：", err);
        showErrorMessage("刪除預定行程發生錯誤，請稍後再試。");
    }
    finally {
        hideLoading();
    }
} 

// 檢查付款欄位
function checkOrderFields() {
    // 信用卡號碼，每 4 碼自動空一格
    const cardNumber = document.getElementById('card-number');
    cardNumber.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // 移除所有非數字
        let formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 '); // 每4碼加一個空格
        e.target.value = formattedValue;
    });

    // 過期時間，MM / YY 格式
    const cardExp = document.getElementById('card-exp');
    cardExp.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // 移除所有非數字
        
        if (value.length > 2) {
            // 在前兩碼後面加上 " / "
            e.target.value = value.substring(0, 2) + ' / ' + value.substring(2, 4);
        } else {
            e.target.value = value;
        }
    });

    // CVV，純數字限制
    const cardCvv = document.getElementById('card-cvv');
    cardCvv.addEventListener('input', (e) => {
        // 只允許輸入數字
        e.target.value = e.target.value.replace(/\D/g, '');
    });
}