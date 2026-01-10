from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
import json
from pydantic import BaseModel, Field
# module
from scripts import sql_connector, auth

router = APIRouter(prefix="/user")

#region BaseModel
class User(BaseModel):
    id: int
    name: str
    email: str

class UserSignUpInput(BaseModel):
    name: str
    email: str
    password: str = Field(..., max_length=50)

class UserSignInInput(BaseModel):
    email: str
    password: str

class Success(BaseModel):
    ok: bool

class Error(BaseModel):
    error: bool
    message: str
#endregion

#region 註冊帳戶 api/user/
@router.post("/", 
             response_model=Success,
             responses={400: {"model": Error}, 500: {"model": Error}})
def sign_up(user: UserSignUpInput):
    sql = "SELECT email FROM members WHERE email = %s;"
    conn = None
    try:
        # 連線資料庫
        conn = sql_connector.get_connection()
        with conn.cursor() as cursor:
            cursor.execute(sql, (user.email.lower(), )) # 用小寫判斷
            email_exists = cursor.fetchone()

            # 判斷信箱是否存在
            if email_exists: # 信箱重複，不能註冊
                raise HTTPException(
                    status_code=400,
                    detail="此電子郵件信箱已被註冊，請使用其他信箱。"
                )
            else: # 信箱沒有重複，可以註冊
                sql = "INSERT INTO members(name, email, password) VALUES(%s, %s, %s);"
                hashed_password = auth.get_password_hash(user.password) # hash 加密
                cursor.execute(sql, (user.name, user.email.lower(), hashed_password))
                conn.commit()
                return {
                    "ok": True
                }
    # 攔截 HTTPException，避免導到下面的通用錯誤
    except HTTPException as e: 
        raise e
    except Exception as e:
        print("[註冊會員]錯誤：", e)
        raise HTTPException(
            status_code=500,
            detail="資料庫系統[新增會員]錯誤"
        )
    finally:
        if conn and conn.is_connected():
            conn.close()
#endregion

#region 登入帳戶 api/user/auth
@router.put("/auth")
def sign_in(user: UserSignInInput):
    sql = "SELECT * FROM members WHERE email=%s;"
    conn = None
    try:
        # 驗證信箱
        conn = sql_connector.get_connection()
        with conn.cursor(dictionary=True) as cursor:
            cursor.execute(sql, (user.email.lower(), )) # 用小寫判斷
            user_data = cursor.fetchone()
        if not user_data: # 找不到"信箱"
            raise HTTPException(
                status_code=400,
                detail="電子郵件錯誤，請重新輸入或註冊。"
            )
        
        # 驗證密碼
        stored_hash = user_data["password"] # 資料庫存的 hash 密碼
        is_valid = auth.verify_password(user.password, stored_hash) # 驗證密碼，相同 True ; 不同 False
        if not is_valid: # 密碼錯誤
            raise HTTPException(
                status_code=400,
                detail="密碼錯誤，請重新輸入。"
            )
        
        # 製造 JWT
        token_payload = {
            "id": user_data["id"],
            "name": user_data["name"],
            "email": user_data["email"]
        }
        token = auth.create_jwt_token(token_payload) # 用 payload 產生 token 的 function
        return {
            "token": token
        }
            
    # 攔截 HTTPException，避免導到下面的通用錯誤
    except HTTPException as e: 
        print("[登入會員]錯誤：", e)
        raise e
    except Exception as e:
        print("[登入會員]錯誤：", e)
        raise HTTPException(
            status_code=500,
            detail="資料庫系統[登入會員]錯誤"
        )
    finally:
        if conn and conn.is_connected():
            conn.close()
#endregion

# 抓取 request header 中的 Authorization: Bearer <token>
# tokenUrl 是給 Swagger UI 測試用的，auto_error=false 不要自動報錯，而是回傳 none
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/auth", auto_error=False)

#region 取得當前會員資訊
@router.get("/auth", response_model=dict[str, User | None])
def get_user_info(token: str | None = Depends(oauth2_scheme)):
    # 沒有 token (未登入)
    if not token:
        return {
            "data": None
        }
    # 驗證 token 正確性
    user_data = auth.get_user_data(token)
    return {
        "data": user_data
    }
#endregion 