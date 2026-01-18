import httpx
import os
from dotenv import load_dotenv

load_dotenv()

# TapPay 設定
TAPPAY_URL = "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime"
PARTNER_KEY = os.getenv("TAPPAY_PARTNER_KEY")
MERCHANT_ID = os.getenv("TAPPAY_MERCHANT_ID")

# 串接 TapPay API
async def post_tappay_api(prime, price, contact):
    # 設定請求標頭
    headers = {
        "Content-Type": "application/json",
        "x-api-key": PARTNER_KEY
    }

    # 設定請求主體
    payload = {
        "prime": prime,
        "partner_key": PARTNER_KEY,
        "merchant_id": MERCHANT_ID,
        "details": "Taipei Day Trip Order",
        "amount": price,
        "cardholder": {
            "phone_number": contact.phone,
            "name": contact.name,
            "email": contact.email
        },
        "remember": True
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                TAPPAY_URL, 
                json=payload, 
                headers=headers, 
                timeout=30.0
            )
            
            # 檢查 HTTP 狀態碼
            response.raise_for_status()
            
            return response.json()

    except httpx.ConnectError:
        return {"status": 1, "msg": "無法連線至 TapPay 伺服器"}
    except httpx.HTTPStatusError as e:
        return {"status": 1, "msg": f"TapPay API 回傳錯誤: {e.response.status_code}"}
    except Exception as e:
        return {"status": 1, "msg": f"發生未知錯誤: {str(e)}"}