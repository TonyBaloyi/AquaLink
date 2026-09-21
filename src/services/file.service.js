const fs = require('fs/promises');
const path = require('path');

/**
 * File / Document Service (Core Services).
 * Stores generated reports and receipts on disk; swap the two functions for
 * S3 / Azure Blob when the platform moves to cloud hosting.
 */
const ROOT = path.join(process.cwd(), 'uploads');

async function save(relativePath, contents) {
  const target = path.join(ROOT, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, contents);
  return { path: relativePath, bytes: Buffer.byteLength(contents) };
}

const read = (relativePath) => fs.readFile(path.join(ROOT, relativePath));

/** Turns an array of rows into a CSV export for the reporting module. */
function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
}

module.exports = { save, read, toCsv };
