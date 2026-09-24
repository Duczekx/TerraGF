# TERRA GF 1900 — lokalna strona wizytówkowa

## Podgląd

Z katalogu projektu uruchom `node website/server.mjs`, następnie otwórz http://127.0.0.1:4173/.

Serwer nasłuchuje tylko lokalnie (127.0.0.1). Pliki strony znajdują się w `website/dist`. Strona nie została opublikowana w Internecie. Fonty, biblioteka model-viewer i model GLB są przechowywane lokalnie; przeglądanie nie wymaga CDN.

## Zawartość

- Polska wersja strony, model 3D z obrotem, zoomem, pauzą i przywróceniem widoku.
- Opis konstrukcji, dane orientacyjne i kontakt przez profil Instagram.
- Układ responsywny, obsługa klawiatury, ograniczenie animacji zgodnie z preferencją systemową.
- Brak analityki, formularza wysyłkowego i plików cookies.

Treści kontaktowe opierają się na dotychczasowym profilu `@terragf1900projekt`. Nie dodawano niepotwierdzonego udźwigu, ciśnienia roboczego, deklaracji zgodności, telefonu, e-maila ani ceny. Przed publikacją należy potwierdzić dane sprzedawcy i ostateczne parametry. Model ma znany brak dwóch trójników ¼″, opisany w `assets/terra-gf1900/README.md` w głównym katalogu projektu.

## Projekt i źródła

Kierunek: katalog przemysłowy, duża typografia, czerń i czerwień zgodne z produktem, oszczędne teksty, bezpośrednia interakcja z modelem.

- Trendy: https://webflow.com/blog/web-design-trends-2026
- Biblioteka: Google model-viewer 4.1.0, https://modelviewer.dev/ (Apache 2.0).
- Fonty: Barlow / Barlow Condensed, Google Fonts (SIL Open Font License).
- Model i wizualizacja: eksport projektu użytkownika z Inventora, przygotowany w Blenderze.

## Zdjęcia użytkownika

Wybrane z folderu `C:/Users/dawid/OneDrive/Escritorio/zdj widly/`:

- `IMG_6576.JPG` — gotowe widły, sekcja Konstrukcja.
- `IMG_6574.JPG` — praca na łące, główne zdjęcie sekcji W praktyce.
- `IMG_6552.jpeg` — detal siłownika i mocowania chwytaka.
- `IMG_6582.JPG` — rama i chwytak podczas budowy, przed malowaniem.

Kopie WebP w szerokościach 640, 1280 i 1920 px; poprawna orientacja EXIF, bez zmiany kolorów i retuszu. Przeglądarka dobiera rozmiar przez `srcset`; zdjęcia są ładowane leniwie i otwierają większy, pełny kadr po kliknięciu. Oryginały pozostały bez zmian. Mapowanie plików jest w `dist/assets/photos/sources.json`, a skrypt przygotowujący w `scripts/prepare-site-photos.py` w głównym katalogu projektu.

## Filmy z pracy

Wybrane z `C:/Users/dawid/OneDrive/Escritorio/Video widly/`:

- `1780820969572.MOV` — szerokie ujęcie pracy, ok. 33 s, odtwarzane po kliknięciu, 1280 × 720.
- `IMG_6528.MOV` — ruch chwytaka, ok. 9 s, pionowo 540 × 960. Wyciszona pętla uruchamiana przy widoczności co najmniej 35%, z przyciskiem pauzy. Nie startuje automatycznie przy ograniczeniu animacji lub oszczędzaniu danych.

Oba pliki przekodowane do H.264/MP4 z `faststart`, bez ścieżki dźwiękowej i metadanych źródłowych. Miniatury pochodzą z nagrań. Główny film używa `preload="none"`; krótki dostaje źródło dopiero przy odtwarzaniu. Filmy zatrzymują się poza ekranem i po ukryciu karty. Oryginały nie zostały zmienione. Serwer lokalny obsługuje żądania Range do przewijania.

Kierunek prezentacji: film panoramiczny + krótki pionowy klip, a fotografie jako uzupełnienie. Inspiracje: [Adobe Creative Trends 2026](https://business.adobe.com/resources/creative-trends-report.html), [Webflow 2026](https://webflow.com/blog/web-design-trends-2026). Wydajność: [web.dev](https://web.dev/learn/performance/video-performance).

## Aktualizacja galerii i modelu

10 zdjęć: 9 w galerii i jedno w sekcji konstrukcji, wszystkie dostępne w pełnoekranowej galerii. Brak widocznych podpisów; zachowane opisy alternatywne. Zamknięcie przyciskiem, Escape lub kliknięciem tła; strzałki i przesuwanie palcem zmieniają zdjęcia. Źródła wszystkich ujęć w `dist/assets/photos/sources.json`.

Model: osiem dolnych i osiem małych górnych zębów czerwonych. Zoom wyłączony, pełny obrót poziomy; odległość kamery obliczana z kuli obejmującej model i proporcji widoku. `scripts/update-upper-tines.py` aktualizuje pliki Blender/GLB i przezroczysty poster strony.

## Wersje językowe

Domyślny język: niemiecki (również w statycznym HTML, bez JavaScript). Dostępne: DE, EN, PL, FR, ES, IT. Wybór jest zapamiętywany lokalnie. Parametr `?lang=de` (analogicznie inne kody) ma pierwszeństwo przed zapamiętanym językiem. Przetłumaczone są treści, metadane, etykiety dostępności, galeria, przyciski i komunikaty modelu oraz filmów. Natywne kontrolki wideo pozostają w języku przeglądarki użytkownika.

Źródło układu do dalszych zmian: `website/source/index.pl.html`. Słownik: `scripts/translations.txt` (kolejność PL|DE|EN|FR|ES|IT). Po zmianach uruchom `scripts/build-translations.py`, który generuje niemiecki `dist/index.html` i `dist/translations.js`. Logika wyboru języka: `dist/i18n.js`. `scripts/localize-app.py` był jednorazową migracją — nie uruchamiać ponownie.

Sprawdzone w przeglądarce: przełączanie wszystkich sześciu języków, tłumaczenia komunikatu resetowania modelu, galeria, zapamiętywanie wyboru po ponownym wejściu, brak poziomego przepełnienia przy szerokości 360 i 1440 px.

Marka strony: TERRAGF; model produktu: GF 1900. Logo, tytuły, opisy i tłumaczenia zostały ujednolicone. Domena nie została jeszcze zarejestrowana ani podłączona.
