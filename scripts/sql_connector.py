import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv
import os

# 載入 .env (存環境變數的檔案，不把內容上傳public)
load_dotenv()

# 建立一個連線池
connection_pool = pooling.MySQLConnectionPool(
    pool_name="my_website_pool",
    pool_size=5, # 池子裡最多養幾條連線
    pool_reset_session=True,  # 每次拿連線時會重置狀態，避免髒資料
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME")
)

def get_connection():
        # 每次呼叫這個函式，是從池子裡「借」一條連線，而不是重新建立
        return connection_pool.get_connection()
