"""P0 536 OCI verifier offline positive and negative fixtures; no network access."""
import hashlib
import importlib.util
import io
import json
import pathlib
import tarfile
import tempfile
import unittest

source = pathlib.Path(__file__).with_name("oci_recovery_536.py")
spec = importlib.util.spec_from_file_location("oci_recovery_536", source)
verify = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verify)


def sha(data):
    return "sha256:" + hashlib.sha256(data).hexdigest()


def fixture(path, corrupt=False, extra=None, user="node", directories=False, extra_dir=None, prefix_files=False, extra_link=None):
    config = json.dumps({"os": "linux", "architecture": "amd64", "config": {"User": user}}).encode()
    layer = b"only-synthetic-fixture-layer"
    manifest = json.dumps({
        "schemaVersion": 2,
        "config": {"digest": sha(config), "size": len(config), "mediaType": "application/vnd.docker.container.image.v1+json"},
        "layers": [{"digest": sha(layer), "size": len(layer), "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip"}]
    }).encode()
    digest = sha(manifest)
    blobs = {
        "oci-layout": b'{"imageLayoutVersion":"1.0.0"}',
        "index.json": json.dumps({"schemaVersion": 2, "manifests": [{"digest": digest, "size": len(manifest),
            "mediaType": "application/vnd.docker.distribution.manifest.v2+json"}]}).encode(),
        "blobs/sha256/" + sha(config)[7:]: config,
        "blobs/sha256/" + sha(layer)[7:]: b"corrupted-layer" if corrupt else layer,
        "blobs/sha256/" + digest[7:]: manifest,
    }
    if extra:
        blobs[extra] = b"unexpected"
    with tarfile.open(path, "w") as tar:
        if directories:
            for name in ("./", "blobs/", "blobs/sha256/"):
                info = tarfile.TarInfo(name)
                info.type = tarfile.DIRTYPE
                info.size = 0
                tar.addfile(info)
        if extra_dir:
            info = tarfile.TarInfo(extra_dir)
            info.type = tarfile.DIRTYPE
            info.size = 0
            tar.addfile(info)
        for name, content in sorted(blobs.items()):
            info = tarfile.TarInfo("./" + name if prefix_files else name)
            info.size = len(content)
            tar.addfile(info, io.BytesIO(content))
        if extra_link:
            info = tarfile.TarInfo(extra_link)
            info.type = tarfile.SYMTYPE
            info.linkname = "oci-layout"
            tar.addfile(info)
    return digest


class OciOfflineTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.path = pathlib.Path(directory.name) / "sample.tar"

    def test_verified_content(self):
        digest = fixture(self.path)
        result = verify.verify(self.path, digest, verify.file_sha(self.path))
        self.assertEqual(result["objectsVerified"], 3)

    def test_corruption(self):
        digest = fixture(self.path, corrupt=True)
        with self.assertRaises(verify.IntegrityError):
            verify.verify(self.path, digest)

    def test_wrong_image(self):
        fixture(self.path)
        with self.assertRaises(verify.IntegrityError):
            verify.verify(self.path, "sha256:" + "0" * 64)

    def test_wrong_archive_hash(self):
        digest = fixture(self.path)
        with self.assertRaises(verify.IntegrityError):
            verify.verify(self.path, digest, "sha256:" + "f" * 64)

    def test_tar_path_escape(self):
        digest = fixture(self.path, extra="../escape")
        with self.assertRaises(verify.IntegrityError):
            verify.verify(self.path, digest)

    def test_unreferenced_file(self):
        digest = fixture(self.path, extra="unexpected")
        with self.assertRaises(verify.IntegrityError):
            verify.verify(self.path, digest)

    def test_requires_non_root(self):
        digest = fixture(self.path, user="root")
        with self.assertRaises(verify.IntegrityError):
            verify.verify(self.path, digest)

    def test_accepts_oci_structural_directories(self):
        digest = fixture(self.path, directories=True)
        self.assertEqual(verify.verify(self.path, digest)["result"], "PASS")

    def test_rejects_unexpected_directory(self):
        digest = fixture(self.path, directories=True, extra_dir="../escape/")
        with self.assertRaises(verify.IntegrityError):
            verify.verify(self.path, digest)

    def test_rejects_root_user_with_group(self):
        for user in ("0:0", "root:root", "0000:1000", ":wheel", "+0000:1000", "-0:0"):
            with self.subTest(user=user):
                digest = fixture(self.path, user=user)
                with self.assertRaises(verify.IntegrityError):
                    verify.verify(self.path, digest)

    def test_accepts_dot_prefixed_regular_files(self):
        digest = fixture(self.path, directories=True, prefix_files=True)
        self.assertEqual(verify.verify(self.path, digest)["result"], "PASS")

    def test_rejects_same_file_after_normalization(self):
        digest = fixture(self.path, extra="./index.json")
        with self.assertRaises(verify.IntegrityError):
            verify.verify(self.path, digest)

    def test_rejects_symlink_even_with_expected_name(self):
        digest = fixture(self.path, extra_link="blobs/untrusted")
        with self.assertRaises(verify.IntegrityError):
            verify.verify(self.path, digest)

    def test_accepts_nonroot_user_with_root_group(self):
        for user in ("node:root", "1000:0"):
            with self.subTest(user=user):
                digest = fixture(self.path, user=user)
                self.assertEqual(verify.verify(self.path, digest)["result"], "PASS")

    def test_rejects_mutable_tags(self):
        with self.assertRaises(verify.IntegrityError):
            verify.check_sha("latest")


if __name__ == "__main__":
    unittest.main()
