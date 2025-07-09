from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import uuid

class DataSource(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str
    config: Dict[str, Any] # config may contain account_name, account_key, container, sas_token