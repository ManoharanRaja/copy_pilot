from pydantic import BaseModel
from typing import Optional, Dict, Any

class DataSource(BaseModel):
    id: Optional[int]= None   # <-- Make sure this is Optional and has a default
    name: str
    type: str
    config: Dict[str, Any]