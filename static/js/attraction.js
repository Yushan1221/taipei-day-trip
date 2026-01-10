import { initAuth, getUserInfo, openLoginDialog } from "./auth.js";
import { showErrorMessage, showLoading, hideLoading } from "./utils.js";

let currentImgIndex = 0; // 目前圖片索引
const imgPreloadArr = []; // 預載入圖片暫存區

// 載入頁面時 fetch 資料
window.addEventListener("DOMContentLoaded", async () => {
    // 驗證登入，渲染導覽列
    initAuth();

    setInputField();

    // 抓路徑參數，去頭去尾"/"，避免有網址的最後有"/"
    const urlParts = window.location.pathname.replace(/^\/|\/$/g, '').split('/');
    const id = urlParts[urlParts.length - 1]; // === "attraction" ? "" : urlParts[urlParts.length - 1]

    if (id) {
        try {
            // fetch api
            const response = await fetch(`/api/attraction/${id}`, {method: "GET"});
            // 錯誤處理
            if (response.status === 404) {
                showErrorMessage("查無景點資訊，將返回首頁");
                return;
            }
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            // 產生景點頁面資料，並進行圖片預處理
            const data = await response.json();
            const attrInfo = data.data;
            renderAttractionUI(attrInfo);
            imgPreload(attrInfo.images);

            // 下訂按鈕
            addBookingEvent(id);  
        }
        catch (err) {
            console.error("景點資料載入錯誤：", err);
            showErrorMessage("景點資料載入錯誤，請稍後再試");
        }
    }
});


// 建立景點資訊
function renderAttractionUI(attr) {
    // 顯示第一張圖片
    renderBeforeFirstImage(attr.images[0]);

    // 建立圖片指示條
    const imageBar = document.getElementById("indicator-bar");
    let barsHTML = ['<div class="indicator-bar_item active"></div>']; // 第一個預設 active
    for (let i=1; i<attr.images.length; i++) {
        barsHTML.push('<div class="indicator-bar_item"></div>');
    }
    imageBar.innerHTML = barsHTML.join("");

    // 左右按鈕切換圖片
    changeImage(attr.images);
    
    // 景點名稱跟分類
    const attrName = document.getElementById("attr-name");
    const attrCategory = document.getElementById("attr-category");
    const attrMrt = document.getElementById("attr-mrt");
    attrName.textContent = attr.name;
    attrCategory.textContent = attr.category;
    attrMrt.textContent = attr.mrt ? attr.mrt : "無";

    // 景點詳述
    const attrDescription = document.getElementById("attr-description");
    const attrAddress = document.getElementById("attr-address");
    const attrTransport = document.getElementById("attr-transport");
    attrDescription.textContent = attr.description;
    attrAddress.textContent = attr.address;
    attrTransport.textContent = attr.transport;
}

// 顯示第一張圖片前的載入動畫
function renderBeforeFirstImage(ImageUrl) {
    const spinner = document.getElementById("loading-spinner");
    const imgSection = document.getElementById("img-section");

    // 顯示載入動畫
    spinner.classList.remove("hidden");

    const firstImg = new Image();
    firstImg.src = ImageUrl;

    // 圖片載入完成後顯示
    firstImg.onload = () => {
        imgSection.style.backgroundImage = `url(${ImageUrl})`;
        spinner.classList.add("hidden");
    }

}


// 圖片切換功能
function changeImage(Images) {
    const currentImg = document.getElementById("img-section");
    const imageBars = document.querySelectorAll(".indicator-bar_item");
    const leftBtn = document.getElementById("img-left-btn");
    const rightBtn = document.getElementById("img-right-btn");

    // 依照新的 index 更新圖片跟指示條
    const updateImage = (newIndex) => {
        // 移除bar的active
        imageBars[currentImgIndex].classList.remove("active");
        // 更改目前 index
        currentImgIndex = newIndex;
        // 更改圖片及增加 bar active
        currentImg.style.backgroundImage = `url(${Images[currentImgIndex]})`;
        imageBars[currentImgIndex].classList.add("active");
    }

    // 右按鈕
    rightBtn.addEventListener('click', () => {
        // 紀錄下張圖的 index
        let next = currentImgIndex == Images.length-1 ? 0 : currentImgIndex + 1;
        updateImage(next);
    });

    // 左按鈕
    leftBtn.addEventListener('click', () => {
        // 紀錄下張圖的 index
        let next = currentImgIndex == 0 ? Images.length-1 : currentImgIndex - 1;
        updateImage(next);
    });
}

// 圖片預載入
function imgPreload (Images) {
    // 延遲一秒再載入其他圖片，不會搶到頁面載入的頻寬
    setTimeout(() => {
        for (let url of Images) {
            const img = new Image();
            img.onload = () => console.log(`圖片已暫存：${url}`);
            img.src = `${url}`;
            imgPreloadArr.push(img);
        }
    }, 1000);
}


// input 欄位設置
function setInputField() {
    // 依照選項更改價格
    const tripTime = document.querySelectorAll('input[name="trip-time"]');
    const tripPrice = document.getElementById('trip-price');
    tripTime.forEach((radio) => {
        radio.addEventListener("change", (e) => {
            tripPrice.textContent = e.target.value;
        });
    });

    // 日期只能選當天之後
    const tripDate = document.getElementById("trip-date");
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    tripDate.min = `${yyyy}-${mm}-${dd}`;

}


function addBookingEvent(id) {
    document.getElementById("booking-btn").addEventListener("click", async ()=> {
        // fetch 開始先 loading
        showLoading();

        // 檢查登入狀態
        const userInfo = await getUserInfo();
        if (!userInfo || userInfo.data === null) {
            openLoginDialog();
            hideLoading();
            return;
        }

        // 檢查日期必填
        const tripDate = document.getElementById("trip-date");
        const dateAlert = document.getElementById("date-alert");
        if (!tripDate.value) {
            dateAlert.style.display = "block";
            hideLoading();
            return;
        }
        else {
            dateAlert.style.display = "none";
        }

        // fetch 新增行程 API
        const tripTime = document.querySelector('input[name="trip-time"]:checked');
        const tripPrice = Number(tripTime.value);
        try {
            const response = await fetch("/api/booking", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("jwt_token")}`
                },
                body: JSON.stringify({ 
                    "attractionId": Number(id),
                    "date": tripDate.value,
                    "time": tripTime.id,
                    "price": tripPrice
                })
            });
            const data = await response.json();

            if (response.status === 403) {
                openLoginDialog();
                return;
            }
            if (response.status === 400) {
                alert(data.message);
                return;
            }
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            // 預約成功，導到 booking 頁面
            window.location.href = "/booking";
        }
        catch {
            console.error("新增預約行程錯誤：", err);
            showErrorMessage("新增預約行程錯誤，請稍後再試");
        }
        finally {
            hideLoading();
        }
    });
}
