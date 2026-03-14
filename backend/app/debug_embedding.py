from app.utils.embedding import get_embedding
text = "Test sentence for embedding."  # Replace with your description
emb = get_embedding(text)
print(f"Length: {len(emb)}")
print(f"First 5: {emb[:5]}")