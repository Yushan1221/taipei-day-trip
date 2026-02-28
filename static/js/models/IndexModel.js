export class IndexModel {
    constructor() {
        this.nextPage = 0;
        this.isloading = false;
    }

    // 取得景點列表
    async getAttractions(page, keyword = "", category = "") {
        // 沒有下一頁或正在載入中，則不進行載入
        if(this.nextPage === null || this.isloading) return; 

        this.isloading = true; // 標記為正在載入中

        try {
            // 如果是"全部分類"就直接輸入空字串
            const safeCategory = category === "全部分類" ? "" : category;

            const url = `/api/attractions?page=${page}&category=${category}&keyword=${keyword}`;
            const res = await fetch(url, { method: "GET" });
            
            if(!res.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            const data = await res.json();

            this.nextPage = data.nextPage;

            return data.data; // 回傳純陣列
        }
        catch (err) {
            console.error("載入景點資料出錯:", err);
            return [];
        }
        finally {
            this.isloading = false;
        }
    }

    async getMrts() {
        try {
            const res = await fetch("/api/mrts", { method: "GET" });

            if(!res.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const data = await res.json();

            return data.data;
        }
        catch (err) {
            console.error("載入捷運站出錯:", err);
            return [];
        }
    }

    async getCategories() {
        try {
            const res = await fetch("/api/categories", { method: "GET" });

            if(!res.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const data = await res.json();

            return data.data;
        }
        catch (err) {
            console.error("載入捷運站出錯:", err);
            return [];
        }
    }

    // 重製狀態
    resetState() {
        this.nextPage = 0;
        this.isLoading = false;
    }
}