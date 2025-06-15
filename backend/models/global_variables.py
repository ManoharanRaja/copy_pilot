# backend/models/global_variable.py
from pydantic import BaseModel, Field
import uuid

class GlobalVariable(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # "static" or "dynamic"
    value: str = ""        # For static variables
    expression: str = ""   # For dynamic variables