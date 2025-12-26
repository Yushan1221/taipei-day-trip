let nextPage = 0; // 初始載入第0頁
let isloading = false; // 紀錄是否正在載入
let category = ""; // 初始分類
let keyword = ""; // 初始關鍵字

// 載入景點資料
function loadAttractions() {
    if(nextPage === null || isloading) return; // 沒有下一頁或正在載入中，則不進行載入

    isloading = true; // 標記為正在載入中

    fetch(`/api/attractions?page=${nextPage}&category=${category}&keyword=${keyword}`,{ method: "GET" })
    .then((res) => res.json())
    .then((res) => {
        const attrBlock = document.getElementById("attraction-block");
        // 依照回傳值 data 顯示不同資訊
        if(res["data"]) {
            const data = res["data"];
            // 建立多個 card 元素並加入到 attrBlock 中
            const cardsHtml = data.map(attr => createCardElement(attr)).join("");
            attrBlock.insertAdjacentHTML("beforeend", cardsHtml); // beforeend 在指定元素裡的子元素結尾插入
            
            // 更新 nextPage
            nextPage = res.nextPage;
        }
        else if (nextPage === 0) { // 沒有任何資料且是第一頁
            attrBlock.insertAdjacentHTML("beforeend", '<div class="lg-12">目前無景點資料</div>');
            nextPage = null;
        }
        
    })
    .catch((err) => {
        console.error("載入資料出錯:", err);
    })
    .finally(() => {
        isloading = false;
    })
}

// 建立 card html 結構
function createCardElement(attr) {
    const mrt = attr.mrt ? attr.mrt : "無";
    
    return `
        <div class="attraction-block__card lg-3 md-4 sm-12">
            <div class="card-img" style="background-image: url('${attr.images[0]}')">
                <div class="card-title font-body bold">${attr.name}</div>
            </div>
            <div class="card-detail font-body">
                <div>${mrt}</div>
                <div>${attr.category}</div>
            </div>
        </div>
    `;

}

// 分類列表點擊事件
const selector = document.querySelector(".selector");
selector.addEventListener("click", () => {  
    const categoryBlock = document.querySelector(".category-block");
    fetch("/api/categories", { method: "GET" })
    .then((res) => res.json())
    .then((res) => {
        let cat_list = ["全部分類"];
        cat_list = cat_list.concat(res["data"]);
        const categoryItemsHtml = cat_list.map(cat => `<div class="category-block__item">${cat}</div>`).join("");
        categoryBlock.innerHTML = categoryItemsHtml; // 更新分類列表內容

        // 為每個分類項目添加點擊事件
        const categoryItems = document.querySelectorAll(".category-block__item");
        categoryItems.forEach(item => {
            item.addEventListener("click", () => {
                const selectedCategory = item.textContent;
                const catgoryNow = document.querySelector("#category-now");
                catgoryNow.textContent = selectedCategory; // 更新目前分類顯示
            });
        });
    })
    .catch((err) => {
        console.error("載入分類出錯:", err);
    });
    categoryBlock.classList.toggle("active");
});


// 用關鍵字搜尋景點
function searchAttractions() {
    const catgoryNow = document.querySelector("#category-now");
    const keywordTextbox = document.getElementById("attraction-textbox");

    // 設定搜尋參數
    category = catgoryNow.textContent === "全部分類" ? "" : catgoryNow.textContent; // 如果是"全部分類"就直接不用輸入參數
    keyword = keywordTextbox.value.trim(); // 取得輸入框關鍵字
    nextPage = 0; // 重設頁數

    // 清空現有景點資料
    const attrBlock = document.getElementById("attraction-block");
    attrBlock.innerHTML = "";

    // 用現有參數重新載入景點資料
    loadAttractions();
}


// 搜尋按鈕點擊事件
const searchBtn = document.getElementById("search-btn");
searchBtn.addEventListener("click", () => {
    // 執行搜尋
    searchAttractions();
});


// mrt 列表初始化
async function initMrtList() {
    fetch("/api/mrts", { method: "GET" })
    .then((res) => res.json())
    .then((res) => {
        const mrtList = document.querySelector(".mrt-list");
        const mrtItemsHtml = res["data"].map(mrt => `<div class="mrt-list__item font-body">${mrt}</div>`).join("");
        mrtList.innerHTML = mrtItemsHtml;

        // 為每個捷運站項目添加點擊事件
        const mrtItems = document.querySelectorAll(".mrt-list__item");
        mrtItems.forEach(item => {
            item.addEventListener("click", () => {
                const keywordTextbox = document.getElementById("attraction-textbox");
                keywordTextbox.value = item.textContent; // 將捷運站名稱設為關鍵字
                searchAttractions(); // 執行搜尋
            });
        });
    })
    .catch((err) => {
        console.error("載入捷運站出錯:", err);
    });
}

// 左右箭頭滾動 mrt 列表
const mrtList= document.querySelector(".mrt-list");
const mrtLeftBtn = document.getElementById("left-btn");
const mrtRightBtn = document.getElementById("right-btn");
mrtLeftBtn.addEventListener("click", () => {
    mrtList.scrollBy({ left: -300, behavior: 'smooth' });
});
mrtRightBtn.addEventListener("click", () => {
    mrtList.scrollBy({ left: 300,  behavior: 'smooth' });
});



// 監測視窗的條件設置
const observerOptions = {
    root: null, // 預設以瀏覽器視窗為準
    rootMargin: "50px", // 提前50px觸發
    threshold: 0.1 // 當目標出現 10% 時觸發
};
// 建立 Intersection Observer 來監測視窗滾動底部
const observer = new IntersectionObserver((entries) => {
    if(entries[0].isIntersecting) {
        loadAttractions();
    } 
}, observerOptions);
const footer = document.querySelector(".footer"); 
observer.observe(footer); // 監測 footer 元素


// 初始載入第一頁資料
loadAttractions();
initMrtList();