from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.invitations.router import router as invitations_router
from app.modules.items.router import router as items_router
from app.modules.lists.router import router as lists_router
from app.modules.members.router import router as members_router
from app.modules.memories.router import router as memories_router
from app.modules.notifications.devices_router import router as devices_router
from app.modules.notifications.router import router as notifications_router
from app.modules.spaces.router import router as spaces_router
from app.modules.uploads.router import router as uploads_router
from app.modules.users.router import router as users_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_v1_router.include_router(users_router, prefix="/users", tags=["Users"])
api_v1_router.include_router(spaces_router, prefix="/spaces", tags=["Spaces"])
api_v1_router.include_router(invitations_router, tags=["Invitations"])
api_v1_router.include_router(items_router, tags=["Items"])
api_v1_router.include_router(notifications_router, tags=["Notifications"])
api_v1_router.include_router(devices_router, tags=["Devices"])
api_v1_router.include_router(memories_router, tags=["Memories"])
api_v1_router.include_router(members_router, tags=["Members"])
api_v1_router.include_router(uploads_router, tags=["Uploads"])
api_v1_router.include_router(lists_router, tags=["Lists"])
