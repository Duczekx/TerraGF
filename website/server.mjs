import http from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./dist/', import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.woff2':'font/woff2','.svg':'image/svg+xml','.mp4':'video/mp4'};
const server = http.createServer(async(req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root)) { res.writeHead(403);res.end();return; }
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    const headers={'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
    let start=0,end=info.size-1,status=200;
    if(req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(!match || (!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
      if(!match[1]) start=Math.max(0,info.size-Number(match[2]));
      else {start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
      if(start>end || start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
      status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length']=Math.max(0,end-start+1);
    res.writeHead(status,headers);
    if(req.method==='HEAD'){res.end();return;}
    if(!info.size){res.end();return;}
    createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
  } catch { res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Nie znaleziono strony.'); }
});
server.listen(4173,'127.0.0.1',()=>console.log('TERRA GF 1900 — Local: http://127.0.0.1:4173'));
