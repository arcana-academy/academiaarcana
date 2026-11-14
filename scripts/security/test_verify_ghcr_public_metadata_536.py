"""Offline synthetic tests for the P0 #536 public GHCR metadata verifier."""

import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("verify-ghcr-public-metadata-536.py")
SPEC = importlib.util.spec_from_file_location("ghcr_public_metadata_536", SCRIPT)
GUARD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GUARD)


def digest(data: bytes) -> str:
    return "sha256:" + hashlib.sha256(data).hexdigest()


def sample(*, env=None, user="node", architecture="amd64", layers=None):
    config = {
        "os": "linux",
        "architecture": architecture,
        "config": {"User": user, "Env": ["NODE_ENV=production"] if env is None else env},
    }
    config_bytes = json.dumps(config, sort_keys=True).encode()
    raw_layers = [b"synthetic-layer"] if layers is None else layers
    manifest = {
        "schemaVersion": 2,
        "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
        "config": {
            "mediaType": "application/vnd.docker.container.image.v1+json",
            "digest": digest(config_bytes),
            "size": len(config_bytes),
        },
        "layers": [{
            "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
            "digest": digest(value),
            "size": len(value),
        } for value in raw_layers],
    }
    return manifest, config_bytes


def packed(manifest):
    return json.dumps(manifest, sort_keys=True).encode()


