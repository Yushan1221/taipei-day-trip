import { BookingModel } from "../models/BookingModel.js";
import { BookingView } from "../views/BookingView.js";
import { getUserInfo } from "../auth.js";
import { showErrorMessage, confirmDelete, showLoading, hideLoading } from "../utils.js";
import { getPrime } from "../payment.js";

export class BookingController {
    constructor() {
        this.model = new BookingModel();
        this.view = new BookingView();
        
        // 暫存預定資料 (給建立訂單用)
        this.bookingData = null;
    }

    async init() {
        showLoading();

        // 檢查登入
        const user = await getUserInfo();
        if (!user || user.data === null) {
            window.location.href = "/";
            return;
        }

        // 渲染基本資訊
        this.view.renderUserInfo(user);
        this.view.setupMobileValidation();

        const result = await this.model.getBooking();
        
        if (result && result.error === 403) {
            showErrorMessage("未登入系統，請登入後再試。");
            window.location.href = "/";
            return;
        }

        // 渲染 booking UI
        this.bookingData = result; // 存起來，等一下付款要用
        this.view.renderBookingUI(this.bookingData);

        // 如果有行程，才綁定刪除按鈕與付款事件
        if (this.bookingData) {
            this.setupDeleteEvent();
            this.setupPaymentEvent();
        }

        hideLoading();
    }

    // 綁定刪除按鈕事件
    setupDeleteEvent() {
        const deleteBtn = this.view.getDeleteBtn();
        if (deleteBtn) {
            deleteBtn.addEventListener("click", async () => {
                const ok = await confirmDelete("確定要刪除預定行程嗎？");
                if (!ok) return;

                await this.handleDelete();
            });
        }
    }

    // 綁定付款表單事件
    setupPaymentEvent() {
        this.view.contactForm.addEventListener("submit", (e) => this.handlePayment(e));
    }

    // 處理刪除邏輯
    async handleDelete() {
        showLoading();
        const result = await this.model.deleteBooking();
        hideLoading();

        if (result.ok) {
            location.reload();
        } else {
            showErrorMessage("刪除預定行程發生錯誤，請稍後再試。");
        }
    }

    // 處理付款邏輯
    async handlePayment(e) {
        e.preventDefault(); // 阻止表單預設提交

        // 表單驗證
        if (!this.view.validateForm()) return;

        showLoading();

        try {
            // 取得 Prime
            const prime = await getPrime();
            if (!prime) {
                hideLoading();
                showErrorMessage("付款資訊驗證失敗，請檢查信用卡資訊。");
                return;
            }

            // 準備訂單資料
            const contactData = this.view.getContactInput();
            const orderPayload = {
                prime: prime,
                order: {
                    price: this.bookingData.price,
                    trip: {
                        attraction: this.bookingData.attraction,
                        date: this.bookingData.date,
                        time: this.bookingData.time
                    },
                    contact: contactData
                }
            };

            // 送出訂單
            const result = await this.model.createOrder(orderPayload);

            if (result.ok) {
                // 成功，轉址
                window.location.href = `/thankyou?number=${result.data.number}`;
            } else if (result.status === 400) {
                showErrorMessage(result.message || "訂單建立失敗，請檢查資訊。");
            } else if (result.status === 403) {
                showErrorMessage("未登入系統，請登入後再試。");
            } else {
                throw new Error("API Error");
            }

        } catch (err) {
            console.error(err);
            showErrorMessage("訂購與付款預定行程發生錯誤，請稍後再試。");
        } finally {
            hideLoading();
        }
    }
}