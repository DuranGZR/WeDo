from uuid import UUID

import pytest
from app.api.dependencies import get_session
from app.main import app
from app.modules.auth.service import _issue_tokens
from app.modules.safety.models import UserBlock
from app.modules.spaces.models import Space, SpaceMember
from app.modules.users.models import User
from sqlalchemy import select


@pytest.fixture
def members(auth_client):
    generator = app.dependency_overrides[get_session]()
    session = next(generator)
    people = []
    for name in ("alice", "bob", "charlie"):
        user = User(email=f"{name}@example.com", display_name=name, email_verified=True)
        session.add(user)
        session.flush()
        tokens = _issue_tokens(session, user, None)
        people.append((user.id, {"Authorization": f"Bearer {tokens.access_token}"}))
    sid = auth_client.post(
        "/api/v1/spaces", headers=people[0][1], json={"name": "Our space"}
    ).json()["id"]
    for user_id, _ in people[1:]:
        session.add(SpaceMember(space_id=UUID(sid), user_id=user_id))
    session.commit()
    yield auth_client, session, people, sid
    generator.close()


def test_member_can_leave_without_blocking_and_rejoin(members):
    client, session, (alice, bob, _), sid = members
    # Use the owner's invitation so it remains valid after Bob leaves.
    token = client.post(
        f"/api/v1/spaces/{sid}/invitations", headers=alice[1], json={}
    ).json()["token"]
    assert client.post(f"/api/v1/spaces/{sid}/leave", headers=bob[1]).status_code == 204
    assert client.get(f"/api/v1/spaces/{sid}", headers=bob[1]).status_code == 403
    assert client.get(f"/api/v1/spaces/{sid}", headers=alice[1]).status_code == 200
    assert session.scalar(select(UserBlock)) is None
    assert (
        client.post(
            f"/api/v1/invitations/token/{token}/accept", headers=bob[1]
        ).status_code
        == 200
    )


def test_owner_must_select_active_successor_and_transfer_is_authoritative(members):
    client, session, (alice, bob, charlie), sid = members
    path = f"/api/v1/spaces/{sid}/leave"
    assert client.post(path, headers=alice[1]).status_code == 400
    assert (
        client.post(
            path, headers=alice[1], json={"successor_user_id": str(alice[0])}
        ).status_code
        == 400
    )
    assert (
        client.post(
            path, headers=alice[1], json={"successor_user_id": str(bob[0])}
        ).status_code
        == 204
    )
    session.expire_all()
    active_owners = session.scalars(
        select(SpaceMember).where(
            SpaceMember.space_id == UUID(sid),
            SpaceMember.role == "owner",
            SpaceMember.removed_at.is_(None),
        )
    ).all()
    assert len(active_owners) == 1 and active_owners[0].user_id == bob[0]
    assert (
        client.patch(
            f"/api/v1/spaces/{sid}", headers=bob[1], json={"name": "Bob's space"}
        ).status_code
        == 200
    )
    assert (
        client.patch(
            f"/api/v1/spaces/{sid}", headers=alice[1], json={"name": "Not allowed"}
        ).status_code
        == 403
    )
    assert client.get(f"/api/v1/spaces/{sid}", headers=charlie[1]).status_code == 200


def test_last_owner_leave_closes_space_and_nonowners_cannot_transfer(members):
    client, session, (alice, bob, charlie), sid = members
    assert (
        client.post(
            f"/api/v1/spaces/{sid}/leave",
            headers=bob[1],
            json={"successor_user_id": str(charlie[0])},
        ).status_code
        == 400
    )
    for account in (bob, charlie, alice):
        assert (
            client.post(f"/api/v1/spaces/{sid}/leave", headers=account[1]).status_code
            == 204
        )
    session.expire_all()
    assert session.get(Space, UUID(sid)).deleted_at is not None
    assert client.get("/api/v1/spaces", headers=alice[1]).json()["data"] == []
    assert session.scalar(select(UserBlock)) is None


def test_profiles_are_scoped_to_current_membership_and_omit_private_data(members):
    client, session, (alice, bob, charlie), sid = members
    mid = str(
        session.scalar(
            select(SpaceMember.id).where(
                SpaceMember.space_id == UUID(sid), SpaceMember.user_id == bob[0]
            )
        )
    )
    path = f"/api/v1/spaces/{sid}/members/{mid}"
    assert client.get(path).status_code == 401
    response = client.get(path, headers=alice[1])
    assert response.status_code == 200
    assert response.json()["display_name"] == "bob"
    assert response.json()["joined_at"]
    assert not (
        {"email", "password_hash", "provider", "preferred_language"}
        & response.json().keys()
    )
    other = client.post(
        "/api/v1/spaces", headers=charlie[1], json={"name": "Private"}
    ).json()["id"]
    assert (
        client.get(
            f"/api/v1/spaces/{other}/members/{mid}", headers=charlie[1]
        ).status_code
        == 404
    )
    assert (
        client.post(f"/api/v1/spaces/{sid}/leave", headers=charlie[1]).status_code
        == 204
    )
    assert client.get(path, headers=charlie[1]).status_code == 403
    assert client.post(f"/api/v1/spaces/{sid}/leave", headers=bob[1]).status_code == 204
    assert client.get(path, headers=alice[1]).status_code == 404


def test_inactive_members_are_anonymized_and_cannot_inherit_ownership(members):
    client, session, (alice, bob, _), sid = members
    user = session.get(User, bob[0])
    user.is_active = False
    session.commit()
    data = client.get(f"/api/v1/spaces/{sid}/members", headers=alice[1]).json()["data"]
    target = next(member for member in data if member["user_id"] == str(bob[0]))
    profile = client.get(
        f"/api/v1/spaces/{sid}/members/{target['id']}", headers=alice[1]
    ).json()
    assert not profile["is_active"] and profile["display_name"] != "bob"
    assert (
        client.post(
            f"/api/v1/spaces/{sid}/leave",
            headers=alice[1],
            json={"successor_user_id": str(bob[0])},
        ).status_code
        == 400
    )
