export class ThankyouView {
    constructor() {
        this.orderNumberEl = document.getElementById("order-number");
        this.container = document.getElementById("booking-container");
        this.nonBookingEl = document.getElementById("non-booking");
    }

    // 設定頁面上的訂單編號
    setOrderNumber(number) {
        // 如果沒有號碼，顯示空字串
        this.orderNumberEl.innerText = number || "";
    }

    // 顯示「查無訂單」區塊
    showNoOrder() {
        this.nonBookingEl.style.display = "block";
    }

    // 渲染訂單詳細卡片
    renderOrderInfo(data) {
        if (!data) {
            this.showNoOrder();
            return;
        }

        this.nonBookingEl.style.display = "none";
        
        const attrInfo = data.trip.attraction;
        const timeText = data.trip.time === "morning" ? "早上 9 點到下午 12 點" : "下午 1 點到下午 4 點";
        
        // 付款狀態樣式邏輯
        const statusText = data.status === 1 ? "已付款" : "未付款"; // 假設 0 是未付, 1 是已付
        const statusColor = data.status === 1 ? "#75ba4d" : "#e55557"; 

        const html = `
            <div class="booking-container font-body margin-box">
                <div class="booking-img"><img src="${attrInfo.image}" alt="景點照片"></div>
                <div class="booking-info bold">
                    <div class="booking-info_title">台北一日遊：${attrInfo.name}</div>
                    <div class="booking-info_label">日期：<span>${data.trip.date}</span></div>
                    <div class="booking-info_label">時間：<span>${timeText}</span></div>
                    <div class="booking-info_label">費用：<span>新台幣 ${data.price} 元</span></div>
                    <div class="booking-info_label">地點：<span>${attrInfo.address}</span></div>
                    <div class="order-status" id="order-status" style="color: ${statusColor}">${statusText}</div>
                </div>
            </div>
        `;
        
        this.container.insertAdjacentHTML("beforeend", html);
    }
}