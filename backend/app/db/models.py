"""Central SQLAlchemy model registry used by Alembic and tooling."""

from app.modules.activities.models import Activity
from app.modules.auth.models import AuthIdentity, RefreshSession
from app.modules.comments.models import Comment
from app.modules.invitations.models import Invitation
from app.modules.items.models import Item
from app.modules.lists.models import SpaceList
from app.modules.memories.models import Memory
from app.modules.notifications.models import DevicePushToken, Notification
from app.modules.plans.models import Plan, PlanReminder
from app.modules.reactions.models import ItemReaction
from app.modules.spaces.models import Space, SpaceMember
from app.modules.uploads.models import Upload
from app.modules.users.models import User

__all__ = [
    "Activity",
    "AuthIdentity",
    "Comment",
    "DevicePushToken",
    "Invitation",
    "Item",
    "ItemReaction",
    "Memory",
    "Notification",
    "Plan",
    "PlanReminder",
    "RefreshSession",
    "Space",
    "SpaceList",
    "SpaceMember",
    "Upload",
    "User",
]