class PublicMetadataTests(unittest.TestCase):
    def assertRejected(self, manifest, config_bytes, expected=None):
        data = packed(manifest)
        with self.assertRaises(GUARD.MetadataError):
            GUARD.verify(data, config_bytes, expected or digest(data))

    def test_valid_synthetic_docker_v2(self):
        manifest, config_bytes = sample()
        result = GUARD.verify(packed(manifest), config_bytes, digest(packed(manifest)))
        self.assertEqual(result["result"], "PASS")
        self.assertEqual(result["layersDeclared"], 1)
        self.assertIn("not downloaded", result["limitation"].lower())

    def test_public_browser_keys_explicitly_allowed(self):
        manifest, config_bytes = sample(env=[
            "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=public-only-synthetic",
            "NEXT_PUBLIC_HONEYBADGER_API_KEY=public-only-synthetic",
            "NEXT_PUBLIC_APP_ENV=production",
        ])
        self.assertEqual(GUARD.verify(packed(manifest), config_bytes, digest(packed(manifest)))["result"], "PASS")

    def test_manifest_digest_mismatch(self):
        m, c = sample()
        self.assertRejected(m, c, "sha256:" + "0" * 64)

    def test_configuration_hash_mismatch_with_matching_size(self):
        m, c = sample()
        altered = c.replace(b"production", b"XXXXXXXXXX")
        self.assertEqual(len(altered), len(c))
        self.assertRejected(m, altered)

    def test_configuration_size_mismatch(self):
        m, c = sample()
        m["config"]["size"] += 1
        self.assertRejected(m, c)

    def test_bad_manifest_schema(self):
        m, c = sample()
        m["schemaVersion"] = 1
        self.assertRejected(m, c)

    def test_bad_config_media_type(self):
        m, c = sample()
        m["config"]["mediaType"] = "application/octet-stream"
        self.assertRejected(m, c)

    def test_bad_layer_descriptor(self):
        m, c = sample()
        m["layers"][0]["digest"] = "sha256:short"
        self.assertRejected(m, c)

    def test_duplicate_layer_digests(self):
        m, c = sample(layers=[b"one", b"one"])
        self.assertRejected(m, c)

    def test_missing_layers(self):
        m, c = sample(layers=[])
        self.assertRejected(m, c)

    def test_unexpected_platform(self):
        m, c = sample(architecture="arm64")
        self.assertRejected(m, c)

    def test_root_user(self):
        for user in ("root", "0", "0:node", "+0", "00"):
            with self.subTest(user=user):
                m, c = sample(user=user)
                self.assertRejected(m, c)

    def test_runtime_credentials_are_rejected(self):
        for name in ("OPENAI_API_KEY", "PARALLEL_API_KEY", "EXA_API_KEY", "GITHUB_TOKEN",
                     "DATABASE_URL", "OUTLOOK_CLIENT_SECRET", "SUPABASE_SERVICE_ROLE_KEY",
                     "NEXT_PUBLIC_OPENAI_API_KEY"):
            with self.subTest(name=name):
                m, c = sample(env=[f"{name}=SYNTHETIC-DO-NOT-PRINT"])
                self.assertRejected(m, c)

    def test_rf01_database_connection_names_are_rejected(self):
        # Stay aligned with the canonical JS build-secret guard.
        for name in (
            "POSTGRES_URL", "POSTGRESQL_URI", "REDIS_URL", "REDIS_DSN",
            "MONGO_URI", "MONGODB_URI", "MYSQL_DSN",
            "MARIADB_CONNECTION_STRING", "DATABASE_URI", "DB_DSN",
            "NEXT_PUBLIC_REDIS_URL", "SOME_POSTGRES_URL_SECONDARY",
        ):
            with self.subTest(name=name):
                m, c = sample(env=[f"{name}=SYNTHETIC-DO-NOT-PRINT"])
                self.assertRejected(m, c)

    def test_rf02_accepts_known_distributable_oci_docker_layer_types(self):
        for layer_type in (
            "application/vnd.docker.image.rootfs.diff.tar.gzip",
            "application/vnd.oci.image.layer.v1.tar",
            "application/vnd.oci.image.layer.v1.tar+gzip",
            "application/vnd.oci.image.layer.v1.tar+zstd",
        ):
            with self.subTest(layer_type=layer_type):
                m, c = sample()
                m["layers"][0]["mediaType"] = layer_type
                self.assertEqual(
                    GUARD.verify(packed(m), c, digest(packed(m)))["result"], "PASS"
                )

    def test_rf02_rejects_unknown_and_non_distributable_layer_types(self):
        for layer_type in (
            "application/octet-stream",
            "application/x-unknown",
            "application/vnd.docker.image.rootfs.foreign.diff.tar.gzip",
            "application/vnd.oci.image.layer.nondistributable.v1.tar+gzip",
            "application/vnd.oci.image.layer.nondistributable.v1.tar",
            "",
            7,
            None,
        ):
            with self.subTest(layer_type=layer_type):
                m, c = sample()
                m["layers"][0]["mediaType"] = layer_type
                self.assertRejected(m, c)

    def test_rf02_rejects_mixed_valid_and_invalid_layer_media_types(self):
        m, c = sample(layers=[b"valid-one", b"synthetic-two"])
        m["layers"][1]["mediaType"] = "application/x-invalid"
        self.assertRejected(m, c)

    def test_duplicate_environment_keys(self):
        m, c = sample(env=["NODE_ENV=production", "NODE_ENV=test"])
        self.assertRejected(m, c)

    def test_invalid_environment_key(self):
        m, c = sample(env=["SOME-KEY=not-allowed"])
        self.assertRejected(m, c)

    def test_metadata_size_limit(self):
        oversized = b"{" + b" " * GUARD.MAX_METADATA_BYTES + b"}"
        m, c = sample()
        with self.assertRaises(GUARD.MetadataError):
            GUARD.verify(oversized, c, digest(oversized))

    def test_cli_fail_closed_without_leaking_canary(self):
        m, c = sample(env=["OPENAI_API_KEY=PRIVATE-SYNTHETIC-CANARY-536"])
        with tempfile.TemporaryDirectory() as tmp:
            manifest = Path(tmp) / "manifest.json"
            config = Path(tmp) / "config.json"
            manifest.write_bytes(packed(m))
            config.write_bytes(c)
            completed = subprocess.run([
                sys.executable, str(SCRIPT), "--manifest", str(manifest),
                "--config", str(config), "--digest", digest(manifest.read_bytes()),
            ], capture_output=True, text=True, check=False)
        self.assertEqual(completed.returncode, 1)
        self.assertIn("NO-GO", completed.stderr)
        self.assertNotIn("PRIVATE-SYNTHETIC-CANARY-536", completed.stdout + completed.stderr)
        self.assertNotIn("OPENAI_API_KEY", completed.stdout + completed.stderr)

    def test_cli_accepts_valid_synthetic_bytes(self):
        m, c = sample()
        with tempfile.TemporaryDirectory() as tmp:
            manifest = Path(tmp) / "manifest.json"
            config = Path(tmp) / "config.json"
            manifest.write_bytes(packed(m))
            config.write_bytes(c)
            completed = subprocess.run([
                sys.executable, str(SCRIPT), "--manifest", str(manifest),
                "--config", str(config), "--digest", digest(manifest.read_bytes()),
            ], capture_output=True, text=True, check=False)
        self.assertEqual(completed.returncode, 0)
        self.assertEqual(json.loads(completed.stdout)["result"], "PASS")


if __name__ == "__main__":
    unittest.main()
