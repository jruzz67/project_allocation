import io
import re
from PyPDF2 import PdfReader

def parse_pdf(content: bytes) -> str:
    """Extract and clean text from PDF bytes."""
    reader = PdfReader(io.BytesIO(content))
    text = ""
    for page in reader.pages:
        text += (page.extract_text() or "") + " "
    # Remove control characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    text = text.replace('\x00', '').replace('\r', ' ').replace('\n', ' ')
    return ' '.join(text.split()).strip()
