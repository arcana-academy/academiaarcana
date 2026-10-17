#!/usr/bin/env python3
"""P0 536: read-only offline OCI archive digest verification; NO registry/deploy writes."""
import argparse
import hashlib
import json
import pathlib
import re
import sys
import tarfile

SHA = re.compile(r"^sha256:[0-9a-f]{64}$")
BLOB = re.compile(r"^blobs/sha256/[0-9a-f]{64}$")
TYPES = {"application/vnd.docker.distribution.manifest.v2+json",
         "application/vnd.oci.image.manifest.v1+json"}
MAX = 3_000_000_000


class IntegrityError(ValueError):
    pass


def check_sha(value):
    if not isinstance(value, str) or not SHA.fullmatch(value):
        raise IntegrityError("Invalid exact SHA256")
    return value


def file_sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1048576), b""):
            h.update(chunk)
    return "sha256:" + h.hexdigest()


def object_json(data, label):
    try:
        result = json.loads(data)
    except (ValueError, UnicodeError) as error:
        raise IntegrityError("Invalid JSON: " + label) from error
    if not isinstance(result, dict):
        raise IntegrityError("JSON object required: " + label)
    return result


def verify(path, digest, archive_digest=None):
    check_sha(digest)
    if archive_digest is not None:
        check_sha(archive_digest)
    path = pathlib.Path(path)
    actual_archive = file_sha(path)
    if archive_digest and actual_archive != archive_digest:
        raise IntegrityError("Tar SHA mismatch")
    checked = {}
    metadata = {}
    with tarfile.open(path, "r|*") as tar:
        for member in tar:
            name = member.name
            if name in checked or not member.isfile():
                raise IntegrityError("Duplicate/nonregular member")
            if name not in ("oci-layout", "index.json") and not BLOB.fullmatch(name):
                raise IntegrityError("Unexpected/unsafe OCI path")
            if member.size < 0 or member.size > MAX:
                raise IntegrityError("Unexpected member size")
            inp = tar.extractfile(member)
            if inp is None:
                raise IntegrityError("Missing tar contents")
            h = hashlib.sha256()
            total = 0
            buffer = []
            while True:
                chunk = inp.read(1048576)
                if not chunk:
                    break
                total += len(chunk)
                if total > member.size:
                    raise IntegrityError("Exceeded member size")
                h.update(chunk)
                if member.size <= 2_000_000:
                    buffer.append(chunk)
            if total != member.size:
                raise IntegrityError("Truncated member")
            if BLOB.fullmatch(name) and name.split("/")[-1] != h.hexdigest():
                raise IntegrityError("Blob content SHA mismatch")
            checked[name] = total
            if buffer:
                metadata[name] = b"".join(buffer)
    if object_json(metadata.get("oci-layout", b""), "layout").get("imageLayoutVersion") != "1.0.0":
        raise IntegrityError("Invalid layout")
    index = object_json(metadata.get("index.json", b""), "index")
    roots = index.get("manifests")
    if not isinstance(roots, list) or len(roots) != 1:
        raise IntegrityError("Expected single image")
    root = roots[0]
    if not isinstance(root, dict) or root.get("mediaType") not in TYPES:
        raise IntegrityError("Unexpected manifest media type")
    if check_sha(root.get("digest")) != digest:
        raise IntegrityError("Wrong manifest")
    manifest_path = "blobs/sha256/" + digest[7:]
    if manifest_path not in metadata or checked[manifest_path] != root.get("size"):
        raise IntegrityError("Manifest missing or size mismatch")
    manifest = object_json(metadata[manifest_path], "manifest")
    cfg, layers = manifest.get("config"), manifest.get("layers")
    if manifest.get("schemaVersion") != 2 or not isinstance(cfg, dict) or not isinstance(layers, list) or not 1 <= len(layers) <= 100:
        raise IntegrityError("Invalid manifest structure")
    descs = [cfg] + layers
    accepted = {"oci-layout", "index.json", manifest_path}
    for desc in descs:
        if not isinstance(desc, dict) or not desc.get("mediaType"):
            raise IntegrityError("Invalid descriptor")
        blob_path = "blobs/sha256/" + check_sha(desc.get("digest"))[7:]
        size = desc.get("size")
        if type(size) is not int or size < 0 or size > MAX:
            raise IntegrityError("Invalid descriptor size")
        if blob_path in accepted or checked.get(blob_path) != size:
            raise IntegrityError("Duplicate/missing/mismatched blob")
        accepted.add(blob_path)
    if set(checked) != accepted:
        raise IntegrityError("Unexpected archive members")
    cfg_path = "blobs/sha256/" + cfg["digest"][7:]
    config = object_json(metadata.get(cfg_path, b""), "config")
    user = config.get("config", {}).get("User")
    if config.get("os") != "linux" or config.get("architecture") != "amd64" or user in ("", None, "0", "root"):
        raise IntegrityError("Unexpected platform or root runtime")
    return {"result": "PASS", "manifest": digest, "archiveSha256": actual_archive,
            "archiveBytes": path.stat().st_size, "objectsVerified": len(descs) + 1,
            "platform": "linux/amd64", "user": user,
            "scope": "offline byte integrity only; not an independent backup or executable rollback"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Read-only and offline OCI verification")
    parser.add_argument("--archive", required=True)
    parser.add_argument("--digest", required=True)
    parser.add_argument("--archive-sha", default=None)
    args = parser.parse_args()
    try:
        print(json.dumps(verify(args.archive, args.digest, args.archive_sha), sort_keys=True))
    except (IntegrityError, OSError, tarfile.TarError):
        print("FAIL: archive rejected (integrity/platform/layout)", file=sys.stderr)
        sys.exit(1)
