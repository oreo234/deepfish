import time
from typing import Dict, Tuple, Optional

# NOTE: These are mock inference functions. Replace with real model inference.

def predict(image_b64: str) -> Tuple[str, float, float, str]:
    start = time.time()
    # Simulate inference
    time.sleep(0.2)
    cls = "金鱼 (Carassius auratus)"
    confidence = 0.92
    model = "YOLOv5-S"
    inference_time = round(time.time() - start, 3)
    return cls, confidence, inference_time, model


def compare(image_b64: str) -> Dict[str, Dict]:
    # Simulate multiple models results
    return {
        "model1": {
            "class_": "金鱼 (Carassius auratus)",
            "confidence": 0.92,
            "inference_time": 0.45,
            "image_url": None,
            "metrics": {
                "accuracy": {"top1": 0.89, "top5": 0.98},
                "recall": 0.87,
                "f1": 0.88,
            },
        },
        "model2": {
            "class_": "金鱼 (Carassius auratus)",
            "confidence": 0.85,
            "inference_time": 0.38,
            "image_url": None,
            "metrics": {
                "accuracy": {"top1": 0.82, "top5": 0.95},
                "recall": 0.84,
                "f1": 0.83,
            },
        },
        "model3": {
            "class_": "锦鲤 (Cyprinus carpio)",
            "confidence": 0.78,
            "inference_time": 0.32,
            "image_url": None,
            "metrics": {
                "accuracy": {"top1": 0.80, "top5": 0.94},
                "recall": 0.79,
                "f1": 0.79,
            },
        },
    }


def metrics(model_id: Optional[str]) -> Dict:
    # Return mock metrics for a model
    base = {
        "accuracy": {"top1": 0.85, "top5": 0.96},
        "recall": 0.84,
        "f1": 0.84,
    }
    name = model_id or "default"
    return {
        "model": name,
        **base,
        "confusion_matrix_url": None,
    }


def heatmap(image_id: str) -> Dict:
    # Return mock heatmap url
    return {
        "image_id": image_id,
        "heatmap_url": f"/static/heatmaps/{image_id}.svg",
    }