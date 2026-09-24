const recipient = 'terra.gf1900@outlook.com';
const reply = (status, body) => Response.json(body, {status, headers:{'Cache-Control':'no-store'}});
const configured = env => Boolean(env.RESEND_API_KEY && env.EMAIL_FROM && env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY);
async function readJson(request) {
  if (Number(request.headers.get('content-length')) > 13400000) throw new Error('size');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('body');
  const chunks = []; let size = 0;
  while (true) {
    const {value,done} = await reader.read(); if (done) break;
    size += value.length;
    if (size > 13400000) { await reader.cancel(); throw new Error('size'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
function validateAttachments(input = []) {
  if (!Array.isArray(input) || input.length > 3) throw new Error('attachments');
  let total = 0;
  return input.map((file, index) => {
    if (!file || typeof file.content !== 'string' || !file.content.length || file.content.length > 6666668 ||
        file.content.length % 4 || /[^A-Za-z0-9+/=]/.test(file.content)) throw new Error('attachments');
    const bytes = atob(file.content);
    if (btoa(bytes) !== file.content || bytes.length > 5000000 || bytes.length < 12) throw new Error('attachments');
    total += bytes.length;
    if (total > 10000000) throw new Error('attachments');
    const starts = (...values) => values.every((value, i) => bytes.charCodeAt(i) === value);
    let type, extension;
    if (starts(255,216,255)) {type='image/jpeg';extension='jpg';}
    else if (starts(137,80,78,71,13,10,26,10)) {type='image/png';extension='png';}
    else if (bytes.slice(0,4)==='RIFF' && bytes.slice(8,12)==='WEBP') {type='image/webp';extension='webp';}
    else throw new Error('attachments');
    if (file.type !== type) throw new Error('attachments');
    return {filename:`tractor-mount-${index+1}.${extension}`,content:file.content,content_type:type};
  });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/contact') return env.ASSETS.fetch(request);
    if (request.method === 'GET') return reply(200,{ready:configured(env),siteKey:configured(env)?env.TURNSTILE_SITE_KEY:null});
    if (request.method !== 'POST') return reply(405,{error:'method'});
    if (request.headers.get('origin') !== url.origin) return reply(403,{error:'origin'});
    if (!configured(env)) return reply(503,{error:'unavailable'});
    if (!(request.headers.get('content-type') || '').startsWith('application/json')) return reply(415,{error:'content_type'});
    let body;
    try { body = await readJson(request); } catch { return reply(400,{error:'validation'}); }
    if (!body || typeof body !== 'object') return reply(400,{error:'validation'});
    const {name,email,message,token,id} = body;
    if (typeof name !== 'string' || !name.trim() || name.length>100 || /[\r\n\x00]/.test(name) ||
        typeof email !== 'string' || email.length>254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ||
        typeof message !== 'string' || message.trim().length<10 || message.length>5000 ||
        typeof token !== 'string' || !token || token.length>2048 ||
        typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return reply(400,{error:'validation'});
    let attachments;
    try { attachments = validateAttachments(body.attachments); } catch { return reply(400,{error:'attachments'}); }
    try {
      const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
        method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:request.headers.get('CF-Connecting-IP') || ''}),signal:AbortSignal.timeout(10000)
      });
      if (!verification.ok) return reply(502,{error:'verification'});
      const checked = await verification.json();
      if (!checked.success || checked.hostname !== url.hostname || checked.action !== 'contact') return reply(403,{error:'verification'});
      const lang = ['de','en','pl','fr','es','it'].includes(body.language) ? body.language : 'de';
      const result = await fetch('https://api.resend.com/emails',{
        method:'POST',headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`contact-${id}`},
        body:JSON.stringify({from:env.EMAIL_FROM,to:[recipient],reply_to:email.trim(),subject:'TERRAGF — nowe zapytanie / Neue Anfrage',text:`Formularz terragf.com\nImię / Name: ${name.trim()}\nE-mail: ${email.trim()}\nJęzyk / Sprache: ${lang}\n\n${message.trim()}`,attachments}),signal:AbortSignal.timeout(15000)
      });
      if (!result.ok) return reply(502,{error:'delivery'});
      const sent = await result.json();
      if (!sent.id) return reply(502,{error:'delivery'});
      return reply(200,{ok:true});
    } catch { return reply(502,{error:'delivery'}); }
  }
};
