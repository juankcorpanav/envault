const http = require('http');
const { fetchFromUrl } = require('../importSources');

let server;
let baseUrl;

beforeAll((done) => {
  server = http.createServer((req, res) => {
    if (req.url === '/env') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('API_KEY=fetched123\nDB_HOST=remotehost\n');
    } else if (req.url === '/not-found') {
      res.writeHead(404);
      res.end();
    } else {
      res.writeHead(500);
      res.end();
    }
  });
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

describe('fetchFromUrl', () => {
  it('fetches raw env content from a valid URL', async () => {
    const content = await fetchFromUrl(`${baseUrl}/env`);
    expect(content).toContain('API_KEY=fetched123');
    expect(content).toContain('DB_HOST=remotehost');
  });

  it('rejects with an error on HTTP 404', async () => {
    await expect(fetchFromUrl(`${baseUrl}/not-found`)).rejects.toThrow('HTTP 404');
  });

  it('rejects with an error on HTTP 500', async () => {
    await expect(fetchFromUrl(`${baseUrl}/other`)).rejects.toThrow('HTTP 500');
  });

  it('rejects when the host is unreachable', async () => {
    await expect(fetchFromUrl('http://127.0.0.1:1')).rejects.toThrow();
  });
});
