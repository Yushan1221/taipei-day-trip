export class IndexView {
    constructor() {
        this.attrContainer = document.getElementById("attraction-block"); // 景點容器
        this.selector = document.querySelector(".selector"); // 分類鍵
        this.categoryContainer = document.querySelector(".category-block"); // 分類列表容器
        this.categoryNow = document.querySelector("#category-now"); // 當前分類標籤
        this.searchTextbox = document.getElementById("attraction-textbox"); // 關鍵字輸入框
        this.searchBtn = document.getElementById("search-btn"); // 搜尋鍵
        this.mrtBar = document.getElementById("mrt-bar"); // 捷運區塊
        this.mrtContainer = document.querySelector(".mrt-list"); // 捷運列表容器
        this.mrtLeftBtn = document.getElementById("left-btn"); // 捷運列表向左按鈕
        this.mrtRightBtn = document.getElementById("right-btn"); // 捷運列表向右按鈕
    }

    get searchInput() {
        return {
            keyword: this.searchTextbox.value.trim(),
            category: this.categoryNow.textContent === "全部分類" ? "" : this.categoryNow.textContent
        };
    }

    set keyword(text) {
        this.searchTextbox.value = text;
    }

    set category(text) {
        this.categoryNow.textContent = text;
    }

    // 渲染景點(一頁)
    renderAttractions(attractions) {
        // 如果為空值，渲染"無景點資料"
        if (!attractions || attractions.length === 0) {
            if (this.attrContainer.innerHTML === "") {
                this.attrContainer.innerHTML = '<div class="lg-12 font-body none-attraction">目前無景點資料</div>';
            }
            return;
        }

        // 有值，對每個景點渲染成 card，繼續放入景點容器
        const html = attractions.map(attr => this._createCardHtml(attr)).join("");
        this.attrContainer.insertAdjacentHTML("beforeend", html);
    }

    // 清空畫面(搜尋用)
    clearAttractions() {
        this.attrContainer.innerHTML = "";
    }

    // 渲染 MRT 列表
    renderMrts(mrts) {
        if (!mrts || mrts.length === "") {
            this.mrtBar.style.display = "none";
            return;
        }

        this.mrtBar.style.display = "flex";
        const html = mrts.map(mrt => `<div class="mrt-list__item font-body">${mrt}</div>`).join("");
        this.mrtContainer.innerHTML = html;
    }

    // 渲染分類列表
    renderCategories(categories) {
        const list = ["全部分類", ...categories];
        const html = list.map(cat => `<div class="category-block__item">${cat}</div>`).join("");
        this.categoryContainer.innerHTML = html;
    }

    // 切換分類選單顯示
    toggleCategoryMenu() {
        this.categoryContainer.classList.toggle("active");
    }

    // 產生單張卡片 HTML
    _createCardHtml(attr) {
        const mrt = attr.mrt ? attr.mrt : "無";
        
        return `
            <div class="attraction-block__card lg-3 md-4 sm-12">
                <a href="/attraction/${attr.id}">
                    <div class="card-img" style="background-image: url('${attr.images[0]}')">
                        <div class="card-title font-body bold">${attr.name}</div>
                    </div>
                    <div class="card-detail font-body">
                        <div>${mrt}</div>
                        <div>${attr.category}</div>
                    </div>
                </a>
            </div>
        `;
    }
}