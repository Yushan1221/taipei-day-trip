const APP_ID = 166460;
const APP_KEY = 'app_TJfrYSHq9WgFSlJZimbJ9yd7wZy2kkqSwqoE6fXS5mkC2nuuZ57MBukIyM04';

// 初始化 tappay
TPDirect.setupSDK(APP_ID, APP_KEY, 'sandbox'); // 'sandbox' 測試環境
// 設定欄位
TPDirect.card.setup({
    fields: {
        number: {
            // css selector
            element: '#card-number',
            placeholder: '**** **** **** ****'
        },
        expirationDate: {
            // DOM object
            element: document.getElementById('card-expiration-date'),
            placeholder: 'MM / YY'
        },
        ccv: {
            element: '#card-ccv',
            placeholder: 'CCV'
        }
    },
    styles: {
        // Style all elements
        'input': {
            'font-size': '16px',
            'font-weight': '500',
        },
        // style focus state
        ':focus': {
            'color': 'black',
        },
        // style valid state
        '.valid': {
            'color': 'green'
        },
        // style invalid state
        '.invalid': {
            'color': 'red'
        }
    },
    // 此設定會顯示卡號輸入正確後，會顯示前六後四碼信用卡卡號
    isMaskCreditCardNumber: true,
    maskCreditCardNumberRange: {
        beginIndex: 6,
        endIndex: 11
    }
});

// 依照資訊輸入狀態客製化做法
TPDirect.card.onUpdate(function (update) {
    const submitButton = document.querySelector("#order-btn"); // 下訂鍵
    const orderAlert = document.querySelector("#order-alert"); // 警語

    if (update.canGetPrime) {
        // 檢查必填格式過了，解鎖下訂鍵
        submitButton.removeAttribute('disabled');
        orderAlert.style.display = "none";
    } else {
        // 檢查必填格式不通過，上鎖下訂鍵
        submitButton.setAttribute('disabled', true);
        orderAlert.style.display = "block";
    }
});

export async function getPrime() {

    return new Promise((resolve, reject) => {
        // 取得 TapPay Fields 的 status
        const tappayStatus = TPDirect.card.getTappayFieldsStatus();

        // 確認是否可以 getPrime
        if (tappayStatus.canGetPrime === false) {
            alert('付款欄位有誤，請確認。');
            return resolve(null);
        }

        // Get prime
        TPDirect.card.getPrime((result) => {
            // 取得 prime 失敗
            if (result.status !== 0) {
                alert('付款欄位有誤，請確認。');
                console.error(result.msg);
                return resolve(null);
            }

            const prime = result.card.prime;
            console.log("取得 prime 成功");

            resolve(prime);
        })
    })
}

