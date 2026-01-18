import { initAuth, getUserInfo } from "./auth.js";
import { showErrorMessage, showLoading, hideLoading } from "./utils.js";

window.addEventListener("DOMContentLoaded", () => {
    // 驗證登入，渲染導覽列
    initAuth();

    initThankyouAPI();
});

async function initThankyouAPI() {
    // 先轉圈圈
    showLoading();

    // 檢查登入狀態
    const user = await getUserInfo();
    if (!user || user.data === null) {
        window.location.href = "/";
        return;
    }

    try {
        // 取 token
        const token = localStorage.getItem("jwt_token");
        // 取 查詢參數
        const urlParams = new URLSearchParams(window.location.search);
        const orderNumber = urlParams.get('number');

        const response = await fetch(`/api/order/${orderNumber}`,{
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

        const order =  await response.json();
        // 渲染訂單資訊UI
        renderOrderUI(order.data);
        
    }
    catch (err) {
        console.error("訂單資料載入錯誤：", err);
        showErrorMessage("訂單資料載入錯誤，請稍後再試。");
    }
    finally {
        // 停止轉圈圈
        hideLoading();
    }
}


function renderOrderUI(data) {
    const orderNumber = document.getElementById("order-number");
    orderNumber.innerText = data.number;

    const nonBooking = document.getElementById("non-booking");
    if (data === null) {
        nonBooking.style.display = "block";
    }
    else {
        nonBooking.style.display = "none";
        const attrInfo = data["trip"]["attraction"];
        const time = data.trip.time === "morning" ? "早上 9 點到下午 12 點" : "下午 1 點到下午 4 點"
        const status = data.status === 1 ? "已付款" : "未付款"
        const color = data.status === 1 ? "#75ba4d" : "#e55557"
        const bookingHtml = `
            <div class="booking-container font-body margin-box">
                <div class="booking-img"><img src="${attrInfo.image}" alt="景點照片"></div>
                <div class="booking-info bold">
                    <div class="booking-info_title">台北一日遊：${attrInfo.name}</div>
                    <div class="booking-info_label">日期：<span>${data.trip.date}</span></div>
                    <div class="booking-info_label">時間：<span>${time}</span></div>
                    <div class="booking-info_label">費用：<span>新台幣 ${data.price} 元</span></div>
                    <div class="booking-info_label">地點：<span>${attrInfo.address}</span></div>
                    <div class="order-status" id="order-status" style="color: ${color}">${status}</div>
                </div>
            </div>
        `
        document.getElementById("booking-container").insertAdjacentHTML("beforeend", bookingHtml);

    }
}