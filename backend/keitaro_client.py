import httpx
from typing import Any
from config import settings


class KeitaroClient:
    def __init__(self):
        self.base_url = f"{settings.KEITARO_URL.rstrip('/')}/admin_api/v1"
        self.headers = {
            "Api-Key": settings.KEITARO_API_KEY,
            "Content-Type": "application/json",
        }

    async def __resolve_ids(self, group_name: str, source_name: str, domain: str) -> dict[str, Any]:
        async with httpx.AsyncClient() as client:
            groups = await client.get(
                f"{self.base_url}/groups?type=campaigns",
                headers=self.headers
            )
            sources = await client.get(
                f"{self.base_url}/traffic_sources",
                headers=self.headers
            )
            domains = await client.get(
                f"{self.base_url}/domains",
                headers=self.headers
            )

        res = {}
        for group in groups:
            if group.name == group_name:
                res["group_id"] = group.id
        for source in sources:
            if source.name == source_name:
                res["source_id"] = source.id
        for domain in domains:
            if domain.name == domain:
                res["domain_id"] = domain.id

        return res

    async def create_campaign(self, name: str, alias: str) -> dict[str, Any]:
        params = await self.__resolve_ids(
            group_name="FORTESTS",
            source_name="FORTESTS",
            domain="https://in.posdk.xyz/"
        )

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/campaigns",
                headers=self.headers,
                json={
                    "name": name,
                    "alias": alias,
                    "state": "active",
                    **params,
                },
            )
            resp.raise_for_status()
            return resp.json()

    async def create_stream(self, payload: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/streams",
                headers=self.headers,
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_campaign_streams(self, campaign_id: int) -> list[dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/campaigns/{campaign_id}/streams",
                headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json()

    async def update_stream(self, stream_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient() as client:
            resp = await client.put(
                f"{self.base_url}/streams/{stream_id}",
                headers=self.headers,
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_all_offers(self) -> list[dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/offers",
                headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json()


keitaro = KeitaroClient()
