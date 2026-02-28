export class BookingView {
    constructor() {
        // UI 區塊
        this.bookingHiddenElements = document.querySelectorAll(".booking-hidden");
        this.nonBookingElement = document.getElementById("non-booking");
        this.bookingContainer = document.getElementById("booking-container");
        this.totalPrice = document.getElementById("total-price");
        
        // 使用者資訊欄位
        this.userNameDisplay = document.getElementById("user-name");
        this.contactNameInput = document.getElementById("name");
        this.contactEmailInput = document.getElementById("email");
        this.contactMobileInput = document.getElementById("mobile");
        
        // 表單
        this.contactForm = document.getElementById("contact-form");
    }

    // 渲染使用者資訊 (Header 歡迎詞 & 聯絡表單預填)
    renderUserInfo(user) {
        if (!user || !user.data) return;
        this.userNameDisplay.innerText = user.data.name;
        this.contactNameInput.value = user.data.name;
        this.contactEmailInput.value = user.data.email;
    }

    // 渲染預定行程卡片
    renderBookingUI(data) {
        if (data === null) {
            // 沒有行程
            this.bookingHiddenElements.forEach(e => e.style.display = "none");
            this.nonBookingElement.style.display = "block";
        } else {
            // 有行程
            this.bookingHiddenElements.forEach(e => e.style.display = "block");
            this.nonBookingElement.style.display = "none";
            
            const attrInfo = data.attraction;
            const timeText = data.time === "morning" ? "早上 9 點到下午 12 點" : "下午 1 點到下午 4 點";
            
            const html = `
                <div class="booking-container font-body margin-box">
                    <div class="booking-img"><img src="${attrInfo.image}" alt="景點照片"></div>
                    <div class="booking-info bold">
                        <div class="booking-info_title">台北一日遊：${attrInfo.name}</div>
                        <div class="booking-info_label">日期：<span>${data.date}</span></div>
                        <div class="booking-info_label">時間：<span>${timeText}</span></div>
                        <div class="booking-info_label">費用：<span>新台幣 ${data.price} 元</span></div>
                        <div class="booking-info_label">地點：<span>${attrInfo.address}</span></div>
                    </div>
                    <div class="delete-btn" id="delete-btn"></div>
                </div>
            `;
            this.bookingContainer.insertAdjacentHTML("beforeend", html);

            // 渲染總價
            this.totalPrice.textContent = data.price;
        }
    }

    // 取得刪除按鈕 (因為是動態生成，需在 render 後呼叫)
    getDeleteBtn() {
        return document.getElementById("delete-btn");
    }

    // 取得聯絡人表單資料
    getContactInput() {
        return {
            name: this.contactNameInput.value,
            email: this.contactEmailInput.value,
            phone: this.contactMobileInput.value
        };
    }

    // 設定手機號碼輸入限制 (只能輸入數字)
    setupMobileValidation() {
        this.contactMobileInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // 檢查表單有效性 (HTML5 驗證)
    validateForm() {
        return this.contactForm.reportValidity();
    }
}