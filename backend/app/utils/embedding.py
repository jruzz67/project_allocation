from sentence_transformers import SentenceTransformer
import numpy as np

# Load once at startup (global)
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str) -> list[float]:
    if not text.strip():
        return [0.0] * 384
    embedding = model.encode(text, convert_to_numpy=True)
    # Normalize for cosine similarity later
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm
    return embedding.tolist()