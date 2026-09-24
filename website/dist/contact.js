(() => {
  const form = document.querySelector('#contact-form');
  const button = form.querySelector('[type=submit]');
  const label = button.querySelector('[data-i18n]');
  const status = document.querySelector('#contact-status');
  let token = '', widget, ready = false, sending = false;
  let submissionId = crypto.randomUUID();
  const photoInput = document.querySelector('#contact-photos');
  const photoList = document.querySelector('#attachment-list');
  const photoStatus = document.querySelector('#attachment-status');
  let photos = [];
  const attachmentError = 'Nie dodano zdjęć. Wybierz maksymalnie 3 pliki JPG, PNG lub WebP, do 5 MB każdy i 10 MB łącznie.';
  function renderPhotos() {
    photoList.replaceChildren();
    photos.forEach((photo, index) => {
      const item = document.createElement('li');
      const img = document.createElement('img'); img.src = photo.url; img.alt = photo.file.name;
      const name = document.createElement('span'); name.className = 'attachment-filename'; name.textContent = photo.file.name;
      const size = document.createElement('small'); size.textContent = `${(photo.file.size / 1000000).toFixed(1)} MB`;
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'attachment-remove'; remove.textContent = '×';
      remove.setAttribute('aria-label', `${i18n.t('Usuń zdjęcie')}: ${photo.file.name}`);
      remove.addEventListener('click', () => {
        if (sending) return;
        URL.revokeObjectURL(photo.url); photos.splice(index, 1); submissionId = crypto.randomUUID(); renderPhotos();
        photoStatus.textContent = ''; delete photoStatus.dataset.message; photoInput.focus();
      });
      item.append(img, name, size, remove); photoList.append(item);
    });
  }
  function clearPhotos() { photos.forEach(photo => URL.revokeObjectURL(photo.url)); photos = []; renderPhotos(); }
  photoInput.addEventListener('change', () => {
    const files = [...photoInput.files]; photoInput.value = '';
    if (sending || !files.length) return;
    if (photos.length + files.length > 3 || files.some(file => !['image/jpeg','image/png','image/webp'].includes(file.type) || !file.size || file.size > 5000000) ||
        [...photos.map(photo => photo.file), ...files].reduce((sum,file) => sum + file.size,0) > 10000000) {
      i18n.message(photoStatus, attachmentError); return;
    }
    photos.push(...files.map(file => ({file, url:URL.createObjectURL(file)})));
    submissionId = crypto.randomUUID(); photoStatus.textContent = ''; delete photoStatus.dataset.message; renderPhotos();
  });
  document.addEventListener('languagechange', renderPhotos);
  const encodePhoto = file => new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({content:reader.result.split(',')[1],type:file.type});
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  function tell(key,state='') { i18n.message(status,key); status.dataset.state = state; }
  function buttonState() { button.disabled = !ready || sending; }
  form.addEventListener('input', () => { submissionId = crypto.randomUUID(); });
  async function initialize() {
    try {
      const response = await fetch('/api/contact',{headers:{Accept:'application/json'}});
      if (!response.ok) return;
      const config = await response.json();
      if (!config.ready || !config.siteKey) return;
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => {
        widget = turnstile.render('#contact-verification',{
          sitekey:config.siteKey,action:'contact',theme:'light',size:'flexible',language:i18n.language,
          callback:value => { token = value; },
          'expired-callback':() => { token = ''; },
          'error-callback':() => { token = ''; tell('Potwierdź weryfikację przed wysłaniem.','error'); }
        });
        ready = true; buttonState(); status.textContent=''; delete status.dataset.message;
      };
      script.onerror = () => tell('Formularz jest chwilowo niedostępny. Napisz do nas na Instagramie.','error');
      document.head.append(script);
    } catch { /* Preserve the translated unavailable state and the Instagram alternative. */ }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!ready || sending) return;
    if (!form.reportValidity()) return;
    if (!token) { tell('Potwierdź weryfikację przed wysłaniem.','error'); return; }
    const fields = new FormData(form);
    const payload = {name:fields.get('name'),email:fields.get('email'),message:fields.get('message'),language:i18n.language,token,id:submissionId};
    sending = true; photoInput.disabled = true; buttonState(); label.dataset.i18n='Wysyłanie…'; label.textContent=i18n.t('Wysyłanie…');
    tell('Wysyłanie…');
    try {
      payload.attachments = await Promise.all(photos.map(photo => encodePhoto(photo.file)));
      const response = await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(60000)});
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const key = data.error === 'attachments' ? 'Załączniki są nieprawidłowe. Wybierz ponownie zdjęcia JPG, PNG lub WebP.' : data.error === 'validation' ? 'Wpisz imię, poprawny e-mail i wiadomość (10–5000 znaków).' : data.error === 'verification' ? 'Potwierdź weryfikację przed wysłaniem.' : 'Nie udało się wysłać wiadomości. Treść została zachowana. Spróbuj ponownie.';
        tell(key,'error');
      } else {
        form.reset(); clearPhotos(); submissionId = crypto.randomUUID(); tell('Wiadomość została wysłana. Dziękujemy za kontakt.','success');
      }
    } catch { tell('Nie udało się wysłać wiadomości. Treść została zachowana. Spróbuj ponownie.','error'); }
    finally {
      token=''; if (widget !== undefined) turnstile.reset(widget);
      sending=false; photoInput.disabled=false; buttonState(); label.dataset.i18n='Wyślij zapytanie'; label.textContent=i18n.t('Wyślij zapytanie');
    }
  });
  // Activate third-party verification only when the form comes into view.
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); initialize(); }
  },{rootMargin:'200px'});
  observer.observe(form);
})();
