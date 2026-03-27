import os
import boto3
import uuid
from botocore.exceptions import NoCredentialsError, ClientError

# Configuration defaults (Ideally read from env variables)
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME", "teamforge-storage-jairus-001")

def get_s3_client():
    """Returns an interactive boto3 S3 client."""
    return boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )

def upload_file_to_s3(file_bytes: bytes, original_filename: str, folder: str = "uploads", custom_filename: str = None) -> str:
    """
    Uploads a file to AWS S3 securely and returns its Object Key.
    """
    if not AWS_ACCESS_KEY_ID or not AWS_BUCKET_NAME:
        print("S3 Warning: Missing AWS credentials. Skipped upload and returning mock key.")
        return f"mock_{folder}/{original_filename}"

    s3 = get_s3_client()
    
    ext = original_filename.split(".")[-1] if "." in original_filename else "pdf"
    name_base = custom_filename if custom_filename else uuid.uuid4().hex[:8]
    # Append short uuid to prevent rare collisions even with custom names
    unique_filename = f"{name_base}_{uuid.uuid4().hex[:4]}.{ext}"
    s3_key = f"{folder}/{unique_filename}"
    
    try:
        s3.put_object(
            Bucket=AWS_BUCKET_NAME,
            Key=s3_key,
            Body=file_bytes,
            ContentType="application/pdf"
        )
        return s3_key
    except (NoCredentialsError, ClientError) as e:
        print(f"Failed to upload to S3: {e}")
        raise e

def generate_presigned_url(object_key: str, expiration: int = 3600) -> str:
    """
    Generates a temporary, pre-signed URL to grant secure read access to a private S3 object.
    """
    if not object_key or object_key.startswith("mock_"):
        # Fallback or mock key handling
        return f"https://mock-s3-bucket.s3.amazonaws.com/{object_key}"

    s3 = get_s3_client()
    try:
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': AWS_BUCKET_NAME, 'Key': object_key},
            ExpiresIn=expiration
        )
        return url
    except ClientError as e:
        print(f"Failed to generate presigned URL: {e}")
        return ""
