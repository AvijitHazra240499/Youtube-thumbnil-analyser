from fastapi import FastAPI, Query, HTTPException, Form, UploadFile, File as FastAPIFile, Request, Body
from fastapi.responses import JSONResponse, HTMLResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import io
import base64
import random
import requests
import json
from datetime import datetime
from dotenv import load_dotenv
from PIL import Image
from typing import Optional, Dict, Any, List
from pytrends.request import TrendReq
import time

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

app = FastAPI(title="Thumbnail Analyzer API")

# CORS Middleware
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows all localhost and 127.0.0.1 origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print(f"[INFO] CORS middleware enabled for: {origins}")

_groq = os.getenv('GROQ_API_KEY')
if _groq:
    print(f"[DEBUG] GROQ_API_KEY loaded: {_groq[:8]}...{_groq[-4:]}")
else:
    print("[DEBUG] GROQ_API_KEY is NOT loaded!")

# Print DeepSeek API key at startup for debug
print("[DEBUG] DEEPSEEK_API_KEY (startup):", os.getenv("DEEPSEEK_API_KEY"))

# Global exception handler for all uncaught exceptions
def setup_global_exception_handler(app):
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        print(f"[GLOBAL ERROR] {repr(exc)}")
        return JSONResponse(status_code=500, content={"error": str(exc)})

setup_global_exception_handler(app)

@app.options("/upload_and_query")
async def options_upload_and_query():
    # For CORS preflight
    return PlainTextResponse("OK", status_code=200)

@app.get("/")
async def root():
    return HTMLResponse("""
        <html>
            <head><title>Thumbnail Analyzer API</title></head>
            <body>
                <h1>Thumbnail Analyzer API</h1>
                <p>API is running. Use POST /upload_and_query to analyze images.</p>
            </body>
        </html>
    """)

@app.post("/generate_script")
async def generate_script(request: Request, body: dict = Body(...)):
    try:
        topic = body.get('topic', '').strip()
        format_ = body.get('format', 'shorts')
        tone = body.get('tone', 50)
        keywords = body.get('keywords', [])
        include_hooks = body.get('includeHooks', True)
        add_cta = body.get('addCTA', True)
        seo_optimization = body.get('seoOptimization', True)

        if not topic:
            return JSONResponse(status_code=400, content={"error": "Video topic is required"})

        # Compose a prompt that ONLY generates slides based on toggles
        # Add tone-specific guidance
        if tone == 50:
            tone_label = "Balanced"
            tone_instruction = "Write each slide in a clear, neutral, and informative style. Avoid being too formal or too casual."
        elif tone > 50:
            tone_label = "Professional"
            tone_instruction = "Write each slide in a formal, authoritative, and polished style. Use precise language and avoid slang."
        else:
            tone_label = "Conversational"
            tone_instruction = "Write each slide in a friendly, relatable, and informal style. Use simple language and contractions."

        prompt_parts = [
            "You are an expert YouTube script writer.",
            f"The video topic is: {topic}.",
            f"Format: {format_}.",
            f"Tone: {tone_label}.",
            tone_instruction,
            "ONLY create slides for the following enabled sections (do not add extra slides):"
        ]
        slide_titles = []
        if include_hooks:
            slide_titles.append("Hook")
        if seo_optimization:
            slide_titles.append("SEO Tips")
        if add_cta:
            slide_titles.append("Call to Action")
        prompt_parts.append(f"Sections to include: {', '.join(slide_titles)}.")
        prompt_parts.append("For each enabled section, generate a concise and relevant slide. Do NOT generate a full script or extra sections.")
        if keywords:
            prompt_parts.append(f"Incorporate these keywords naturally: {', '.join(keywords)}.")
        prompt_parts.append("Respond in JSON: {\"outline\": [section names], \"script\": [slide content for each section]}. Do not include any other text.")
        prompt = '\n'.join(prompt_parts)
        print("[Gemini DEBUG] Topic received:", topic)
        print("[Gemini DEBUG] Prompt sent to Gemini:\n", prompt)

        gemini_api_key = os.getenv("GEMINI_API_KEY") or "AIzaSyAm9-71D5AYCF9jpPi8Jv5u8cdguF9F5vM"
        if not gemini_api_key:
            return JSONResponse(status_code=500, content={"error": "GEMINI_API_KEY not set"})

        # --- GROQ LLAMA SCRIPT GENERATION (REVERTED) ---
        import json as _json
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            return JSONResponse(status_code=500, content={"error": "GROQ_API_KEY not set"})
        llama_url = "https://api.groq.com/openai/v1/chat/completions"
        llama_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {groq_api_key}"
        }
        # Compose llama_payload for Groq Llama API
        llama_payload = {
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",
            "messages": [
                {"role": "user", "content": [{"type": "text", "text": prompt}]}
            ],
            "max_tokens": 1200
        }
        llama_response = requests.post(
            llama_url,
            headers=llama_headers,
            json=llama_payload,
            timeout=60
        )
        if llama_response.status_code != 200:
            print("[Llama ERROR]", llama_response.status_code, llama_response.text)
            return JSONResponse(status_code=500, content={"error": "Llama API error", "status": llama_response.status_code, "text": llama_response.text})
        try:
            content = llama_response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": "Failed to parse Llama API response", "details": str(e), "text": llama_response.text})
        outline = script = ''
        try:
            parsed = _json.loads(content)
            outline = parsed.get('outline', '')
            script = parsed.get('script', '')
        except Exception:
            script = content
            outline = ''
        return {"outline": outline, "script": script}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
