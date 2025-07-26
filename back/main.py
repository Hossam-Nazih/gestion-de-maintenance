from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
from routers import auth, demandeur, technicien

from models.user import User
from models.equipement import Equipement
from models.intervention import Intervention
from models.traitement import Traitement

from fastapi.middleware.cors import CORSMiddleware
from routers import equipement  # assuming your router is inside routers folder



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="GMAO Carriprefa API",
    description="API for GMAO (Gestion de Maintenance Assistée par Ordinateur)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware( 
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(demandeur.router, prefix="/api/public", tags=["Public - Demandeur"])  
app.include_router(technicien.router, prefix="/api/tech", tags=["Protected - Technicien"])
app.include_router(equipement.router, prefix="/api", tags=["euipments"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=5000, reload=True)

    