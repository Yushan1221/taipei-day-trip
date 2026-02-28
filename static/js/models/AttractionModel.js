export class AttractionModel {
    // 取得景點資料
    async getAttraction(id) {
        try {
            const response = await fetch(`/api/attraction/${id}`, { method: "GET" });
            
            // 404 錯誤處理交給 Controller 判斷，這裡回傳完整 response 或 status
            if (response.status === 404) {
                return { error: 404 };
            }
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const data = await response.json();
            return data.data;
        } catch (err) {
            console.error("景點資料載入錯誤：", err);
            return null;
        }
    }

    // 發送預定請求
    async createBooking(bookingData) {
        try {
            const token = localStorage.getItem("jwt_token");
            const response = await fetch("/api/booking", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });

            const data = await response.json();
            
            // 回傳狀態碼與資料，讓 Controller 決定下一步
            return {
                status: response.status,
                ok: response.ok,
                message: data.message
            };
        } catch (err) {
            console.error("新增預約行程錯誤：", err);
            return { ok: false, error: err };
        }
    }
}