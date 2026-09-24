# Formularz kontaktowy TERRAGF

Odbiorca: terra.gf1900@outlook.com. Formularz i obsługa serwerowa są przygotowane; wysyłka wymaga konfiguracji poniżej. Nie wysłano wiadomości testowej do prawdziwej skrzynki.

1. Załóż konto w Resend (https://resend.com), dodaj domenę nadawczą i zweryfikuj ją rekordami DNS wskazanymi przez usługę. Nie zmieniaj istniejących rekordów poczty bez potrzeby. Ustaw adres nadawcy należący do zweryfikowanej domeny, np. TERRAGF <formularz@terragf.com>.
2. Utwórz w Cloudflare Turnstile widżet Managed dla terragf.com oraz www.terragf.com. Dla testów dodaj również konkretną nazwę projektu pages.dev. Skopiuj klucz witryny oraz klucz tajny.
3. W projekcie Cloudflare Pages, Settings → Variables and Secrets ustaw:
   - RESEND_API_KEY: sekret API z uprawnieniem wysyłania, ograniczony do domeny nadawcy.
   - EMAIL_FROM: pełny zweryfikowany adres nadawcy, np. TERRAGF <formularz@terragf.com>.
   - TURNSTILE_SITE_KEY: publiczny klucz widżetu.
   - TURNSTILE_SECRET_KEY: tajny klucz widżetu, jako sekret.
   Nie umieszczaj sekretów w plikach strony ani na czacie.
4. Wgraj ponownie zawartość website/dist. Ten katalog zawiera już _worker.js i _routes.json: obsługa formularza działa w trybie zaawansowanym Cloudflare Pages, który obsługuje Direct Upload. Zwykły katalog functions nie jest potrzebny. Po dodaniu/zmianie sekretów wykonaj nowe wdrożenie.
5. Wyślij jedno rzeczywiste zapytanie kontrolne. Sprawdź odbiór w Outlooku (również folder Niechciane), działanie przycisku Odpowiedz oraz dziennik dostarczenia w Resend. Potwierdzenie na stronie oznacza przyjęcie wiadomości przez usługę wysyłającą; końcowe doręczenie należy sprawdzić w skrzynce.

Lokalny serwer nie wysyła poczty. Formularz pokazuje uczciwy stan niedostępności i alternatywny kontakt przez Instagram. Nie ma pozornego potwierdzenia wysłania. Wdrożenie bez wymaganych ustawień również nie aktywuje przycisku wysyłki.

Zabezpieczenia: walidacja danych po stronie serwera, limit rozmiaru, stały odbiorca, Reply-To użytkownika, kontrola Origin, Turnstile z kontrolą nazwy hosta i action, ograniczenia czasu połączeń i klucz idempotencji. Sekrety wyłącznie w konfiguracji Cloudflare. Żądania statyczne omijają Worker dzięki _routes.json.

Testy bez zewnętrznych żądań: node scripts/test-contact.mjs.
Dokumentacja: https://developers.cloudflare.com/pages/platform/functions/ oraz https://resend.com/docs/api-reference/emails/send-email

## Zdjęcia mocowania
Opcjonalnie do 3 zdjęć JPG/PNG/WebP, maksymalnie 5 000 000 bajtów na plik i 10 000 000 bajtów łącznie. Podgląd lokalny przed wysłaniem, usuwanie pojedynczych zdjęć. Załączniki trafiają wyłącznie do e-maila, bez publicznego magazynu plików. Serwer kontroluje liczbę, rozmiar, kodowanie i sygnaturę formatu. Nie obsługujemy HEIC ani SVG. Przy błędzie wysyłki wybrane zdjęcia pozostają w formularzu. Testy przekazywania plików do Resend działają na atrapach bez rzeczywistej wysyłki.
