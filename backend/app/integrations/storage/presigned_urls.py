import boto3

from app.core.config import settings


def create_presigned_put_url(object_key: str, content_type: str) -> str | None:
    if not all(
        (
            settings.storage_bucket,
            settings.storage_access_key,
            settings.storage_secret_key,
        )
    ):
        return None
    client = boto3.client(
        "s3",
        endpoint_url=settings.storage_endpoint,
        aws_access_key_id=settings.storage_access_key,
        aws_secret_access_key=settings.storage_secret_key,
    )
    return client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.storage_bucket,
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=900,
        HttpMethod="PUT",
    )