import json
from fastapi.responses import JSONResponse
from fastapi import FastAPI, Query
import requests
import random
import time
from datetime import datetime, timedelta
from pytrends.request import TrendReq
import asyncio

# Initialize Google Trends
pytrends = TrendReq(hl='en-US', tz=360, timeout=(10,25), retries=2, backoff_factor=0.1)

# Cache for storing recent keyword results to avoid repeated calculations
keyword_cache = {}
CACHE_EXPIRY = 3600  # 1 hour cache expiry

# Rate limiting
last_request_time = 0
REQUEST_COOLDOWN = 1  # seconds between requests to respect rate limits

async def get_trends_data(keyword: str) -> dict:
    """Get keyword data from Google Trends with rate limiting"""
    global last_request_time
    
    # Rate limiting
    now = time.time()
    time_since_last = now - last_request_time
    if time_since_last < REQUEST_COOLDOWN:
        await asyncio.sleep(REQUEST_COOLDOWN - time_since_last)
    
    try:
        last_request_time = time.time()
        
        # Get interest over time
        pytrends.build_payload([keyword], cat=0, timeframe='today 3-m', geo='', gprop='youtube')
        interest_over_time = pytrends.interest_over_time()
        
        if not interest_over_time.empty:
            values = interest_over_time[keyword].values
            avg_interest = int(values.mean())
            
            # Calculate trend
            if len(values) > 1:
                trend = 'up' if values[-1] > values[0] * 1.1 else 'down' if values[-1] < values[0] * 0.9 else 'stable'
            else:
                trend = 'stable'
                
            return {
                'avg_interest': avg_interest,
                'trend': trend,
                'timeframe': 'last 3 months'
            }
    except Exception as e:
        print(f"Google Trends error for '{keyword}': {str(e)}")
    
    # Fallback values if API fails
    return {
        'avg_interest': random.randint(20, 80),
        'trend': random.choice(['up', 'stable', 'down']),
        'timeframe': 'last 3 months',
        'cached': False
    }

# Simple keyword difficulty estimator (faster than API calls)
def estimate_keyword_metrics(keyword: str) -> dict:
    """Estimate keyword metrics without external API calls"""
    # Generate a stable hash of the keyword for consistent results
    keyword_hash = hash(keyword) % 1000
    random.seed(keyword_hash)
    
    # Generate metrics based on keyword properties
    word_count = len(keyword.split())
    length_factor = len(keyword) / 50  # 0-1 based on length
    
    # Base metrics (0-100 scale)
    base_volume = random.randint(100, 10000)
    base_competition = random.randint(20, 90)
    
    # Adjust based on keyword properties
    if word_count == 1:
        base_volume *= 1.5  # Single word keywords get more volume
        base_competition *= 1.3
    elif word_count > 3:
        base_volume *= 0.7  # Long tail keywords get less volume
        base_competition *= 0.8
    
    # Ensure within bounds
    search_volume = max(100, min(50000, int(base_volume)))
    competition = max(10, min(95, int(base_competition)))
    
    # Calculate trend (weighted random)
    trend_weights = {'up': 0.4, 'stable': 0.5, 'down': 0.1}
    trend = random.choices(
        list(trend_weights.keys()),
        weights=list(trend_weights.values())
    )[0]
    
    # Calculate scores
    vol_score = min(100, (search_volume / 500) * 1.2)
    comp_score = 100 - (competition * 0.8)
    overall_score = (vol_score * 0.5) + (comp_score * 0.5)
    
    # Adjust for trend
    if trend == 'up':
        overall_score *= 1.1
    elif trend == 'down':
        overall_score *= 0.9
    
    # Calculate difficulty
    if overall_score > 70:
        difficulty = "easy"
    elif overall_score > 40:
        difficulty = "medium"
    else:
        difficulty = "hard"
    
    # Add some random variation
    magic_score = int(overall_score + random.uniform(-5, 5))
    magic_score = max(5, min(95, magic_score))
    
    return {
        "searchVolume": search_volume,
        "competition": competition,
        "trend": trend,
        "magicScore": magic_score,
        "difficulty": difficulty,
        "avgInterest": int(overall_score * 0.8),  # Slightly lower than magic score
        "timeframe": "last 12 months"
    }

