import asyncio
import boto3
from botocore.config import Config
from src.config.config import (
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
)

# R2 uses S3-compatible API
s3_client = boto3.client(
    service_name="s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name="auto",  # R2 doesn't use regions in the same way, 'auto' is usually fine
    config=Config(signature_version="s3v4"),
)


async def upload_blob(hash: str, data: bytes) -> str:
    """Upload a blob to R2. Returns the R2 key."""
    key = f"objects/{hash[:2]}/{hash[2:]}"
    
    # Run synchronous boto3 call in a thread pool to avoid blocking the event loop
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(
        None,
        lambda: s3_client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=data,
            ContentType="application/octet-stream",
            # Content-Addressing: If it exists, it's the same content.
            # However, R2 doesn't have a built-in 'put-if-not-exists' that is easy to use without conditional headers.
            # We check existence in the controller/database anyway.
        )
    )
    return key


async def download_blob(hash: str) -> bytes:
    """Download a blob from R2."""
    key = f"objects/{hash[:2]}/{hash[2:]}"
    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(
        None,
        lambda: s3_client.get_object(Bucket=R2_BUCKET_NAME, Key=key)
    )
    return response["Body"].read()


async def blob_exists(hash: str) -> bool:
    """Check if a blob exists in R2."""
    key = f"objects/{hash[:2]}/{hash[2:]}"
    loop = asyncio.get_running_loop()
    try:
        await loop.run_in_executor(
            None,
            lambda: s3_client.head_object(Bucket=R2_BUCKET_NAME, Key=key)
        )
        return True
    except Exception:
        return False
