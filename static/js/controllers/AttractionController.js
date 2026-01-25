import { AttractionModel } from "../models/AttractionModel.js";
import { AttractionView } from "../views/AttractionView.js";
import { getUserInfo, openLoginDialog } from "../auth.js";
import { showErrorMessage, showLoading, hideLoading } from "../utils.js";

export class AttractionController {
    constructor() {
        this.model = new AttractionModel();
        this.view = new AttractionView();
        
        // 狀態管理
        this.attractionId = null;
        this.images = [];
        this.currentImgIndex = 0;
        this.imgPreloadArr = []; // 避免被 Garbage Collection 回收
    }

    async init() {
        this.view.initDateInput();
        
        // 解析網址 ID
        const urlParts = window.location.pathname.replace(/^\/|\/$/g, '').split('/');
        this.attractionId = urlParts[urlParts.length - 1];

        if (!this.attractionId) return;

        const data = await this.model.getAttraction(this.attractionId);

        if (!data) {
            showErrorMessage("景點資料載入錯誤，請稍後再試");
            return;
        }
        if (data.error === 404) {
            showErrorMessage("查無景點資訊，將返回首頁");
            window.location.href = "/";
            return;
        }

        // 儲存狀態並渲染
        this.images = data.images;
        this.view.renderInfo(data);
        this.view.renderIndicators(this.images.length);
        this.view.renderFirstImage(this.images[0]);

        // 綁定事件
        this.setupEventListeners();
        
        // 圖片預載入 (延遲執行)
        this.preloadImages();
    }

    setupEventListeners() {
        // 輪播按鈕
        this.view.leftBtn.addEventListener("click", () => this.handleCarousel(-1));
        this.view.rightBtn.addEventListener("click", () => this.handleCarousel(1));

        // 價格選項改變
        this.view.tripTimeInputs.forEach(radio => {
            radio.addEventListener("change", (e) => {
                this.view.setPrice(e.target.value);
            });
        });

        // 預定按鈕
        this.view.bookingBtn.addEventListener("click", () => this.handleBooking());
    }

    // 處理輪播邏輯
    handleCarousel(direction) {
        const len = this.images.length;
        if (len === 0) return;

        const oldIndex = this.currentImgIndex;
        
        // 計算新 Index (處理循環)
        if (direction === 1) { // 下一張
            this.currentImgIndex = (this.currentImgIndex + 1) % len;
        } else { // 上一張
            this.currentImgIndex = (this.currentImgIndex - 1 + len) % len;
        }

        // 更新 View
        this.view.updateImageDisplay(
            this.images[this.currentImgIndex], 
            this.currentImgIndex, 
            oldIndex
        );
    }

    // 處理預定邏輯
    async handleBooking() {
        showLoading();

        // 檢查登入
        const userInfo = await getUserInfo();
        if (!userInfo || !userInfo.data) {
            hideLoading();
            openLoginDialog();
            return;
        }

        // 獲取並驗證輸入
        const inputData = this.view.getBookingInput();
        if (!inputData.date) {
            hideLoading();
            this.view.toggleDateAlert(true);
            return;
        }
        this.view.toggleDateAlert(false);

        // 呼叫 Model
        const bookingData = {
            attractionId: Number(this.attractionId),
            ...inputData
        };

        const result = await this.model.createBooking(bookingData);

        // 處理結果
        hideLoading(); // 先結束轉圈動畫
        if (result.ok) {
            window.location.href = "/booking";
        } else if (result.status === 403) {
            openLoginDialog();
        } else if (result.message) {
            alert(result.message);
        } else {
            showErrorMessage("新增預約行程錯誤，請稍後再試");
        }
    }

    // 圖片預載入
    preloadImages() {
        setTimeout(() => {
            this.images.forEach(url => {
                const img = new Image();
                img.src = url;
                // img.onload = () => console.log(`Cached: ${url}`);
                this.imgPreloadArr.push(img);
            });
        }, 1000);
    }
}