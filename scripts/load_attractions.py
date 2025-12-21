import mysql.connector
import json
from dotenv import load_dotenv
import os
import re

load_dotenv()

# 取JSON資料
with open("./data/taipei-attractions.json", "r", encoding="utf-8-sig", newline="") as file:
    data = json.load(file)

# 景點陣列
attractions = data["result"]["results"]
# print(attractions)

# 連線資料庫
conn = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME")
)


try:
    with conn.cursor() as cursor:
        # [item]*10 會生成一個list裡面有10個item
        # "分割符號".join(list) 用分割符號連接所有list的item成一個string
        item = ",".join(["%s"] * 10) 
        # 用 f-string 插入 %s 不會有 SQL injection 的問題
        sql = f"INSERT INTO attractions (id, name, category, description, address, transport, mrt, lat, lng, images) " \
                "VALUES ( %s, %s, %s, %s, %s, %s, %s, %s, %s, %s )"
        for attr in attractions:
            # 抓各個值
            id = attr.get("_id")
            name = attr.get("name")
            category = attr.get("CAT")
            description = attr.get("description")
            address = attr.get("address")
            transport = attr.get("direction")
            mrt = attr.get("MRT")
            lat = float(attr.get("latitude", 0))
            lng = float(attr.get("longitude", 0))
            # 處理檔案url，分割成list並且篩出圖片部分
            url_list = re.findall(r"https://.*?(?=https://|$)", attr["file"]) # .*? 非貪婪匹配任意字元， (?=pattern) lookahead=>找下段字串的開頭(不包含在本段字串)
            img_list = [u for u in url_list if u.endswith((".jpg", ".JPG", ".png", ".PNG"))]
            images = json.dumps(img_list) # 轉成JSON型態
            # print(type(images))
            cursor.execute(sql, (id, name, category, description, address, transport, mrt, lat, lng, images))
            conn.commit()

except Exception as e:
    print(e)