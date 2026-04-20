import hashlib
from typing import BinaryIO

import boto3
from botocore.client import BaseClient
from botocore.config import Config
from botocore.exceptions import ClientError

from app.config import Settings


def get_s3_client(settings: Settings) -> BaseClient:
    s3_config = None
    if settings.s3_path_style:
        s3_config = Config(s3={"addressing_style": "path"})
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        use_ssl=settings.s3_use_ssl,
        config=s3_config,
    )


def ensure_bucket(settings: Settings) -> None:
    client = get_s3_client(settings)
    try:
        client.head_bucket(Bucket=settings.s3_bucket)
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code not in ("404", "NoSuchBucket", "403"):
            raise
        create_kwargs: dict = {"Bucket": settings.s3_bucket}
        if settings.s3_region and settings.s3_region != "us-east-1":
            create_kwargs["CreateBucketConfiguration"] = {
                "LocationConstraint": settings.s3_region,
            }
        try:
            client.create_bucket(**create_kwargs)
        except ClientError:
            client.create_bucket(Bucket=settings.s3_bucket)


def sha256_stream(stream: BinaryIO, chunk_size: int = 1024 * 1024) -> str:
    h = hashlib.sha256()
    while True:
        chunk = stream.read(chunk_size)
        if not chunk:
            break
        h.update(chunk)
    return h.hexdigest()


def upload_bytes(
    settings: Settings,
    key: str,
    body: bytes,
    content_type: str,
) -> None:
    client = get_s3_client(settings)
    extra: dict = {}
    if settings.s3_path_style:
        # boto3 uses addressing_style in config
        pass
    client.put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=body,
        ContentType=content_type,
    )


def download_bytes(settings: Settings, key: str) -> bytes:
    client = get_s3_client(settings)
    obj = client.get_object(Bucket=settings.s3_bucket, Key=key)
    return obj["Body"].read()
