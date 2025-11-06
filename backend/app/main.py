from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .routers import predict, compare, metrics, heatmap

app = FastAPI(title="DeepFish API", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (for images/heatmaps)
static_dir = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Routers
app.include_router(predict.router)
app.include_router(compare.router)
app.include_router(metrics.router)
app.include_router(heatmap.router)

@app.get("/health")
async def health():
    return {"status": "ok"}