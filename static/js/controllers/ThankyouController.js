import { OrderModel } from "../models/OrderModel.js";
import { ThankyouView } from "../views/ThankyouView.js";
import { getUserInfo } from "../auth.js";
import { showErrorMessage, showLoading, hideLoading } from "../utils.js";

export class ThankyouController {
    constructor() {
        this.model = new OrderModel();
        this.view = new ThankyouView();
    }

    async init() {
        showLoading();

        // 檢查登入狀態
        const user = await getUserInfo();
        if (!user || user.data === null) {
            window.location.href = "/";
            return;
        }

        // 從網址取得訂單編號
        const urlParams = new URLSearchParams(window.location.search);
        const orderNumber = urlParams.get('number');

        // 如果網址沒有 number 参数，視為錯誤或直接顯示無資料
        if (!orderNumber) {
            this.view.showNoOrder();
            hideLoading();
            return;
        }

        // 呼叫 Model 取得訂單資料
        const result = await this.model.getOrder(orderNumber);

        // 錯誤處理
        if (result && result.error === 403) {
            showErrorMessage("未登入系統，請登入後再試。");
            hideLoading();
            return;
        }

        if (!result) {
            // API 錯誤或回傳 null
            showErrorMessage("訂單資料載入錯誤，請稍後再試。");
            hideLoading();
            return;
        }

        // 渲染 View
        this.view.setOrderNumber(result.number);
        this.view.renderOrderInfo(result);

        hideLoading();
    }
}