import { readFileSync, writeFileSync } from 'node:fs';
import type { RawPlace } from '../src/domain/normalize/raw';
import { normalizeAll } from '../src/domain/normalize/normalizePlace';
import { buildAudit } from './audit';

const RAW = new URL('../data/raw/italy.json', import.meta.url);
const PLACES_OUT = new URL('../src/data/places.json', import.meta.url);
const AUDIT_OUT = new URL('../data/audit.md', import.meta.url);

const raws = JSON.parse(readFileSync(RAW, 'utf-8')) as RawPlace[];
const places = normalizeAll(raws);

writeFileSync(PLACES_OUT, `${JSON.stringify(places, null, 2)}\n`);
writeFileSync(AUDIT_OUT, buildAudit(raws, places));

const flagged = places.filter((p) => p.flags.length > 0).length;
console.log(`Normalized ${places.length} places (${flagged} carry data-quality flags).`);
console.log(`Wrote ${PLACES_OUT.pathname}`);
console.log(`Wrote ${AUDIT_OUT.pathname}`);
