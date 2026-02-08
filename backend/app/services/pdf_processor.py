import PyPDF2
from typing import List, Dict
import re
from pdf2image import convert_from_path
import pytesseract
from PIL import Image
import os

class PDFProcessor:
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.pdf_reader = None
        
        try:
            with open(pdf_path, 'rb') as file:
                self.pdf_reader = PyPDF2.PdfReader(file)
                self.num_pages = len(self.pdf_reader.pages)
        except Exception as e:
            print(f"❌ Error opening PDF: {e}")
            self.num_pages = 0
    
    def extract_text_by_pages(self) -> List[str]:
        """Extract text from PDF with OCR fallback for scanned PDFs"""
        
        print(f"\n{'='*60}")
        print(f"📄 PDF EXTRACTION STARTING")
        print(f"📂 File: {self.pdf_path}")
        print(f"{'='*60}")
        
        pages_text = []
        
        if not self.pdf_reader:
            print("❌ PDF Reader not initialized")
            return pages_text
        
        print(f"📊 Total pages in PDF: {self.num_pages}")
        
        # First try: Regular text extraction
        pages_with_text = 0
        
        for page_num in range(self.num_pages):
            try:
                page = self.pdf_reader.pages[page_num]
                text = page.extract_text()
                
                if text and len(text.strip()) > 50:
                    pages_text.append(text)
                    pages_with_text += 1
                else:
                    pages_text.append("")
                    print(f"   ⚠️  Page {page_num + 1}: NO TEXT FOUND (might be image-based PDF)")
                    
            except Exception as e:
                print(f"   ❌ Page {page_num + 1}: Error - {e}")
                pages_text.append("")
        
        print(f"📋 Total pages with text: {pages_with_text}/{self.num_pages}")
        
        # If less than 30% of pages have text, it's likely a scanned PDF - use OCR
        if pages_with_text < (self.num_pages * 0.3):
            print(f"\n🔍 LOW TEXT EXTRACTION - Attempting OCR...")
            print(f"{'='*60}")
            return self._extract_with_ocr()
        
        if pages_with_text == 0:
            print(f"❌ NO TEXT EXTRACTED - This might be a scanned/image-based PDF!")
            print(f"{'='*60}")
            print(f"\n🔍 Attempting OCR extraction...")
            return self._extract_with_ocr()
        
        print(f"{'='*60}\n")
        return pages_text
    
    def _extract_with_ocr(self) -> List[str]:
        """Extract text using OCR for scanned/image PDFs"""
        
        try:
            print(f"📸 Converting PDF pages to images...")
            
            # Convert PDF to images
            images = convert_from_path(
                self.pdf_path,
                dpi=300,  # High quality
                fmt='jpeg'
            )
            
            print(f"✅ Converted {len(images)} pages to images")
            print(f"🔤 Performing OCR on each page...\n")
            
            pages_text = []
            
            for i, image in enumerate(images, 1):
                print(f"   📄 OCR Page {i}/{len(images)}...", end=" ")
                
                try:
                    # Perform OCR
                    text = pytesseract.image_to_string(image, lang='eng')
                    
                    if text and len(text.strip()) > 20:
                        pages_text.append(text)
                        print(f"✅ Extracted {len(text)} chars")
                    else:
                        pages_text.append("")
                        print(f"⚠️  No text found")
                        
                except Exception as e:
                    print(f"❌ Error: {e}")
                    pages_text.append("")
            
            total_chars = sum(len(text) for text in pages_text)
            print(f"\n✅ OCR Complete!")
            print(f"📊 Total characters extracted: {total_chars}")
            print(f"{'='*60}\n")
            
            return pages_text
            
        except Exception as e:
            print(f"❌ OCR Failed: {e}")
            print(f"{'='*60}\n")
            return [""] * self.num_pages
    
    def detect_chapters(self, pages_text: List[str]) -> List[Dict]:
        """Detect chapters from extracted text"""
        
        print(f"🔍 Detecting chapters...")
        
        chapters = []
        current_chapter = {
            "title": "Complete Document",
            "content": "",
            "start_page": 0
        }
        
        for page_num, text in enumerate(pages_text):
            # Look for chapter patterns
            chapter_match = re.search(
                r'(?:Chapter|CHAPTER|Section|SECTION)\s+(\d+|[IVX]+)[:\s]+(.+?)(?:\n|$)',
                text,
                re.IGNORECASE
            )
            
            if chapter_match and len(current_chapter["content"]) > 100:
                # Save previous chapter
                chapters.append(current_chapter.copy())
                
                # Start new chapter
                chapter_title = chapter_match.group(0).strip()
                current_chapter = {
                    "title": chapter_title,
                    "content": text,
                    "start_page": page_num
                }
                print(f"   📖 Found: {chapter_title}")
            else:
                # Add to current chapter
                current_chapter["content"] += "\n" + text
        
        # Add final chapter
        if current_chapter["content"].strip():
            chapters.append(current_chapter)
        
        # If no chapters detected, treat entire document as one chapter
        if not chapters:
            print(f"   ℹ️  No chapters detected, treating as single document")
            all_content = "\n".join(pages_text)
            chapters = [{
                "title": "Complete Document",
                "content": all_content,
                "start_page": 0
            }]
        
        print(f"📚 Total chapters detected: {len(chapters)}")
        for i, chapter in enumerate(chapters, 1):
            print(f"   {i}. {chapter['title']}: {len(chapter['content'])} characters")
        
        return chapters