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


def fixture(path, corrupt=False, extra=None, user="node", directories=()):
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
        for directory in directories:
            info = tarfile.TarInfo(directory)
            info.type = tarfile.DIRTYPE
            tar.addfile(info)
        for name, content in sorted(blobs.items()):
            info = tarfile.TarInfo(name)
            info.size = len(content)
            tar.addfile(info, io.BytesIO(content))
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

    def test_accepts_expected_oci_structure_directories(self):
        for directories in (("./", "blobs/", "blobs/sha256/"),
                            ("blobs", "blobs/sha256")):
            with self.subTest(directories=directories):
                digest = fixture(self.path, directories=directories)
                result = verify.verify(self.path, digest, verify.file_sha(self.path))
                self.assertEqual(result["result"], "PASS")
                self.assertEqual(result["objectsVerified"], 3)

    def test_rejects_unknown_or_unsafe_directories(self):
        for directory in ("../", "/absolute/", "blobs/../", "blobs//sha256/",
                          "././",
                          "blobs/sha256/extra/", "./blobs/"):
            with self.subTest(directory=directory):
                digest = fixture(self.path, directories=(directory,))
                with self.assertRaises(verify.IntegrityError):
                    verify.verify(self.path, digest)

    def test_rejects_duplicate_structural_directories(self):
        digest = fixture(self.path, directories=("blobs/", "blobs"))
        with self.assertRaises(verify.IntegrityError):
            verify.verify(self.path, digest)

    def test_rejects_special_file_types_at_structural_paths(self):
        for kind in (tarfile.SYMTYPE, tarfile.LNKTYPE, tarfile.FIFOTYPE):
            with self.subTest(kind=kind):
                digest = fixture(self.path)
                with tarfile.open(self.path, "a") as tar:
                    info = tarfile.TarInfo("blobs/")
                    info.type = kind
                    info.linkname = "../outside"
                    tar.addfile(info)
                with self.assertRaises(verify.IntegrityError):
                    verify.verify(self.path, digest)

    def test_rejects_structural_directories_with_payload(self):
        digest = fixture(self.path)
        with tarfile.open(self.path, "a") as tar:
            info = tarfile.TarInfo("blobs/")
            info.type = tarfile.DIRTYPE
            info.size = 3
            tar.addfile(info, io.BytesIO(b"bad"))
        with self.assertRaises(verify.IntegrityError):
            verify.verify(self.path, digest)

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

    def test_rejects_root_uid_or_name_with_group(self):
        for user in ("0:0", "0:node", "000:users", "+0:1000", "root:node", "ROOT:node", ":node"):
            with self.subTest(user=user):
                digest = fixture(self.path, user=user)
                with self.assertRaises(verify.IntegrityError):
                    verify.verify(self.path, digest)

    def test_accepts_explicit_non_root_principal_with_group(self):
        for user in ("node:node", "1000:1000"):
            with self.subTest(user=user):
                digest = fixture(self.path, user=user)
                self.assertEqual(verify.verify(self.path, digest)["result"], "PASS")

    def test_rejects_mutable_tags(self):
        with self.assertRaises(verify.IntegrityError):
            verify.check_sha("latest")


if __name__ == "__main__":
    unittest.main()
