/**
 * Technical C03 Docker publish-port preflight. This is not an egress/DNS,
 * IPv4/IPv6 firewall or independent-review attestation.
 * Input comes from a read-only Docker ps JSON-lines command.
 * Never log container environment variables or secret-bearing inspect output.
 */
export function assessSupabasePublishedPorts(dockerPsJsonLines) {
  const reasons = [];
  if (typeof dockerPsJsonLines !== 'string' || !dockerPsJsonLines.trim()) {
    return { ok: false, reasons: ['Docker container inventory is unavailable'] };
  }

  let sawKong = false;
  let sawDatabase = false;
  let kongPublished = false;
  let databasePublished = false;
  for (const line of dockerPsJsonLines.split(/\r?\n/).filter(Boolean)) {
    let item;
    try { item = JSON.parse(line); } catch {
      return { ok: false, reasons: ['Docker container inventory is malformed'] };
    }
    if (!item || typeof item.Names !== 'string' || typeof item.Ports !== 'string') {
      return { ok: false, reasons: ['Docker container port metadata is incomplete'] };
    }
    if (!/^supabase_/.test(item.Names)) continue;
    const isKong = /^supabase_kong(?:_|$)/.test(item.Names);
    const isDatabase = /^supabase_db(?:_|$)/.test(item.Names);
    sawKong ||= isKong;
    sawDatabase ||= isDatabase;

    for (const specification of item.Ports.split(/,\s*/).filter(Boolean)) {
      if (!specification.includes('->')) continue;
      const match = /^(127\.0\.0\.1|\[::1\]):([0-9]{1,5})->([0-9]{1,5})\/(tcp|udp)$/.exec(specification);
      if (!match || Number(match[2]) < 1 || Number(match[2]) > 65535 ||
          Number(match[3]) < 1 || Number(match[3]) > 65535) {
        reasons.push('Supabase container has non-loopback or malformed published ports');
        continue;
      }
      if (isKong) kongPublished = true;
      if (isDatabase) databasePublished = true;
    }
  }

  if (!sawKong || !sawDatabase) {
    reasons.push('Running local Supabase API and database containers were not both found');
  } else if (!kongPublished || !databasePublished) {
    reasons.push('Local Supabase API and database must each publish on loopback');
  }
  return { ok: reasons.length === 0, reasons: [...new Set(reasons)] };
}
