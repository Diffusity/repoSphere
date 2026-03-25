import gzip
import json


def compress_message(message: dict) -> bytes:
    """Compress a dict to gzip bytes."""
    json_bytes = json.dumps(message).encode("utf-8")
    return gzip.compress(json_bytes)


def decompress_message(data: bytes) -> dict:
    """Decompress gzip bytes back to a dict."""
    decompressed = gzip.decompress(data)
    return json.loads(decompressed)
