#!/usr/bin/env python3
"""P0 #536: offline, fail-closed inspection of public GHCR manifest/config bytes.

This verifier does not download layers, read Render secrets, write to a registry,
or attest operational backup, runtime isolation, or release readiness.
"""

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

DIGEST = re.compile(r"sha256:[0-9a-f]{64}\Z")
ENV_NAME = re.compile(r"[A-Z_][A-Z0-9_]*\Z")
SENSITIVE_NAME = re.compile(
    r"(?:^|_)(?:API_KEY|ACCESS_TOKEN|REFRESH_TOKEN|CLIENT_SECRET|SECRET_KEY|"
    r"PRIVATE_KEY|SIGNING_KEY|SERVICE_ROLE_KEY|DATABASE_URL|DATABASE_PASSWORD|"
    r"DB_URL|DB_PASSWORD|ACCESS_KEY_ID|PGPASSWORD|PGPASSFILE|MYSQL_PWD|"
    r"CONNECTION_STRING|(?:POSTGRES(?:QL)?|REDIS|MONGO(?:DB)?|MYSQL|"
    r"MARIADB|DATABASE|DB)_(?:URL|URI|CONNECTION_STRING|DSN)|"
    r"PASSWORD|TOKEN|SECRET|CREDENTIALS?|DEPLOY_HOOK_URL)"
    r"(?:$|_)",
    re.IGNORECASE,
)
PUBLIC_EXCEPTIONS = frozenset({
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_HONEYBADGER_API_KEY",
})
MANIFEST_TYPES = frozenset({
    "application/vnd.docker.distribution.manifest.v2+json",
    "application/vnd.oci.image.manifest.v1+json",
})
CONFIG_TYPES = frozenset({
    "application/vnd.docker.container.image.v1+json",
    "application/vnd.oci.image.config.v1+json",
})
# Offline backup preflight: intentionally reject foreign/nondistributable layers.
LAYER_TYPES = frozenset({
    "application/vnd.docker.image.rootfs.diff.tar.gzip",
    "application/vnd.oci.image.layer.v1.tar",
    "application/vnd.oci.image.layer.v1.tar+gzip",
    "application/vnd.oci.image.layer.v1.tar+zstd",
})
MAX_METADATA_BYTES = 2 * 1024 * 1024
MAX_LAYER_COUNT = 100
MAX_DESCRIPTOR_BYTES = 3_000_000_000


class MetadataError(ValueError):
    """Invalid metadata; details must not be printed to public logs."""


def sha256(data: bytes) -> str:
    return "sha256:" + hashlib.sha256(data).hexdigest()


def require(condition: bool) -> None:
    if not condition:
        raise MetadataError("Invalid public OCI metadata")


def read_json_object(data: bytes) -> dict:
    require(isinstance(data, bytes) and 0 < len(data) <= MAX_METADATA_BYTES)
    try:
        obj = json.loads(data)
    except (UnicodeError, ValueError) as exc:
        raise MetadataError("Invalid public OCI metadata") from exc
    require(isinstance(obj, dict))
    return obj


def descriptor(item: object, types: frozenset[str] | None = None) -> tuple[str, int]:
    require(isinstance(item, dict))
    require(isinstance(item.get("digest"), str) and DIGEST.fullmatch(item["digest"]) is not None)
    size = item.get("size")
    require(type(size) is int and 0 < size <= MAX_DESCRIPTOR_BYTES)
    media_type = item.get("mediaType")
    require(isinstance(media_type, str) and bool(media_type))
    if types is not None:
        require(media_type in types)
    return item["digest"], size


def nonroot_user(value: object) -> bool:
    if not isinstance(value, str) or not value or value != value.strip():
        return False
    name = value.split(":", 1)[0]
    if not name or name != name.strip() or name.casefold() == "root":
        return False
    if re.fullmatch(r"[+-]?0+", name) or (name.isdecimal() and int(name) == 0):
        return False
    return True


def verify(manifest_bytes: bytes, config_bytes: bytes, expected_digest: str) -> dict:
    """Verify supplied public bytes and descriptors; layers are NOT downloaded."""
    require(isinstance(expected_digest, str) and DIGEST.fullmatch(expected_digest) is not None)
    manifest = read_json_object(manifest_bytes)
    config = read_json_object(config_bytes)
    require(sha256(manifest_bytes) == expected_digest)
    require(manifest.get("schemaVersion") == 2)
    media_type = manifest.get("mediaType")
    require(media_type is None or media_type in MANIFEST_TYPES)

    config_digest, config_size = descriptor(manifest.get("config"), CONFIG_TYPES)
    require(len(config_bytes) == config_size and sha256(config_bytes) == config_digest)

    layers = manifest.get("layers")
    require(isinstance(layers, list) and 1 <= len(layers) <= MAX_LAYER_COUNT)
    seen = {config_digest}
    declared_bytes = config_size
    for layer in layers:
        layer_digest, layer_size = descriptor(layer, LAYER_TYPES)
        require(layer_digest not in seen)
        seen.add(layer_digest)
        declared_bytes += layer_size

    require(config.get("os") == "linux" and config.get("architecture") == "amd64")
    settings = config.get("config")
    require(isinstance(settings, dict) and nonroot_user(settings.get("User")))
    environment = settings.get("Env", [])
    require(isinstance(environment, list))
    seen_names = set()
    for entry in environment:
        require(isinstance(entry, str) and "=" in entry)
        # Names only. Never output environment values, even when validation fails.
        name = entry.split("=", 1)[0]
        require(ENV_NAME.fullmatch(name) is not None and name not in seen_names)
        seen_names.add(name)
        require(name in PUBLIC_EXCEPTIONS or SENSITIVE_NAME.search(name) is None)

    return {
        "result": "PASS",
        "scope": "public-manifest-and-config-only",
        "platform": "linux/amd64",
        "layersDeclared": len(layers),
        "descriptorBytesDeclared": declared_bytes,
        "limitation": "Layers not downloaded; no layer integrity, hosted isolation, backup or release proof.",
    }


def read_bounded(path: str) -> bytes:
    item = Path(path)
    require(not item.is_symlink() and item.is_file())
    with item.open("rb") as handle:
        content = handle.read(MAX_METADATA_BYTES + 1)
    require(0 < len(content) <= MAX_METADATA_BYTES)
    return content


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Offline public GHCR metadata guard (no network)")
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--digest", required=True)
    args = parser.parse_args(argv)
    try:
        result = verify(read_bounded(args.manifest), read_bounded(args.config), args.digest)
    except (MetadataError, OSError, ValueError):
        print("P0 #536: public OCI metadata NOT VERIFIED; NO-GO.", file=sys.stderr)
        return 1
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
