from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uuid

class CopyJob(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    sourceType: str
    sourceAzureId: Optional[str] = None
    sourceContainer: Optional[str] = None
    source: str
    sourceFileMask: Optional[str] = None
    targetType: str
    targetAzureId: Optional[str] = None
    targetContainer: Optional[str] = None
    target: str
    targetFileMask: Optional[str] = None
    local_variables: List[Dict[str, Any]] = Field(default_factory=list)