def get_google_trends_keywords(query: str, max_results: int = 5) -> list:
    """
    Fetch keywords from Google Trends with deep debug logging and custom user-agent/proxy support.
    Returns list of dicts: [{"keyword": ..., "source": "google_trends"}]
    """
    if not query or not query.strip():
        print("[WARNING] Empty query provided to get_google_trends_keywords")
        return []
    print(f"[DEBUG] Fetching Google Trends data for: {query}")
    try:
        # Custom user-agent and optional proxy from environment
        proxy_url = os.getenv('PYTRENDS_PROXY')
        requests_args = {
            'headers': {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'},
            'verify': False
        }
        if proxy_url:
            print(f"[DEBUG] Using pytrends proxy: {proxy_url}")
            requests_args['proxies'] = {
                'https': proxy_url,
                'http': proxy_url
            }
        else:
            print("[DEBUG] No proxy set for pytrends (PYTRENDS_PROXY not set)")
        pytrends = TrendReq(
            hl='en-US', tz=360, timeout=(15, 30), retries=3, backoff_factor=0.3,
            requests_args=requests_args
        )
        timeframes = ['now 7-d', 'today 1-m', 'today 3-m', 'today 12-m']
        for timeframe in timeframes:
            try:
                print(f"[DEBUG] Trying timeframe: {timeframe}")
                pytrends.build_payload([query], cat=0, timeframe=timeframe, geo='', gprop='youtube')
                related_queries = pytrends.related_queries()
                print(f"[DEBUG] pytrends related_queries raw: {related_queries}")
                if related_queries and query in related_queries:
                    top_queries = related_queries[query].get('top')
                    if top_queries is not None and not top_queries.empty:
                        print(f"[DEBUG] Found {len(top_queries['query'])} keywords from Google Trends: {top_queries['query'].tolist()}")
                        keywords = top_queries['query'].head(max_results).tolist()
                        return [{"keyword": kw, "source": "google_trends"} for kw in keywords]
                print(f"[DEBUG] No results for timeframe: {timeframe}")
            except Exception as e:
                print(f"[WARNING] Error with timeframe {timeframe}: {e}")
                import traceback; traceback.print_exc()
                continue
        try:
            print("[DEBUG] Trying alternative search method...")
            pytrends.build_payload([query], cat=0, timeframe='now 7-d', geo='', gprop='youtube')
            df = pytrends.trending_searches(pn='united_states')
            print(f"[DEBUG] pytrends trending_searches raw: {df}")
            if df is not None and not df.empty:
                keywords = df[0].head(max_results).tolist()
                print(f"[DEBUG] Trending searches keywords: {keywords}")
                return [{"keyword": kw, "source": "google_trends"} for kw in keywords]
        except Exception as e:
            print(f"[WARNING] Fallback method failed: {e}")
            import traceback; traceback.print_exc()
        print("[WARNING] No keywords found in Google Trends")
        return []
    except Exception as e:
        print(f"[ERROR] Google Trends API error: {e}")
        import traceback
        traceback.print_exc()
        return []

import re

def get_deepseek_keywords(query: str, count: int):
    # Fetch keywords from DeepSeek API directly
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print("[WARN] DEEPSEEK_API_KEY not found, skipping DeepSeek.")
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    prompt = f"""Generate exactly {count} YouTube keyword ideas for the topic '{query}'.\nFor each keyword, provide the following metrics in a valid JSON format:\n- keyword (string)\n- searchVolume (integer, estimated)\n- competition (float, 0.0 to 1.0)\n- trend (string: 'up', 'down', 'stable')\n- difficulty (float, 0.0 to 1.0)\n- magicScore (float, 0.0 to 1.0, a blend of all factors)\n- source (string, should be 'deepseek')\n\nReturn ONLY a single JSON object with a 'keywords' key containing an array of these objects. Example:\n{{\n    \"keywords\": [\n        {{\n            \"keyword\": \"Example Keyword\",\n            \"searchVolume\": 12345,\n            \"competition\": 0.8,\n            \"trend\": \"up\",\n            \"difficulty\": 0.6,\n            \"magicScore\": 0.75,\n            \"source\": \"deepseek\"\n        }}\n    ]\n}}\n"""

    data = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 2048,
        "stream": False
    }
    
    endpoint = "https://api.deepseek.com/v1/chat/completions"
    print(f"[DEBUG] Sending request to Deepseek API for query: '{query}'")
    
    try:
        response = requests.post(
            endpoint,
            headers=headers,
            json=data,
            timeout=30
        )
        
        response.raise_for_status()
        response_json = response.json()
        
        # Extract the content from the response
        if "choices" in response_json and len(response_json["choices"]) > 0:
            content = response_json["choices"][0]["message"]["content"]
            
            # Parse the JSON string in the response
            try:
                keywords_data = json.loads(content)
                if not isinstance(keywords_data, dict) or "keywords" not in keywords_data:
                    print(f"[ERROR] Invalid keywords format in response: {keywords_data}")
                    return None
                return keywords_data
            except json.JSONDecodeError as je:
                print(f"[ERROR] Failed to parse keywords JSON: {je}")
                print(f"[DEBUG] Raw content that failed to parse: {content}")
                return None
        else:
            print(f"[ERROR] Unexpected response format from Deepseek: {response_json}")
            return None
            
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if hasattr(e, 'response') and e.response is not None:
            error_msg += f" | Status: {e.response.status_code} | Response: {e.response.text}"
        print(f"[ERROR] Deepseek API request failed for '{query}': {error_msg}")
        return None
    except Exception as e:
        print(f"[ERROR] Unexpected error in get_deepseek_keywords for '{query}': {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def get_groq_keywords(query: str, count: int) -> list:
    """Fetch keywords from Groq AI, returning [{'keyword': ..., 'source': 'groq'}]."""
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        print("[ERROR] GROQ_API_KEY not set")
        return []
    try:
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        prompt = (
            f"List exactly {count} specific and trending YouTube keywords related to '{query}'. "
            "Each keyword should be 1-3 words maximum. "
            "Return ONLY a valid JSON array of strings like [\"keyword1\", \"keyword2\"]. "
            "Do not include any other text or formatting. "
            "Example output: [\"keyword one\", \"second keyword\"]"
        )
        data = {
            "model": "llama3-70b-8192",
            "messages": [
                {"role": "system", "content": "You are a helpful YouTube keyword research assistant."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 256,
            "temperature": 0.7
        }
        print(f"[DEBUG] Sending request to Groq API with prompt: {prompt[:100]}...")
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=data,  # Fix: use json=data instead of json=payload
            timeout=45
        )
        response_text = response.text
        print(f"[DEBUG] Groq API response status: {response.status_code}")
        print(f"[DEBUG] Groq API response: {response_text[:200]}...")
        if response.status_code != 200:
            print(f"[ERROR] Groq API error: {response.status_code} - {response.text}")
            print(f"[ERROR] Groq API error: {response.status_code} - {response_text}")
            return []
        data = response.json()
        try:
            if not data.get("choices"):
                print("[ERROR] No choices in Groq API response")
                return []
            content = data["choices"][0].get("message", {}).get("content", "")
            if not content:
                print("[ERROR] Empty content in Groq API response")
                return []
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:-3].strip()
            elif content.startswith('```'):
                content = content[3:-3].strip()
            keywords = json.loads(content)
            if not isinstance(keywords, list):
                print(f"[ERROR] Expected list but got: {type(keywords)}")
                return []
            filtered = []
            for kw in keywords:
                if not isinstance(kw, str):
                    continue
                kw = kw.strip()
                if not kw or kw.lower() in {"how to", "tutorial", "tips", "how", "to", "what", "why"}:
                    continue
                filtered.append({"keyword": kw, "source": "groq"})
                if len(filtered) >= count:
                    break
            print(f"[DEBUG] Got {len(filtered)} keywords from Groq")
            return filtered
        except json.JSONDecodeError as je:
            print(f"[ERROR] Failed to parse Groq response as JSON: {je}")
            print(f"[DEBUG] Content that failed to parse: {content}")
            return []
    except requests.exceptions.RequestException as re:
        print(f"[ERROR] Request to Groq API failed: {re}")
        return []
    except Exception as e:
        print(f"[ERROR] Unexpected error in get_groq_keywords: {e}")
        import traceback
        traceback.print_exc()
        return []

@app.get("/analyze_keyword")
async def analyze_keyword(query: str = Query(..., min_length=2), suggest: int = Query(5, ge=1, le=10)):
    """
    Get detailed, AI-powered keyword analysis using OpenRouter (GPT-3.5 Turbo or similar).
    """
    print(f"\n{'='*50}\n[DEBUG] Starting keyword analysis for query: '{query}', suggest: {suggest}")
    try:
        if not query or not query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        query = query.strip()
        suggest = min(max(suggest, 1), 10)
        # Use OpenRouter API (GPT-3.5 Turbo)
        result = await get_openrouter_keywords(query, suggest)
        print(f"[SUCCESS] Retrieved {len(result['keywords'])} keywords for '{query}' from OpenRouter")
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        error_msg = f"An unexpected error occurred during keyword analysis for '{query}': {str(e)}"
        print(f"[CRITICAL] {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)

async def get_openrouter_keywords(query: str, count: int = 5) -> dict:
    """
    Get related keywords using OpenRouter API with DeepSeek model
    """
    # Debug: Print all environment variables
    print("\n[DEBUG] Checking environment variables...")
    for key, value in os.environ.items():
        if 'API' in key or 'KEY' in key or 'OPENROUTER' in key.upper():
            masked_value = value[:4] + '*' * (len(value) - 8) + value[-4:] if len(value) > 8 else '***'
            print(f"[DEBUG] {key}: {masked_value}")
    
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_api_key:
        error_msg = "OPENROUTER_API_KEY environment variable not set"
        print(f"[ERROR] {error_msg}")
        raise ValueError(error_msg)
    
    print(f"[DEBUG] Using OpenRouter API key: {openrouter_api_key[:4]}...{openrouter_api_key[-4:]}")
    
    # Prepare the prompt with clear instructions for JSON output
    system_prompt = """You are an expert in YouTube SEO and keyword research. 
    Generate highly relevant and specific search terms based on the user's query.
    
    For each term, create a JSON object with these exact fields:
    - keyword: (string) the search term, 2-5 words
    - searchVolume: (number) estimated monthly searches (1000-1000000)
    - competition: (string) one of: 'Low', 'Medium', 'High'
    - trend: (string) one of: 'Rising', 'Stable', 'Falling'
    - difficulty: (number) 1-100, where 1 is easiest to rank for
    - magicScore: (number) 1-100, overall quality score
    - recommendations: (string) 1-2 sentences of content ideas
    - seoTips: (string) 1-2 actionable SEO tips"""

    user_prompt = f"""
IMPORTANT: You MUST return a valid JSON array of exactly {count} objects, nothing else. No markdown, no explanations, no extra text before or after, only the JSON array. If you do not, your response will be discarded.
List {count} highly relevant YouTube keywords for "{query}" as a JSON array of objects with fields: keyword, searchVolume, competition, trend, difficulty, magicScore, recommendations, seoTips. Each object MUST have all fields present and not empty. No explanations, no markdown, only the JSON array.
"""
    
    headers = {
        "Authorization": f"Bearer {openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "YouTube Thumbnail Analysis"
    }
    
    payload = {
        "model": "mistralai/mistral-nemo:free",  # Mistral Nemo (free) model for OpenRouter
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2000,
        "top_p": 0.9,
        "frequency_penalty": 0.5,
        "presence_penalty": 0.5,
        "response_format": { "type": "json_object" }  # Request JSON response format
    }
    
    try:
        import httpx
        import json
        from datetime import datetime
        
        print(f"[DEBUG] Sending request to OpenRouter API...")
        
        # Make the API request
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )
        
        # Log response details
        print(f"[DEBUG] Response status: {response.status_code}")
        print(f"[DEBUG] Response headers: {dict(response.headers)}")
        
        # Check for HTTP errors
        response.raise_for_status()
        
        # Parse JSON response
        result = response.json()
        print(f"[DEBUG] Raw API response: {json.dumps(result, indent=2)[:1000]}...")
        
        # Extract the content from the response
        if 'choices' not in result or not result['choices'] or 'message' not in result['choices'][0]:
            raise ValueError("Unexpected response format: missing choices or message in response")
            
        content = result['choices'][0]['message']['content'].strip()
        print(f"[DEBUG] Extracted content: {content[:500]}...")
        
        # Clean up the content to extract just the JSON array
        content = content.strip()
        if content.startswith('```json'):
            content = content[7:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        print(f"[DEBUG] Cleaned content: {content[:500]}...")
        
        # Parse the JSON response
        try:
            import re
            import json
            # Try to extract all JSON objects for keywords using regex
            keyword_objs = re.findall(r'\{[^{}]*?"keyword"[^{}]*?\}', content, re.DOTALL)
            valid_keywords = []
            for obj_str in keyword_objs:
                try:
                    kw = json.loads(obj_str)
                except Exception:
                    continue
                cleaned = {
                    "keyword": kw.get("keyword", ""),
                    "searchVolume": kw.get("searchVolume", 0),
                    "competition": kw.get("competition", ""),
                    "trend": kw.get("trend", ""),
                    "difficulty": kw.get("difficulty", 0),
                    "magicScore": kw.get("magicScore", 0),
                    "recommendations": kw.get("recommendations", ""),
                    "seoTips": kw.get("seoTips", ""),
                    "source": "openai_via_openrouter"
                }
                valid_keywords.append(cleaned)
            # If fewer than requested, make a second API call to try to get more keywords (no padding)
            if len(valid_keywords) < count:
                print(f"[INFO] Got only {len(valid_keywords)} keywords, retrying once to get more...")
                # Make a second API call with the same payload
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response2 = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers=headers,
                        json=payload
                    )
                response2.raise_for_status()
                result2 = response2.json()
                content2 = result2['choices'][0]['message']['content'].strip()
                if content2.startswith('```json'):
                    content2 = content2[7:]
                if content2.endswith('```'):
                    content2 = content2[:-3]
                content2 = content2.strip()
                keyword_objs2 = re.findall(r'\{[^{}]*?"keyword"[^{}]*?\}', content2, re.DOTALL)
                for obj_str in keyword_objs2:
                    try:
                        kw = json.loads(obj_str)
                        cleaned = {
                            "keyword": kw.get("keyword", ""),
                            "searchVolume": kw.get("searchVolume", 0),
                            "competition": kw.get("competition", ""),
                            "trend": kw.get("trend", ""),
                            "difficulty": kw.get("difficulty", 0),
                            "magicScore": kw.get("magicScore", 0),
                            "recommendations": kw.get("recommendations", ""),
                            "seoTips": kw.get("seoTips", ""),
                            "source": "openai_via_openrouter"
                        }
                        # Avoid duplicates
                        if not any(x["keyword"].lower() == cleaned["keyword"].lower() for x in valid_keywords):
                            valid_keywords.append(cleaned)
                    except Exception:
                        continue
            # Always return all keywords provided by the LLM (even if more than requested), but ensure at least 5
            # If after two calls there are fewer than 5, return as many as possible (never pad with empty objects)
            if not valid_keywords:
                raise HTTPException(status_code=502, detail=f"No valid keywords returned from OpenRouter for '{query}' after two attempts")
            if len(valid_keywords) < 5:
                print(f"[WARNING] Only {len(valid_keywords)} keywords found after two attempts (less than 5)")
            return {
                "query": query,
                "keywords": valid_keywords,
                "timestamp": datetime.now().isoformat()
            }
            
        except json.JSONDecodeError as je:
            print(f"[ERROR] Failed to parse keywords from response: {je}")
            print(f"[DEBUG] Content that failed to parse: {content}")
            raise ValueError(f"Invalid JSON in API response: {je}")
            
    except httpx.HTTPStatusError as e:
        error_msg = f"OpenRouter API request failed with status {e.response.status_code}"
        print(f"[ERROR] {error_msg}")
        if e.response.content:
            try:
                error_detail = e.response.json()
                print(f"[DEBUG] Error details: {json.dumps(error_detail, indent=2)}")
                error_msg = f"{error_msg}: {error_detail.get('error', {}).get('message', str(error_detail))}"
            except:
                error_msg = f"{error_msg}: {e.response.text}"
        print(f"[DEBUG] Response body: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=error_msg)
    except Exception as e:
        print(f"[ERROR] Unexpected error in get_openrouter_keywords: {e}")
        import traceback
        traceback.print_exc()
        raise

@app.on_event("startup")
async def startup_event():
    deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
    print(f"[DEBUG] DEEPSEEK_API_KEY: {deepseek_api_key}")

def get_keyword_metrics(keyword: str) -> dict:
    """
    Get metrics for a single keyword with safe fallbacks.
    Returns a dictionary with keyword metrics or None if an error occurs.
    """
    try:
        print(f"[DEBUG] Getting metrics for keyword: {keyword}")
        
        # Generate mock metrics (replace with real API calls if needed)
        metrics = {
            "keyword": keyword,
            "searchVolume": random.randint(1000, 100000),
            "competition": round(random.uniform(0.1, 1.0), 2),
            "trend": random.choice(['up', 'stable', 'down']),
            "difficulty": round(random.uniform(0.1, 1.0), 2),
            "magicScore": round(random.uniform(0.1, 1.0), 2),
        }
        print(f"[DEBUG] Metrics for '{keyword}': {metrics}")
        return metrics
        
    except Exception as e:
        print(f"[ERROR] Failed to get metrics for '{keyword}': {str(e)}")
        # Return a safe default if metrics generation fails
        return {
            "keyword": keyword,
            "searchVolume": 0,
            "competition": 0.0,
            "trend": "unknown",
            "difficulty": 0.0,
            "magicScore": 0.0,
            "error": str(e),
            "fallback": True
        }

@app.post("/generate_tweet")
async def generate_tweet(request: Request, image: UploadFile = FastAPIFile(None), topic: str = Form(None)):
    try:
        # Accept either image or topic
        if not image and not (topic and topic.strip()):
            return JSONResponse(status_code=400, content={"error": "Please upload an image or enter a topic."})
        img_str = None
        if image:
            contents = await image.read()
            try:
                img_obj = Image.open(io.BytesIO(contents))
            except Exception as e:
                print(f"[ERROR] Invalid image: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")
            buffered = io.BytesIO()
            img_obj.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode()

        groq_api_key = os.getenv("GROQ_API_KEY")
        openrouter_api_key = os.getenv("OPENROUTER_API_KEY")

        tweet_prompt = "Generate 3 creative, viral tweets (each max 280 chars, no hashtags) for a YouTube/Instagram post based on this {}. Output each tweet on a separate line, no extra text.".format(
            "image" if image else "topic"
        )
        ig_prompt = "Write 3 engaging Instagram posts (each max 300 chars, friendly tone, emoji ok, no hashtags) for a YouTube/Instagram post based on this {}. Output each post on a separate line, no extra text.".format(
            "image" if image else "topic"
        )
        # Compose messages for Groq
        def groq_messages(prompt):
            if img_str:
                return [
                    {"role": "user", "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_str}"}}
                    ]}
                ]
            else:
                return [
                    {"role": "user", "content": [
                        {"type": "text", "text": f"{prompt}\nTopic: {topic}"}
                    ]}
                ]
        def call_groq(prompt):
            headers = {"Authorization": f"Bearer {groq_api_key}", "Content-Type": "application/json"}
            payload = {
                "model": "meta-llama/llama-4-scout-17b-16e-instruct",
                "messages": groq_messages(prompt),
                "max_tokens": 800
            }
            try:
                resp = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=30)
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"].strip()
                else:
                    print(f"[GROQ ERROR] {resp.status_code}: {resp.text}")
                    return None
            except Exception as e:
                print(f"[GROQ EXCEPTION] {str(e)}")
                return None
        def call_deepseek(prompt):
            if not openrouter_api_key:
                print("[ERROR] OPENROUTER_API_KEY not set for DeepSeek fallback")
                return None
            headers = {"Authorization": f"Bearer {openrouter_api_key}", "Content-Type": "application/json"}
            messages = [
                {"role": "user", "content": prompt}
            ]
            payload = {"model": "deepseek-coder-v1-8b", "messages": messages, "max_tokens": 800}
            try:
                resp = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers, timeout=30)
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"].strip()
                else:
                    print(f"[DEEPSEEK ERROR] {resp.status_code}: {resp.text}")
                    return None
            except Exception as e:
                print(f"[DEEPSEEK EXCEPTION] {str(e)}")
                return None

        # Try Groq first
        tweet = call_groq(tweet_prompt)
        ig = call_groq(ig_prompt)
        # If Groq fails, try DeepSeek
        if not tweet or not ig:
            tweet_fallback = call_deepseek(tweet_prompt)
            ig_fallback = call_deepseek(ig_prompt)
            if tweet_fallback:
                tweet = tweet_fallback
            if ig_fallback:
                ig = ig_fallback
        if not tweet and not ig:
            return JSONResponse(status_code=500, content={"error": "Both Groq and DeepSeek failed to generate content."})
        # Split into lists, remove empty lines
        tweet_list = [t.strip() for t in (tweet or '').split('\n') if t.strip()]
        ig_list = [t.strip() for t in (ig or '').split('\n') if t.strip()]
        return {"tweets": tweet_list, "igs": ig_list}
    except Exception as e:
        print(f"[TWEET GENERATOR ERROR] {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/upload_and_query")
