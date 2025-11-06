from fastapi import APIRouter
from ..models.schemas import HeatmapResponse
from ..utils.inference import heatmap as heatmap_fn

router = APIRouter()

@router.get("/heatmap/{image_id}", response_model=HeatmapResponse)
async def get_heatmap(image_id: str):
    h = heatmap_fn(image_id)
    return {
        "image_id": h["image_id"],
        "heatmap_url": h["heatmap_url"],
    }