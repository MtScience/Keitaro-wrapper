from sqlalchemy import Column, Integer, String, Boolean, UniqueConstraint
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
Base = declarative_base()


class StreamOfferState(Base):
    __tablename__ = "stream_offer_states"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, index=True, nullable=False)
    stream_id = Column(Integer, index=True, nullable=False)
    offer_id = Column(Integer, nullable=False)
    offer_name = Column(String, nullable=False)
    share = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)

    __table_args__ = (
        UniqueConstraint("stream_id", "offer_id", name="uq_stream_offer"),
    )


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
