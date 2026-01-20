from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Camera Test TMA Server")

# CORS для всех доменов (для теста)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создаем папку для видео
os.makedirs("test_videos", exist_ok=True)

@app.get("/")
async def root():
    return {
        "message": "Camera Test TMA Server is running",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/upload-test",
            "health": "/health"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/upload-test")
async def upload_test(
    video: UploadFile = File(...),
    user_id: str = Form(None)
):
    """
    Принимает видео файл и сохраняет его на диск
    """
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{video.filename}"
        file_path = f"test_videos/{filename}"
        
        logger.info(f"📥 Receiving video upload: {filename}")
        if user_id:
            logger.info(f"👤 User ID: {user_id}")
        
        # Читаем содержимое файла
        content = await video.read()
        file_size = len(content)
        
        logger.info(f"📦 File size: {file_size / 1024 / 1024:.2f} MB")
        
        # Проверяем тип файла
        content_type = video.content_type
        logger.info(f"📹 Content type: {content_type}")
        
        # Сохраняем файл
        with open(file_path, "wb") as f:
            f.write(content)
        
        logger.info(f"✅ Video saved: {file_path}")
        
        # Проверяем наличие аудио (базовая проверка по размеру)
        has_audio = "unknown"
        if content_type and "webm" in content_type:
            # Для webm файлов можно сделать более детальную проверку
            # Здесь упрощенная версия
            has_audio = "likely" if file_size > 100000 else "unlikely"
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "filename": filename,
                "size_bytes": file_size,
                "size_mb": round(file_size / 1024 / 1024, 2),
                "content_type": content_type,
                "user_id": user_id,
                "has_audio": has_audio,
                "timestamp": datetime.now().isoformat(),
                "saved_path": file_path
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Upload error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )

@app.get("/videos")
async def list_videos():
    """
    Возвращает список всех загруженных видео
    """
    try:
        videos = []
        for filename in os.listdir("test_videos"):
            file_path = os.path.join("test_videos", filename)
            file_size = os.path.getsize(file_path)
            videos.append({
                "filename": filename,
                "size_bytes": file_size,
                "size_mb": round(file_size / 1024 / 1024, 2)
            })
        
        return {
            "status": "success",
            "count": len(videos),
            "videos": videos
        }
    except Exception as e:
        logger.error(f"❌ List videos error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e)
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
