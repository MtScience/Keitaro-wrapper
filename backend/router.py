from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db, StreamOfferState
from keitaro_client import keitaro
from schemas import (
    CampaignCreateRequest,
    StreamSchema,
    OfferItemSchema,
    StreamUpdateRequest,
)


keitaro_router = APIRouter()


@keitaro_router.post("/campaigns")
async def create_campaign(req: CampaignCreateRequest):
    try:
        campaign = await keitaro.create_campaign(name=req.name, alias=req.alias)
        campaign_id = campaign["id"]

        stream_1_payload = {
            "campaign_id": campaign_id,
            "name": "Geo Filter -> Google",
            "position": 1,
            "schema": "redirect",
            "action_type": "http",
            "action_payload": "https://google.com",
            "filters": [
                {
                    "name": "country",
                    "mode": "accept",
                    "payload": [c.strip().upper() for c in req.country_codes if c.strip()],
                }
            ],
            "state": "active",
        }
        s1 = await keitaro.create_stream(stream_1_payload)

        stream_2_payload = {
            "campaign_id": campaign_id,
            "name": "Main Offers Stream",
            "position": 2,
            "schema": "landings",
            "offers": [],
            "landings": [],
            "state": "active",
        }
        s2 = await keitaro.create_stream(stream_2_payload)

        return {"campaign": campaign, "streams": [s1, s2]}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Keitaro API Error: {str(e)}")


@keitaro_router.get("/campaigns/{campaign_id}/streams", response_model=list[StreamSchema])
async def load_campaign_streams(campaign_id: int, db: AsyncSession = Depends(get_db)):
    try:
        kt_streams = await keitaro.get_campaign_streams(campaign_id)
        all_kt_offers = await keitaro.get_all_offers()
        offer_name_map = {o["id"]: o["name"] for o in all_kt_offers}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Keitaro API Error: {str(e)}")

    result_streams: list[StreamSchema] = []

    for s in kt_streams:
        stream_id = s["id"]
        kt_offers = s.get("offers", [])
        kt_offer_map = {item["offer_id"]: item for item in kt_offers}

        stmt = select(StreamOfferState).where(StreamOfferState.stream_id == stream_id)
        db_records = (await db.execute(stmt)).scalars().all()
        db_map = {rec.offer_id: rec for rec in db_records}

        merged_offers: list[OfferItemSchema] = []

        for oid, kt_item in kt_offer_map.items():
            name = offer_name_map.get(oid, f"Offer #{oid}")
            share = kt_item.get("share", 0)

            if oid in db_map:
                rec = db_map[oid]
                rec.offer_name = name
                rec.share = share
                rec.is_deleted = False
            else:
                rec = StreamOfferState(
                    campaign_id=campaign_id,
                    stream_id=stream_id,
                    offer_id=oid,
                    offer_name=name,
                    share=share,
                    is_pinned=False,
                    is_deleted=False,
                )
                db.add(rec)

            merged_offers.append(
                OfferItemSchema(
                    offer_id=oid,
                    offer_name=name,
                    share=share,
                    is_pinned=rec.is_pinned,
                    is_deleted=False,
                )
            )

        for oid, rec in db_map.items():
            if oid not in kt_offer_map:
                rec.is_deleted = True
                rec.share = 0
                rec.is_pinned = False
                merged_offers.append(
                    OfferItemSchema(
                        offer_id=oid,
                        offer_name=offer_name_map.get(oid, rec.offer_name),
                        share=0,
                        is_pinned=False,
                        is_deleted=True,
                    )
                )

        await db.commit()

        result_streams.append(
            StreamSchema(
                id=stream_id,
                name=s.get("name", f"Stream #{stream_id}"),
                position=s.get("position", 0),
                schema_type=s.get("schema", "landings"),
                offers=merged_offers,
            )
        )

    return result_streams


@keitaro_router.get("/offers/search")
async def search_offers(q: str = Query(..., min_length=1)):
    try:
        offers = await keitaro.get_all_offers()
        matches = [
            {"id": o["id"], "name": o["name"]}
            for o in offers
            if str(o["id"]).startswith(q.strip())
        ]
        return matches[:15]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Keitaro API Error: {str(e)}")


@keitaro_router.put("/campaigns/{campaign_id}/streams/{stream_id}/offers")
async def update_stream_offers(
        campaign_id: int,
        stream_id: int,
        req: StreamUpdateRequest,
        db: AsyncSession = Depends(get_db),
):
    active_offers = [o for o in req.offers if not o.is_deleted]
    kt_offers_payload = [
        {
            "offer_id": o.offer_id,
            "share": o.share,
            "state": "active",
        }
        for o in active_offers
    ]

    try:
        await keitaro.update_stream(
            stream_id,
            {
                "schema": "landings",
                "offers": kt_offers_payload,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed updating Keitaro stream: {str(e)}")

    stmt = select(StreamOfferState).where(StreamOfferState.stream_id == stream_id)
    db_records = (await db.execute(stmt)).scalars().all()
    db_map = {rec.offer_id: rec for rec in db_records}

    for item in req.offers:
        if item.offer_id in db_map:
            rec = db_map[item.offer_id]
            rec.offer_name = item.offer_name
            rec.share = 0 if item.is_deleted else item.share
            rec.is_pinned = False if item.is_deleted else item.is_pinned
            rec.is_deleted = item.is_deleted
        else:
            db.add(
                StreamOfferState(
                    campaign_id=campaign_id,
                    stream_id=stream_id,
                    offer_id=item.offer_id,
                    offer_name=item.offer_name,
                    share=0 if item.is_deleted else item.share,
                    is_pinned=False if item.is_deleted else item.is_pinned,
                    is_deleted=item.is_deleted,
                )
            )

    await db.commit()
    return {"status": "ok"}