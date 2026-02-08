import subprocess
import os
from typing import Optional

class PDFConverter:
    """Convert PPTX to PDF using LibreOffice"""
    
    @staticmethod
    def convert_pptx_to_pdf(pptx_path: str, output_dir: str) -> Optional[str]:
        """
        Convert PowerPoint to PDF using LibreOffice headless
        
        Args:
            pptx_path: Path to the .pptx file
            output_dir: Directory where PDF will be saved
            
        Returns:
            Path to generated PDF file, or None if conversion failed
        """
        try:
            print(f"\n📄 Converting PPTX to PDF...")
            print(f"   Input: {pptx_path}")
            print(f"   Output dir: {output_dir}")
            
            # Ensure output directory exists
            os.makedirs(output_dir, exist_ok=True)
            
            # Run LibreOffice in headless mode to convert
            command = [
                'libreoffice',
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', output_dir,
                pptx_path
            ]
            
            # Execute conversion
            result = subprocess.run(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=120  # 2 minute timeout
            )
            
            if result.returncode == 0:
                # Get the PDF filename (same as PPTX but with .pdf extension)
                pptx_filename = os.path.basename(pptx_path)
                pdf_filename = os.path.splitext(pptx_filename)[0] + '.pdf'
                pdf_path = os.path.join(output_dir, pdf_filename)
                
                if os.path.exists(pdf_path):
                    print(f"   ✅ PDF created: {pdf_filename}")
                    return pdf_path
                else:
                    print(f"   ❌ PDF file not found after conversion")
                    return None
            else:
                error_msg = result.stderr.decode('utf-8')
                print(f"   ❌ Conversion failed: {error_msg}")
                return None
                
        except subprocess.TimeoutExpired:
            print(f"   ❌ Conversion timeout (>2 minutes)")
            return None
        except Exception as e:
            print(f"   ❌ Conversion error: {e}")
            return None
    
    @staticmethod
    def get_pdf_filename(pptx_filename: str) -> str:
        """Get PDF filename from PPTX filename"""
        return os.path.splitext(pptx_filename)[0] + '.pdf'