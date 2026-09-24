# TERRAGF

Strona produktu GF 1900: model 3D, galeria zdjęć, filmy, sześć języków (domyślnie niemiecki) i formularz kontaktowy ze zdjęciami mocowania.

## Lokalny podgląd

Uruchom `node website/server.mjs` i otwórz http://127.0.0.1:4173/.
Lokalny serwer statyczny nie wysyła e-maili.

## Cloudflare Pages — GitHub

W Cloudflare wybierz Workers & Pages → Create application → Pages → Connect to Git i repozytorium `Duczekx/TerraGF`.

| Ustawienie | Wartość |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | pozostaw puste (główny katalog repozytorium) |
| Build command | `python3 scripts/build-translations.py && node scripts/test-contact.mjs` |
| Build output directory | `website/dist` |

Po wdrożeniu dodaj `terragf.com` i `www.terragf.com` w Custom domains. Kolejne wysłania zmian do `main` uruchomią publikację automatycznie.
Jeśli wcześniej utworzono projekt Direct Upload, do integracji z Git utwórz nowy projekt Pages.

## Formularz i sekrety

Wysyłka wymaga konfiguracji Resend i Cloudflare Turnstile. Odbiorca: `terra.gf1900@outlook.com`.
Szczegóły: [website/CONTACT-SETUP.md](website/CONTACT-SETUP.md).
Klucze ustaw wyłącznie w Variables and Secrets projektu Cloudflare Pages, nigdy w repozytorium.
Bez konfiguracji formularz pozostaje nieaktywny. Testy korzystają z atrap usług i nie wysyłają poczty.

## Edycja

- Układ: `website/source/index.pl.html`.
- Tłumaczenia: `scripts/translations.txt`.
- Generowanie: `python3 scripts/build-translations.py`.
- Style i interakcje: `website/dist/style.css`, `app.js`, `i18n.js`, `contact.js`.
- Obsługa serwerowa formularza: `website/dist/_worker.js`.
- Testy: `node scripts/test-contact.mjs`.

Gotowe media są w `website/dist/assets`. Oryginalne projekty CAD/Blender i lokalne narzędzia nie należą do repozytorium strony.

## Cloudflare Workers — aktualny projekt terragf

Repozytorium obsługuje również Worker `terragf` dzięki `wrangler.jsonc`.
W Settings → Build ustaw katalog główny repozytorium, build command `python3 scripts/build-translations.py && node scripts/test-contact.mjs`, deploy command `npx wrangler deploy`.
Konfiguracja publikuje `website/dist` jako statyczne zasoby, a `/api/*` kieruje do obsługi formularza. `.assetsignore` wyklucza kod serwerowy i pliki pomocnicze z zasobów publicznych.
Sekrety formularza ustaw w Settings → Variables and Secrets samego Workera (nie tylko w ustawieniach kompilacji). `keep_vars` zachowuje zwykłe zmienne dodane w panelu; sekrety pozostają w Cloudflare.
Domenę dodaj w Settings → Domains & Routes po udanym wdrożeniu.
