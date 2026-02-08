from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="EduSlide AI Backend",
    description="AI-powered presentation generation API",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "message": "EduSlide AI Backend is running!",
        "version": "1.0.0",
        "endpoints": {
            "generate_from_topic": "/api/generate-from-topic",
            "generate_from_pdf": "/api/generate-from-pdf",
            "download": "/api/download/{filename}"
        }
    }