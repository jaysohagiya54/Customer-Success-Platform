from fastapi import APIRouter

from app.api.v1 import auth, customers, dashboard, interactions, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(customers.router)
api_router.include_router(interactions.router)
api_router.include_router(dashboard.router)
api_router.include_router(users.router)
