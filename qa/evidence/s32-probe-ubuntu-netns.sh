#!/usr/bin/env bash
# REVIEW ONLY: no workflow activation, no npm/build/test, no external network call.
set -euo pipefail
[[ "${AA_NETNS_EVIDENCE_AUTHORIZED:-}" == yes ]] || { echo 'BLOCKED: explicit evidence authorization required' >&2; exit 40; }
[[ "${RUNNER_OS:-}" == Linux && "${GITHUB_ACTIONS:-}" == true ]] || { echo 'BLOCKED: GitHub Ubuntu runner required' >&2; exit 41; }
. /etc/os-release
[[ "${ID:-}" == ubuntu && "${VERSION_ID:-}" == 24.04 ]] || { echo 'BLOCKED: Ubuntu 24.04 required' >&2; exit 42; }
for program in sudo unshare ip readlink python3; do
  command -v "$program" >/dev/null || { echo "BLOCKED: missing $program" >&2; exit 43; }
done
AA_PARENT_NS="$(readlink /proc/self/ns/net)"
[[ "$AA_PARENT_NS" == net:\[*\] ]] || { echo 'BLOCKED: unrecognized parent netns' >&2; exit 44; }
# Root is used only to create the disposable netns and bring its own loopback up.
# The probe does NOT request or connect to any public IP, DNS server or service.
sudo -n env -i PATH='/usr/sbin:/usr/bin:/sbin:/bin' AA_PARENT_NS="$AA_PARENT_NS" \
  unshare --net -- python3 - <<'PY'
import json, os, subprocess

def output(argv):
    return subprocess.check_output(argv,text=True,timeout=8).strip()

subprocess.run(['ip','link','set','lo','up'],check=True,timeout=8)
parent=os.environ['AA_PARENT_NS']
child=output(['readlink','/proc/self/ns/net'])
links=json.loads(output(['ip','-j','link','show']) or '[]')
ipv4=json.loads(output(['ip','-j','-4','route','show','table','all']) or '[]')
ipv6=json.loads(output(['ip','-j','-6','route','show','table','all']) or '[]')
interfaces=[x.get('ifname') for x in links]
separate=child!=parent and child.startswith('net:[')
only_loopback=interfaces==['lo']
no_external_routes=all(route.get('dev')=='lo' for route in ipv4+ipv6)
passed=bool(separate and only_loopback and no_external_routes)
report={'schema':1,'test':'Ubuntu 24.04 isolated network namespace',
  'pass':passed,'separateNamespace':separate,
  'interfaces':interfaces,'onlyLoopback':only_loopback,
  'noExternalRoutes':no_external_routes,'ipv4Routes':len(ipv4),
  'ipv6Routes':len(ipv6),'externalConnectionsAttempted':0,
  'releaseAuthorized':False}
print(json.dumps(report,sort_keys=True))
if not passed: raise SystemExit(50)
PY
