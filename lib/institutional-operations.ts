import 'server-only';
import { createHash, createHmac } from 'node:crypto';
import type { Person } from './contracts';
import { ServiceIssue } from './db';

export async function institutionalRequest(person: Person, operation: string, data: object = {}) {
  if (person.scope !== 'live' || !person.roles.some(role => ['admin', 'super_admin'].includes(role))) {
    throw new ServiceIssue('WORKSPACE_ACCESS_REQUIRED', 'Administrator access is required.', 403);
  }
  const secret = process.env.HUB_OPERATIONS_SECRET;
  if (!secret || secret.length < 32) {
    throw new ServiceIssue('WORKSPACE_CONNECTION_REQUIRED', 'The administration connection is unavailable.', 503);
  }
  const body = JSON.stringify({ operation, data });
  const iat = Math.floor(Date.now() / 1000);
  const proof = Buffer.from(JSON.stringify({
    use: 'hub-operations', sub: person.provider_subject, method: 'POST',
    body: createHash('sha256').update(body).digest('hex'), iat, exp: iat + 30,
  })).toString('base64url');
  const token = proof + '.' + createHmac('sha256', secret).update(proof).digest('base64url');
  const website = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://citizenbank.co.ls';
  const response = await fetch(new URL('/api/platform/hub-operations', website), {
    method: 'POST', body, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(25000),
    headers: { 'X-Citizen-Hub-Token': token, 'Content-Type': 'application/json' },
  });
  if (response.ok && response.headers.get('content-type')?.startsWith('application/pdf')) {
    return new Response(await response.arrayBuffer(), {headers:{'Content-Type':'application/pdf','Cache-Control':'private, no-store'}});
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) {
    const detail = response.status < 500 && typeof result?.detail === 'string' ? result.detail : 'The save or data request could not be confirmed. Retry.';
    throw new ServiceIssue('WORKSPACE_REQUEST_FAILED', detail, response.ok ? 502 : response.status);
  }
  return result;
}
