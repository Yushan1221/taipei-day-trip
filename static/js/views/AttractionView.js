export class AttractionView {
    constructor() {
        // 景點資訊相關元素
        this.imgSection = document.getElementById("img-section");
        this.nameEl = document.getElementById("attr-name");
        this.categoryEl = document.getElementById("attr-category");
        this.mrtEl = document.getElementById("attr-mrt");
        this.descEl = document.getElementById("attr-description");
        this.addressEl = document.getElementById("attr-address");
        this.transportEl = document.getElementById("attr-transport");
        
        // 圖片輪播相關
        this.imageBar = document.getElementById("indicator-bar");
        this.leftBtn = document.getElementById("img-left-btn");
        this.rightBtn = document.getElementById("img-right-btn");
        this.spinner = document.getElementById("loading-spinner");

        // 預定表單相關
        this.tripDateInput = document.getElementById("trip-date");
        this.tripTimeInputs = document.querySelectorAll('input[name="trip-time"]');
        this.tripPriceEl = document.getElementById('trip-price');
        this.bookingBtn = document.getElementById("booking-btn");
        this.dateAlert = document.getElementById("date-alert");
    }

    // 初始化日期限制 (只能選今天以後)
    initDateInput() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        this.tripDateInput.min = `${yyyy}-${mm}-${dd}`;
    }

    // 取得使用者輸入的預定資訊
    getBookingInput() {
        const selectedTime = document.querySelector('input[name="trip-time"]:checked');
        return {
            date: this.tripDateInput.value,
            time: selectedTime ? selectedTime.id : null,
            price: Number(selectedTime ? selectedTime.value : 0)
        };
    }

    // 設定價格顯示
    setPrice(price) {
        this.tripPriceEl.textContent = price;
    }

    // 顯示/隱藏日期錯誤提示
    toggleDateAlert(show) {
        this.dateAlert.style.display = show ? "block" : "none";
    }

    // 渲染景點基本文字資訊
    renderInfo(attr) {
        this.nameEl.textContent = attr.name;
        this.categoryEl.textContent = attr.category;
        this.mrtEl.textContent = attr.mrt ? attr.mrt : "無";
        this.descEl.textContent = attr.description;
        this.addressEl.textContent = attr.address;
        this.transportEl.textContent = attr.transport;
    }

    // 渲染指示條 (圓點)
    renderIndicators(count) {
        let html = "";
        for (let i = 0; i < count; i++) {
            // 第一個預設 active
            html += `<div class="indicator-bar_item ${i === 0 ? 'active' : ''}"></div>`;
        }
        this.imageBar.innerHTML = html;
    }

    // 處理第一張圖片載入 (含 Loading 動畫)
    renderFirstImage(imageUrl) {
        this.spinner.classList.remove("hidden");
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            this.imgSection.style.backgroundImage = `url(${imageUrl})`;
            this.spinner.classList.add("hidden");
        };
    }

    // 更新輪播圖片顯示
    updateImageDisplay(imageUrl, newIndex, oldIndex) {
        const bars = document.querySelectorAll(".indicator-bar_item");
        
        // 更改圖片
        this.imgSection.style.backgroundImage = `url(${imageUrl})`;
        
        // 更新 active 狀態
        if(bars[oldIndex]) bars[oldIndex].classList.remove("active");
        if(bars[newIndex]) bars[newIndex].classList.add("active");
    }
}