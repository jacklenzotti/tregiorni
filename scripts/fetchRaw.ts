import { writeFileSync } from 'node:fs';

const SOURCE = 'https://storage.googleapis.com/interview-booking/italy.json';
const DEST = new URL('../data/raw/italy.json', import.meta.url);

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
const body = await res.text();
JSON.parse(body);
writeFileSync(DEST, body);
console.log(`Wrote ${body.length} bytes to ${DEST.pathname}`);
