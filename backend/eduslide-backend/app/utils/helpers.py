import os
import uuid
from datetime import datetime

def generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename with timestamp and UUID"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    ext = os.path.splitext(original_filename)[1]
    return f"{timestamp}_{unique_id}{ext}"

def clean_text(text: str) -> str:
    """Clean extracted text"""
    text = " ".join(text.split())
    return text.strip()

def ensure_dir(directory: str):
    """Ensure directory exists"""
    os.makedirs(directory, exist_ok=True)