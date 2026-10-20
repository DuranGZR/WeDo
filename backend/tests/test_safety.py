from types import SimpleNamespace
from uuid import uuid4

import pytest
from app.api.dependencies import get_session
from app.core.config import settings
from app.core.mail import EmailDeliveryError
from app.main import app
from app.modules.auth.service import _issue_tokens
from app.modules.items.models import Item, ItemPreviewImage
from app.modules.metadata.service import process_item_metadata
from app.modules.safety import service
from app.modules.safety.models import ContentReport, UserBlock
from app.modules.safety.moderate import review_report
from app.modules.safety.policy import violates_policy
from app.modules.spaces.models import SpaceMember
from app.modules.users.models import User
from fastapi import HTTPException
from sqlalchemy import select


@pytest.fixture
def safety(auth_client, monkeypatch):
    sent = []
    monkeypatch.setattr(service, "send_email", lambda **kwargs: sent.append(kwargs))
    generator = app.dependency_overrides[get_session]()
    session = next(generator)
    accounts = []
    for name in ("alice", "bob", "charlie"):
        user = User(email=f"{name}@example.com", display_name=name, email_verified=True)
        session.add(user)
        session.flush()
        tokens = _issue_tokens(session, user, None)
        accounts.append((user.id, {"Authorization": f"Bearer {tokens.access_token}"}))
    session.commit()
    yield auth_client, session, accounts, sent
    generator.close()


