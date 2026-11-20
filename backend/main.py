from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from router import keitaro_router

app = FastAPI(title="Keitaro Wrapper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    keitaro_router, prefix="/api", tags=["API"]
)


@app.on_event("startup")
async def on_startup():
    await init_db()



