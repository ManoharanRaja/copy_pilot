from pydantic import BaseModel
from typing import Optional

class CopyJob(BaseModel):
    id: Optional[int] = None
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