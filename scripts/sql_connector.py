import mysql.connector
from dotenv import load_dotenv
import os

# 載入 .env (存環境變數的檔案，不把內容上傳public)
load_dotenv()

# 連線資料庫
def get_connection():
    return mysql.connector.connect(
        host = os.getenv("DB_HOST"),
        user = os.getenv("DB_USER"),
        password = os.getenv("DB_PASSWORD"),
        database = os.getenv("DB_NAME")
    )
