"""
Fix for MongoDB ObjectId serialization issue in FastAPI

This script demonstrates how to fix the MongoDB ObjectId serialization issue
in the VoicePrep AI backend. The issue occurs when FastAPI tries to serialize
MongoDB ObjectId objects to JSON.

To fix this issue, you need to:
1. Create a custom PyObjectId class that extends ObjectId
2. Update Pydantic's JSON encoders to handle ObjectId
3. Update your Pydantic models to use the custom PyObjectId class

Example implementation:
"""

from bson import ObjectId
from pydantic import BaseModel, Field
from pydantic.json import ENCODERS_BY_TYPE
from typing import List, Optional
from datetime import datetime

# Custom Pydantic ObjectId type
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError('Invalid ObjectId')
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type='string')

# Update Pydantic's custom encoders
ENCODERS_BY_TYPE[ObjectId] = str

# Example of how to update the CreditTransaction model
class CreditTransaction(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    amount: int  # Positive for addition, negative for deduction
    type: str  # "signup_bonus", "referral", "purchase", "conversation", "admin_grant"
    description: str
    conversation_id: Optional[str] = None
    payment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

"""
Example of how to update the credit transactions endpoint:

```python
@api_router.get("/credits/transactions", response_model=List[dict])
async def get_credit_transactions(current_user: User = Depends(get_current_user)):
    # Get user's credit transaction history
    transactions = await db.credit_transactions.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).to_list(50)
    
    # Convert ObjectId to string before returning
    for transaction in transactions:
        if "_id" in transaction:
            transaction["_id"] = str(transaction["_id"])
    
    return transactions
```

Alternative approach:

If you don't want to modify your models, you can create a helper function
to convert MongoDB documents to JSON-serializable dictionaries:

```python
def convert_mongo_doc(doc):
    if doc is None:
        return None
    
    doc_copy = doc.copy()
    if "_id" in doc_copy:
        doc_copy["_id"] = str(doc_copy["_id"])
    
    return doc_copy

@api_router.get("/credits/transactions", response_model=List[dict])
async def get_credit_transactions(current_user: User = Depends(get_current_user)):
    # Get user's credit transaction history
    transactions = await db.credit_transactions.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).to_list(50)
    
    # Convert ObjectId to string before returning
    return [convert_mongo_doc(transaction) for transaction in transactions]
```

This approach is simpler but less type-safe than using Pydantic models.
"""