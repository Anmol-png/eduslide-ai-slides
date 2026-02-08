# 🎨 EduSlide - AI-Powered Presentation Generator

An intelligent presentation generation system that converts topics or PDF documents into professional PowerPoint presentations using AI.

## ✨ Features

### 🚀 Core Features
- **AI-Powered Generation** - Generate slides from topics or PDF documents
- **Multiple Templates** - 7 professional PowerPoint-style templates
- **Color Schemes** - 10 beautiful color palettes
- **Smart Content** - AI extracts and organizes content intelligently
- **PDF Support** - Upload PDFs and convert to presentations
- **Chapter Detection** - Automatically detects and organizes PDF chapters

### 🎯 Advanced Features
- **AI Image Generation** - Optional AI-generated images for slides (SDXL-Turbo)
- **PDF Export** - Generate both PPTX and PDF versions
- **Custom Instructions** - Guide AI with custom prompts
- **Recent History** - Track and re-download previous presentations
- **Dark Mode** - Beautiful dark/light theme toggle
- **Responsive Design** - Works on desktop, tablet, and mobile

## 🏗️ Tech Stack

### Backend
- **Python 3.12** - Core language
- **FastAPI** - Web framework
- **Qwen 2.5 3B** - AI model for content generation
- **python-pptx** - PowerPoint generation
- **PyMuPDF** - PDF processing
- **Diffusers** - AI image generation (optional)
- **LibreOffice** - PDF conversion

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - API calls

## 📋 Prerequisites

- **Python 3.12+**
- **Node.js 18+**
- **LibreOffice** (for PDF export)
- **GPU** (optional, for faster AI image generation)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/eduslide-ai.git
cd eduslide-ai
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate

# Install dependencies
pip install -r requirements.txt --break-system-packages

# Install LibreOffice (for PDF conversion)
sudo apt-get install -y libreoffice

# Create required directories
mkdir -p uploads outputs

# Run backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **http://localhost:8000**

### 3. Frontend Setup
```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Run frontend
npm run dev
```

Frontend runs at: **http://localhost:3000**

## 🎯 Usage

1. **Open browser** → `http://localhost:3000`
2. **Choose input**:
   - 📝 **From Topic** - Enter topic + slide count
   - 📄 **From PDF** - Upload PDF document
3. **Select template** - 7 professional designs
4. **Pick colors** - 10 color schemes
5. **Advanced** (optional):
   - ✏️ Custom AI instructions
   - 🖼️ AI image generation
   - 📄 PDF export
6. **Generate** → Download!

## 📁 Project Structure
```
eduslide-project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py          # API endpoints
│   │   ├── services/
│   │   │   ├── ai_generator.py    # AI content generation (Qwen 2.5 3B)
│   │   │   ├── pdf_processor.py   # PDF text extraction
│   │   │   ├── pptx_generator.py  # PowerPoint creation
│   │   │   ├── pdf_converter.py   # PPTX → PDF conversion
│   │   │   └── image_generator.py # AI images (SDXL-Turbo)
│   │   ├── utils/
│   │   │   └── helpers.py         # Utilities
│   │   └── main.py                # FastAPI app
│   ├── uploads/                   # Uploaded PDFs
│   ├── outputs/                   # Generated presentations
│   └── requirements.txt           # Python dependencies
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Main UI
│   │   ├── layout.tsx            # Layout
│   │   └── globals.css           # Styles
│   ├── package.json              # Node dependencies
│   └── tailwind.config.ts        # Tailwind config
│
├── .gitignore
└── README.md
```

## 🎨 Templates

1. **Executive Brief** - Clean corporate design
2. **Modern Minimal** - Sleek contemporary
3. **Vibrant Creative** - Colorful energetic
4. **Academic Pro** - Professional educational
5. **Tech Startup** - Bold gradients
6. **Elegant Dark** - Sophisticated dark theme
7. **Detailed Brief** - Comprehensive overview

## 🎨 Color Schemes

Ocean Blue • Forest Green • Sunset Orange • Royal Purple • Rose Pink • Amber Gold • Teal Aqua • Crimson Red • Slate Gray • Deep Violet

## 📊 API Endpoints

### `POST /api/generate-from-topic`
Generate from topic
- **Body**: `topic`, `num_slides`, `template`, `color_scheme`, `custom_prompt`, `use_images`, `generate_pdf`
- **Returns**: `filename`, `pdf_filename`, `slides_count`

### `POST /api/generate-from-pdf`
Generate from PDF
- **Body**: `file`, `slides_per_chapter`, `template`, `color_scheme`, `custom_prompt`, `use_images`, `generate_pdf`
- **Returns**: `filename`, `pdf_filename`, `chapters_detected`, `total_slides`

### `GET /api/download/{filename}`
Download presentation (PPTX or PDF)

### `GET /api/templates`
Get templates and color schemes

## ⚙️ Configuration

### Enable AI Image Generation
```bash
# Install dependencies
pip install diffusers transformers accelerate --break-system-packages

# Toggle in frontend UI
# First run downloads ~7GB model (cached)
```

### Environment Variables (Optional)
Create `backend/.env`:
```env
UPLOAD_DIR=uploads
OUTPUT_DIR=outputs
```

## 🔧 Troubleshooting

**Backend won't start:**
```bash
python3 --version  # Check 3.12+
pip install -r requirements.txt --break-system-packages
```

**Frontend won't start:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**PDF export fails:**
```bash
sudo apt-get install -y libreoffice
libreoffice --version
```

## 📝 Features

- [x] Topic-based generation
- [x] PDF upload support
- [x] 7 templates
- [x] 10 color schemes
- [x] AI image generation
- [x] PDF export
- [x] Dark mode
- [x] Recent history
- [ ] Google Slides export
- [ ] Collaboration
- [ ] Custom branding

## 📄 License

MIT License

## 👨‍💻 Author

Created with ❤️

## 🙏 Acknowledgments

- **Qwen 2.5** - Alibaba Cloud
- **SDXL-Turbo** - Stability AI
- **python-pptx** - PowerPoint library
- **FastAPI** - Web framework
- **Next.js** - React framework

---

**Made with AI ✨ | Powered by Claude**
