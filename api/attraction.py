from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
import json
# module
from scripts import sql_connector as sql

router = APIRouter()

# 連線資料庫
conn = sql.get_connection()


@router.get("/attractions")
async def get_attractions_list(
    page: int = Query(..., ge=0), # ge=>大於或等於，le=>小於或等於
    category: str = Query(None),
    keyword: str = Query(None)
):
    offset = page * 8 # 要從List[offset]開始抓取，也就是"頁數"*"每頁有幾個"
    parameters = [] # 放execute要用的參數
    sql = "SELECT * FROM attractions " \
        "WHERE 1=1 "
    if category:
        sql += "and category = %s "
        parameters.append(category)
    if keyword:
        sql += "and (mrt = %s or name LIKE CONCAT('%', %s, '%')) "
        parameters.append(keyword)
        parameters.append(keyword)
    
    sql += "ORDER BY id LIMIT 8 OFFSET %s;"
    parameters.append(offset)

    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, parameters)
            attrs = cursor.fetchall()
        attr_list = []
        for attr in attrs:
            attr_list.append(
                {
                    "id": attr[0],
                    "name": attr[1],
                    "category": attr[2],
                    "description": attr[3],
                    "address": attr[4],
                    "transport": attr[5],
                    "mrt": attr[6],
                    "lat": float(attr[7]),
                    "lng": float(attr[8]),
                    "images": json.loads(attr[9])
                }
            )

        return JSONResponse(
            status_code=200,
            content={
                "nextPage": page + 1 if len(attr_list) == 8 else None,
                "data": attr_list                
            }
        )
    except Exception as e:
        print("取得[分頁景點列表]錯誤：", e)
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "message": "資料庫取得[分頁景點列表]錯誤"
            }
        )

# 抓景點資訊
@router.get("/attraction/{attractionId}")
async def get_attraction(attractionId: int):
    sql = "SELECT * FROM attractions WHERE id = %s;"
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, (attractionId, ))
            attr_data = cursor.fetchone() # (...) 型態會是tuple
        if attr_data:
            return JSONResponse(
                status_code=200,
                content={
                    "data": {
                        "id": attr_data[0],
                        "name": attr_data[1],
                        "category": attr_data[2],
                        "description": attr_data[3],
                        "address": attr_data[4],
                        "transport": attr_data[5],
                        "mrt": attr_data[6],
                        "lat": float(attr_data[7]),
                        "lng": float(attr_data[8]),
                        "images": json.loads(attr_data[9])
                    }
                }
            )
        else:
            return JSONResponse(
                status_code=400,
                content={
                    "error": True,
                    "message": "景點編號不正確"
                }
            )
    except Exception as e:
        print("取得[景點資訊]錯誤：", e)
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "message": "資料庫取得[景點資訊]錯誤"
            }
        )

# 抓景點類別名稱
@router.get("/categories")
async def get_categories():
    sql = "SELECT category FROM attractions " \
        "GROUP BY category ORDER BY COUNT(id) DESC;"
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql)
            categories = cursor.fetchall() # [(...), (...), ...] 型態會是list裡裝tuple
            catgory_list = [cat[0] for cat in categories] # 直接去掉tuple
        return JSONResponse(
            status_code=200,
            content={
                "data": catgory_list
            }
        )
    except Exception as e:
        print("取得[景點分類名稱]錯誤：", e)
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "message": "資料庫取得[景點分類名稱]錯誤"
            }
        )

# 抓捷運站名稱
@router.get("/mrts")
async def get_mrts():
    sql = "SELECT mrt FROM attractions " \
        "GROUP BY mrt ORDER BY COUNT(id) DESC;"
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql)
            mrts = cursor.fetchall() # [(...), (...), ...] 型態會是list裡裝tuple
            mrt_list = [mrt[0] for mrt in mrts if mrt[0] is not None] # 直接去掉tuple，並且篩選掉 null
        return JSONResponse(
            status_code=200,
            content={
                "data": mrt_list
            }
        )
    except Exception as e:
        print("取得[捷運站名稱]錯誤：", e)
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "message": "資料庫取得[捷運站名稱]錯誤"
            }
        )