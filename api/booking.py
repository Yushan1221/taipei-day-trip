from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from typing import Literal
from datetime import date
import json
# module
from scripts import sql_connector, auth

router = APIRouter(prefix="/booking")

#region BaseModel
class BookingAttraction(BaseModel):
    id: int
    name: str
    address: str
    image: str

class Booking(BaseModel):
    attraction: BookingAttraction
    date: date
    time: Literal["morning", "afternoon"] # 只能是 morning, afternoon
    price: int = Field(..., gt=0) # 大於0

class BookingInput(BaseModel):
    attractionId: int = Field(..., gt=0)
    date: date
    time: Literal["morning", "afternoon"]
    price: int = Field(..., gt=0)

#endregion

# 抓取 request header 中的 Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/auth", auto_error=False)

# 取得尚未下單的預定行程
@router.get("/", response_model=dict[str, Booking | None])
def get_booking_data(token: str | None = Depends(oauth2_scheme)):
    # 驗證登入
    user_data = auth.get_user_data(token)
    if not user_data:
        raise HTTPException(
            status_code=403,
            detail="未登入系統，拒絕存取。"
        )
    
    sql = "SELECT b.booking_date AS date, b.booking_time AS time, b.price, " \
            "a.id, a.name, a.address, a.images " \
            "FROM bookings AS b " \
            "LEFT JOIN attractions AS a ON b.attraction_id = a.id " \
            "WHERE b.member_id = %s AND b.status = 1;"
    conn = None
    try:
        conn = sql_connector.get_connection()
        with conn.cursor(dictionary=True) as cursor:
            cursor.execute(sql, (user_data["id"], ))
            booking_data = cursor.fetchone()
        if not booking_data: # 未找到任何有效預定行程
            return {
                "data": None
            }
        img_list = json.loads(booking_data["images"]) # json 先轉回 list
        return {
            "data": {
                "attraction": {
                    "id": booking_data["id"],
                    "name": booking_data["name"],
                    "address": booking_data["address"],
                    "image": img_list[0]
                },
                "date": str(booking_data["date"]),
                "time": booking_data["time"],
                "price": booking_data["price"]
            }
        }
    except Exception as e:
        print("[取得預定行程]錯誤：", e)
        raise HTTPException(
            status_code=500,
            detail="資料庫系統[取得預定行程]錯誤"
        )
    finally:
        if conn and conn.is_connected():
            conn.close()
        
# 建立新的預定行程
@router.post("/")
def create_booking_data(
        booking: BookingInput, # 沒有預設值的要放前面
        token: str | None = Depends(oauth2_scheme)):
    # 驗證登入
    user_data = auth.get_user_data(token)
    if not user_data:
        raise HTTPException(
            status_code=403,
            detail="未登入系統，拒絕存取。"
        )

    # 日期檢查
    if booking.date < date.today():
        raise HTTPException(status_code=400, detail="預約日期不能是過去的時間")
    
    conn = None
    try:
        conn = sql_connector.get_connection()
        with conn.cursor(dictionary=True) as cursor:
            # 景點id檢查
            cursor.execute("SELECT id FROM attractions WHERE id = %s", (booking.attractionId, ))
            if not cursor.fetchone():
                raise HTTPException(status_code=400, detail="找不到該景點")
            # 開始新增資料
            # 若之前已有預定行程，先將 status 設為 0 (已覆蓋)
            sql1 = "UPDATE bookings SET status = 0 WHERE member_id = %s AND status = 1;"
            sql2 = "INSERT INTO bookings (member_id, attraction_id, booking_date, booking_time, price, status) " \
                    "VALUES (%s, %s, %s, %s, %s, 1);"
            cursor.execute(sql1, (user_data["id"], ))
            cursor.execute(sql2, (user_data["id"], booking.attractionId, booking.date, booking.time, booking.price))
            conn.commit()
            return {
                "ok": True
            }
    except HTTPException as e: 
        raise e
    except Exception as e:
        if conn:
            conn.rollback() # 萬一失敗，把剛才改的一半的東西撤銷
        print("[新增預定行程]錯誤：", e)
        raise HTTPException(
            status_code=500,
            detail="資料庫系統[新增預定行程]錯誤"
        )
    finally:
        if conn and conn.is_connected():
            conn.close()

# 刪除目前的預定行程
@router.delete("/")
def delete_current_booking(token: str | None = Depends(oauth2_scheme)):
    # 驗證登入
    user_data = auth.get_user_data(token)
    if not user_data:
        raise HTTPException(
            status_code=403,
            detail="未登入系統，拒絕存取。"
        )
    
    # 將目前的預定行程改為已取消(status = 0)
    sql = "UPDATE bookings SET status = 0 WHERE member_id = %s AND status = 1;"
    conn = None
    try:
        conn = sql_connector.get_connection()
        with conn.cursor(dictionary=True) as cursor:
            cursor.execute(sql, (user_data["id"], ))
            conn.commit()
            return { "ok": True }
    except Exception as e:
        print("[刪除預定行程]錯誤：", e)
        raise HTTPException(
            status_code=500,
            detail="資料庫系統[刪除預定行程]錯誤"
        )
    finally:
        if conn and conn.is_connected():
            conn.close()