export class UserModel {
    constructor() {
        this.tokenKey = "jwt_token";
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    removeToken() {
        localStorage.removeItem(this.tokenKey);
    }

    // 取得使用者資料 (維持原本的回傳格式)
    async getUserInfo() {
        const token = this.getToken();
        if (!token) return { data: null };

        try {
            const response = await fetch("/api/user/auth", {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
            return await response.json();
        } catch (err) {
            console.error("取得會員資料錯誤：", err);
            return { data: null };
        }
    }

    // 登入
    async login(email, password) {
        const response = await fetch("/api/user/auth", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        return this._handleResponse(response);
    }

    // 註冊
    async register(name, email, password) {
        const response = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        return this._handleResponse(response);
    }

    // 內部處理 response 的小幫手
    async _handleResponse(response) {
        const result = await response.json();
        return {
            ok: response.ok,
            status: response.status,
            ...result
        };
    }
}