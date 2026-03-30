"""FastAPI application — the entry point for the backend.

This is where all the API endpoints (URLs) are defined.
The frontend sends requests here, and the backend responds
with trip plans, activities, and optimised itineraries.

To run locally: uvicorn travel.api.app:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from travel.api.routes import router

app = FastAPI(
    title="Travel Agent API",
    description="AI-powered trip itinerary optimiser",
    version="0.1.0",
)

# Allow the frontend to talk to the backend
# (they run on different ports during development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/health")
async def health_check():
    """Simple health check — is the server running?"""
    return {"status": "ok", "version": "0.1.0"}
