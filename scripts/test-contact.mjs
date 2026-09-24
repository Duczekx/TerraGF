import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source = await readFile(new URL('../website/dist/_worker.js',import.meta.url),'utf8');
const {default:worker} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const env={RESEND_API_KEY:'test-only',EMAIL_FROM:'TERRAGF <form@terragf.com>',TURNSTILE_SECRET_KEY:'test-secret',TURNSTILE_SITE_KEY:'test-site',ASSETS:{fetch:()=>new Response('asset')}};
const payload={name:'Test visitor',email:'visitor@example.org',message:'Test message for validation only.',token:'test-token',id:'123e4567-e89b-12d3-a456-426614174000',language:'de',to:'attacker@example.org'};
const req=(data=payload,origin='https://terragf.com')=>new Request('https://terragf.com/api/contact',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(data)});
let calls=[];
const originalFetch=globalThis.fetch;
try {
 assert.equal((await worker.fetch(new Request('https://terragf.com/style.css'),env)).status,200);
 assert.equal((await (await worker.fetch(new Request('https://terragf.com/api/contact'),{})).json()).ready,false);
 assert.equal((await worker.fetch(req(),{})).status,503);
 assert.equal((await worker.fetch(req(payload,'https://other.example'),env)).status,403);
 assert.equal((await worker.fetch(req({...payload,email:'a@example.org\r\nBcc: b@example.org'}),env)).status,400);
 assert.equal((await worker.fetch(req({...payload,message:'x'.repeat(25000)}),env)).status,400);
 globalThis.fetch=async()=>Response.json({success:false});
 assert.equal((await worker.fetch(req(),env)).status,403);
 globalThis.fetch=async()=>Response.json({success:true,hostname:'wrong.example',action:'contact'});
 assert.equal((await worker.fetch(req(),env)).status,403);
 globalThis.fetch=async(url,options)=>{
   calls.push({url,options});
   return url.includes('siteverify')?Response.json({success:true,hostname:'terragf.com',action:'contact'}):Response.json({id:'test-email'});
 };
 assert.deepEqual(await (await worker.fetch(req(),env)).json(),{ok:true});
 const email=JSON.parse(calls[1].options.body);
 assert.deepEqual(email.to,['terra.gf1900@outlook.com']);
 assert.equal(email.reply_to,'visitor@example.org');
 assert.equal(email.from,env.EMAIL_FROM);
 assert.equal(calls[1].options.headers['Idempotency-Key'],'contact-'+payload.id);

 const image = await readFile(new URL('../website/dist/assets/terra-gf1900.png',import.meta.url));
 const photo = {type:'image/png',content:image.toString('base64')};
 calls=[];
 assert.deepEqual(await (await worker.fetch(req({...payload,attachments:[photo]}),env)).json(),{ok:true});
 const attached=JSON.parse(calls[1].options.body).attachments;
 assert.equal(attached.length,1);
 assert.equal(attached[0].filename,'tractor-mount-1.png');
 assert.equal(attached[0].content,photo.content);
 for (const attachments of [[photo,photo,photo,photo],[{...photo,type:'image/jpeg'}],[{type:'image/png',content:Buffer.from('<script>bad</script>').toString('base64')}],[{type:'image/png',content:'!!!!'}],[{type:'image/png',path:'https://example.org/private'}]]) {
   assert.equal((await worker.fetch(req({...payload,attachments}),env)).status,400);
 }
 const large=Buffer.alloc(5000001);image.copy(large,0,0,12);
 assert.equal((await worker.fetch(req({...payload,attachments:[{type:'image/png',content:large.toString('base64')}]}),env)).status,400);
 const medium=Buffer.alloc(3400000);image.copy(medium,0,0,12);
 const mediumPhoto={type:'image/png',content:medium.toString('base64')};
 assert.equal((await worker.fetch(req({...payload,attachments:[mediumPhoto,mediumPhoto,mediumPhoto]}),env)).status,400);
 console.log('PASS: optional attachments, exact email bytes, safe filenames, count, file signatures, MIME mismatch, base64, no remote URLs and size limits.');
 globalThis.fetch=async url=>url.includes('siteverify')?Response.json({success:true,hostname:'terragf.com',action:'contact'}):new Response('',{status:500});
 assert.equal((await worker.fetch(req(),env)).status,502);
 console.log('PASS: configuration, assets, origin, validation, payload size, verification, fixed recipient, reply-to, idempotency and provider failure. All external requests mocked; no email sent.');
} finally {globalThis.fetch=originalFetch;}
