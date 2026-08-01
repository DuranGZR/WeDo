from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.activities.service import record_activity
from app.modules.items.enums import ItemStatus
from app.modules.items.service import get_item
from app.modules.notifications.service import notify_space_members
from app.modules.reactions.enums import ReactionValue
from app.modules.reactions.models import ItemReaction
from app.modules.reactions.repository import reaction_repository
from app.modules.reactions.schemas import ReactionRequest, ReactionResponse


def set_reaction(
    session: Session, item_id: UUID, user_id: UUID, data: ReactionRequest
) -> ReactionResponse:
    item = get_item(session, item_id)
    reaction = reaction_repository.get(session, item_id, user_id)
    if reaction is None:
        reaction = ItemReaction(
            item_id=item_id, user_id=user_id, reaction=data.reaction
        )
        session.add(reaction)
    else:
        reaction.reaction = data.reaction
    if (
        data.reaction == ReactionValue.WANT
        and reaction_repository.want_count(session, item_id) >= 1
    ):
        item.status = ItemStatus.MATCHED
        record_activity(
            session,
            space_id=item.space_id,
            actor_id=user_id,
            activity_type="match_created",
            entity_type="item",
            entity_id=item.id,
        )
    record_activity(
        session,
        space_id=item.space_id,
        actor_id=user_id,
        activity_type="item_reacted",
        entity_type="item",
        entity_id=item.id,
        payload={"reaction": data.reaction},
    )
    notify_space_members(
        session,
        space_id=item.space_id,
        actor_id=user_id,
        notification_type="item_reacted",
        title="İçeriğe tepki verildi",
        body="Ortak içeriklerden birine yeni tepki geldi.",
        data={"item_id": str(item.id)},
    )
    session.commit()
    return ReactionResponse.model_validate(reaction, from_attributes=True)


def remove_reaction(session: Session, item_id: UUID, user_id: UUID) -> None:
    reaction = reaction_repository.get(session, item_id, user_id)
    if reaction is not None:
        session.delete(reaction)
        session.commit()


def list_reactions(session: Session, item_id: UUID) -> list[ReactionResponse]:
    return [
        ReactionResponse.model_validate(item, from_attributes=True)
        for item in reaction_repository.list_for_item(session, item_id)
    ]
