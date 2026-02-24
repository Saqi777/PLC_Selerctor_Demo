import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import fs from 'fs';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/')) {
              try {
                const url = new URL(req.url, `http://${req.headers.host}`);
                const pathName = url.pathname;
                
                // Resolve the API file
                const apiPath = path.resolve(`.${pathName}.ts`);
                if (!fs.existsSync(apiPath)) {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ error: `API Route ${pathName} not found` }));
                  return;
                }

                // Dynamic import the handler
                // We use a timestamp to avoid caching issues during development
                const { default: handler } = await import(`${apiPath}?t=${Date.now()}`);
                
                // Parse body
                const body = await new Promise((resolve) => {
                  let data = '';
                  req.on('data', chunk => data += chunk);
                  req.on('end', () => {
                    try {
                      resolve(data ? JSON.parse(data) : {});
                    } catch {
                      resolve({});
                    }
                  });
                });

                const mockRes = {
                  status: (code: number) => {
                    res.statusCode = code;
                    return mockRes;
                  },
                  json: (data: any) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                    return mockRes;
                  },
                  setHeader: (name: string, value: string) => {
                    res.setHeader(name, value);
                    return mockRes;
                  }
                };

                const mockReq = { 
                  method: req.method, 
                  body, 
                  query: Object.fromEntries(url.searchParams) 
                };

                await handler(mockReq, mockRes);
              } catch (e) {
                console.error('API Middleware Error:', e);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Internal Server Error', details: String(e) }));
              }
              return;
            }
            next();
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
