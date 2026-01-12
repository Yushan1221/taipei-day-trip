// 錯誤訊息
export function showErrorMessage(message) {
    alert(message);
    window.location.href = "/";
}

// 再次確認
export function confirmDelete(message) {
    return new Promise((resolve) => {
        const isConfirmed = confirm(message);
        resolve(isConfirmed);
    })
}

// 顯示 Loading
export function showLoading() {
    const loader = document.getElementById("loading-overlay");
    if (loader) {
        loader.style.display = "flex";
    }
}

// 隱藏 Loading
export function hideLoading() {
    const loader = document.getElementById("loading-overlay");
    if (loader) {
        loader.style.display = "none";
    }
}