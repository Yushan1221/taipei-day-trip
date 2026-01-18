from fastapi import APIRouter, HTTPException, Depends, Path
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from typing import Literal
from datetime import date, datetime
import secrets
import json
# module
from scripts import sql_connector, auth, tappay
from .booking import BookingAttraction

router = APIRouter()

#region BaseModel
class Trip(BaseModel):
    attraction: BookingAttraction
    date: date
    time: Literal["morning", "afternoon"]

class Contact(BaseModel):
    name: str = Field(max_length=50)
    email: str
    phone: str = Field(min_length=10, max_length=10)

class Order(BaseModel):
    number: str
    price: int
    trip: Trip
    contact: Contact
    status: Literal[0, 1]

class OrderInput(BaseModel):
    price: int
    trip: Trip
    contact: Contact

class OrderRequest(BaseModel):
    prime: str
    order: OrderInput

class PaymentStatus(BaseModel):
    status: int
    message: str

class OrderResult(BaseModel):
    number: str
    payment: PaymentStatus
#endregion

# 抓取 request header 中的 Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/auth", auto_error=False)

# 建立訂單並完成付款程序
@router.post("/orders", response_model=dict[str, OrderResult])
async def create_order(
    data: OrderRequest,
    token: str | None = Depends(oauth2_scheme)):

    # 驗證登入
    user_data = auth.get_user_data(token)
    if not user_data:
        raise HTTPException(status_code=403, detail="未登入系統，拒絕存取。")
    
    # 取 聯絡資訊、prime
    contact = data.order.contact
    prime = data.prime

    # 生成訂單編號，現在時間 yyyymmddHHMMSS; 加密隨機數字 3 bytes 十六進位表示法=六位數
    order_number = datetime.now().strftime("%Y%m%d%H%M%S") + secrets.token_hex(3)

    conn = sql_connector.get_connection()
    try:
        with conn.cursor(dictionary=True) as cursor:
            # 到 bookings 找對應的訂單
            sql = "SELECT id, price FROM bookings WHERE member_id = %s AND status = 1;"
            cursor.execute(sql, (user_data["id"], ))
            booking = cursor.fetchone()

            if not booking:
                raise HTTPException(status_code=400, detail="無對應的預定行程，請重新預定。")
            
            # 紀錄這筆付款訂單到資料庫
            sql = """
                INSERT INTO orders (order_number, booking_id, member_id, prime, 
                contact_name, contact_email, contact_phone, price, status) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'UNPAID');
            """
            cursor.execute(sql, (
                order_number, booking["id"], user_data["id"], prime, 
                contact.name, contact.email, contact.phone, booking["price"]
            ))

            # 更新 bookings 訂單狀態為已下單
            sql = "UPDATE bookings SET status = 2 WHERE id = %s AND status = 1;"
            cursor.execute(sql, (booking["id"], ))
            conn.commit()

            # 呼叫 TapPay API
            try:
                tappay_res = await tappay.post_tappay_api(prime, booking["price"], contact)
            except Exception as err:
                print(f"TapPay API 連線失敗: {err}")
                return { 
                    "data": OrderResult(
                        number=order_number, 
                        payment=PaymentStatus(
                            status=1, 
                            message="銀行端連線失敗"
                        )
                    ) 
                }
            
            # 處理 tappay_res 並回傳
            final_status = 0 if tappay_res.get("status") == 0 else tappay_res.get("status")
            final_msg = "付款成功" if final_status == 0 else tappay_res.get("msg", "付款失敗")
            payment_record = json.dumps(tappay_res)
            try:
                with conn.cursor() as cursor:
                    if final_status == 0: # 付款成功，更新狀態為PAID
                        sql = """
                            UPDATE orders 
                            SET status = 'PAID', payment_record = %s 
                            WHERE order_number = %s;
                        """
                        cursor.execute(sql, (payment_record, order_number))
                    else: # 付款失敗，把 record 存起來
                        sql = """
                            UPDATE orders 
                            SET payment_record = %s 
                            WHERE order_number = %s;
                        """
                        cursor.execute(sql, (payment_record, order_number))
                    conn.commit()
            except Exception as err:
                print(f"更新訂單付款紀錄失敗: {err}")
            finally:
                # 不管有沒有存進資料庫實際上都有下訂成功了，所以都回傳200
                return {
                    "data": {
                        "number": order_number,
                        "payment": { "status": final_status, "message": final_msg }
                    }
                }

    except HTTPException as e: 
        raise e
    except Exception as e:
        if conn:
            conn.rollback() # 萬一失敗，把剛才改的一半的東西撤銷
        print("[下訂付款程序]錯誤：", e)
        raise HTTPException(
            status_code=500,
            detail="資料庫系統[下訂付款程序]錯誤"
        )
    finally:
        if conn and conn.is_connected():
            conn.close()


@router.get("/order/{number}", response_model=dict[str, Order | None])
def get_order(
    number: str = Path(..., description="20位數十六進制訂單編號", pattern=r"^[0-9a-f]{20}$"),
    token: str | None = Depends(oauth2_scheme)):

    # 驗證登入
    user_data = auth.get_user_data(token)
    if not user_data:
        raise HTTPException(status_code=403, detail="未登入系統，拒絕存取。")
    
    conn = sql_connector.get_connection()
    try:
        with conn.cursor(dictionary=True) as cursor:
            sql = """
                SELECT 
                    o.order_number, 
                    o.price, 
                    o.contact_name, 
                    o.contact_email, 
                    o.contact_phone, 
                    o.status,
                    b.booking_date AS date, 
                    b.booking_time AS time, 
                    a.id AS attraction_id, 
                    a.name AS attraction_name, 
                    a.address AS attraction_address,
                    a.images AS attraction_images
                FROM orders o
                JOIN bookings b ON o.booking_id = b.id
                JOIN attractions a ON b.attraction_id = a.id
                WHERE o.order_number = %s AND o.member_id = %s;
            """
            cursor.execute(sql, (number, user_data["id"]))
            order = cursor.fetchone()

            if not order:
                return {"data": None}
            
            # PAID => 1 UNPAID => 0
            status_code = 1 if order["status"] == "PAID" else 0
            # images json 先轉回 list
            img_list = json.loads(order["attraction_images"]) 

            # 組合成要求的 JSON 格式
            result = {
                "data": {
                    "number": order["order_number"],
                    "price": order["price"],
                    "trip": {
                        "attraction": {
                            "id": order["attraction_id"],
                            "name": order["attraction_name"],
                            "address": order["attraction_address"],
                            "image": img_list[0]
                        },
                        "date": str(order["date"]), # 確保日期轉為字串
                        "time": order["time"]
                    },
                    "contact": {
                        "name": order["contact_name"],
                        "email": order["contact_email"],
                        "phone": order["contact_phone"]
                    },
                    "status": status_code
                }
            }
            return result
    except HTTPException as e: 
        raise e
    except Exception as e:
        print(f"查詢訂單出錯: {e}")
        raise HTTPException(status_code=500, detail="資料庫系統[取得付款訂單]錯誤")
    finally:
        if conn and conn.is_connected():
            conn.close()

    
