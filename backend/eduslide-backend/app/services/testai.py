import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

prompt = """Create 3 slides about Photosynthesis.

Return ONLY a valid JSON array with this EXACT format (no other text):
[
  {"slide_number": 1, "title": "What is Photosynthesis", "content": ["Chlorophyll absorbs light", "Occurs in chloroplasts", "Converts CO2 to glucose"], "visual_note": "Diagram of chloroplast"},
  {"slide_number": 2, "title": "Light Reactions", "content": ["Happen in thylakoids", "Produce ATP and NADPH"], "visual_note": "Thylakoid membrane"}
]"""

print("Testing Gemini API...\n")

response = model.generate_content(prompt)
print("=== RAW RESPONSE ===")
print(response.text)
print("\n=== ATTEMPTING TO PARSE ===")

text = response.text.strip()

# Try to find JSON
import re
text = re.sub(r'```json\s*', '', text)
text = re.sub(r'```\s*', '', text)

start = text.find('[')
end = text.rfind(']') + 1

if start != -1 and end > start:
    json_str = text[start:end]
    print("\nExtracted JSON:")
    print(json_str)
    
    try:
        slides = json.loads(json_str)
        print(f"\n✅ SUCCESS! Parsed {len(slides)} slides")
        print("\nFirst slide content:")
        print(slides[0])
    except Exception as e:
        print(f"\n❌ Parse failed: {e}")
else:
    print("\n❌ No JSON array found")