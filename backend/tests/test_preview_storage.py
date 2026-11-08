from datetime import UTC, datetime, timedelta
from io import BytesIO
from types import SimpleNamespace
from uuid import uuid4

import jwt
from app.api.dependencies import get_session
from app.core.config import settings
from app.main import app
from app.modules.auth.service import _issue_tokens
from app.modules.items.enums import MetadataStatus
from app.modules.items.models import Item, ItemPreviewImage
from app.modules.lists.models import SpaceList
from app.modules.metadata.service import process_item_metadata
from app.modules.spaces.models import Space, SpaceMember
from app.modules.users.models import User
from PIL import Image


def test_instagram_preview_is_resized_and_stored_without_object_storage(auth_client):
    generator = app.dependency_overrides[get_session]()
    session = next(generator)
    try:
        user = User(
            email="preview@example.com", display_name="Preview", email_verified=True
        )
        session.add(user)
        session.flush()
        space = Space(name="Saved links", type="personal", created_by=user.id)
        session.add(space)
        session.flush()
        member = SpaceMember(space_id=space.id, user_id=user.id, role="owner")
        session.add(member)
        access_token = _issue_tokens(session, user, None).access_token
        listing = SpaceList(
            space_id=space.id, name="Links", normalized_name="links", created_by=user.id
        )
        session.add(listing)
        session.flush()
        item = Item(
            space_id=space.id,
            list_id=listing.id,
            created_by=user.id,
            original_url="https://www.instagram.com/p/test/",
        )
        session.add(item)
        session.commit()

        raw = BytesIO()
        Image.new("RGB", (1800, 1200), "coral").save(raw, "PNG")
        image_url = "https://scontent.cdninstagram.com/photo.jpg?oe=123"

        class Fetcher:
            def fetch(self, url):
                if url == image_url:
                    return SimpleNamespace(content=raw.getvalue())
                return SimpleNamespace(
                    url=item.original_url,
                    text=(
                        '<meta property="og:title" content="Saved post">'
                        f'<meta property="og:image" content="{image_url}">'
                    ),
                )

        process_item_metadata(session, item.id, fetcher=Fetcher())
        preview = session.get(ItemPreviewImage, item.id)
        assert preview is not None and preview.content_type == "image/jpeg"
        assert item.metadata_status == MetadataStatus.COMPLETED
        assert item.preview_image_url == f"/api/v1/items/{item.id}/preview"
        with Image.open(BytesIO(preview.data)) as optimized:
            assert max(optimized.size) <= 600
        assert auth_client.get(item.preview_image_url).status_code == 401
        assert (
            auth_client.get(f"{item.preview_image_url}?token=invalid").status_code
            == 401
        )
        headers = {"Authorization": f"Bearer {access_token}"}
        item_response = auth_client.get(f"/api/v1/items/{item.id}", headers=headers)
        signed_url = item_response.json()["preview_image_url"]
        assert signed_url.startswith(f"{item.preview_image_url}?token=")
        listed = auth_client.get(f"/api/v1/lists/{listing.id}/items", headers=headers)
        assert listed.json()["data"][0]["preview_image_url"].startswith(
            f"{item.preview_image_url}?token="
        )
        response = auth_client.get(signed_url)
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/jpeg"
        assert response.headers["cache-control"] == "private, no-store"
        assert response.content == preview.data
        wrong_item = signed_url.replace(str(item.id), str(uuid4()), 1)
        assert auth_client.get(wrong_item).status_code == 401
        expired_token = jwt.encode(
            {
                "type": "item_preview",
                "item_id": str(item.id),
                "sub": str(user.id),
                "exp": datetime.now(UTC) - timedelta(seconds=1),
            },
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )
        assert (
            auth_client.get(
                f"{item.preview_image_url}?token={expired_token}"
            ).status_code
            == 401
        )
        member.removed_at = datetime.now(UTC)
        session.commit()
        assert auth_client.get(signed_url).status_code == 403
    finally:
        generator.close()
