export class OrderModel {
    // 根據訂單編號取得資訊
    async getOrder(orderNumber) {
        try {
            const token = localStorage.getItem("jwt_token");
            const response = await fetch(`/api/order/${orderNumber}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            // 處理特殊狀態碼，回傳給 Controller 判斷
            if (response.status === 403) {
                return { error: 403 };
            }
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const data = await response.json();
            return data.data; // 回傳訂單資料物件

        } catch (err) {
            console.error("訂單資料載入錯誤：", err);
            return null;
        }
    }
}