async def upload_and_query(request: Request, image: UploadFile = FastAPIFile(...), query: str = Form(...)):
    print(f"[REQUEST] /upload_and_query from {request.client.host}")
    try:
        if not image.content_type.startswith("image/"):
            print("[ERROR] File is not an image.")
            raise HTTPException(status_code=400, detail="File must be an image")
        contents = await image.read()
        try:
            img_obj = Image.open(io.BytesIO(contents))
        except Exception as e:
            print(f"[ERROR] Invalid image: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

        buffered = io.BytesIO()
        img_obj.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            print("[ERROR] GROQ_API_KEY not set")
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not set")

        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }

        # Prompts for heading, description and hashtags
        heading_prompt = "Generate a catchy, relevant heading/title for a YouTube/Instagram post based on this image. Reply with only the title."
        desc_prompt = "Generate a detailed, post-ready description for a YouTube/Instagram post based on this image."
        hash_prompt = (
            "Generate up to 10 highly relevant, platform-ready social media hashtags for a post based on this image. "
            "Return them in a single line, separated by spaces, each starting with the # symbol."
        )

        def make_api_request(prompt, encoded_image):
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"}}
                    ]
                }
            ]
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json={
                    "model": "meta-llama/llama-4-scout-17b-16e-instruct",
                    "messages": messages,
                    "max_tokens": 1000
                },
                headers={
                    "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
                    "Content-Type": "application/json"
                },
                timeout=30
            )
            return response

        # Make requests to the multimodal model for heading, description and hashtags
        heading_response = make_api_request(heading_prompt, img_str)
        desc_response = make_api_request(desc_prompt, img_str)
        hash_response = make_api_request(hash_prompt, img_str)

        print("[DEBUG] Got Groq API responses for heading, description and hashtags...")
        if any(r.status_code != 200 for r in [heading_response, desc_response, hash_response]):
            print("[ERROR] Failed to get response from Groq API (heading/description/hashtags)")
            print(f"[DEBUG] Heading status: {heading_response.status_code}, text: {heading_response.text}")
            print(f"[DEBUG] Description status: {desc_response.status_code}, text: {desc_response.text}")
            print(f"[DEBUG] Hashtag status: {hash_response.status_code}, text: {hash_response.text}")
            return JSONResponse(status_code=500, content={
                "error": "Failed to get response from Groq API (heading/description/hashtags)",
                "heading_status": heading_response.status_code,
                "heading_text": heading_response.text,
                "desc_status": desc_response.status_code,
                "desc_text": desc_response.text,
                "hash_status": hash_response.status_code,
                "hash_text": hash_response.text
            })
        try:
            heading = heading_response.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[ERROR] Failed to parse heading response: {str(e)}")
            heading = "AI Analysis"
        try:
            description = desc_response.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[ERROR] Failed to parse description response: {str(e)}")
            description = ""
        try:
            hashtags = hash_response.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[ERROR] Failed to parse hashtag response: {str(e)}")
            hashtags = ""
        print("[SUCCESS] Returning heading, description and hashtags.")
        return {
            "heading": heading,
            "description": description,
            "hashtags": hashtags
        }

    except HTTPException as e:
        print(f"[HTTPException] {str(e.detail)}")
        raise e
    except Exception as e:
        print(f"[UNEXPECTED ERROR] {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})
