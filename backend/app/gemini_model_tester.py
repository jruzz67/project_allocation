# gemini_model_tester.py (fixed)
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    API_KEY = input("Enter your GOOGLE_API_KEY: ").strip()

genai.configure(api_key=API_KEY)

print("Listing all available Gemini models...\n")

try:
    models = list(genai.list_models())  # Convert generator to list
    if not models:
        print("No models found. Check API key or network.")
        exit()

    print("Model name                          | Display name                          | Supports generateContent?")
    print("-" * 90)
    
    supported = []
    unsupported = []

    for m in models:
        name = m.name.replace("models/", "")
        display_name = getattr(m, "display_name", "Unknown")
        supports_gen = "generateContent" in getattr(m, "supported_generation_methods", [])
        
        status = "YES" if supports_gen else "NO"
        print(f"{name:<35} | {display_name:<37} | {status}")
        
        if supports_gen:
            supported.append(name)
        else:
            unsupported.append(name)

    print("\n" + "=" * 90)
    print(f"Total models found: {len(models)}")
    print(f"Supported for generateContent: {len(supported)}")
    
    if supported:
        print("\nRecommended models (best to try first):")
        for model in supported[:8]:
            print(f"  - {model}")
        print("\nBest choices for your use case (structured JSON, long context):")
        print("  1. gemini-2.5-flash-latest          → fastest, 1M+ context")
        print("  2. gemini-2.5-flash                 → stable")
        print("  3. gemini-2.5-pro-latest            → smarter reasoning")
        print("  4. gemini-2.5-pro                   → stable pro")
    else:
        print("No supported models — check key/credits/region")

except Exception as e:
    print("Error:", e)