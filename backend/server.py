from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from typing import List
from datetime import datetime, timezone
import uuid
import logging
from sqlalchemy import Column, String, Boolean, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, delete, update

DATABASE_URL = "sqlite+aiosqlite:///./resources.db"

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

class ResourceDB(Base):
    __tablename__ = "resources"
    
    id = Column(String, primary_key=True)
    url = Column(String, nullable=False)
    login = Column(String, nullable=False)
    password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Resource(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str
    login: str
    password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResourceCreate(BaseModel):
    url: str
    login: str
    password: str

class ResourceUpdate(BaseModel):
    is_active: bool

app = FastAPI()
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@api_router.get("/")
async def root():
    return {"message": "Resource Manager API"}

@api_router.post("/resources", response_model=Resource)
async def create_resource(input: ResourceCreate):
    async with async_session() as session:
        resource = ResourceDB(
            id=str(uuid.uuid4()),
            url=input.url,
            login=input.login,
            password=input.password,
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        session.add(resource)
        await session.commit()
        await session.refresh(resource)
        return Resource.model_validate(resource)

@api_router.get("/resources", response_model=List[Resource])
async def get_resources():
    async with async_session() as session:
        result = await session.execute(select(ResourceDB))
        resources = result.scalars().all()
        return [Resource.model_validate(r) for r in resources]

@api_router.put("/resources/{resource_id}", response_model=Resource)
async def update_resource(resource_id: str, input: ResourceUpdate):
    async with async_session() as session:
        result = await session.execute(
            select(ResourceDB).where(ResourceDB.id == resource_id)
        )
        resource = result.scalar_one_or_none()
        
        if not resource:
            raise HTTPException(status_code=404, detail="Ресурс не найден")
        
        resource.is_active = input.is_active
        await session.commit()
        await session.refresh(resource)
        return Resource.model_validate(resource)

@api_router.delete("/resources/{resource_id}")
async def delete_resource(resource_id: str):
    async with async_session() as session:
        result = await session.execute(
            select(ResourceDB).where(ResourceDB.id == resource_id)
        )
        resource = result.scalar_one_or_none()
        
        if not resource:
            raise HTTPException(status_code=404, detail="Ресурс не найден")
        
        await session.delete(resource)
        await session.commit()
        return {"message": "Ресурс удалён"}

@api_router.post("/resources/import")
async def import_resources(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        text = contents.decode('utf-8')
        
        lines = text.strip().split('\n')
        imported = 0
        errors = []
        
        async with async_session() as session:
            for i, line in enumerate(lines, 1):
                line = line.strip()
                if not line:
                    continue
                
                parts = line.rsplit(':', 2)
                if len(parts) != 3:
                    errors.append(f"Строка {i}: неверный формат (ожидается url:login:pass)")
                    continue
                
                url, login, password = [p.strip() for p in parts]
                
                if not url or not login or not password:
                    errors.append(f"Строка {i}: пустые поля")
                    continue
                
                resource = ResourceDB(
                    id=str(uuid.uuid4()),
                    url=url,
                    login=login,
                    password=password,
                    is_active=True,
                    created_at=datetime.now(timezone.utc)
                )
                session.add(resource)
                imported += 1
            
            await session.commit()
        
        return {
            "message": f"Импортировано ресурсов: {imported}",
            "imported": imported,
            "errors": errors
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка импорта: {str(e)}")

app.include_router(api_router)
