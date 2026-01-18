import { initAuth, getUserInfo } from "./auth.js";
import { showErrorMessage, confirmDelete, showLoading, hideLoading } from "./utils.js";
import { getPrime } from "./payment.js";

let bookingData = null;

window.addEventListener("DOMContentLoaded", () => {
    // 驗證登入，渲染導覽列
    initAuth();

    initBookingAPI();
    // 檢查付款欄位
    checkOrderFields();

    // order button
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", handlePayment);
    }
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

    // 渲染聯絡資訊
    const contactName = document.getElementById("name");
    const contactEmail = document.getElementById("email");
    contactName.value = user.data["name"];
    contactEmail.value = user.data["email"];

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
        bookingData = booking.data;
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
    catch (err) {
        console.error("刪除預定行程資料錯誤：", err);
        showErrorMessage("刪除預定行程發生錯誤，請稍後再試。");
    }
    finally {
        hideLoading();
    }
} 

// 檢查聯絡資訊欄位
function checkOrderFields() {
    // 剩下的改成用 input form 檢查
    // 手機，純數字限制
    const contactMobile = document.getElementById("mobile");
    contactMobile.addEventListener('input', (e) => {
        // 只允許輸入數字
        e.target.value = e.target.value.replace(/\D/g, '');
    });
}


export async function handlePayment(e) {
    showLoading();

    try {
        // 阻止發送 form
        e.preventDefault();
        // 檢查必填
        if (!e.target.reportValidity()) {
            return;
        }

        // 取值
        const contactName = document.getElementById("name").value;
        const contactEmail = document.getElementById("email").value;
        const contactMobile = document.getElementById("mobile").value;

        // 取 prime
        const prime = await getPrime();
        if (!prime) return;

        const token = localStorage.getItem("jwt_token");
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                "prime": prime,
                "order": {
                    "price": bookingData.price,
                    "trip": {
                        "attraction": bookingData.attraction,
                        "date": bookingData.date,
                        "time": bookingData.time
                    },
                    "contact": {
                        "name": contactName,
                        "email": contactEmail,
                        "phone": contactMobile
                    }
                }
            })
        });

        const data = await response.json();
        if (response.status === 400) {
            showErrorMessage(data["message"]);
            return;
        }
        if (response.status === 403) {
            showErrorMessage("未登入系統，請登入後再試。");
            return;
        }
        if(!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        // 導到 thankyou page
        window.location.href = `/thankyou?number=${data.data.number}`;
    }
    catch {
        console.error("訂購與付款預定行程發生錯誤：", err);
        showErrorMessage("訂購與付款預定行程發生錯誤，請稍後再試。");
    }
    finally {
        hideLoading();
    }
}