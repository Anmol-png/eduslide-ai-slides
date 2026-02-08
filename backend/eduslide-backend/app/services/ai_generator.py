from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import os
from typing import List, Dict, Optional
import re

class AIGenerator:
    def __init__(self):
        print("🔄 Loading Qwen 2.5 3B model (better quality, no login needed)...")
        
        # BEST MODEL - No authentication required, excellent quality
        model_name = "Qwen/Qwen2.5-3B-Instruct"
        
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                trust_remote_code=True
            )
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16,
                device_map="cpu",
                trust_remote_code=True,
                low_cpu_mem_usage=True
            )
            print("✅ Qwen 2.5 3B model ready!")
            
        except Exception as e:
            print(f"⚠️  Qwen failed: {e}")
            print("🔄 Falling back to TinyLlama...")
            
            # Ultimate fallback - TinyLlama (always works)
            model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16,
                device_map="cpu"
            )
            print("✅ TinyLlama model ready (fallback)")
    
    def generate_slides_from_topic(self, topic: str, num_slides: int = 10, custom_prompt: Optional[str] = None) -> List[Dict]:
        """Generate slides using AI"""
        
        print(f"\n{'='*60}")
        print(f"🚀 Generating: {topic} ({num_slides} slides)")
        if custom_prompt:
            print(f"📝 Custom Instructions: {custom_prompt}")
        print(f"{'='*60}\n")
        
        prompt = f"""Create {num_slides} educational slides about {topic}.

Format EXACTLY like this:

Slide 1
Title: Introduction to {topic}
- First key point about the topic
- Second important detail
- Third relevant fact

Slide 2
Title: Main Concept 1
- Explanation of concept
- Example or detail
- Additional information

Create {num_slides} slides with clear titles and 3-4 bullet points each."""

        if custom_prompt:
            prompt += f"\n\nADDITIONAL INSTRUCTIONS:\n{custom_prompt}"
        
        prompt += f"\n\nCreate {num_slides} slides now:"

        try:
            messages = [
                {"role": "system", "content": "You are an expert educator. Create well-structured slides."},
                {"role": "user", "content": prompt}
            ]
            
            text = self.tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )
            inputs = self.tokenizer(text, return_tensors="pt")
            
            print("🔄 Generating content...")
            
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=2000,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract response
            if "assistant" in response.lower():
                parts = response.split("assistant", 1)
                if len(parts) > 1:
                    response = parts[1].strip()
            
            print(f"\n📥 Generated (first 400 chars):")
            print(response[:400])
            print()
            
            slides = self._parse_response(response, topic, num_slides)
            print(f"✅ Created {len(slides)} slides!")
            
            return slides
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return self._create_fallback_slides(topic, num_slides)
    
    def generate_slides_from_content(self, content: str, title: str, num_slides: int = 10, custom_prompt: Optional[str] = None, chapter_number: int = 1, total_slides_so_far: int = 0) -> List[Dict]:
        """Generate slides from PDF using AI"""
        
        print(f"\n{'='*60}")
        print(f"🚀 Chapter: {title}")
        print(f"📄 Length: {len(content)} chars")
        
        max_chars = 4000
        if len(content) > max_chars:
            print(f"✂️  Truncating: {len(content)} → {max_chars}")
            content = content[:max_chars]
        
        print(f"{'='*60}\n")
        
        slides = self._extract_with_ai(
            content, title, num_slides, chapter_number, total_slides_so_far, custom_prompt
        )
        
        print(f"✅ {len(slides)} slides!\n")
        return slides
    
    def _extract_with_ai(self, content: str, chapter_title: str, num_slides: int, chapter_number: int, total_slides_so_far: int, custom_prompt: Optional[str] = None) -> List[Dict]:
        """Extract key points using AI"""
        
        print(f"🤖 AI extracting key information...")
        
        prompt = f"""Extract {num_slides} key topics from this chapter: "{chapter_title}"

CONTENT:
{content}

Create {num_slides} slides. Extract REAL information from the text.

Format:

Slide 1
Title: First Key Topic
- First point from content
- Second point from content  
- Third point from content

Slide 2
Title: Second Key Topic
- Main concept
- Supporting detail
- Additional fact

Create {num_slides} slides:"""

        if custom_prompt:
            prompt += f"\n\nINSTRUCTIONS: {custom_prompt}"

        try:
            messages = [
                {"role": "system", "content": "You extract key information from texts into clear slides."},
                {"role": "user", "content": prompt}
            ]
            
            text = self.tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )
            inputs = self.tokenizer(text, return_tensors="pt")
            
            print("🔄 AI processing...")
            
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=2000,
                    temperature=0.6,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            if "assistant" in response.lower():
                parts = response.split("assistant", 1)
                if len(parts) > 1:
                    response = parts[1].strip()
            
            print(f"\n📥 AI response (first 400 chars):")
            print(response[:400])
            print()
            
            slides = self._parse_response_for_pdf(
                response, chapter_title, num_slides, chapter_number, total_slides_so_far
            )
            
            if len(slides) < num_slides:
                slides = self._ensure_minimum_slides(
                    slides, content, chapter_title, num_slides, chapter_number, total_slides_so_far
                )
            
            return slides
            
        except Exception as e:
            print(f"❌ AI failed: {e}")
            return self._extract_slides_from_content_direct(
                content, chapter_title, num_slides, chapter_number, total_slides_so_far
            )
    
    def _parse_response(self, text: str, topic: str, num_slides: int) -> List[Dict]:
        """Parse AI response"""
        slides = []
        blocks = re.split(r'Slide\s+(\d+)', text, flags=re.IGNORECASE)
        
        if len(blocks) <= 2:
            blocks = re.split(r'^(\d+)\.', text, flags=re.MULTILINE)
        
        slide_num = 1
        
        for block in blocks:
            if not block.strip() or block.strip().isdigit():
                continue
            
            # Title
            title_match = re.search(r'Title:\s*(.+?)(?:\n|$)', block, re.IGNORECASE)
            if title_match:
                title = title_match.group(1).strip()
                if len(title) > 70:
                    title = title[:67] + "..."
            else:
                title = f"Topic {slide_num}"
            
            # Content
            content_lines = []
            for line in block.split('\n'):
                line = line.strip()
                if not line or 'title:' in line.lower():
                    continue
                if line.startswith(('-', '•', '*')):
                    content = line.lstrip('-•*').strip()
                    if len(content) > 140:
                        content = content[:137] + "..."
                    if content and len(content) > 15:
                        content_lines.append(content)
            
            if len(content_lines) >= 2:
                slides.append({
                    "slide_number": slide_num,
                    "title": title,
                    "content": content_lines[:5],
                    "visual_note": topic,
                    "needs_image": False,
                    "image_query": title
                })
                slide_num += 1
                if len(slides) >= num_slides:
                    break
        
        while len(slides) < num_slides:
            slides.append({
                "slide_number": len(slides) + 1,
                "title": f"Topic {len(slides) + 1}",
                "content": [
                    f"Key information about {topic}",
                    f"Important details and concepts",
                    f"Relevant examples"
                ],
                "visual_note": topic,
                "needs_image": False,
                "image_query": topic
            })
        
        return slides[:num_slides]
    
    def _parse_response_for_pdf(self, text: str, chapter_title: str, num_slides: int, chapter_number: int, total_slides_so_far: int) -> List[Dict]:
        """Parse for PDF"""
        slides = []
        blocks = re.split(r'Slide\s+(\d+)', text, flags=re.IGNORECASE)
        
        if len(blocks) <= 2:
            blocks = re.split(r'^(\d+)\.', text, flags=re.MULTILINE)
        
        topic_num = 1
        
        for block in blocks:
            if not block.strip() or block.strip().isdigit():
                continue
            
            title_match = re.search(r'Title:\s*(.+?)(?:\n|$)', block, re.IGNORECASE)
            if title_match:
                raw = title_match.group(1).strip()
                if len(raw) > 50:
                    raw = raw[:47] + "..."
                title = f"Topic {chapter_number}.{topic_num}: {raw}"
            else:
                title = f"Topic {chapter_number}.{topic_num}"
            
            content_lines = []
            for line in block.split('\n'):
                line = line.strip()
                if not line or 'title:' in line.lower():
                    continue
                if line.startswith(('-', '•', '*')):
                    content = line.lstrip('-•*').strip()
                    if len(content) > 140:
                        content = content[:137] + "..."
                    if content and len(content) > 15:
                        content_lines.append(content)
            
            if len(content_lines) >= 2:
                slides.append({
                    "slide_number": total_slides_so_far + topic_num,
                    "title": title,
                    "content": content_lines[:5],
                    "visual_note": chapter_title,
                    "needs_image": False,
                    "image_query": chapter_title,
                    "chapter": chapter_number
                })
                topic_num += 1
                if len(slides) >= num_slides:
                    break
        
        return slides[:num_slides]
    
    def _extract_slides_from_content_direct(self, content: str, chapter_title: str, num_slides: int, chapter_number: int, total_slides_so_far: int) -> List[Dict]:
        """Direct extraction fallback"""
        print(f"📖 Direct extraction...")
        
        sentences = re.split(r'[.!?]+', content)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 30]
        
        unique = []
        seen = set()
        for s in sentences:
            if s.lower() not in seen:
                unique.append(s)
                seen.add(s.lower())
        
        slides = []
        per_slide = max(3, len(unique) // num_slides)
        
        for i in range(num_slides):
            start = i * per_slide
            end = min(start + per_slide, len(unique))
            if start >= len(unique):
                break
            
            slide_sents = unique[start:end]
            limited = []
            for s in slide_sents[:5]:
                if len(s) > 140:
                    s = s[:137] + "..."
                limited.append(s)
            
            title_hint = slide_sents[0][:50] if slide_sents else "Info"
            title_words = title_hint.split()[:8]
            slide_title = " ".join(title_words)
            if len(slide_title) > 60:
                slide_title = slide_title[:57] + "..."
            
            slides.append({
                "slide_number": total_slides_so_far + i + 1,
                "title": f"Topic {chapter_number}.{i + 1}: {slide_title}",
                "content": limited,
                "visual_note": chapter_title,
                "needs_image": False,
                "image_query": chapter_title,
                "chapter": chapter_number
            })
        
        while len(slides) < num_slides:
            slides.append({
                "slide_number": total_slides_so_far + len(slides) + 1,
                "title": f"Topic {chapter_number}.{len(slides) + 1}",
                "content": [
                    f"Information from {chapter_title}",
                    "Key concepts and details",
                    "Important points"
                ],
                "visual_note": chapter_title,
                "needs_image": False,
                "image_query": chapter_title,
                "chapter": chapter_number
            })
        
        return slides[:num_slides]
    
    def _ensure_minimum_slides(self, slides: List[Dict], content: str, chapter_title: str, num_slides: int, chapter_number: int, total_slides_so_far: int) -> List[Dict]:
        """Ensure minimum slides"""
        while len(slides) < num_slides:
            slides.append({
                "slide_number": total_slides_so_far + len(slides) + 1,
                "title": f"Topic {chapter_number}.{len(slides) + 1}",
                "content": [
                    f"Additional information from {chapter_title}",
                    "Key concepts",
                    "Important points"
                ],
                "visual_note": chapter_title,
                "needs_image": False,
                "image_query": chapter_title,
                "chapter": chapter_number
            })
        return slides[:num_slides]
    
    def _create_fallback_slides(self, title: str, num_slides: int) -> List[Dict]:
        """Fallback"""
        slides = []
        for i in range(num_slides):
            slides.append({
                "slide_number": i + 1,
                "title": f"Topic {i + 1}",
                "content": [
                    f"Information about {title}",
                    "Key concepts",
                    "Important details"
                ],
                "visual_note": title,
                "needs_image": False,
                "image_query": title
            })
        return slides