def space(client, account):
    response = client.post(
        "/api/v1/spaces", headers=account[1], json={"name": "Shared", "type": "group"}
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def invite(client, owner, space_id):
    response = client.post(
        f"/api/v1/spaces/{space_id}/invitations",
        headers=owner[1],
        json={"max_uses": 10},
    )
    assert response.status_code == 201, response.text
    return response.json()["token"]


def join(client, account, token):
    return client.post(f"/api/v1/invitations/token/{token}/accept", headers=account[1])


def item(client, owner, space_id):
    listing = client.post(
        f"/api/v1/spaces/{space_id}/lists", headers=owner[1], json={"name": "Links"}
    ).json()
    response = client.post(
        "/api/v1/items",
        headers=owner[1],
        json={
            "space_id": space_id,
            "list_id": listing["id"],
            "title": "Weekend idea",
            "original_url": "https://example.com/idea",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def report(client, account, target, **kwargs):
    return client.post(
        "/api/v1/safety/reports",
        headers=account[1],
        json={
            "target_type": "item",
            "target_id": target,
            "reason": "harassment",
            "details": "This content contains abusive threats.",
            **kwargs,
        },
    )


def test_owner_block_removes_target_and_denies_all_shared_item_operations(safety):
    client, session, (alice, bob, charlie), _ = safety
    sid = space(client, alice)
    token = invite(client, alice, sid)
    assert join(client, bob, token).status_code == 200
    assert join(client, charlie, token).status_code == 200
    saved = item(client, alice, sid)
    assert (
        client.put(f"/api/v1/safety/blocks/{bob[0]}", headers=alice[1]).status_code
        == 204
    )
    # Retrying the block is idempotent despite no longer sharing a space.
    assert (
        client.put(f"/api/v1/safety/blocks/{bob[0]}", headers=alice[1]).status_code
        == 204
    )
    for method, path, body in (
        ("get", f"/api/v1/spaces/{sid}", None),
        ("get", f"/api/v1/spaces/{sid}/members", None),
        ("get", f"/api/v1/lists/{saved['list_id']}/items", None),
        ("get", f"/api/v1/items/{saved['id']}", None),
        ("patch", f"/api/v1/items/{saved['id']}", {"title": "Tampered"}),
        ("delete", f"/api/v1/items/{saved['id']}", None),
        ("post", f"/api/v1/items/{saved['id']}/complete", None),
    ):
        assert (
            client.request(
                method, path, headers=bob[1], **({"json": body} if body else {})
            ).status_code
            == 403
        )
    assert (
        client.get(f"/api/v1/items/{saved['id']}", headers=charlie[1]).status_code
        == 200
    )
    assert client.get("/api/v1/notifications", headers=bob[1]).json()["data"] == []
    assert session.scalar(select(UserBlock)) is not None


def test_member_block_leaves_all_common_spaces_and_preserves_third_parties(safety):
    client, _, (alice, bob, charlie), _ = safety
    for owner in (bob, charlie):
        sid = space(client, owner)
        token = invite(client, owner, sid)
        for member in (alice, bob):
            if member != owner:
                assert join(client, member, token).status_code == 200
    assert (
        client.put(f"/api/v1/safety/blocks/{bob[0]}", headers=alice[1]).status_code
        == 204
    )
    assert client.get("/api/v1/spaces", headers=alice[1]).json()["data"] == []
    assert len(client.get("/api/v1/spaces", headers=bob[1]).json()["data"]) == 2


def test_block_prevents_invitation_bypass_in_both_directions_and_unblock_needs_new_join(
    safety,
):
    client, _, (alice, bob, charlie), _ = safety
    sid = space(client, alice)
    token = invite(client, alice, sid)
    assert join(client, bob, token).status_code == 200
    assert (
        client.put(f"/api/v1/safety/blocks/{bob[0]}", headers=alice[1]).status_code
        == 204
    )
    assert join(client, bob, token).status_code == 403
    # A third member's invitation cannot bypass a block either.
    other = space(client, charlie)
    third_token = invite(client, charlie, other)
    assert join(client, bob, third_token).status_code == 200
    assert join(client, alice, third_token).status_code == 403
    blocks = client.get("/api/v1/safety/blocks", headers=alice[1]).json()["data"]
    assert blocks[0]["user_id"] == str(bob[0]) and "email" not in blocks[0]
    # Bob cannot delete Alice's block by calling his own unblock endpoint.
    assert (
        client.delete(f"/api/v1/safety/blocks/{alice[0]}", headers=bob[1]).status_code
        == 204
    )
    assert join(client, bob, token).status_code == 403
    assert (
        client.delete(f"/api/v1/safety/blocks/{bob[0]}", headers=alice[1]).status_code
        == 204
    )
    assert client.get(f"/api/v1/spaces/{sid}", headers=bob[1]).status_code == 403
    # Reuses the removed row instead of failing its unique constraint.
    assert join(client, bob, token).status_code == 200


def test_removed_inviter_cannot_continue_inviting(safety):
    client, _, (alice, bob, charlie), _ = safety
    sid = space(client, alice)
    assert join(client, bob, invite(client, alice, sid)).status_code == 200
    member = next(
        m
        for m in client.get(f"/api/v1/spaces/{sid}/members", headers=alice[1]).json()[
            "data"
        ]
        if m["user_id"] == str(bob[0])
    )
    assert (
        client.patch(
            f"/api/v1/spaces/{sid}/members/{member['id']}",
            headers=alice[1],
            json={"role": "admin"},
        ).status_code
        == 200
    )
    token = invite(client, bob, sid)
    client.put(f"/api/v1/safety/blocks/{bob[0]}", headers=alice[1])
    assert join(client, charlie, token).status_code == 403
    assert client.get(f"/api/v1/invitations/token/{token}").status_code == 403


def test_blocks_require_shared_membership_and_authentication(safety):
    client, _, (alice, bob, _), _ = safety
    assert client.put(f"/api/v1/safety/blocks/{bob[0]}").status_code == 401
    assert (
        client.put(f"/api/v1/safety/blocks/{alice[0]}", headers=alice[1]).status_code
        == 400
    )
    assert (
        client.put(f"/api/v1/safety/blocks/{bob[0]}", headers=alice[1]).status_code
        == 404
    )
    assert (
        client.put(f"/api/v1/safety/blocks/{uuid4()}", headers=alice[1]).status_code
        == 404
    )


def test_reports_enforce_access_validation_and_deduplicate(safety):
    client, session, (alice, bob, _), sent = safety
    sid = space(client, alice)
    saved = item(client, alice, sid)
    assert report(client, bob, saved["id"]).status_code == 403
    assert client.post("/api/v1/safety/reports", json={}).status_code == 401
    assert join(client, bob, invite(client, alice, sid)).status_code == 200
    first = report(client, bob, saved["id"])
    assert first.status_code == 201, first.text
    assert set(first.json()) == {"id", "status", "created_at"}
    assert report(client, bob, saved["id"]).json()["id"] == first.json()["id"]
    assert len(sent) == 1
    assert report(client, bob, saved["id"], details="    ").status_code == 422
    assert report(client, bob, saved["id"], reason="made-up").status_code == 422
    assert report(client, bob, saved["id"], space_id=str(uuid4())).status_code == 400
    stored = session.scalar(select(ContentReport))
    assert stored.snapshot["title"] == "Weekend idea"
    assert stored.subject_user_id == alice[0]
    assert client.get("/api/v1/safety/reports", headers=alice[1]).status_code == 405


def test_reports_survive_email_failure_and_can_be_retried(safety, monkeypatch):
    client, session, (alice, _, _), _ = safety

    def fail(**kwargs):
        raise EmailDeliveryError("unavailable")

    monkeypatch.setattr(service, "send_email", fail)
    response = client.post(
        "/api/v1/safety/reports",
        headers=alice[1],
        json={
            "target_type": "app",
            "reason": "other",
            "details": "Please review this behaviour.",
        },
    )
    assert response.status_code == 201
    stored = session.scalar(select(ContentReport))
    assert stored.status == "pending" and stored.notified_at is None
    monkeypatch.setattr(service, "send_email", lambda **kwargs: None)
    assert service.notify_report(session, stored.id)
    assert stored.notified_at is not None


def test_report_quota_and_generic_target_validation(safety):
    client, session, (alice, _, _), _ = safety
    payload = {
        "target_type": "app",
        "reason": "other",
        "details": "Please review this behaviour.",
    }
    assert (
        client.post(
            "/api/v1/safety/reports",
            headers=alice[1],
            json={**payload, "target_id": str(uuid4())},
        ).status_code
        == 422
    )
    for _ in range(20):
        session.add(
            ContentReport(
                reporter_id=alice[0],
                target_type="app",
                reason="other",
                details="Test report",
                snapshot={},
            )
        )
    session.commit()
    assert (
        client.post(
            "/api/v1/safety/reports", headers=alice[1], json=payload
        ).status_code
        == 429
    )


def test_operator_removes_content_and_preview_or_suspends_account(safety):
    client, session, (alice, bob, _), _ = safety
    sid = space(client, alice)
    assert join(client, bob, invite(client, alice, sid)).status_code == 200
    saved = item(client, alice, sid)
    response = report(client, bob, saved["id"])
    report_id = session.scalar(select(ContentReport.id))
    assert response.status_code == 201
    from uuid import UUID

    iid = UUID(saved["id"])
    session.add(ItemPreviewImage(item_id=iid, data=b"test", content_type="image/jpeg"))
    session.commit()
    assert client.get(f"/api/v1/items/{iid}/preview").status_code == 200
    review_report(session, report_id, "remove", "Confirmed inappropriate content")
    assert client.get(f"/api/v1/items/{iid}", headers=bob[1]).status_code == 404
    assert client.get(f"/api/v1/items/{iid}/preview").status_code == 404
    assert session.get(ItemPreviewImage, iid) is None
    with pytest.raises(ValueError):
        review_report(session, report_id, "remove", "Repeated")
    user_report = client.post(
        "/api/v1/safety/reports",
        headers=bob[1],
        json={
            "target_type": "user",
            "target_id": str(alice[0]),
            "reason": "harassment",
            "details": "This user has been abusive.",
        },
    )
    assert user_report.status_code == 201
    review_report(session, UUID(user_report.json()["id"]), "suspend", "Repeated abuse")
    assert client.get("/api/v1/users/me", headers=alice[1]).status_code == 401


@pytest.mark.parametrize(
    "text", ["KENDİNİ ÖLDÜR", "kill\u200b yourself", "I WILL KILL YOU"]
)
def test_policy_normalizes_threats(text):
    assert violates_policy(text)
    assert not violates_policy("A nice weekend plan")


def test_policy_blocks_domains_and_rechecks_fetched_metadata(safety, monkeypatch):
    client, session, (alice, _, _), _ = safety
    monkeypatch.setattr(settings, "content_blocked_domains", ["blocked.example"])
    assert violates_policy(urls=("https://sub.blocked.example/post",))
    assert not violates_policy(urls=("https://notblocked.example/post",))
    assert violates_policy(urls=("https://[invalid",))
    sid = space(client, alice)
    saved = item(client, alice, sid)
    bad = {
        "space_id": sid,
        "list_id": saved["list_id"],
        "original_url": "https://blocked.example/item",
    }
    assert client.post("/api/v1/items", headers=alice[1], json=bad).status_code == 422
    assert (
        client.patch(
            f"/api/v1/items/{saved['id']}",
            headers=alice[1],
            json={"title": "kill yourself"},
        ).status_code
        == 422
    )
    from uuid import UUID

    iid = UUID(saved["id"])
    process_item_metadata(
        session,
        iid,
        fetcher=SimpleNamespace(
            fetch=lambda url: SimpleNamespace(
                url="https://example.com/idea",
                text='<meta property="og:description" content="kill yourself">',
            )
        ),
    )
    assert session.get(Item, iid).deleted_at is not None
    assert client.get(f"/api/v1/items/{iid}", headers=alice[1]).status_code == 404


def test_invitation_rechecks_members_added_while_waiting_for_locks(safety, monkeypatch):
    client, session, (alice, bob, charlie), _ = safety
    sid = space(client, charlie)
    from uuid import UUID

    session.add(UserBlock(blocker_id=alice[0], blocked_id=bob[0]))
    session.commit()
    original_lock = service.lock_users

    def waiting_lock(db, user_ids):
        original_lock(db, user_ids)
        # Models the membership committed by an earlier invitation while this
        # request was waiting for the shared owner's row lock.
        db.add(SpaceMember(space_id=UUID(sid), user_id=alice[0]))
        db.flush()

    monkeypatch.setattr(service, "lock_users", waiting_lock)
    with pytest.raises(HTTPException) as error:
        service.check_invitation_safety(session, UUID(sid), bob[0])
    assert error.value.status_code == 403
