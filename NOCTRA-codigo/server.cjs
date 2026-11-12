// Servidor local de desenvolvimento. Não requer instalação de pacotes.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,port=5500;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg'};
http.createServer((req,res)=>{let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end()}
 if(pathname.split('/').some(part=>part.startsWith('.'))){res.writeHead(403);return res.end()}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 fs.stat(file,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404);return res.end('Not found')}
 const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
 let start=0,end=stat.size-1,status=200;
 if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':'bytes */'+stat.size});return res.end()}
 if(!match[1]){start=Math.max(0,stat.size-Number(match[2]))}else{start=Number(match[1]);if(match[2])end=Math.min(Number(match[2]),end)}
 if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':'bytes */'+stat.size});return res.end()}
 status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`}
 headers['Content-Length']=Math.max(0,end-start+1);res.writeHead(status,headers);if(req.method==='HEAD')return res.end();const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);
 });
}).listen(port,'127.0.0.1',()=>console.log(`NOCTRA: http://127.0.0.1:${port}`));
