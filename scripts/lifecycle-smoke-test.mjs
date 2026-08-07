import { readFile } from 'node:fs/promises';

const base = 'http://localhost:3000';

async function login(email, password) {
  const response = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`login failed for ${email}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function run() {
  const brand = await login('brand@nike.com', 'brand123');
  const creator = await login('priya@creator.com', 'creator123');

  const fileBuffer = await readFile('Project_Guide_pdf/Project_Guide.md');
  const form = new FormData();
  form.set('campaignId', 'camp1');
  form.set('creatorId', 'c1');
  form.set('paymentAmount', '7000');
  form.set('file', new Blob([fileBuffer], { type: 'text/markdown' }), 'Project_Guide.md');

  const ingestRes = await fetch(`${base}/api/contracts/ingest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${brand.token}` },
    body: form,
  });
  const ingest = await ingestRes.json();
  if (!ingestRes.ok) {
    throw new Error(`ingest failed: ${JSON.stringify(ingest)}`);
  }

  const contractId = ingest.contractId;

  const acceptRes = await fetch(`${base}/api/contracts/${contractId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${creator.token}` },
  });
  const accept = await acceptRes.json();
  if (!acceptRes.ok) {
    throw new Error(`accept failed: ${JSON.stringify(accept)}`);
  }

  const lockRes = await fetch(`${base}/api/contracts/${contractId}/lock`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${brand.token}` },
  });
  const lock = await lockRes.json();
  if (!lockRes.ok) {
    throw new Error(`lock failed: ${JSON.stringify(lock)}`);
  }

  const executeRes = await fetch(`${base}/api/contracts/${contractId}/execute`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${brand.token}` },
  });
  const execute = await executeRes.json();
  if (!executeRes.ok) {
    throw new Error(`execute failed: ${JSON.stringify(execute)}`);
  }

  console.log(JSON.stringify({
    contractId,
    acceptedStatus: accept.status,
    lockedStatus: lock.status,
    termsHash: lock.termsHash,
    finalStatus: execute.status,
    decision: execute.decision,
  }, null, 2));
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
