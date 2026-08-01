from enum import StrEnum


class ItemType(StrEnum):
    URL = "url"
    PLACE = "place"
    PRODUCT = "product"
    VIDEO = "video"
    MOVIE = "movie"
    SERIES = "series"
    RECIPE = "recipe"
    EVENT = "event"
    IMAGE = "image"
    IDEA = "idea"
    OTHER = "other"


class ItemStatus(StrEnum):
    NEW = "new"
    DECISION_PENDING = "decision_pending"
    MATCHED = "matched"
    PLANNED = "planned"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"


class MetadataStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    NOT_AVAILABLE = "not_available"
