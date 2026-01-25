import { IndexView } from "../views/IndexView.js";
import { IndexModel} from "../models/IndexModel.js";
import { showLoading, hideLoading } from "../utils.js";

export class IndexController {
    constructor() {
        this.model = new IndexModel();
        this.view = new IndexView();
    }

    async init() {
        // 載入初始 MRT 列表
        const mrts = await this.model.getMrts();
        this.view.renderMrts(mrts);

        // 載入初始景點
        await this.loadMoreAttractions();

        // 綁定所有事件
        this.setupEventListeners();
        this.setupInfiniteScroll();
    }

    async loadMoreAttractions() {
        showLoading();

        // 從 View 拿目前的搜尋條件
        const { keyword, category } = this.view.searchInput;
        
        // 跟 Model 要資料
        const data = await this.model.getAttractions(this.model.nextPage, keyword, category);
        
        // 叫 View 畫出來
        if (data) {
            this.view.renderAttractions(data);
        }

        hideLoading();
    }

    async handleSearch() {
        // 重置 Model 狀態 (頁數歸零)
        this.model.resetState();
        // 清空 View 畫面
        this.view.clearAttractions();
        // 重新載入
        await this.loadMoreAttractions();
    }

    setupEventListeners() {
        // 搜尋按鈕
        this.view.searchBtn.addEventListener("click", () => this.handleSearch());

        // mrt 列表點擊
        this.view.mrtContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("mrt-list__item")) {
                this.view.keyword = e.target.textContent; // 填入輸入框
                this.handleSearch(); // 觸發搜尋
            }
        });

        // mrt 左右捲動按鈕
        this.view.mrtLeftBtn.addEventListener("click", () => {
            this.view.mrtContainer.scrollBy({ left: -300, behavior: 'smooth' });
        });
        this.view.mrtRightBtn.addEventListener("click", () => {
            this.view.mrtContainer.scrollBy({ left: 300, behavior: 'smooth' });
        });

        // 分類選單開啟
        this.view.selector.addEventListener("click", async () => {
            // 如果還沒載入過分類，才去 fetch
            if (this.view.categoryContainer.children.length === 0) {
                const categories = await this.model.getCategories();
                this.view.renderCategories(categories);
            }
            // 打開選單
            this.view.toggleCategoryMenu();
        });

        // 分類項目點擊
        
        this.view.categoryContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("category-block__item")) {
                this.view.category = e.target.textContent;
            }
        });
        
        // 點擊其他地方關閉分類選單
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".selector") && !e.target.closest(".category-block")) {
                this.view.categoryContainer.classList.remove("active");
            }
        });
    }

    // 無限滾動
    setupInfiniteScroll() {
        const observer = new IntersectionObserver((entries) => {
        // 如果看到 footer 且 Model 說還有下一頁
        if (entries[0].isIntersecting && this.model.nextPage !== null) {
            this.loadMoreAttractions();
        }
        }, { rootMargin: "100px", threshold: 0.1 });

        const footer = document.querySelector(".footer");
        observer.observe(footer);
    }
}