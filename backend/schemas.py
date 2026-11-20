from pydantic import BaseModel
from typing import List


class CampaignCreateRequest(BaseModel):
    name: str
    alias: str
    country_codes: List[str]


class OfferItemSchema(BaseModel):
    offer_id: int
    offer_name: str
    share: int
    is_pinned: bool = False
    is_deleted: bool = False


class StreamSchema(BaseModel):
    id: int
    name: str
    position: int
    schema_type: str
    offers: List[OfferItemSchema]


class StreamUpdateRequest(BaseModel):
    offers: List[OfferItemSchema]
