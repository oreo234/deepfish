from fastapi import APIRouter
from ..models.schemas import CompareRequest, CompareResponse, CompareItem, ModelMetrics
from ..utils.inference import compare as compare_fn

router = APIRouter()

@router.post("/compare", response_model=CompareResponse)
async def compare(req: CompareRequest):
    results = compare_fn(req.image)
    # Return dict with 'class' key names in nested items
    return {
        "model1": {
            "class": results["model1"]["class_"],
            "confidence": results["model1"]["confidence"],
            "inference_time": results["model1"]["inference_time"],
            "image_url": results["model1"].get("image_url"),
            "metrics": results["model1"]["metrics"],
        },
        "model2": {
            "class": results["model2"]["class_"],
            "confidence": results["model2"]["confidence"],
            "inference_time": results["model2"]["inference_time"],
            "image_url": results["model2"].get("image_url"),
            "metrics": results["model2"]["metrics"],
        },
        "model3": {
            "class": results["model3"]["class_"],
            "confidence": results["model3"]["confidence"],
            "inference_time": results["model3"]["inference_time"],
            "image_url": results["model3"].get("image_url"),
            "metrics": results["model3"]["metrics"],
        },
    }