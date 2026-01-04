from fastapi import Header, Depends
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
import jwt
import datetime
from datetime import timezone
from dotenv import load_dotenv
import os

## hash 處理
# 設加密環境，用 bcrypt 演算法
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 明碼變亂碼 (hash)
def get_password_hash(password):
    return pwd_context.hash(password)

# hash 後進行密碼比對
def verify_password(password, hashed_password):
    # 驗證密碼，回傳 True or False
    # verify_password(使用者輸入的明碼, 資料庫存的亂碼)
    return pwd_context.verify(password, hashed_password)

## JWT 處理
# 私鑰跟演算法模式
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

# 製作 token
def create_jwt_token(data: dict):
    payload = data.copy()
    # 設定過期時間 7 天
    expire_time = datetime.datetime.now(tz=timezone.utc) + datetime.timedelta(days=7)
    payload.update({"exp": expire_time})
    
    # 進行編碼
    encoded_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_token


def get_user_data(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception as e:
        print("JWT 驗證失敗", e)
        return None
    
    