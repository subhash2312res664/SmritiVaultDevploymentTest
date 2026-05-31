from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.auth_routes import auth_router
from app.history_route import history_router

# Import these only if you have them — comment out if not yet added
try:
    from app.detect_route import detect_router
    DETECT_ENABLED = True
except ImportError:
    DETECT_ENABLED = False

try:
    from app.live_detect_route import live_router
    LIVE_ENABLED = True
except ImportError:
    LIVE_ENABLED = False

app = FastAPI(
    title="SmritiVault — Smart AI Memory Assistant",
    description="Manual + AI + Live Camera + Offline memory assistant",
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(router)
app.include_router(history_router)

if DETECT_ENABLED:
    app.include_router(detect_router)

if LIVE_ENABLED:
    app.include_router(live_router)


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status":  "ok",
        "message": "SmritiVault v4.0 running!",
        "modules": {
            "ai_detect": DETECT_ENABLED,
            "live":      LIVE_ENABLED,
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)
