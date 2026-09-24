(() => {
  const dictionaries = window.TRANSLATIONS;
  const supported = Object.keys(dictionaries);
  const valid = value => supported.includes(value);
  let saved;
  try { saved = localStorage.getItem('terra-language'); } catch {}
  const requested = new URL(location.href).searchParams.get('lang');
  let language = valid(requested) ? requested : valid(saved) ? saved : 'de';
  const translate = key => dictionaries[language][key] ?? key;
  function message(element, key) {
    element.dataset.message = key;
    element.textContent = translate(key);
  }
  function apply(next, persist = false) {
    if (!valid(next)) return;
    language = next;
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = translate(el.dataset.i18n); });
    for (const attribute of ['alt','aria-label','title','content']) {
      document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(el => {
        const key = el.getAttribute(`data-i18n-${attribute}`);
        if (el.tagName === 'TITLE') document.title = translate(key);
        else el.setAttribute(attribute, translate(key));
      });
    }
    document.querySelectorAll('[data-message]').forEach(el => { el.textContent = translate(el.dataset.message); });
    document.querySelector('#language-select').value = language;
    updateLanguageControl();
    document.querySelectorAll('a[href$="-1920.webp"]').forEach(link => {
      link.setAttribute('aria-label', `${translate('Powiększ zdjęcie')}: ${link.querySelector('img').alt}`);
    });
    customElements.whenDefined('model-viewer').then(() => {
      const model = document.querySelector('#fork-model');
      const hints = {'interaction-prompt': translate('Obracaj myszą, dotykiem lub klawiszami strzałek.')};
      for (const [prefix, label] of [['','Widok'],['upper-','Widok z góry i'],['lower-','Widok z dołu i']]) {
        for (const [side, direction] of [['front','z przodu'],['right','z prawej'],['back','z tyłu'],['left','z lewej']]) {
          hints[prefix + side] = translate(`${label} ${direction}`);
        }
      }
      model.a11y = hints;
      model.shadowRoot?.querySelector('[role="region"]')?.setAttribute('aria-label', translate('Komunikaty modelu 3D'));
    });
    if (persist) {
      try { localStorage.setItem('terra-language', language); } catch {}
      const url = new URL(location.href);
      url.searchParams.set('lang', language);
      history.replaceState(history.state, '', url);
    }
    document.dispatchEvent(new CustomEvent('languagechange'));
  }
  window.i18n = { t:translate, message, get language(){ return language; } };
  const select = document.querySelector('#language-select');
  const picker = document.createElement('div');
  picker.className = 'language-picker language-enhanced';
  const trigger = document.createElement('button');
  trigger.className = 'language-trigger';
  trigger.type = 'button';
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'language-menu');
  trigger.innerHTML = '<span class="language-globe" aria-hidden="true">◎</span><span class="language-code"></span><span class="language-chevron" aria-hidden="true">⌄</span>';
  const panel = document.createElement('div');
  panel.className = 'language-panel';
  panel.id = 'language-menu';
  panel.setAttribute('role', 'menu');
  panel.hidden = true;
  const heading = document.createElement('div');
  heading.className = 'language-heading';
  heading.setAttribute('aria-hidden', 'true');
  panel.append(heading);
  const items = [...select.options].map(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'language-option';
    button.dataset.language = option.value;
    button.setAttribute('role', 'menuitemradio');
    button.tabIndex = -1;
    const code = document.createElement('span');
    code.className = 'language-option-code';
    code.textContent = option.value.toUpperCase();
    code.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.lang = option.value;
    name.textContent = option.textContent;
    const check = document.createElement('span');
    check.className = 'language-check';
    check.textContent = '✓';
    check.setAttribute('aria-hidden', 'true');
    button.append(code, name, check);
    button.addEventListener('click', () => { apply(option.value, true); closeLanguages(true); });
    panel.append(button);
    return button;
  });
  select.closest('.language-picker').replaceWith(picker);
  select.hidden = true;
  picker.append(select, trigger, panel);
  function updateLanguageControl() {
    trigger.querySelector('.language-code').textContent = language.toUpperCase();
    trigger.setAttribute('aria-label', `${translate('Język strony')}: ${select.selectedOptions[0].textContent}`);
    panel.setAttribute('aria-label', translate('Język strony'));
    heading.textContent = translate('Język strony');
    items.forEach(item => item.setAttribute('aria-checked', String(item.dataset.language === language)));
  }
  function closeLanguages(restoreFocus = false) {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus({preventScroll:true});
  }
  function openLanguages() {
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    items.find(item => item.dataset.language === language).focus({preventScroll:true});
  }
  trigger.addEventListener('click', () => panel.hidden ? openLanguages() : closeLanguages(true));
  trigger.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); openLanguages(); }
  });
  panel.addEventListener('keydown', event => {
    const index = items.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % items.length;
    if (event.key === 'ArrowUp') next = (index + items.length - 1) % items.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = items.length - 1;
    if (next !== undefined) { event.preventDefault(); items[next].focus(); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); closeLanguages(true); }
  });
  document.addEventListener('click', event => { if (!picker.contains(event.target)) closeLanguages(); });
  picker.addEventListener('focusout', event => { if (!picker.contains(event.relatedTarget)) closeLanguages(); });
  select.addEventListener('change', event => apply(event.target.value, true));
  window.addEventListener('popstate', () => {
    const lang = new URL(location.href).searchParams.get('lang');
    apply(valid(lang) ? lang : 'de');
  });
  apply(language);
})();
