from enum import StrEnum


class SpaceType(StrEnum):
    COUPLE = "couple"
    FRIENDS = "friends"
    FAMILY = "family"
    ROOMMATES = "roommates"
    GROUP = "group"
    PERSONAL = "personal"
    OTHER = "other"


class SpaceRole(StrEnum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class NotificationLevel(StrEnum):
    ALL = "all"
    IMPORTANT = "important"
    NONE = "none"
