from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
import os
import shutil
from typing import Optional
from app.services.pdf_processor import PDFProcessor
from app.services.ai_generator import AIGenerator
from app.services.pptx_generator import PPTXGenerator
from app.utils.helpers import generate_unique_filename, ensure_dir
from app.services.pdf_converter import PDFConverter

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "outputs")

ensure_dir(UPLOAD_DIR)
ensure_dir(OUTPUT_DIR)

# Map frontend template IDs to backend templates
TEMPLATE_MAPPING = {
    'executive': 'professional',
    'modern-minimal': 'modern',
    'vibrant-creative': 'creative',
    'academic': 'professional',
    'tech-startup': 'modern',
    'elegant-dark': 'minimal',
    'detailed-brief': 'professional'
}

# Map frontend color scheme IDs to backend colors
COLOR_MAPPING = {
    'ocean': 'blue',
    'forest': 'green',
    'sunset': 'orange',
    'royal': 'purple',
    'rose': 'purple',
    'amber': 'orange',
    'teal': 'blue',
    'crimson': 'orange',
    'slate': 'dark',
    'violet': 'purple'
}

@router.post("/generate-from-topic")
async def generate_from_topic(
    topic: str = Form(...),
    num_slides: int = Form(10),
    template: str = Form("executive"),
    color_scheme: str = Form("ocean"),
    custom_prompt: Optional[str] = Form(None),
    use_images: bool = Form(False),
    generate_pdf: bool = Form(False)
):
    """Generate presentation from topic - MAX 10 SLIDES"""
    try:
        # Enforce maximum of 10 slides
        num_slides = min(num_slides, 10)
        
        backend_template = TEMPLATE_MAPPING.get(template, 'modern')
        backend_color = COLOR_MAPPING.get(color_scheme, 'blue')
        
        print(f"\n🎨 Frontend → Backend Mapping:")
        print(f"   Template: {template} → {backend_template}")
        print(f"   Color: {color_scheme} → {backend_color}")
        print(f"   Slides: {num_slides} (max 10)")
        print(f"   🖼️  Images: {'ENABLED' if use_images else 'DISABLED'}")
        print(f"   📄 PDF: {'ENABLED' if generate_pdf else 'DISABLED'}")
        
        ai_generator = AIGenerator()
        slides = ai_generator.generate_slides_from_topic(topic, num_slides, custom_prompt)
        
        pptx_generator = PPTXGenerator(
            template=backend_template, 
            color_scheme=backend_color,
            use_images=use_images
        )
        output_filename = generate_unique_filename(f"{topic}.pptx")
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        pptx_generator.generate_presentation(
            slides_data=slides,
            presentation_title=topic,
            output_path=output_path
        )
        
        # Generate PDF if requested
        pdf_filename = None
        if generate_pdf:
            pdf_path = PDFConverter.convert_pptx_to_pdf(output_path, OUTPUT_DIR)
            if pdf_path:
                pdf_filename = os.path.basename(pdf_path)
        
        return {
            "success": True,
            "message": "Presentation generated successfully",
            "filename": output_filename,
            "pdf_filename": pdf_filename,
            "slides_count": len(slides),
            "template": template,
            "color_scheme": color_scheme
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-from-pdf")
async def generate_from_pdf(
    file: UploadFile = File(...),
    slides_per_chapter: int = Form(10),
    template: str = Form("executive"),
    color_scheme: str = Form("ocean"),
    custom_prompt: Optional[str] = Form(None),
    use_images: bool = Form(False),
    generate_pdf: bool = Form(False)
):
    """Generate from PDF - MAX 10 TOTAL SLIDES with proper Topic numbering"""
    try:
        backend_template = TEMPLATE_MAPPING.get(template, 'modern')
        backend_color = COLOR_MAPPING.get(color_scheme, 'blue')
        
        print(f"\n🎨 Frontend → Backend Mapping:")
        print(f"   Template: {template} → {backend_template}")
        print(f"   Color: {color_scheme} → {backend_color}")
        print(f"   🖼️  Images: {'ENABLED' if use_images else 'DISABLED'}")
        print(f"   📄 PDF: {'ENABLED' if generate_pdf else 'DISABLED'}")
        
        upload_filename = generate_unique_filename(file.filename)
        upload_path = os.path.join(UPLOAD_DIR, upload_filename)
        
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract chapters
        pdf_processor = PDFProcessor(upload_path)
        pages_text = pdf_processor.extract_text_by_pages()
        chapters = pdf_processor.detect_chapters(pages_text)
        
        # ENFORCE MAXIMUM 10 SLIDES TOTAL
        MAX_TOTAL_SLIDES = 10
        num_chapters = len(chapters)
        
        # If only 1 chapter, use all 10 slides for content
        if num_chapters == 1:
            slides_per_chapter_adjusted = MAX_TOTAL_SLIDES
            include_dividers = False
        else:
            # Reserve slides for dividers, distribute rest
            available_for_content = MAX_TOTAL_SLIDES - num_chapters
            slides_per_chapter_adjusted = max(1, available_for_content // num_chapters)
            include_dividers = True
        
        print(f"\n{'='*70}")
        print(f"📚 PDF: {file.filename}")
        print(f"📖 Chapters: {num_chapters}")
        print(f"🎯 Requested slides/chapter: {slides_per_chapter}")
        print(f"✅ Adjusted slides/chapter: {slides_per_chapter_adjusted}")
        print(f"📊 Max total slides: {MAX_TOTAL_SLIDES}")
        print(f"{'='*70}\n")
        
        ai_generator = AIGenerator()
        all_slides = []
        
        for chapter_idx, chapter in enumerate(chapters, 1):
            # STOP if we're at limit
            if len(all_slides) >= MAX_TOTAL_SLIDES:
                print(f"\n⚠️  Reached slide limit ({MAX_TOTAL_SLIDES}), stopping")
                break
            
            print(f"\n{'─'*70}")
            print(f"📖 CHAPTER {chapter_idx}/{num_chapters}: {chapter['title']}")
            print(f"{'─'*70}")
            
            # Add chapter divider (only if multiple chapters)
            if include_dividers:
                divider_slide = {
                    "slide_number": len(all_slides) + 1,
                    "title": f"Chapter {chapter_idx}",
                    "content": [
                        chapter['title'],
                        "Key topics in this chapter"
                    ],
                    "visual_note": f"Chapter {chapter_idx}",
                    "is_chapter_divider": True,
                    "needs_image": True,
                    "image_query": chapter['title']
                }
                all_slides.append(divider_slide)
                print(f"   ✅ Chapter {chapter_idx} divider added")
            
            # Calculate remaining capacity
            remaining_capacity = MAX_TOTAL_SLIDES - len(all_slides)
            if remaining_capacity <= 0:
                print(f"   ⚠️  No capacity left")
                continue
            
            slides_to_generate = min(slides_per_chapter_adjusted, remaining_capacity)
            
            # Generate content slides with chapter number and current slide count
            chapter_slides = ai_generator.generate_slides_from_content(
                content=chapter["content"],
                title=chapter["title"],
                num_slides=slides_to_generate,
                custom_prompt=custom_prompt,
                chapter_number=chapter_idx,
                total_slides_so_far=len(all_slides)
            )
            
            # Add all generated slides (already have proper numbering and formatting)
            added_count = 0
            for slide in chapter_slides:
                # STOP if we hit limit
                if len(all_slides) >= MAX_TOTAL_SLIDES:
                    print(f"   ⚠️  Hit slide limit")
                    break
                
                all_slides.append(slide)
                print(f"   ✅ Added: {slide['title']}")
                added_count += 1
            
            print(f"   📊 Added {added_count} slides | Total: {len(all_slides)}/{MAX_TOTAL_SLIDES}")
        
        print(f"\n{'='*70}")
        print(f"✅ PDF COMPLETE")
        print(f"   📚 Chapters: {len(chapters)}")
        print(f"   📄 Total slides: {len(all_slides)}")
        if len(chapters) > 0:
            print(f"   📊 Avg/chapter: {len(all_slides) / len(chapters):.1f}")
        print(f"{'='*70}\n")
        
        # Generate PowerPoint
        pptx_generator = PPTXGenerator(
            template=backend_template, 
            color_scheme=backend_color,
            use_images=use_images
        )
        output_filename = generate_unique_filename(f"{file.filename}.pptx")
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        pptx_generator.generate_presentation(
            slides_data=all_slides,
            presentation_title=os.path.splitext(file.filename)[0],
            output_path=output_path
        )
        
        # Generate PDF if requested
        pdf_filename = None
        if generate_pdf:
            pdf_path = PDFConverter.convert_pptx_to_pdf(output_path, OUTPUT_DIR)
            if pdf_path:
                pdf_filename = os.path.basename(pdf_path)
        
        os.remove(upload_path)
        
        return {
            "success": True,
            "message": "PDF processed successfully",
            "filename": output_filename,
            "pdf_filename": pdf_filename,
            "chapters_detected": len(chapters),
            "total_slides": len(all_slides),
            "slides_per_chapter": round(len(all_slides) / len(chapters), 1) if len(chapters) > 0 else 0,
            "template": template,
            "color_scheme": color_scheme
        }
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{filename}")
async def download_presentation(filename: str):
    """Download presentation (PPTX or PDF)"""
    file_path = os.path.join(OUTPUT_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine media type based on extension
    if filename.endswith('.pdf'):
        media_type = "application/pdf"
    else:
        media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type
    )

@router.get("/templates")
async def get_templates():
    """Get templates"""
    return {
        "templates": [
            "executive",
            "modern-minimal",
            "vibrant-creative",
            "academic",
            "tech-startup",
            "elegant-dark",
            "detailed-brief"
        ],
        "color_schemes": [
            "ocean",
            "forest",
            "sunset",
            "royal",
            "rose",
            "amber",
            "teal",
            "crimson",
            "slate",
            "violet"
        ]
    }