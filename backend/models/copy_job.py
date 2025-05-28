from pydantic import BaseModel
from typing import Optional

class CopyJob(BaseModel):
    id: Optional[int]
    name: str
    source: str
    target: str
    schedule: Optional[str] = None