export class BookingModel {
    constructor() {
        this.token = localStorage.getItem("jwt_token");
    }

    // 取得預定行程
    async getBooking() {
        try {
            const response = await fetch("/api/booking", {
                method: "GET",
                headers: { "Authorization": `Bearer ${this.token}` }
            });

            // 回傳物件讓 Controller 判斷狀態
            if (response.status === 403) return { error: 403 };
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

            const data = await response.json();
            return data.data; // 可能回傳 null 或 booking 物件
        } catch (err) {
            console.error("預定行程資料載入錯誤：", err);
            return { error: "network" };
        }
    }

    // 刪除預定
    async deleteBooking() {
        try {
            const response = await fetch("/api/booking", {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${this.token}` }
            });

            if (response.status === 403) return { error: 403 };
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            
            return { ok: true };
        } catch (err) {
            console.error("刪除預定行程資料錯誤：", err);
            return { ok: false };
        }
    }

    // 建立訂單 (送出 Prime 與訂單資訊)
    async createOrder(orderData) {
        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.token}`
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            // 這裡回傳完整資訊，因為 Controller 需要 error message 或 order number
            return {
                status: response.status,
                ok: response.ok,
                data: data.data,
                message: data.message
            };
        } catch (err) {
            console.error("訂購與付款預定行程發生錯誤：", err);
            return { ok: false };
        }
    }
}