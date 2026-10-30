// measure-dimensions.mjs: image sizes for pointer files, decoded with sharp.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { measure, measureAll } from './measure-dimensions.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'measure-'));
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
const at = (name) => path.join(dir, name);
const blank = (width, height) => sharp({ create: { width, height, channels: 3, background: '#336699' } });

test('png, jpeg and webp report their real size', async () => {
  await blank(64, 32).png().toFile(at('a.png'));
  await blank(10, 20).jpeg().toFile(at('b.jpg'));
  await blank(7, 9).webp().toFile(at('c.webp'));
  assert.deepEqual(await measure(at('a.png')), { width: 64, height: 32 });
  assert.deepEqual(await measure(at('b.jpg')), { width: 10, height: 20 });
  assert.deepEqual(await measure(at('c.webp')), { width: 7, height: 9 });
});

test('a gif reports one frame, not the stacked animation', async () => {
  const frames = await Promise.all([1, 2, 3].map(() => blank(30, 20).raw().toBuffer()));
  await sharp(Buffer.concat(frames), { raw: { width: 30, height: 60, channels: 3, pageHeight: 20 } })
    .gif({ loop: 0 })
    .toFile(at('anim.gif'));
  assert.deepEqual(await measure(at('anim.gif')), { width: 30, height: 20 });
});

test('anything that is not a readable image is skipped, not an error', async () => {
  fs.writeFileSync(at('fake.png'), 'not an image');
  fs.writeFileSync(at('movie.mp4'), 'x');
  fs.writeFileSync(at('vector.svg'), '<svg/>');
  fs.symlinkSync(at('a.png') , at('link.png'));
  for (const name of ['fake.png', 'movie.mp4', 'vector.svg', 'missing.png', 'link.png'])
    assert.equal(await measure(at(name)), null, name);
});

test('the result is keyed by the sha256 of the file bytes', async () => {
  const out = await measureAll([at('a.png'), at('fake.png')]);
  const hash = crypto.createHash('sha256').update(fs.readFileSync(at('a.png'))).digest('hex');
  assert.deepEqual(out, { [hash]: { width: 64, height: 32 } });
});
