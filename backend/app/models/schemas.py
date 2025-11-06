from typing import Dict, Optional
from pydantic import BaseModel, Field
try:
    # Pydantic v2
    from pydantic import ConfigDict
    V2 = True
except Exception:
    V2 = False

# Base config to allow alias population
class AliasModel(BaseModel):
    if 'ConfigDict' in globals():
        model_config = ConfigDict(populate_by_name=True)  # type: ignore
    else:
        class Config:
            allow_population_by_field_name = True

# Request Schemas
class PredictRequest(AliasModel):
    image: str  # base64 encoded image without header

class CompareRequest(AliasModel):
    image: str  # base64 encoded image without header

# Response Schemas
# NOTE: Define classes conditionally for Pydantic v1/v2 compatibility
if V2:
    # 避免与外层 PredictResponse 重名，使用别名
    class _PredictResponse(AliasModel):
        class_: str = Field(serialization_alias='class', validation_alias='class')
        confidence: float
        inference_time: float
        model: str
        draw_url: Optional[str] = None
else:
    class PredictResponse(AliasModel):
        class_: str = Field(alias='class')
        confidence: float
        inference_time: float
        model: str
        draw_url: Optional[str] = None

class ModelMetrics(AliasModel):
    accuracy: Dict[str, float]
    recall: float
    f1: float

if V2:
    class _CompareItem(AliasModel):
        class_: str = Field(serialization_alias='class', validation_alias='class')
        confidence: float
        inference_time: float
        image_url: Optional[str] = None
        metrics: ModelMetrics
else:
    class CompareItem(AliasModel):
        class_: str = Field(alias='class')
        confidence: float
        inference_time: float
        image_url: Optional[str] = None
        metrics: ModelMetrics

class CompareResponse(AliasModel):
    model1: CompareItem
    model2: CompareItem
    model3: CompareItem

class MetricsResponse(AliasModel):
    model: str
    accuracy: Dict[str, float]
    recall: float
    f1: float
    confusion_matrix_url: Optional[str] = None

class HeatmapResponse(AliasModel):
    image_id: str
    heatmap_url: str