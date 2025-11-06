from fastapi import APIRouter, Query
from typing import Optional
from ..models.schemas import MetricsResponse
from ..utils.inference import metrics as metrics_fn

router = APIRouter()

@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(model: Optional[str] = Query(default=None)):
    m = metrics_fn(model)
    return {
        "model": m["model"],
        "accuracy": m["accuracy"],
        "recall": m["recall"],
        "f1": m["f1"],
        "confusion_matrix_url": m.get("confusion_matrix_url"),
    }