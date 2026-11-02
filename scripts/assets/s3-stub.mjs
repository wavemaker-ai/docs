// A small S3 look-alike for tests (path-style requests, as the AWS CLI sends them to an IP address).
// It implements what the upload and swap flows use: PUT with a SHA-256 checksum and conditional
// writes, HEAD, GET, S3-style XML errors, and a request log. Faults can be queued per method to
// exercise retries: a status code, `drop` (close the connection before storing) or `store-then-drop`
// (store the object, then close the connection, so the client never sees the answer).
import crypto from 'node:crypto';
import http from 'node:http';

const xml = (code, message) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<Error><Code>${code}</Code><Message>${message}</Message></Error>`;

export async function startS3Stub({ bucket = 'test-bucket' } = {}) {
  const objects = new Map(); // key -> { body, headers, checksum }
  const requests = []; // { method, key, headers }
  const faults = { PUT: [], HEAD: [], GET: [] };

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const [, requestedBucket, ...rest] = decodeURIComponent(req.url.split('?')[0]).split('/');
      const key = rest.join('/');
      requests.push({ method: req.method, key, headers: req.headers });
      const send = (status, headers = {}, text = '') => {
        res.writeHead(status, { 'content-type': 'application/xml', ...headers });
        res.end(req.method === 'HEAD' ? undefined : text);
      };
      if (requestedBucket !== bucket) return send(404, {}, xml('NoSuchBucket', 'The bucket does not exist'));

      const fault = faults[req.method]?.shift();
      if (fault === 'drop') return req.socket.destroy();
      if (typeof fault === 'object' && fault.status)
        return send(fault.status, {}, xml(fault.code ?? 'InternalError', fault.message ?? 'injected fault'));

      if (req.method === 'PUT') {
        const claimed = req.headers['x-amz-checksum-sha256'];
        const actual = crypto.createHash('sha256').update(body).digest('base64');
        if (claimed && claimed !== actual)
          return send(400, {}, xml('BadDigest', 'The SHA256 you specified did not match the calculated checksum.'));
        if (req.headers['if-none-match'] === '*' && objects.has(key))
          return send(412, {}, xml('PreconditionFailed', 'At least one of the pre-conditions you specified did not hold'));
        const headers = Object.fromEntries(
          Object.entries(req.headers).filter(([k]) => /^(content-type|cache-control|x-amz-meta-)/.test(k)),
        );
        objects.set(key, { body, headers, checksum: claimed ?? null });
        if (fault === 'store-then-drop') return req.socket.destroy();
        return send(200, { etag: '"stub"', 'x-amz-checksum-sha256': actual });
      }
      const object = objects.get(key);
      if (!object) return send(404, {}, xml('NoSuchKey', 'The specified key does not exist.'));
      const headers = {
        'content-length': String(object.body.length),
        etag: '"stub"',
        ...(object.checksum ? { 'x-amz-checksum-sha256': object.checksum } : {}),
        ...object.headers,
      };
      if (req.method === 'HEAD') return send(200, headers);
      res.writeHead(200, { ...headers, 'content-type': object.headers['content-type'] ?? 'application/octet-stream' });
      return res.end(object.body);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    bucket,
    endpoint: `http://127.0.0.1:${port}`,
    objects,
    requests,
    fail: (method, ...list) => faults[method].push(...list),
    count: (method) => requests.filter((r) => r.method === method).length,
    close: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve); }),
  };
}
