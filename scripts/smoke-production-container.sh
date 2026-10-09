#!/usr/bin/env bash
# Isolated PR/CI runtime validation: deliberately provides no production secrets.
set -Eeuo pipefail

revision="${1:?Expected the exact 40-character source revision}"
if ! [[ "$revision" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Image smoke requires an exact lowercase commit SHA." >&2
  exit 1
fi

container_id=""
cleanup() {
  if [ -n "$container_id" ]; then
    docker rm --force "$container_id" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

container_id="$(docker run --detach --rm \
  --publish 127.0.0.1:10080:10000 \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  "academiaarcana:${revision}")"

if [ "$(docker exec "$container_id" id -u)" = "0" ]; then
  echo "Production container must not run as root." >&2
  exit 1
fi

# Check presence only. Never fetch, print, or inject actual credential values.
docker exec "$container_id" node -e '
const runtimeOnly = [
  "OPENAI_API_KEY",
  "PARALLEL_API_KEY",
  "EXA_API_KEY",
  "OUTLOOK_CALENDAR_SESSION_SECRET",
];
for (const key of runtimeOnly) {
  if (Object.prototype.hasOwnProperty.call(process.env, key)) {
    console.error("Runtime-only key unexpectedly present in isolated build: " + key);
    process.exit(1);
  }
}
'

for attempt in {1..30}; do
  if ! docker inspect "$container_id" >/dev/null 2>&1; then
    echo "Production container exited before liveness was ready." >&2
    exit 1
  fi
  if body="$(curl --fail --silent --max-time 5 http://127.0.0.1:10080/api/health 2>/dev/null)"; then
    if node -e '
      const response = JSON.parse(process.argv[1]);
      const revision = process.argv[2];
      if (response.status !== "ok" ||
          response.service !== "academiaarcana" ||
          response.revision !== revision) {
        process.exit(1);
      }
    ' "$body" "$revision"; then
      echo "Isolated production container passed liveness, revision, non-root, and credential-absence checks."
      exit 0
    fi
  fi
  sleep 2
done

echo "Production container did not satisfy the expected /api/health contract." >&2
exit 1
