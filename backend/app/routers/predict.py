from fastapi import APIRouter
from ..models.schemas import PredictRequest, PredictResponse
from ..utils.inference import predict as predict_fn

router = APIRouter()

@router.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    cls, conf, inf_time, model = predict_fn(req.image)
    # Use dict with 'class' key to match frontend
    return {
        "class": cls,
        "confidence": conf,
        "inference_time": inf_time,
        "model": model,
        "draw_url": None,
    }