import os
import numpy as np
from sentence_transformers import SentenceTransformer

# Load model at startup — use local cache only to avoid network check on HuggingFace.
# The model was already downloaded; TRANSFORMERS_OFFLINE=1 prevents HTTP HEAD requests
# that fail when there's no internet, causing 5x retry delays at startup.
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
os.environ.setdefault("HF_DATASETS_OFFLINE", "1")

model = SentenceTransformer("all-MiniLM-L6-v2", local_files_only=True)
print("[INFO] SentenceTransformer loaded from local cache (offline mode)")


def get_embedding(text: str) -> list[float]:
    if not text.strip():
        return [0.0] * 384
    embedding = model.encode(text, convert_to_numpy=True)
    # L2-normalize for cosine similarity
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm
    return embedding.tolist()