from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from typing import Optional
import requests
import os
from dotenv import load_dotenv
from PIL import Image
import io
import base64

load_dotenv()

app = FastAPI(title="Thumbnail Analyzer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002"],  # Allow requests from frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/upload_and_query")
async def upload_and_query(file: UploadFile, query: str):
    try:
        # Check if file is an image
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read and validate image
        contents = await file.read()
        try:
            image = Image.open(io.BytesIO(contents))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

        # Convert image to base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        # Get Groq API key from environment
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not set")

        # Prepare requests for both models
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }

        # Llama-3.2-11b-vision request
        llama_payload = {
            "model": "llama-3.2-11b-vision-preview",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": query
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{img_str}"
                            }
                        }
                    ]
                }
            ]
        }

        # Llama-3.2-90b-vision request
        llava_payload = {
            "model": "llama-3.2-90b-vision-preview",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": query
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{img_str}"
                            }
                        }
                    ]
                }
            ]
        }

        # Send requests to Groq API
        llama_response = requests.post(
            "https://api.groq.com/v1/chat/completions",
            headers=headers,
            json=llama_payload
        )

        llava_response = requests.post(
            "https://api.groq.com/v1/chat/completions",
            headers=headers,
            json=llava_payload
        )

        # Check responses
        if llama_response.status_code != 200 or llava_response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail="Failed to get response from Groq API"
            )

        return {
            "llama": llama_response.json()["choices"][0]["message"]["content"],
            "llava": llava_response.json()["choices"][0]["message"]["content"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
