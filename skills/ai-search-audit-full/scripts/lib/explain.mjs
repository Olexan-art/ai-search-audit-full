// The Full report's three layers of words for every problem code, in English, Ukrainian and Polish:
//
//   t  a short generic title (the site report groups pages under it; the per-page label stays
//      the evidence-specific one from copy.mjs)
//   d  the plain description, for juniors and managers: what is wrong and why it matters to
//      search or AI. It gives no advice; the report's plain layer lists problems only.
//   x  the fix direction, technical and terse, for developers and SEOs. It is shown only inside
//      the collapsed "Details for specialists" of each finding, never in the plain layer.
//   r  "What the rule says": either a short verbatim quote from the official source (Q), with
//      the source's key in rules.mjs and the date the quote was checked against the live page,
//      or, where no published source states the rule, "This skill's rule" (S) with the rule in
//      this skill's own words and no quote attributed to anyone.
//
// The site-wide checks have theirs in siteExplain.mjs.
// Every quote was fetched from its page and matched word for word (tools/verify-rules.mjs does
// it again on demand: it fetches each source and compares the quote after folding whitespace,
// quote marks and HTML entities). Quotes stay in the source's language, English, in both views.
// Nothing here is invented: a rule nobody publishes is labelled as this skill's.

export const RULES_CHECKED = "2026-10-17";

const Q = (src, quote, checked = RULES_CHECKED) => ({ kind: "quote", src, quote, checked });
// S(en, uk, pl, opts); a call without the Polish string, S(en, uk, opts), still works.
const S = (en, uk, pl, opts) => {
  if (typeof pl !== "string") { opts = pl; pl = undefined; }
  const { fullOnly = false } = opts || {};
  return { kind: "skill", text: pl === undefined ? [en, uk] : [en, uk, pl], ...(fullOnly ? { fullOnly: true } : {}) };
};
export const skillRule = S;

export const EXPLAIN = {
  // ── Access and indexing ─────────────────────────────────────────────────────
  robots_unreachable: {
    t: ["robots.txt does not answer", "robots.txt не відповідає", "robots.txt nie odpowiada"],
    d: [
      "The site's robots.txt answered with a server error or did not answer at all. Under the robots.txt standard a crawler must then assume it may fetch nothing on the site, so search engines and AI crawlers can stay away from every page.",
      "robots.txt сайту відповів помилкою сервера або не відповів зовсім. За стандартом robots.txt краулер тоді має вважати, що на сайті нічого не можна завантажувати, тож пошукові системи й ШІ-краулери можуть оминати кожну сторінку.",
      "Plik robots.txt witryny odpowiedział błędem serwera albo nie odpowiedział wcale. Według standardu robots.txt crawler musi wtedy przyjąć, że nie wolno mu pobrać niczego z witryny, więc wyszukiwarki i crawlery AI mogą omijać każdą stronę.",
    ],
    x: [
      "Serve /robots.txt from the origin with 200 (or 404 when there is none); look for 5xx, timeouts, WAF or bot-protection rules and redirect loops on crawler user agents.",
      "Віддавайте /robots.txt з origin зі статусом 200 (або 404, коли файла немає); шукайте 5xx, тайм-аути, правила WAF чи захисту від ботів і цикли переадресацій для user agent краулерів.",
      "Serwuj /robots.txt z originu ze statusem 200 (albo 404, gdy pliku nie ma); szukaj błędów 5xx, przekroczeń czasu, reguł WAF lub ochrony przed botami oraz pętli przekierowań dla user agentów crawlerów.",
    ],
    r: Q("rfc", "If the robots.txt file is unreachable due to server or network errors, this means the robots.txt file is undefined and the crawler MUST assume complete disallow."),
  },
  search_engine_blocked: {
    t: ["Googlebot or Bingbot blocked", "Googlebot чи Bingbot заблоковано", "Googlebot lub Bingbot zablokowany"],
    d: [
      "robots.txt forbids Google's or Bing's crawler to fetch this page. A page the crawler cannot fetch cannot be read for search results, and AI assistants that answer from these indexes lose it too.",
      "robots.txt забороняє краулеру Google чи Bing завантажувати цю сторінку. Сторінку, яку краулер не може завантажити, неможливо прочитати для результатів пошуку, і ШІ-асистенти, що відповідають з цих індексів, теж її втрачають.",
      "robots.txt zabrania crawlerowi Google lub Bing pobierać tę stronę. Strony, której crawler nie może pobrać, nie da się przeczytać na potrzeby wyników wyszukiwania, a asystenci AI odpowiadający z tych indeksów również ją tracą.",
    ],
    x: [
      "Remove or narrow the Disallow matching this path in the Googlebot / Bingbot group (or *); the longest match wins and Allow wins a tie (RFC 9309 2.2.2).",
      "Приберіть або звузьте Disallow, що збігається з цим шляхом, у групі Googlebot / Bingbot (або *); перемагає найдовший збіг, а за рівності перемагає Allow (RFC 9309 2.2.2).",
      "Usuń lub zawęź regułę Disallow pasującą do tej ścieżki w grupie Googlebot / Bingbot (albo *); wygrywa najdłuższe dopasowanie, a przy remisie wygrywa Allow (RFC 9309 2.2.2).",
    ],
    r: Q("gRobots", "A robots.txt file tells search engine crawlers which URLs the crawler can access on your site."),
  },
  ai_search_blocked: {
    t: ["AI search bot blocked", "ШІ-бота пошуку заблоковано", "Bot wyszukiwania AI zablokowany"],
    d: [
      "robots.txt forbids a crawler that an AI assistant uses for its search answers, or to fetch a page a person asked about. That assistant cannot read this page, so it cannot quote it or link to it in an answer.",
      "robots.txt забороняє краулера, яким ШІ-асистент користується для пошукових відповідей або щоб завантажити сторінку на прохання людини. Цей асистент не може прочитати сторінку, тож не може процитувати її чи послатися на неї у відповіді.",
      "robots.txt zabrania wstępu crawlerowi, którego asystent AI używa do odpowiedzi wyszukiwania albo do pobrania strony, o którą zapytał użytkownik. Ten asystent nie może przeczytać strony, więc nie może jej zacytować ani podać do niej linku w odpowiedzi.",
    ],
    x: [
      "Allow OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot and Perplexity-User for this path (own group or *); decide on the training bots separately, they are independent tokens.",
      "Дозвольте OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot і Perplexity-User для цього шляху (власна група або *); щодо ботів навчання вирішуйте окремо, це незалежні токени.",
      "Zezwól OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot i Perplexity-User na tę ścieżkę (własna grupa albo *); o botach treningowych decyduj osobno, to niezależne tokeny.",
    ],
    r: Q("openai", "Sites that are opted out of OAI-SearchBot will not be shown in ChatGPT search answers, though can still appear as navigational links."),
  },
  noindex: {
    t: ["Marked noindex", "Позначено noindex", "Oznaczona jako noindex"],
    d: [
      "The page tells search engines not to index it, with a meta robots tag or an X-Robots-Tag header. A page left out of the index does not appear in search results, and AI features built on the index cannot show it either.",
      "Сторінка просить пошукові системи не індексувати її — тегом meta robots або заголовком X-Robots-Tag. Сторінки поза індексом немає в результатах пошуку, і ШІ-функції, що спираються на індекс, теж не можуть її показати.",
      "Strona prosi wyszukiwarki, by jej nie indeksowały, tagiem meta robots albo nagłówkiem X-Robots-Tag. Strony spoza indeksu nie ma w wynikach wyszukiwania, a funkcje AI zbudowane na indeksie też nie mogą jej pokazać.",
    ],
    x: [
      "Drop noindex / none from <meta name=robots|googlebot> and from the X-Robots-Tag response header (check the CDN and server config too), unless the exclusion is intended.",
      "Приберіть noindex / none з <meta name=robots|googlebot> і з заголовка відповіді X-Robots-Tag (перевірте й конфігурацію CDN та сервера), якщо виключення не навмисне.",
      "Usuń noindex / none z <meta name=robots|googlebot> i z nagłówka odpowiedzi X-Robots-Tag (sprawdź też konfigurację CDN i serwera), chyba że wykluczenie jest zamierzone.",
    ],
    r: Q("gNoindex", "When Googlebot crawls that page and extracts the tag or header, Google will drop that page entirely from Google Search results, regardless of whether other sites link to it."),
  },
  ai_training_blocked: {
    t: ["AI training bot blocked", "Бота навчання ШІ заблоковано", "Bot treningowy AI zablokowany"],
    d: [
      "robots.txt keeps a crawler that collects text for training AI models away from this page. Sites often choose this on purpose. It does not hide the page from search, but models trained later will not have read it.",
      "robots.txt не пускає на сторінку краулера, що збирає тексти для навчання ШІ-моделей. Сайти часто роблять це свідомо. Від пошуку це сторінку не ховає, але моделі, навчені пізніше, її не читатимуть.",
      "robots.txt nie wpuszcza na stronę crawlera, który zbiera teksty do trenowania modeli AI. Witryny często robią to celowo. Nie ukrywa to strony przed wyszukiwaniem, ale modele trenowane później jej nie przeczytają.",
    ],
    x: [
      "If intended, leave it. Otherwise remove the Disallow for GPTBot, ClaudeBot, Google-Extended or CCBot; the search and user bots are separate tokens and stay unaffected.",
      "Якщо це навмисно, залиште. Інакше приберіть Disallow для GPTBot, ClaudeBot, Google-Extended чи CCBot; боти пошуку й запитів користувачів — окремі токени, їх це не зачіпає.",
      "Jeśli to zamierzone, zostaw. W przeciwnym razie usuń Disallow dla GPTBot, ClaudeBot, Google-Extended lub CCBot; boty wyszukiwania i boty zapytań użytkowników to osobne tokeny i to ich nie dotyczy.",
    ],
    r: Q("anthropic", "When a site restricts ClaudeBot access, it signals that the site's future materials should be excluded from our AI model training datasets."),
  },
  llms_txt_missing: {
    t: ["No llms.txt", "Немає llms.txt", "Brak llms.txt"],
    d: [
      "The site has no /llms.txt, a proposed Markdown file that sums up a site for language models. It is a proposal, not a standard, and Google documents no use of it, so its absence is a note, not a fault.",
      "На сайті немає /llms.txt — запропонованого Markdown-файла, що коротко описує сайт для мовних моделей. Це пропозиція, а не стандарт, і Google не документує його використання, тож його відсутність — зауваження, а не вада.",
      "Witryna nie ma pliku /llms.txt, proponowanego pliku Markdown, który streszcza witrynę dla modeli językowych. To propozycja, a nie standard, i Google nie dokumentuje jego użycia, więc jego brak to uwaga, a nie usterka.",
    ],
    x: [
      "Optional: publish /llms.txt per llmstxt.org (an H1 name, a > summary, ## sections of links to Markdown copies of key pages).",
      "Необов’язково: опублікуйте /llms.txt за llmstxt.org (H1 з назвою, > короткий опис, розділи ## з посиланнями на Markdown-копії ключових сторінок).",
      "Opcjonalnie: opublikuj /llms.txt zgodnie z llmstxt.org (H1 z nazwą, > krótkie podsumowanie, sekcje ## z linkami do kopii Markdown kluczowych stron).",
    ],
    r: Q("llms", "We propose adding a /llms.txt markdown file to websites to provide LLM-friendly content."),
  },
  snippet_blocked: {
    t: ["Snippets blocked", "Сніпети заборонено", "Fragmenty w wynikach zablokowane"],
    d: [
      "The page forbids text snippets, with nosnippet, max-snippet:0, or data-nosnippet over most of its text. Google requires a page to be eligible for a snippet before it can be a supporting link in AI Overviews or AI Mode, so this keeps the page out of those answers.",
      "Сторінка забороняє текстові сніпети — через nosnippet, max-snippet:0 або data-nosnippet на більшій частині тексту. Google вимагає, щоб сторінка могла мати сніпет, перш ніж стати посиланням-джерелом в AI Overviews чи AI Mode, тож це не пускає сторінку в такі відповіді.",
      "Strona zabrania tekstowych fragmentów w wynikach (snippetów) przez nosnippet, max-snippet:0 albo data-nosnippet na większości tekstu. Google wymaga, by strona mogła mieć snippet, zanim stanie się linkiem źródłowym w AI Overviews lub AI Mode, więc to wyklucza stronę z takich odpowiedzi.",
    ],
    x: [
      "Remove nosnippet and max-snippet:0 from meta robots and X-Robots-Tag; keep data-nosnippet to the few spans that must stay out of snippets.",
      "Приберіть nosnippet і max-snippet:0 з meta robots та X-Robots-Tag; залиште data-nosnippet лише на тих кількох фрагментах, яким справді не місце в сніпетах.",
      "Usuń nosnippet i max-snippet:0 z meta robots i X-Robots-Tag; data-nosnippet zostaw tylko na tych kilku fragmentach, które naprawdę nie powinny trafiać do snippetów.",
    ],
    r: Q("gAi", "To be eligible to be shown as a supporting link in AI Overviews or AI Mode, a page must be indexed and eligible to be shown in Google Search with a snippet, fulfilling the Search technical requirements."),
  },
  markdown_alternate_broken: {
    t: ["Markdown copy does not load", "Markdown-копія не завантажується", "Kopia Markdown się nie ładuje"],
    d: [
      "The page declares a Markdown version of itself, but that address does not answer with Markdown. Agents that follow the declaration get an error or an HTML page instead of the clean text they were promised.",
      "Сторінка оголошує свою Markdown-версію, але за цією адресою Markdown не віддається. Агенти, що йдуть за оголошенням, отримують помилку або HTML-сторінку замість обіцяного чистого тексту.",
      "Strona deklaruje swoją wersję Markdown, ale pod tym adresem nie ma Markdownu. Agenci, którzy idą za deklaracją, dostają błąd albo stronę HTML zamiast obiecanego czystego tekstu.",
    ],
    x: [
      "Make the href of <link rel=alternate type=text/markdown> return 200 with Content-Type text/markdown (or text/plain), or remove the link.",
      "Зробіть так, щоб href у <link rel=alternate type=text/markdown> повертав 200 з Content-Type text/markdown (або text/plain), або приберіть посилання.",
      "Spraw, by href w <link rel=alternate type=text/markdown> zwracał 200 z Content-Type text/markdown (lub text/plain), albo usuń link.",
    ],
    r: Q("llms", 'rel="alternate" type="text/markdown" points to the markdown version of a page'),
  },
  ai_catalog_invalid: {
    t: ["ai-catalog.json does not parse", "ai-catalog.json не розбирається", "ai-catalog.json się nie parsuje"],
    d: [
      "The site serves an ai-catalog.json file that is not valid JSON. An agent that reads the file to learn what the site offers gets nothing it can use.",
      "Сайт віддає файл ai-catalog.json, що не є коректним JSON. Агент, який читає цей файл, щоб дізнатися, що пропонує сайт, не отримує нічого придатного.",
      "Witryna serwuje plik ai-catalog.json, który nie jest poprawnym JSON-em. Agent, który czyta ten plik, by dowiedzieć się, co witryna oferuje, nie dostaje nic, czego mógłby użyć.",
    ],
    x: [
      "Validate /.well-known/ai-catalog.json (or /ai-catalog.json) with a JSON parser and serve it as application/json, or remove it.",
      "Перевірте /.well-known/ai-catalog.json (або /ai-catalog.json) JSON-парсером і віддавайте як application/json, або приберіть файл.",
      "Sprawdź /.well-known/ai-catalog.json (lub /ai-catalog.json) parserem JSON i serwuj go jako application/json, albo usuń plik.",
    ],
    r: S(
      "A file served as ai-catalog.json is expected to parse as JSON. No standards body publishes this format's rules; the check is this skill's.",
      "Файл, що віддається як ai-catalog.json, має розбиратися як JSON. Жоден орган стандартизації не публікує правил цього формату; перевірка — цієї навички.",
      "Plik serwowany jako ai-catalog.json powinien parsować się jako JSON. Żadna organizacja standaryzacyjna nie publikuje reguł tego formatu; to sprawdzenie tej umiejętności.",
    ),
  },
  indexnow_key_broken: {
    t: ["IndexNow key file missing", "Немає файлу ключа IndexNow", "Brak pliku klucza IndexNow"],
    d: [
      "The page declares an IndexNow key, but the key file does not load. Search engines that use IndexNow fetch that file before they trust the site's notices about changed pages, so the notices can be ignored.",
      "Сторінка оголошує ключ IndexNow, але файл ключа не завантажується. Пошукові системи, що користуються IndexNow, завантажують цей файл, перш ніж довіряти повідомленням сайту про змінені сторінки, тож ці повідомлення можуть ігноруватися.",
      "Strona deklaruje klucz IndexNow, ale plik klucza się nie ładuje. Wyszukiwarki korzystające z IndexNow pobierają ten plik, zanim zaufają powiadomieniom witryny o zmienionych stronach, więc te powiadomienia mogą być ignorowane.",
    ],
    x: [
      "Host <key>.txt at the site root (or at keyLocation) holding exactly the key, served 200 as text/plain.",
      "Розмістіть <key>.txt у корені сайту (або за keyLocation) рівно з ключем усередині, зі статусом 200 і типом text/plain.",
      "Umieść <key>.txt w katalogu głównym witryny (lub pod keyLocation), zawierający dokładnie klucz, serwowany ze statusem 200 jako text/plain.",
    ],
    r: Q("indexnow", "Once you submit your URLs to search engines, search engines will crawl the key file to verify ownership and use the key until you change the key."),
  },

  // ── Classic search ───────────────────────────────────────────────────────────
  not_https: {
    t: ["No HTTPS", "Без HTTPS", "Brak HTTPS"],
    d: [
      "The page is served over plain http. Browsers mark it as not secure, and Google counts HTTPS among the signs of a good page experience.",
      "Сторінка віддається через звичайний http. Браузери позначають її як незахищену, а Google зараховує HTTPS до ознак доброго досвіду на сторінці.",
      "Strona jest serwowana przez zwykły http. Przeglądarki oznaczają ją jako niezabezpieczoną, a Google zalicza HTTPS do oznak dobrego doświadczenia na stronie.",
    ],
    x: [
      "Serve over TLS; 301 http to https site-wide; switch canonical, hreflang, sitemap and internal links to https.",
      "Віддавайте через TLS; 301 з http на https для всього сайту; переведіть canonical, hreflang, sitemap і внутрішні посилання на https.",
      "Serwuj przez TLS; 301 z http na https w całej witrynie; przełącz canonical, hreflang, sitemap i linki wewnętrzne na https.",
    ],
    r: Q("gPageExp", "Assess if your pages have good Core Web Vitals, are secure (HTTPS), mobile-friendly, avoid excessive ads or intrusive interstitials, and clearly distinguish main content."),
  },
  redirect_chain: {
    t: ["Redirect chain", "Ланцюжок переадресацій", "Łańcuch przekierowań"],
    d: [
      "The address passes through two or more redirects before the page answers. Every hop costs time for people and for crawlers, and crawlers stop following after a limited number of hops.",
      "Адреса проходить через дві чи більше переадресацій, перш ніж сторінка відповідає. Кожен крок забирає час у людей і в краулерів, а краулери припиняють переходити після обмеженої кількості кроків.",
      "Adres przechodzi przez dwa lub więcej przekierowań, zanim strona odpowie. Każdy krok kosztuje czas ludzi i crawlerów, a crawlery przestają podążać po ograniczonej liczbie kroków.",
    ],
    x: [
      "Point links, canonical, hreflang and the sitemap at the final URL; collapse the hops into a single 301.",
      "Спрямуйте посилання, canonical, hreflang і sitemap на кінцеву адресу; зведіть кроки до однієї 301.",
      "Skieruj linki, canonical, hreflang i sitemap na docelowy URL; zastąp kroki jednym przekierowaniem 301.",
    ],
    r: Q("gHttp", "By default, Google's crawlers follow up to 10 redirect hops."),
  },
  sitemap_missing: {
    t: ["No sitemap found", "Sitemap не знайдено", "Nie znaleziono sitemap"],
    d: [
      "No sitemap was found, neither in robots.txt nor at /sitemap.xml. A sitemap is how a site lists its pages for search engines; without one they find pages through links alone.",
      "Sitemap не знайдено ні в robots.txt, ні за адресою /sitemap.xml. Sitemap — це спосіб, яким сайт перелічує свої сторінки для пошукових систем; без нього вони знаходять сторінки лише за посиланнями.",
      "Nie znaleziono sitemap ani w robots.txt, ani pod /sitemap.xml. Sitemap to sposób, w jaki witryna wylicza swoje strony dla wyszukiwarek; bez niej znajdują one strony wyłącznie po linkach.",
    ],
    x: [
      "Publish /sitemap.xml (urlset of absolute canonical URLs, at most 50,000 per file) and declare it with a Sitemap: line in robots.txt.",
      "Опублікуйте /sitemap.xml (urlset з абсолютними канонічними адресами, до 50 000 на файл) і оголосіть його рядком Sitemap: у robots.txt.",
      "Opublikuj /sitemap.xml (urlset z bezwzględnymi kanonicznymi adresami URL, najwyżej 50 000 na plik) i zadeklaruj go wierszem Sitemap: w robots.txt.",
    ],
    r: Q("gSitemap", "Search engines like Google read this file to crawl your site more efficiently."),
  },
  sitemap_not_listed: {
    t: ["Not in the sitemap", "Немає в sitemap", "Brak w sitemap"],
    d: [
      "The sitemap was read in full and this page is not in it. Search engines may then find the page later, or only through links.",
      "Sitemap прочитано повністю, і цієї сторінки в ньому немає. Тоді пошукові системи можуть знайти сторінку пізніше або лише через посилання.",
      "Sitemap została przeczytana w całości i tej strony w niej nie ma. Wyszukiwarki mogą wtedy znaleźć stronę później albo wyłącznie przez linki.",
    ],
    x: [
      "Add the page's canonical URL as a <loc> to the urlset (or to the matching child sitemap of the index).",
      "Додайте канонічну адресу сторінки як <loc> до urlset (або до відповідного дочірнього sitemap індексу).",
      "Dodaj kanoniczny URL strony jako <loc> do urlset (lub do odpowiedniej podrzędnej sitemap indeksu).",
    ],
    r: Q("gSitemap", "Search engines like Google read this file to crawl your site more efficiently."),
  },
  title_missing: {
    t: ["No title", "Немає title", "Brak title"],
    d: [
      "The page has no <title>. Search engines build the clickable headline of a result mostly from it, so they have to guess one from the page, and the browser tab shows the bare address.",
      "Сторінка не має <title>. Пошукові системи будують клікабельний заголовок результату здебільшого з нього, тож мусять вгадувати його зі сторінки, а вкладка браузера показує голу адресу.",
      "Strona nie ma <title>. Wyszukiwarki budują z niego głównie klikalny nagłówek wyniku, więc muszą go odgadnąć z treści strony, a karta przeglądarki pokazuje sam adres.",
    ],
    x: [
      "Add one <title> in <head>: unique per page, about 10 to 60 characters, the topic first.",
      "Додайте один <title> у <head>: унікальний для сторінки, приблизно 10–60 символів, тема на початку.",
      "Dodaj jeden <title> w <head>: unikalny dla strony, około 10–60 znaków, z tematem na początku.",
    ],
    r: Q("gTitle", "Make sure every page on your site has a title specified in the <title> element."),
  },
  title_too_long: {
    t: ["Title too long", "Title задовгий", "Title za długi"],
    d: [
      "The title is longer than about 60 characters, roughly what one result line shows. Its end is likely to be cut off in search results, and the words there are lost.",
      "Title довший за приблизно 60 символів — стільки зазвичай вміщує один рядок результату. Його кінець, найімовірніше, обріжеться в результатах пошуку, і слова там загубляться.",
      "Title ma więcej niż około 60 znaków, mniej więcej tyle, ile mieści jeden wiersz wyniku. Jego koniec zostanie najpewniej ucięty w wynikach wyszukiwania, a słowa z końca przepadną.",
    ],
    x: [
      "Trim to 60 characters or fewer; move the brand and boilerplate to the end or drop them.",
      "Скоротіть до 60 символів або менше; перенесіть бренд і шаблонні слова в кінець або приберіть їх.",
      "Skróć do 60 znaków lub mniej; markę i stałe dopiski przenieś na koniec albo usuń.",
    ],
    r: Q("gTitle", "Also avoid unnecessarily long or verbose text in your <title> elements."),
  },
  title_too_short: {
    t: ["Title too short", "Title закороткий", "Title za krótki"],
    d: [
      "The title has fewer than 10 characters, too few to say what the page is about. A result with such a headline tells a searcher almost nothing, and search engines may replace it.",
      "Title має менше ніж 10 символів — замало, щоб сказати, про що сторінка. Результат із таким заголовком майже нічого не каже людині, і пошукові системи можуть його замінити.",
      "Title ma mniej niż 10 znaków, za mało, by powiedzieć, o czym jest strona. Wynik z takim nagłówkiem prawie nic nie mówi szukającemu, a wyszukiwarki mogą go zastąpić.",
    ],
    x: [
      "Write a descriptive title that names the page's subject, 10 to 60 characters.",
      "Напишіть описовий title, що називає предмет сторінки, 10–60 символів.",
      "Napisz opisowy title, który nazywa temat strony, 10–60 znaków.",
    ],
    r: Q("gTitle", "Write descriptive and concise text for your <title> elements."),
  },
  meta_description_missing: {
    t: ["No meta description", "Немає meta description", "Brak meta description"],
    d: [
      "The page has no meta description. Search engines then build the snippet under the result from text they pick themselves, which may not be the part that describes the page best.",
      "Сторінка не має meta description. Тоді пошукові системи складають сніпет під результатом із тексту, який обирають самі, і це може бути не та частина, що найкраще описує сторінку.",
      "Strona nie ma meta description. Wyszukiwarki budują wtedy snippet pod wynikiem z tekstu wybranego przez siebie, który nie musi być tym, co najlepiej opisuje stronę.",
    ],
    x: [
      'Add <meta name="description" content="…"> of 70 to 160 characters, specific to this page.',
      'Додайте <meta name="description" content="…"> довжиною 70–160 символів, саме про цю сторінку.',
      "Dodaj <meta name=\"description\" content=\"…\"> o długości 70–160 znaków, dotyczący właśnie tej strony.",
    ],
    r: Q("gSnippet", "We may also use descriptive information in the meta description element when it describes the page better than other parts of the content."),
  },
  meta_description_short: {
    t: ["Meta description too short", "Meta description закороткий", "Meta description za krótki"],
    d: [
      "The meta description is under 70 characters, too short to sum up the page. Search engines are then more likely to replace it with text of their own choosing.",
      "Meta description коротший за 70 символів — замало, щоб підсумувати сторінку. Тоді пошукові системи частіше замінюють його текстом на власний вибір.",
      "Meta description ma mniej niż 70 znaków, za mało, by podsumować stronę. Wyszukiwarki chętniej zastąpią go wtedy tekstem wybranym przez siebie.",
    ],
    x: [
      "Extend to 70 to 160 characters with the page's specific offer or facts.",
      "Розширте до 70–160 символів конкретною пропозицією чи фактами сторінки.",
      "Wydłuż do 70–160 znaków, dodając konkretną ofertę lub fakty ze strony.",
    ],
    r: S(
      "A meta description of 70 to 160 characters. Under 70 says too little to sum up a page. Google publishes no minimum; the range is this skill's threshold.",
      "Meta description довжиною від 70 до 160 символів. Менше ніж 70 — замало, щоб підсумувати сторінку. Google не публікує мінімуму; цей діапазон — поріг цієї навички.",
      "Meta description o długości 70–160 znaków. Poniżej 70 mówi za mało, by podsumować stronę. Google nie publikuje minimum; zakres to próg tej umiejętności.",
    ),
  },
  meta_description_long: {
    t: ["Meta description too long", "Meta description задовгий", "Meta description za długi"],
    d: [
      "The meta description is over 160 characters. Results usually show less than that, so its end is likely to be cut off in the snippet.",
      "Meta description довший за 160 символів. Результати зазвичай показують менше, тож його кінець, найімовірніше, обріжеться в сніпеті.",
      "Meta description ma ponad 160 znaków. Wyniki zwykle pokazują mniej, więc jego koniec zostanie najpewniej ucięty w snippecie.",
    ],
    x: [
      "Trim to 160 characters or fewer; put the key point in the first 120.",
      "Скоротіть до 160 символів або менше; головне — у перших 120.",
      "Skróć do 160 znaków lub mniej; najważniejsze umieść w pierwszych 120.",
    ],
    r: Q("gSnippet", "There's no limit on how long a meta description can be, but the snippet is truncated in Google Search results as needed, typically to fit the device width."),
  },
  h1_missing: {
    t: ["No h1", "Немає h1", "Brak h1"],
    d: [
      "The page has no visible h1, the heading that names its main topic. People scanning the page, search engines and AI readers all lose the clearest statement of what the page is about.",
      "Сторінка не має видимого h1 — заголовка, що називає її головну тему. Люди, які переглядають сторінку, пошукові системи й ШІ-читачі втрачають найчіткіше твердження про те, про що вона.",
      "Strona nie ma widocznego h1, czyli nagłówka nazywającego jej główny temat. Ludzie przeglądający stronę, wyszukiwarki i czytniki AI tracą najjaśniejszą informację o tym, czego dotyczy strona.",
    ],
    x: [
      "Add one visible <h1> naming the page's topic, before the first h2.",
      "Додайте один видимий <h1>, що називає тему сторінки, перед першим h2.",
      "Dodaj jeden widoczny <h1> nazywający temat strony, przed pierwszym h2.",
    ],
    r: Q("wHead", "The most important heading has the rank 1 (<h1>), the least important heading rank 6 (<h6>)."),
  },
  h1_multiple: {
    t: ["Several h1 headings", "Кілька заголовків h1", "Kilka nagłówków h1"],
    d: [
      "The page has more than one visible h1. Each of them claims to be the page's main heading, so a reader or a machine cannot tell which topic comes first.",
      "Сторінка має більше ніж один видимий h1. Кожен із них заявляє, що він — головний заголовок сторінки, тож читач чи машина не можуть визначити, яка тема головна.",
      "Strona ma więcej niż jeden widoczny h1. Każdy z nich podaje się za główny nagłówek strony, więc czytelnik ani maszyna nie wiedzą, który temat jest najważniejszy.",
    ],
    x: [
      "Keep one <h1>; demote the others to h2 (restyle with CSS rather than by heading level).",
      "Залиште один <h1>; інші зробіть h2 (вигляд змінюйте через CSS, а не рівнем заголовка).",
      "Zostaw jeden <h1>; pozostałe zamień na h2 (wygląd zmieniaj w CSS, a nie poziomem nagłówka).",
    ],
    r: S(
      "One visible h1 per page, naming its main topic. The HTML standard allows several; one is this skill's rule, so that the page states a single main topic.",
      "Один видимий h1 на сторінці, що називає її головну тему. Стандарт HTML дозволяє кілька; один — правило цієї навички, щоб сторінка заявляла одну головну тему.",
      "Jeden widoczny h1 na stronę, nazywający jej główny temat. Standard HTML dopuszcza kilka; jeden to reguła tej umiejętności, aby strona deklarowała jeden główny temat.",
    ),
  },
  heading_order_skip: {
    t: ["Heading levels skipped", "Пропущено рівні заголовків", "Pominięte poziomy nagłówków"],
    d: [
      "The headings jump levels, for example from h2 straight to h4. The outline that a screen reader or a machine builds from the headings then has gaps, and sections can end up under the wrong parent.",
      "Заголовки перескакують рівні, наприклад з h2 одразу на h4. Тоді в структурі, яку зчитувач екрана чи машина будує із заголовків, з’являються прогалини, і розділи можуть опинитися не під тим батьківським заголовком.",
      "Nagłówki przeskakują poziomy, na przykład z h2 od razu do h4. Konspekt, który czytnik ekranu lub maszyna buduje z nagłówków, ma wtedy luki, a sekcje mogą trafić pod niewłaściwego rodzica.",
    ],
    x: [
      "Use consecutive levels (h2 then h3); change the look with CSS, not by picking a lower level.",
      "Використовуйте послідовні рівні (h2, потім h3); вигляд змінюйте через CSS, а не вибором нижчого рівня.",
      "Używaj kolejnych poziomów (h2, potem h3); wygląd zmieniaj w CSS, a nie przez wybór niższego poziomu.",
    ],
    r: Q("wHead", "Skipping heading ranks can be confusing and should be avoided where possible"),
  },
  canonical_missing: {
    t: ["No canonical", "Немає canonical", "Brak canonical"],
    d: [
      "The page names no canonical address. When the same content can be reached at several addresses, search engines choose one themselves, and it may not be the one meant to be shown.",
      "Сторінка не називає канонічної адреси. Коли той самий вміст доступний за кількома адресами, пошукові системи обирають одну самі, і це може бути не та, яку мали показувати.",
      "Strona nie wskazuje adresu kanonicznego. Gdy ta sama treść jest dostępna pod kilkoma adresami, wyszukiwarki wybierają jeden same i nie musi to być ten, który miał być pokazywany.",
    ],
    x: [
      'Add <link rel="canonical" href="…"> with the page\'s own absolute URL in <head>.',
      'Додайте в <head> <link rel="canonical" href="…"> з власною абсолютною адресою сторінки.',
      "Dodaj w <head> <link rel=\"canonical\" href=\"…\"> z własnym bezwzględnym adresem URL strony.",
    ],
    r: Q("gCanon", "To specify which URL that you want people to see in search results."),
  },
  canonical_relative: {
    t: ["Canonical is relative", "Canonical відносний", "Canonical jest względny"],
    d: [
      "The canonical link gives a path instead of a full address. Crawlers resolve it against whatever address they fetched, so a copy on another host or with extra parameters can declare itself the original.",
      "Посилання canonical містить шлях замість повної адреси. Краулери розв’язують його відносно тієї адреси, яку завантажили, тож копія на іншому хості чи з додатковими параметрами може оголосити себе оригіналом.",
      "Link canonical podaje ścieżkę zamiast pełnego adresu. Crawlery rozwiązują go względem adresu, który akurat pobrały, więc kopia na innym hoście lub z dodatkowymi parametrami może ogłosić się oryginałem.",
    ],
    x: [
      "Use an absolute https URL in rel=canonical (and in a Link header, if one is sent).",
      "Вказуйте в rel=canonical абсолютну https-адресу (і в заголовку Link, якщо він надсилається).",
      "Użyj bezwzględnego adresu https w rel=canonical (i w nagłówku Link, jeśli jest wysyłany).",
    ],
    r: Q("gCanon", 'Use absolute paths rather than relative paths with the rel="canonical" link element.'),
  },
  canonical_other: {
    t: ["Canonical points elsewhere", "Canonical веде деінде", "Canonical wskazuje gdzie indziej"],
    d: [
      "The canonical link points to a different address than this page. Search engines take it as a strong hint that the other address is the one to show, so this page itself may never appear in results.",
      "Посилання canonical веде на іншу адресу, ніж ця сторінка. Пошукові системи сприймають це як сильну підказку, що показувати слід іншу адресу, тож ця сторінка сама може ніколи не з’явитися в результатах.",
      "Link canonical wskazuje inny adres niż ta strona. Wyszukiwarki traktują to jako silną wskazówkę, że to tamten adres należy pokazywać, więc ta strona może nigdy nie pojawić się w wynikach.",
    ],
    x: [
      "Point rel=canonical at this URL unless the page truly duplicates the target; keep it consistent with redirects, the sitemap and hreflang.",
      "Спрямуйте rel=canonical на цю адресу, якщо сторінка не є справжнім дублікатом цілі; узгодьте з переадресаціями, sitemap і hreflang.",
      "Skieruj rel=canonical na ten URL, chyba że strona naprawdę duplikuje stronę docelową; zachowaj spójność z przekierowaniami, sitemap i hreflang.",
    ],
    r: Q("gCanon", 'rel="canonical" link annotations: A strong signal that the specified URL should become canonical.'),
  },
  canonical_multiple: {
    t: ["Several canonicals", "Кілька canonical", "Kilka canonical"],
    d: [
      "The page declares more than one canonical link. Conflicting declarations leave search engines to choose for themselves, or to ignore them all.",
      "Сторінка оголошує більше ніж одне посилання canonical. Суперечливі оголошення змушують пошукові системи вибирати самостійно або ігнорувати їх усі.",
      "Strona deklaruje więcej niż jeden link canonical. Sprzeczne deklaracje zmuszają wyszukiwarki do samodzielnego wyboru albo do zignorowania wszystkich.",
    ],
    x: [
      "Emit exactly one rel=canonical; look for a second one from a CMS plugin, a theme or a tag manager.",
      "Виводьте рівно один rel=canonical; шукайте другий від плагіна CMS, теми чи менеджера тегів.",
      "Wysyłaj dokładnie jeden rel=canonical; szukaj drugiego z wtyczki CMS, motywu lub menedżera tagów.",
    ],
    r: Q("gCanon", "Don't specify different URLs as canonical for the same page using different canonicalization techniques"),
  },
  internal_links_none: {
    t: ["No internal links", "Немає внутрішніх посилань", "Brak linków wewnętrznych"],
    d: [
      "The page links to no other page on the same site. Crawlers find the rest of a site by following links, so this page leads them nowhere and shares no context with related pages.",
      "Сторінка не посилається на жодну іншу сторінку того самого сайту. Краулери знаходять решту сайту, переходячи за посиланнями, тож ця сторінка нікуди їх не веде і не має спільного контексту з пов’язаними сторінками.",
      "Strona nie linkuje do żadnej innej strony tej samej witryny. Crawlery znajdują resztę witryny, podążając za linkami, więc ta strona nigdzie ich nie prowadzi i nie łączy się kontekstem z powiązanymi stronami.",
    ],
    x: [
      "Add crawlable <a href> links to related pages (navigation, breadcrumbs, links in the text).",
      "Додайте придатні для обходу посилання <a href> на пов’язані сторінки (навігація, хлібні крихти, посилання в тексті).",
      "Dodaj linki <a href> możliwe do przejścia przez crawlery do powiązanych stron (nawigacja, okruszki, linki w tekście).",
    ],
    r: Q("gLinks", "so that Google can find other pages on your site via the links on your page"),
  },
  broken_links: {
    t: ["Broken links", "Неробочі посилання", "Niedziałające linki"],
    d: [
      "Links on the page lead to an error page. People who follow them hit a dead end, and search engines drop such addresses from their index.",
      "Посилання на сторінці ведуть на сторінку помилки. Люди, які переходять за ними, потрапляють у глухий кут, а пошукові системи вилучають такі адреси зі свого індексу.",
      "Linki na stronie prowadzą do strony błędu. Osoby, które w nie klikną, trafiają w ślepy zaułek, a wyszukiwarki usuwają takie adresy ze swojego indeksu.",
    ],
    x: [
      "Update or remove hrefs that return 4xx or 5xx; 301 moved targets to their new URL.",
      "Оновіть або приберіть href, що повертають 4xx чи 5xx; для перенесених цілей налаштуйте 301 на нову адресу.",
      "Zaktualizuj lub usuń href, które zwracają 4xx lub 5xx; przeniesione cele przekieruj 301 na nowy URL.",
    ],
    r: Q("gHttp", "In the case of Google Search, Google doesn't index URLs that return a 4xx status code, and URLs that are already indexed and return a 4xx status code are removed from the index."),
  },
  image_alt_missing: {
    t: ["Images without alt", "Зображення без alt", "Obrazy bez alt"],
    d: [
      "Images have no alt text. People who cannot see them get nothing in their place, and search engines lose the main clue to what each image shows.",
      "Зображення не мають alt-тексту. Люди, які не бачать зображень, нічого не отримують замість них, а пошукові системи втрачають головну підказку про те, що показує кожне зображення.",
      "Obrazy nie mają tekstu alt. Osoby, które ich nie widzą, nie dostają nic w zamian, a wyszukiwarki tracą główną wskazówkę, co pokazuje każdy obraz.",
    ],
    x: [
      'Give informative images a descriptive alt; give purely decorative ones alt="".',
      'Дайте інформативним зображенням описовий alt; суто декоративним — alt="".',
      "Obrazom informacyjnym nadaj opisowy alt; czysto dekoracyjnym alt=\"\".",
    ],
    r: Q("gImages", "The most important attribute when it comes to providing more metadata for an image is the alt text"),
  },
  viewport_missing: {
    t: ["No viewport meta", "Немає meta viewport", "Brak meta viewport"],
    d: [
      "The page has no viewport meta tag, so phones lay it out at desktop width and shrink it. Google indexes pages by their mobile version, so a page that is hard to use on a phone is judged that way.",
      "Сторінка не має тега meta viewport, тож телефони розкладають її в ширину комп’ютера і зменшують. Google індексує сторінки за їхньою мобільною версією, тож сторінку, якою незручно користуватися на телефоні, оцінюють саме так.",
      "Strona nie ma tagu meta viewport, więc telefony układają ją w szerokości desktopowej i pomniejszają. Google indeksuje strony według ich wersji mobilnej, więc strona niewygodna na telefonie jest tak właśnie oceniana.",
    ],
    x: [
      'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to <head>.',
      'Додайте в <head> <meta name="viewport" content="width=device-width, initial-scale=1">.',
      "Dodaj do <head> <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.",
    ],
    r: Q("gMobile", "Google uses the mobile version of a site's content, crawled with the smartphone agent, for indexing and ranking."),
  },
  html_lang_missing: {
    t: ["No html lang", "Немає html lang", "Brak html lang"],
    d: [
      "The <html> element declares no language. Screen readers, translators, search engines and AI readers then have to guess the language of the text, and can guess wrong.",
      "Елемент <html> не оголошує мови. Тоді зчитувачі екрана, перекладачі, пошукові системи й ШІ-читачі мусять вгадувати мову тексту і можуть помилитися.",
      "Element <html> nie deklaruje języka. Czytniki ekranu, tłumacze, wyszukiwarki i czytniki AI muszą wtedy zgadywać język tekstu i mogą zgadnąć źle.",
    ],
    x: [
      'Set <html lang="…"> to the BCP 47 tag of the content (for example en, uk, es-MX).',
      'Задайте <html lang="…"> із тегом BCP 47 мови вмісту (наприклад, en, uk, es-MX).',
      "Ustaw <html lang=\"…\"> na tag BCP 47 języka treści (na przykład en, uk, es-MX).",
    ],
    r: Q("i18n", "Always use a language attribute on the html tag to declare the default language of the text in the page."),
  },
  social_tags_missing: {
    t: ["Preview tags missing", "Бракує тегів прев’ю", "Brak tagów podglądu"],
    d: [
      "Open Graph or Twitter card tags are missing. When the page is shared in a chat or a social network, the preview has to be guessed and can show the wrong title or no image.",
      "Бракує тегів Open Graph чи Twitter card. Коли сторінкою діляться в чаті чи соцмережі, прев’ю доводиться вгадувати, і воно може показати не той заголовок або жодного зображення.",
      "Brakuje tagów Open Graph lub Twitter card. Gdy ktoś udostępnia stronę na czacie lub w sieci społecznościowej, podgląd trzeba zgadywać i może pokazać zły tytuł albo brak obrazka.",
    ],
    x: [
      "Add og:title, og:description, og:image (absolute URL), og:url, og:type and twitter:card.",
      "Додайте og:title, og:description, og:image (абсолютна адреса), og:url, og:type і twitter:card.",
      "Dodaj og:title, og:description, og:image (bezwzględny URL), og:url, og:type i twitter:card.",
    ],
    r: Q("ogp", "To turn your web pages into graph objects, you need to add basic metadata to your page."),
  },
  page_weight_heavy: {
    t: ["Heavy page", "Важка сторінка", "Ciężka strona"],
    d: [
      "The page's HTML is very large, or it loads many scripts. All of it has to be downloaded and parsed before the text is ready, which is slow on phones and costly for crawlers.",
      "HTML сторінки дуже великий або вона завантажує багато скриптів. Усе це треба завантажити й розібрати, перш ніж текст буде готовий, а це повільно на телефонах і дорого для краулерів.",
      "HTML strony jest bardzo duży albo strona ładuje wiele skryptów. Wszystko to trzeba pobrać i przetworzyć, zanim tekst będzie gotowy, co jest wolne na telefonach i kosztowne dla crawlerów.",
    ],
    x: [
      "Cut inline JSON, SVG and CSS bulk; defer, async or drop scripts; lazy-load widgets below the fold.",
      "Зменште вбудовані JSON, SVG і CSS; застосуйте defer чи async або приберіть скрипти; віджети нижче першого екрана завантажуйте ліниво.",
      "Ogranicz osadzony JSON, SVG i CSS; skrypty ładuj z defer lub async albo je usuń; widżety poniżej pierwszego ekranu ładuj leniwie.",
    ],
    r: S(
      "HTML over 500 KB, or more than 30 scripts, is a heavy page. The threshold is this skill's; speed for real visitors is what Core Web Vitals measure, and this check does not read them.",
      "HTML понад 500 КБ або понад 30 скриптів — важка сторінка. Поріг — цієї навички; швидкість для реальних відвідувачів вимірюють Core Web Vitals, і ця перевірка їх не читає.",
      "HTML powyżej 500 KB lub więcej niż 30 skryptów to ciężka strona. Próg należy do tej umiejętności; szybkość dla prawdziwych odwiedzających mierzą Core Web Vitals, a to sprawdzenie ich nie odczytuje.",
    ),
  },
  url_unreadable: {
    t: ["Hard-to-read URL", "Незручна адреса", "Nieczytelny URL"],
    d: [
      "The address is long, has many parameters or carries a session id. Such addresses are hard for people to read and share, and they multiply into many addresses for the same content.",
      "Адреса довга, має багато параметрів або містить ідентифікатор сесії. Такі адреси людям важко читати й передавати, і вони розмножуються на багато адрес для того самого вмісту.",
      "Adres jest długi, ma wiele parametrów albo zawiera identyfikator sesji. Takie adresy trudno ludziom czytać i udostępniać, a mnożą się w wiele adresów tej samej treści.",
    ],
    x: [
      "Use short, word-based paths; drop session ids and parameters that do not change the content; canonicalise the rest.",
      "Використовуйте короткі шляхи зі слів; приберіть ідентифікатори сесій і параметри, що не змінюють вмісту; решту канонізуйте.",
      "Używaj krótkich ścieżek złożonych ze słów; usuń identyfikatory sesji i parametry, które nie zmieniają treści; resztę kanonikalizuj.",
    ],
    r: Q("gUrl", "Overly complex URLs, especially those containing multiple parameters, can cause problems for crawlers by creating unnecessarily high numbers of URLs that point to identical or similar content on your site."),
  },

  // ── Rich results and markup ──────────────────────────────────────────────────
  jsonld_invalid: {
    t: ["JSON-LD does not parse", "JSON-LD не розбирається", "JSON-LD się nie parsuje"],
    d: [
      "A JSON-LD block does not parse as JSON. Search engines skip the whole block, so none of the structured data in it is used.",
      "Блок JSON-LD не розбирається як JSON. Пошукові системи пропускають увесь блок, тож жодні структуровані дані з нього не використовуються.",
      "Blok JSON-LD nie parsuje się jako JSON. Wyszukiwarki pomijają cały blok, więc żadne zawarte w nim dane strukturalne nie są wykorzystywane.",
    ],
    x: [
      "Fix the syntax (trailing commas, unescaped quotes or line breaks, comments) and re-run the Rich Results Test.",
      "Виправте синтаксис (зайві коми в кінці, неекрановані лапки чи переноси рядків, коментарі) і повторіть Rich Results Test.",
      "Popraw składnię (końcowe przecinki, nieescapowane cudzysłowy lub złamania wiersza, komentarze) i ponownie uruchom Rich Results Test.",
    ],
    r: Q("gSdIntro", "Be sure to check your structured data using the Rich Results Test during development, and the Rich result status reports after deployment"),
  },
  structured_data_none: {
    t: ["No structured data", "Немає структурованих даних", "Brak danych strukturalnych"],
    d: [
      "The page carries no structured data at all. Search engines can still read it, but they get no machine-readable statement of what the page is, and rich results that depend on markup are out of reach.",
      "Сторінка не має жодних структурованих даних. Пошукові системи все одно можуть її прочитати, але не отримують машиночитного твердження про те, що це за сторінка, а розширені результати, що залежать від розмітки, недоступні.",
      "Strona nie zawiera żadnych danych strukturalnych. Wyszukiwarki nadal mogą ją przeczytać, ale nie dostają czytelnej maszynowo informacji, czym jest strona, a wyniki rozszerzone zależne od znaczników są poza zasięgiem.",
    ],
    x: [
      "Add JSON-LD for the page's real type (Organization and WebSite on the home page, Article, Product, BreadcrumbList, …).",
      "Додайте JSON-LD для справжнього типу сторінки (Organization і WebSite на головній, Article, Product, BreadcrumbList, …).",
      "Dodaj JSON-LD dla rzeczywistego typu strony (Organization i WebSite na stronie głównej, Article, Product, BreadcrumbList, …).",
    ],
    r: Q("gSdIntro", "Adding structured data can enable search results that are more engaging to users and might encourage them to interact more with your website, which are called rich results."),
  },
  schema_required_missing: {
    t: ["Required schema fields missing", "Бракує обов’язкових полів схеми", "Brak wymaganych pól schema"],
    d: [
      "Structured data on the page leaves out properties that Google lists as required for its type. Without them the markup is not eligible for the rich result it was written for.",
      "Структуровані дані на сторінці пропускають властивості, які Google називає обов’язковими для цього типу. Без них розмітка не може дати розширеного результату, заради якого її написали.",
      "Dane strukturalne na stronie pomijają właściwości, które Google wymienia jako wymagane dla danego typu. Bez nich znaczniki nie kwalifikują się do wyniku rozszerzonego, dla którego zostały napisane.",
    ],
    x: [
      "Add each listed required property as the type's Google page names it, then re-test.",
      "Додайте кожну названу обов’язкову властивість так, як її описує сторінка Google для цього типу, і перевірте знову.",
      "Dodaj każdą wymienioną wymaganą właściwość tak, jak nazywa ją strona Google dla tego typu, i przetestuj ponownie.",
    ],
    r: Q("gSdIntro", "You must include all the required properties for an object to be eligible for appearance in Google Search with enhanced display."),
  },
  schema_recommended_missing: {
    t: ["Recommended schema fields missing", "Бракує рекомендованих полів схеми", "Brak zalecanych pól schema"],
    d: [
      "Structured data leaves out properties that Google recommends for its type. The markup still counts, but it says less than it could, and fuller markup is more likely to be shown.",
      "Структуровані дані пропускають властивості, які Google рекомендує для цього типу. Розмітка все одно діє, але каже менше, ніж могла б, а повнішу розмітку показують частіше.",
      "Dane strukturalne pomijają właściwości, które Google zaleca dla danego typu. Znaczniki nadal się liczą, ale mówią mniej, niż mogłyby, a pełniejsze znaczniki mają większą szansę na wyświetlenie.",
    ],
    x: [
      "Add the recommended properties wherever the page really has the data; never add values it does not show.",
      "Додайте рекомендовані властивості там, де сторінка справді має ці дані; не додавайте значень, яких вона не показує.",
      "Dodaj zalecane właściwości wszędzie tam, gdzie strona naprawdę ma te dane; nigdy nie dodawaj wartości, których nie pokazuje.",
    ],
    r: Q("gSdIntro", "In general, defining more recommended features can make it more likely that your information can appear in Search results with enhanced display."),
  },
  faq_rich_result_retired: {
    t: ["FAQ rich result retired", "Розширеного FAQ більше немає", "Wynik rozszerzony FAQ wycofany"],
    d: [
      "The page has FAQPage markup, and Google no longer shows FAQ rich results. The markup does no harm, but it no longer earns the expanded result it was once added for.",
      "Сторінка має розмітку FAQPage, а Google більше не показує розширених результатів FAQ. Розмітка не шкодить, але вже не дає розширеного результату, заради якого її колись додали.",
      "Strona ma znaczniki FAQPage, a Google nie pokazuje już wyników rozszerzonych FAQ. Znaczniki nie szkodzą, ale nie dają już rozszerzonego wyniku, dla którego kiedyś je dodano.",
    ],
    x: [
      "Nothing required for Google; keep it if another consumer reads it, or remove it to lighten the page.",
      "Для Google нічого не потрібно; залиште, якщо її читає інший споживач, або приберіть, щоб полегшити сторінку.",
      "Dla Google nic nie jest wymagane; zostaw je, jeśli czyta je inny odbiorca, albo usuń, by odciążyć stronę.",
    ],
    r: Q("gUpdates", "The FAQ rich result feature is no longer shown in Google Search results"),
  },
  rich_result_retired: {
    t: ["Retired rich result", "Розширеного результату більше немає", "Wycofany wynik rozszerzony"],
    d: [
      "The page carries markup for a rich result that Google has retired. The markup is not an error, but it no longer produces a special result in Google Search.",
      "Сторінка містить розмітку для розширеного результату, який Google припинив показувати. Розмітка не є помилкою, але більше не дає особливого результату в Google Search.",
      "Strona zawiera znaczniki dla wyniku rozszerzonego, który Google wycofało. To nie błąd, ale znaczniki nie dają już specjalnego wyniku w wyszukiwarce Google.",
    ],
    x: [
      "Optional clean-up: drop the retired type unless another consumer needs it.",
      "Необов’язкове прибирання: приберіть застарілий тип, якщо він не потрібен іншому споживачеві.",
      "Opcjonalne porządki: usuń wycofany typ, chyba że potrzebuje go inny odbiorca.",
    ],
    r: Q("gUpdates", "Removed the How-to structured data documentation, as this rich result is no longer shown in search results, on both desktop and mobile devices."),
  },

  // ── Images ───────────────────────────────────────────────────────────────────
  image_dimensions_missing: {
    t: ["Images without width and height", "Зображення без width і height", "Obrazy bez width i height"],
    d: [
      "Images have no width and height in the HTML. The browser cannot reserve their space, so the text jumps as they load, which Google measures as layout shift.",
      "Зображення не мають width і height в HTML. Браузер не може заздалегідь відвести їм місце, тож текст стрибає, коли вони завантажуються, і Google вимірює це як зсув макета.",
      "Obrazy nie mają width i height w HTML. Przeglądarka nie może zarezerwować dla nich miejsca, więc tekst przeskakuje podczas ich ładowania, co Google mierzy jako przesunięcie układu.",
    ],
    x: [
      "Set width and height attributes (the intrinsic ratio) or a CSS aspect-ratio on every <img>.",
      "Задайте атрибути width і height (власні пропорції) або CSS aspect-ratio для кожного <img>.",
      "Ustaw atrybuty width i height (proporcje własne obrazu) albo CSS aspect-ratio na każdym <img>.",
    ],
    r: Q("wCls", "The most common causes of a poor CLS are: Images without dimensions."),
  },
  image_lcp_lazy: {
    t: ["First image lazy-loaded", "Перше зображення з lazy", "Pierwszy obraz ładowany leniwie"],
    d: [
      "The first large image at the top of the page is set to load lazily. The browser then waits before fetching the picture people see first, so the page seems to load slower.",
      "Перше велике зображення вгорі сторінки налаштоване на ліниве завантаження. Тоді браузер зволікає з картинкою, яку люди бачать першою, і сторінка здається повільнішою.",
      "Pierwszy duży obraz na górze strony ma ustawione leniwe ładowanie. Przeglądarka czeka wtedy z pobraniem obrazu, który ludzie widzą jako pierwszy, więc strona wydaje się ładować wolniej.",
    ],
    x: [
      "Remove loading=lazy from the first above-the-fold image and add fetchpriority=high.",
      "Приберіть loading=lazy з першого зображення на першому екрані й додайте fetchpriority=high.",
      "Usuń loading=lazy z pierwszego obrazu nad linią zgięcia i dodaj fetchpriority=high.",
    ],
    r: Q("wLcpLazy", "more eagerly loading images within the initial viewport—while liberally lazy loading the rest—can give us the best of both worlds: fewer bytes loaded and improved Core Web Vitals"),
  },
  image_not_lazy: {
    t: ["Images below the fold load eagerly", "Зображення нижче екрана без lazy", "Obrazy poniżej pierwszego ekranu ładują się od razu"],
    d: [
      "Images further down the page load straight away instead of when they are scrolled to. They compete with what is on screen first and spend data on pictures that may never be seen.",
      "Зображення нижче на сторінці завантажуються одразу, а не тоді, коли до них прокручують. Вони конкурують з тим, що видно першим, і витрачають трафік на картинки, яких можуть і не побачити.",
      "Obrazy niżej na stronie ładują się od razu, a nie wtedy, gdy ktoś do nich przewinie. Konkurują z tym, co widać na ekranie najpierw, i zużywają transfer na obrazy, których ktoś może nigdy nie zobaczyć.",
    ],
    x: [
      "Add loading=lazy to <img> and <iframe> elements below the first screen.",
      "Додайте loading=lazy до <img> та <iframe> нижче першого екрана.",
      "Dodaj loading=lazy do elementów <img> i <iframe> poniżej pierwszego ekranu.",
    ],
    r: Q("wLcpLazy", "more eagerly loading images within the initial viewport—while liberally lazy loading the rest—can give us the best of both worlds: fewer bytes loaded and improved Core Web Vitals"),
  },
  image_legacy_format: {
    t: ["Images in JPEG or PNG only", "Зображення лише в JPEG чи PNG", "Obrazy tylko w JPEG lub PNG"],
    d: [
      "Images are served only as JPEG or PNG. Newer formats usually carry the same picture in fewer bytes, so the page is heavier than it needs to be.",
      "Зображення віддаються лише в JPEG чи PNG. Новіші формати зазвичай передають ту саму картинку меншою кількістю байтів, тож сторінка важча, ніж могла б бути.",
      "Obrazy są serwowane wyłącznie jako JPEG lub PNG. Nowsze formaty zwykle mieszczą ten sam obraz w mniejszej liczbie bajtów, więc strona jest cięższa, niż musi.",
    ],
    x: [
      "Serve WebP or AVIF through <picture><source type> or content negotiation, keeping a JPEG or PNG fallback.",
      "Віддавайте WebP чи AVIF через <picture><source type> або узгодження вмісту, залишивши запасний JPEG чи PNG.",
      "Serwuj WebP lub AVIF przez <picture><source type> albo negocjację treści, zachowując zapasowy JPEG lub PNG.",
    ],
    r: S(
      "An image with no WebP, AVIF or SVG version is flagged. Google Search supports JPEG and PNG; a modern format for lighter pages is this skill's rule.",
      "Зображення без версії WebP, AVIF чи SVG позначається. Google Search підтримує JPEG і PNG; сучасний формат для легших сторінок — правило цієї навички.",
      "Obraz bez wersji WebP, AVIF ani SVG jest oznaczany. Wyszukiwarka Google obsługuje JPEG i PNG; nowoczesny format dla lżejszych stron to reguła tej umiejętności.",
    ),
  },
  image_oversized: {
    t: ["Images over 200 KB", "Зображення понад 200 КБ", "Obrazy powyżej 200 KB"],
    d: [
      "Some images weigh more than 200 KB each. Large files slow the page down, above all on phones, and images are often the largest part of a page's weight.",
      "Деякі зображення важать понад 200 КБ кожне. Великі файли сповільнюють сторінку, найбільше на телефонах, а зображення часто становлять найбільшу частину ваги сторінки.",
      "Niektóre obrazy ważą ponad 200 KB każdy. Duże pliki spowalniają stronę, zwłaszcza na telefonach, a obrazy to często największa część wagi strony.",
    ],
    x: [
      "Compress, resize to the displayed size, convert to AVIF or WebP, and serve size variants through srcset.",
      "Стисніть, зменште до розміру показу, перетворіть на AVIF чи WebP і віддавайте варіанти розмірів через srcset.",
      "Skompresuj, przeskaluj do wyświetlanego rozmiaru, przekonwertuj do AVIF lub WebP i serwuj warianty rozmiarów przez srcset.",
    ],
    r: Q("gImages", "images are often the largest contributor to overall page size, which can make pages slow and expensive to load."),
  },
  image_no_srcset: {
    t: ["Large images without srcset", "Великі зображення без srcset", "Duże obrazy bez srcset"],
    d: [
      "Large images have no srcset, so a phone downloads the same big file as a wide desktop screen.",
      "Великі зображення не мають srcset, тож телефон завантажує той самий великий файл, що й широкий екран комп’ютера.",
      "Duże obrazy nie mają srcset, więc telefon pobiera ten sam duży plik co szeroki ekran desktopowy.",
    ],
    x: [
      "Add srcset with width descriptors and a sizes attribute, or use <picture>.",
      "Додайте srcset з дескрипторами ширини й атрибут sizes або використайте <picture>.",
      "Dodaj srcset z deskryptorami szerokości i atrybut sizes albo użyj <picture>.",
    ],
    r: Q("gImages", "The srcset attribute allows specifying different versions of the same image, specifically for different screen sizes."),
  },

  // ── The site around the page ─────────────────────────────────────────────────
  favicon_missing: {
    t: ["Favicon does not load", "Favicon не завантажується", "Favicon się nie ładuje"],
    d: [
      "The site's icon does not load. Google shows a site's favicon beside its results; without it the result shows a generic icon, and the site is harder to recognise.",
      "Іконка сайту не завантажується. Google показує favicon сайту поруч із його результатами; без нього результат має загальну іконку, і сайт важче впізнати.",
      "Ikona witryny się nie ładuje. Google pokazuje favicon witryny obok jej wyników; bez niego wynik pokazuje ogólną ikonę, a witrynę trudniej rozpoznać.",
    ],
    x: [
      "Serve a crawlable square icon (48×48 or a multiple) and declare <link rel=icon> on the home page.",
      "Віддавайте доступну для краулера квадратну іконку (48×48 або кратну) і оголосіть <link rel=icon> на головній сторінці.",
      "Serwuj dostępną dla crawlerów kwadratową ikonę (48×48 lub wielokrotność) i zadeklaruj <link rel=icon> na stronie głównej.",
    ],
    r: Q("gFavicon", "Googlebot-Image must be able to crawl the favicon file and Googlebot must be able to crawl the home page; they cannot be blocked for crawling."),
  },
  site_name_missing: {
    t: ["No WebSite name markup", "Немає назви сайту в розмітці", "Brak znaczników nazwy WebSite"],
    d: [
      "The home page has no WebSite markup with a name. Google then works out the site name shown above its results from other signals, and may choose a different one.",
      "Головна сторінка не має розмітки WebSite з назвою. Тоді Google визначає назву сайту над результатами з інших ознак і може обрати іншу.",
      "Strona główna nie ma znaczników WebSite z nazwą. Google ustala wtedy nazwę witryny pokazywaną nad jej wynikami na podstawie innych sygnałów i może wybrać inną.",
    ],
    x: [
      "Add WebSite JSON-LD with name (and alternateName, url) to the home page.",
      "Додайте на головну JSON-LD типу WebSite з name (і alternateName, url).",
      "Dodaj na stronie głównej JSON-LD WebSite z name (oraz alternateName, url).",
    ],
    r: Q("gSiteName", "To indicate your site name preference, add WebSite structured data to your home page."),
  },
  mixed_content: {
    t: ["http:// resources on an https page", "Ресурси http:// на https-сторінці", "Zasoby http:// na stronie https"],
    d: [
      "The https page loads some resources over plain http. Browsers block or flag them, so parts of the page can break, and the page loses the protection HTTPS is meant to give.",
      "https-сторінка завантажує частину ресурсів через звичайний http. Браузери блокують або позначають їх, тож частини сторінки можуть зламатися, а сторінка втрачає захист, який мав давати HTTPS.",
      "Strona https ładuje część zasobów przez zwykły http. Przeglądarki je blokują lub oznaczają, więc fragmenty strony mogą przestać działać, a strona traci ochronę, którą ma zapewniać HTTPS.",
    ],
    x: [
      "Switch every subresource URL to https; add a Content-Security-Policy: upgrade-insecure-requests while migrating.",
      "Переведіть адреси всіх підресурсів на https; на час переходу додайте Content-Security-Policy: upgrade-insecure-requests.",
      "Przełącz URL każdego zasobu podrzędnego na https; na czas migracji dodaj Content-Security-Policy: upgrade-insecure-requests.",
    ],
    r: Q("mixed", "this guarantee is weakened if the webpage loads subresources such as script or images over an insecure connection."),
  },
  soft_404: {
    t: ["A missing page answers 200", "Неіснуюча сторінка відповідає 200", "Nieistniejąca strona odpowiada 200"],
    d: [
      "An address that cannot exist on the site answers 200 OK instead of 404. Search engines then treat error pages as real pages, and missing pages can stay in their index.",
      "Адреса, якої на сайті не може існувати, відповідає 200 OK замість 404. Тоді пошукові системи вважають сторінки помилок справжніми, і відсутні сторінки можуть залишатися в їхньому індексі.",
      "Adres, który nie może istnieć w witrynie, odpowiada 200 OK zamiast 404. Wyszukiwarki traktują wtedy strony błędów jak prawdziwe strony, a nieistniejące strony mogą pozostać w ich indeksie.",
    ],
    x: [
      "Return a real 404 or 410 status for unknown paths (check catch-all routes of single-page apps and CMS fallbacks).",
      "Повертайте справжній статус 404 чи 410 для невідомих шляхів (перевірте маршрути catch-all односторінкових застосунків і запасні сторінки CMS).",
      "Zwracaj prawdziwy status 404 lub 410 dla nieznanych ścieżek (sprawdź trasy catch-all aplikacji jednostronicowych i strony zapasowe CMS).",
    ],
    r: Q("gHttp", "If the content suggests an error for Google Search, an empty page or an error message, Search Console will show a soft 404 error."),
  },
  url_variants_inconsistent: {
    t: ["URL variants end elsewhere", "Варіанти адреси ведуть деінде", "Warianty URL kończą się gdzie indziej"],
    d: [
      "The http, www or trailing-slash variants of the address do not end at this page. The same content then lives at several addresses, and search engines may split its signals or show the wrong one.",
      "Варіанти адреси з http, www чи скісною рискою в кінці не ведуть на цю сторінку. Тоді той самий вміст живе за кількома адресами, і пошукові системи можуть розділити його сигнали або показати не ту.",
      "Warianty adresu z http, z www lub z ukośnikiem na końcu nie prowadzą do tej strony. Ta sama treść żyje wtedy pod kilkoma adresami, a wyszukiwarki mogą rozdzielić jej sygnały lub pokazać niewłaściwy.",
    ],
    x: [
      "301 every variant (http, www or not, the trailing slash) to the one canonical URL.",
      "Налаштуйте 301 з кожного варіанта (http, з www чи без, скісна риска в кінці) на одну канонічну адресу.",
      "Przekieruj 301 każdy wariant (http, z www lub bez, końcowy ukośnik) na jeden kanoniczny URL.",
    ],
    r: Q("gCanon", "Pick one of those URLs as your canonical URL, and use redirects to send traffic from the other URLs to your preferred URL."),
  },
  hsts_missing: {
    t: ["No HSTS header", "Немає заголовка HSTS", "Brak nagłówka HSTS"],
    d: [
      "The https answer has no Strict-Transport-Security header. On a later visit a browser may still try plain http first, which leaves a gap for downgrade attacks.",
      "Відповідь через https не має заголовка Strict-Transport-Security. Під час наступного візиту браузер може спершу спробувати звичайний http, і це лишає шпарину для атак із пониженням протоколу.",
      "Odpowiedź https nie ma nagłówka Strict-Transport-Security. Przy kolejnej wizycie przeglądarka może najpierw spróbować zwykłego http, co zostawia lukę dla ataków typu downgrade.",
    ],
    x: [
      "Send Strict-Transport-Security: max-age=31536000; includeSubDomains (add preload once every subdomain is on https).",
      "Надсилайте Strict-Transport-Security: max-age=31536000; includeSubDomains (preload — коли всі піддомени перейдуть на https).",
      "Wysyłaj Strict-Transport-Security: max-age=31536000; includeSubDomains (dodaj preload, gdy każda subdomena będzie na https).",
    ],
    r: Q("hsts", "This specification defines a mechanism enabling web sites to declare themselves accessible only via secure connections"),
  },

  // ── Trust ────────────────────────────────────────────────────────────────────
  author_missing: {
    t: ["Article without an author", "Стаття без автора", "Artykuł bez autora"],
    d: [
      "The page is marked up as an article, but no author is shown on it or named in the markup. Readers and search engines cannot see who wrote it, and Google names this among the signs of trust.",
      "Сторінку розмічено як статтю, але автора не показано на ній і не названо в розмітці. Читачі й пошукові системи не бачать, хто її написав, а Google називає це серед ознак довіри.",
      "Strona jest oznaczona jako artykuł, ale autor nie jest na niej pokazany ani wymieniony w znacznikach. Czytelnicy i wyszukiwarki nie widzą, kto go napisał, a Google wymienia to wśród oznak wiarygodności.",
    ],
    x: [
      "Show a byline and add author (a Person with name and url) to the Article JSON-LD.",
      "Покажіть підпис автора й додайте author (Person з name і url) до JSON-LD Article.",
      "Pokaż podpis autora i dodaj author (Person z name i url) do JSON-LD Article.",
    ],
    r: Q("gHelpful", "Something that helps people intuitively understand the E-E-A-T of content is when it's clear who created it."),
  },
  about_contact_missing: {
    t: ["No About or Contact link", "Немає посилання «Про нас» чи «Контакти»", "Brak linku O nas lub Kontakt"],
    d: [
      "The page has no link to an About or a Contact page. Readers and search engines look for who stands behind a site, and these pages are where they find it.",
      "Сторінка не має посилання на сторінку «Про нас» чи «Контакти». Читачі й пошукові системи шукають, хто стоїть за сайтом, і саме там це знаходять.",
      "Strona nie ma linku do strony O nas ani Kontakt. Czytelnicy i wyszukiwarki szukają, kto stoi za witryną, i właśnie na tych stronach to znajdują.",
    ],
    x: [
      "Link About and Contact from the header or the footer of every page.",
      "Додайте посилання «Про нас» і «Контакти» в шапку або підвал кожної сторінки.",
      "Podlinkuj O nas i Kontakt w nagłówku lub stopce każdej strony.",
    ],
    r: Q("gHelpful", "background about the author or the site that publishes it, such as through links to an author page or a site's About page"),
  },
  organization_details_missing: {
    t: ["Organization markup incomplete", "Розмітка Organization неповна", "Niepełne znaczniki Organization"],
    d: [
      "The organisation is missing from the markup, or its name, logo or sameAs links are. Search engines use these to recognise the company and to choose the logo they show for it.",
      "У розмітці немає організації або бракує її назви, логотипа чи посилань sameAs. Пошукові системи використовують їх, щоб упізнати компанію й обрати логотип, який для неї показують.",
      "W znacznikach brakuje organizacji albo jej nazwy, logo lub linków sameAs. Wyszukiwarki używają ich, by rozpoznać firmę i wybrać logo, które dla niej pokazują.",
    ],
    x: [
      "Add Organization JSON-LD with name, url, logo and sameAs (the official profiles).",
      "Додайте JSON-LD Organization з name, url, logo і sameAs (офіційні профілі).",
      "Dodaj JSON-LD Organization z name, url, logo i sameAs (oficjalne profile).",
    ],
    r: Q("gOrg", "We recommend focusing on properties that are useful to your users, such as name or alternateName for your business name"),
  },
  article_date_missing: {
    t: ["Article without a visible date", "Стаття без видимої дати", "Artykuł bez widocznej daty"],
    d: [
      "The page is an article, and no date is visible on it. Readers cannot tell how current it is, and an AI answer that weighs freshness has nothing to go on.",
      "Сторінка — стаття, і на ній не видно жодної дати. Читачі не можуть зрозуміти, наскільки вона свіжа, а ШІ-відповідь, яка зважає на актуальність, не має на що спертися.",
      "Strona jest artykułem, a nie widać na niej żadnej daty. Czytelnicy nie wiedzą, na ile jest aktualna, a odpowiedź AI, która bierze pod uwagę świeżość, nie ma się na czym oprzeć.",
    ],
    x: [
      "Render the published and updated dates near the headline, equal to datePublished and dateModified.",
      "Покажіть дати публікації й оновлення біля заголовка, рівні datePublished і dateModified.",
      "Wyświetl datę publikacji i aktualizacji przy nagłówku, równe datePublished i dateModified.",
    ],
    r: S(
      "An article shows the date it was published or updated where readers can see it. Google's Article page documents the dates in markup; a visible date is this skill's rule.",
      "Стаття показує дату публікації чи оновлення там, де її бачать читачі. Сторінка Google про Article описує дати в розмітці; видима дата — правило цієї навички.",
      "Artykuł pokazuje datę publikacji lub aktualizacji tam, gdzie czytelnicy mogą ją zobaczyć. Strona Google o Article dokumentuje daty w znacznikach; widoczna data to reguła tej umiejętności.",
    ),
  },
  privacy_terms_missing: {
    t: ["No privacy or terms link", "Немає посилання на конфіденційність чи умови", "Brak linku do polityki prywatności lub regulaminu"],
    d: [
      "The page has no link to a privacy policy or to terms. These pages are part of what shows a reader who runs the site and on what terms.",
      "Сторінка не має посилання на політику конфіденційності чи умови. Ці сторінки — частина того, що показує читачеві, хто керує сайтом і на яких умовах.",
      "Strona nie ma linku do polityki prywatności ani do regulaminu. Te strony są częścią tego, co pokazuje czytelnikowi, kto prowadzi witrynę i na jakich warunkach.",
    ],
    x: [
      "Link the privacy policy and the terms from the footer of every page.",
      "Додайте посилання на політику конфіденційності й умови в підвал кожної сторінки.",
      "Podlinkuj politykę prywatności i regulamin w stopce każdej strony.",
    ],
    r: S(
      "A site links its privacy policy and its terms from its pages, as a sign of who runs it and on what terms. No search engine publishes this as a rule; it is this skill's.",
      "Сайт посилається зі своїх сторінок на політику конфіденційності й умови як на ознаку того, хто ним керує і на яких умовах. Жодна пошукова система не публікує цього як правила; воно — цієї навички.",
      "Witryna linkuje ze swoich stron politykę prywatności i regulamin jako znak tego, kto ją prowadzi i na jakich warunkach. Żadna wyszukiwarka nie publikuje tego jako reguły; to reguła tej umiejętności.",
    ),
  },
  date_mismatch: {
    t: ["Markup date differs from the visible date", "Дата в розмітці не збігається з видимою", "Data w znacznikach różni się od widocznej"],
    d: [
      "The date in the structured data is not a date the page shows. Readers and machines are told two different things about when the page was published or updated.",
      "Дата в структурованих даних не збігається з жодною датою, яку показує сторінка. Читачам і машинам кажуть дві різні речі про те, коли сторінку опубліковано чи оновлено.",
      "Data w danych strukturalnych nie jest datą, którą pokazuje strona. Czytelnicy i maszyny dostają dwie różne informacje o tym, kiedy strona została opublikowana lub zaktualizowana.",
    ],
    x: [
      "Make datePublished and dateModified equal to the visible dates (one source in the template).",
      "Зробіть datePublished і dateModified рівними видимим датам (одне джерело в шаблоні).",
      "Ustaw datePublished i dateModified równe widocznym datom (jedno źródło w szablonie).",
    ],
    r: S(
      "The date in the markup is one the page shows, so that people and machines read the same date. This is this skill's rule.",
      "Дата в розмітці має бути однією з тих, які показує сторінка, щоб люди й машини бачили ту саму дату. Це правило цієї навички.",
      "Data w znacznikach to ta, którą pokazuje strona, tak by ludzie i maszyny czytali tę samą datę. To reguła tej umiejętności.",
    ),
  },

  // ── AI quotes it right ───────────────────────────────────────────────────────
  faq_schema_not_visible: {
    t: ["FAQ markup not in the visible text", "Розмітки FAQ немає у видимому тексті", "Znaczniki FAQ nie w widocznym tekście"],
    d: [
      "The FAQPage markup lists questions that do not appear in the text people see. Markup is meant to describe the visible page, so search engines can treat this as misleading.",
      "Розмітка FAQPage перелічує запитання, яких немає в тексті, що бачать люди. Розмітка має описувати видиму сторінку, тож пошукові системи можуть вважати це оманливим.",
      "Znaczniki FAQPage wymieniają pytania, których nie ma w tekście widocznym dla ludzi. Znaczniki mają opisywać widoczną stronę, więc wyszukiwarki mogą uznać to za wprowadzanie w błąd.",
    ],
    x: [
      "Render every mainEntity question and answer visibly on the page, or remove those entries from the markup.",
      "Покажіть кожне запитання й відповідь із mainEntity на сторінці або приберіть ці записи з розмітки.",
      "Wyświetl każde pytanie i odpowiedź z mainEntity widocznie na stronie albo usuń te wpisy ze znaczników.",
    ],
    r: Q("gSdPol", "Don't mark up content that is not visible to readers of the page."),
  },
  lost_faq_questions: {
    t: ["FAQ answers lost their questions", "Відповіді FAQ без запитань", "Odpowiedzi FAQ straciły pytania"],
    d: [
      "The FAQ's questions sit in buttons or toggles with no heading around them, and the reading drops them with the controls. AI readers keep the answers without the questions they answer, so an answer is rarely matched to anyone's question.",
      "Запитання FAQ сидять у кнопках чи перемикачах без заголовка навколо, і читання викидає їх разом з елементами керування. ШІ-читачі зберігають відповіді без запитань, на які ті відповідають, тож відповідь рідко зіставляють із чиїмсь запитанням.",
      "Pytania FAQ siedzą w przyciskach lub przełącznikach bez otaczającego nagłówka, a odczyt odrzuca je razem z kontrolkami. Czytniki AI zachowują odpowiedzi bez pytań, na które odpowiadają, więc odpowiedź rzadko zostaje dopasowana do czyjegoś pytania.",
    ],
    x: [
      "Wrap each question's button in an <h3> (or use <details><summary> inside a heading); keep the question text in the served DOM.",
      "Обгорніть кнопку кожного запитання в <h3> (або використайте <details><summary> усередині заголовка); тримайте текст запитання в DOM, що віддає сервер.",
      "Opakuj przycisk każdego pytania w <h3> (albo użyj <details><summary> wewnątrz nagłówka); zachowaj tekst pytania w serwowanym DOM.",
    ],
    r: Q("apgAcc", "Each accordion header button is wrapped in an element with role heading that has a value set for aria-level that is appropriate for the information architecture of the page."),
  },
  mid_sentence_start: {
    t: ["Passages start mid-sentence", "Уривки з середини речення", "Fragmenty zaczynają się w połowie zdania"],
    d: [
      "Some passages begin in the middle of a sentence, because a long section was cut into pieces. Read on its own, such a passage makes little sense, and AI answers quote passages on their own.",
      "Деякі уривки починаються з середини речення, бо довгий розділ розрізали на частини. Окремо такий уривок мало що означає, а ШІ-відповіді цитують уривки саме окремо.",
      "Niektóre fragmenty zaczynają się w połowie zdania, bo długa sekcja została pocięta na kawałki. Czytany osobno taki fragment ma mało sensu, a odpowiedzi AI cytują fragmenty właśnie osobno.",
    ],
    x: [
      "Break long sections with more h2 or h3 headings so that cuts fall at headings; keep sections under about 2,000 characters.",
      "Розбийте довгі розділи додатковими заголовками h2 чи h3, щоб розрізи припадали на заголовки; тримайте розділи коротшими за приблизно 2 000 символів.",
      "Podziel długie sekcje dodatkowymi nagłówkami h2 lub h3, aby cięcia wypadały na nagłówkach; trzymaj sekcje poniżej około 2000 znaków.",
    ],
    r: S(
      "The Vectorscope reading cuts the kept text at h2 sections, then into 2,000-character windows; a passage that opens inside a sentence is flagged. This is this skill's rule.",
      "Читання Vectorscope ріже збережений текст за розділами h2, а потім на вікна по 2 000 символів; уривок, що відкривається всередині речення, позначається. Це правило цієї навички.",
      "Odczyt Vectorscope tnie zachowany tekst na sekcje h2, a potem na okna po 2000 znaków; fragment, który zaczyna się wewnątrz zdania, jest oznaczany. To reguła tej umiejętności.",
    ),
  },
  truncated_teaser: {
    t: ["Cut-off teasers", "Обрізані анонси", "Urwane zajawki"],
    d: [
      "The page has short teasers that stop mid-thought with an ellipsis, the rest being elsewhere. AI readers get the fragment, not the point.",
      "Сторінка має короткі анонси, що обриваються на півдумці трьома крапками, а решта — деінде. ШІ-читачі отримують уривок, а не суть.",
      "Strona ma krótkie zajawki, które urywają się w pół myśli wielokropkiem, a reszta jest gdzie indziej. Czytniki AI dostają strzęp, a nie sedno.",
    ],
    x: [
      "Write teasers as complete sentences that carry the point, or include the full text.",
      "Пишіть анонси завершеними реченнями, що несуть суть, або вміщуйте повний текст.",
      "Pisz zajawki jako pełne zdania, które niosą sedno, albo umieść pełny tekst.",
    ],
    r: S(
      "A line in a passage that ends in an ellipsis is a cut-off teaser: the passage holds only part of a text. This is this skill's rule (the Vectorscope reading).",
      "Рядок в уривку, що закінчується трьома крапками, — обрізаний анонс: уривок містить лише частину тексту. Це правило цієї навички (читання Vectorscope).",
      "Wiersz we fragmencie, który kończy się wielokropkiem, to urwana zajawka: fragment zawiera tylko część tekstu. To reguła tej umiejętności (odczyt Vectorscope).",
    ),
  },
  repeated_claim: {
    t: ["The same claim, again and again", "Те саме твердження знову й знову", "To samo twierdzenie raz za razem"],
    d: [
      "The same phrase recurs across many sections of the page. Repetition does not add information, and it makes the sections look alike to a machine that tells passages apart by their words.",
      "Та сама фраза повторюється в багатьох розділах сторінки. Повтор не додає інформації і робить розділи схожими для машини, що розрізняє уривки за словами.",
      "Ta sama fraza powraca w wielu sekcjach strony. Powtórzenie nie dodaje informacji, a sprawia, że sekcje wyglądają podobnie dla maszyny, która rozróżnia fragmenty po ich słowach.",
    ],
    x: [
      "State the claim once where it is proven; give each section its own subject and wording.",
      "Висловте твердження один раз там, де воно доведене; дайте кожному розділу власний предмет і формулювання.",
      "Wypowiedz twierdzenie raz, tam gdzie jest udowodnione; każdej sekcji daj własny temat i własne sformułowania.",
    ],
    r: S(
      "A four-word phrase with at least two content words that appears in half or more of the h2 sections, from three sections, is a repeated claim. This is this skill's rule (the Vectorscope reading).",
      "Фраза з чотирьох слів, щонайменше два з яких змістові, що трапляється в половині чи більше розділів h2 (від трьох розділів), — повторене твердження. Це правило цієї навички (читання Vectorscope).",
      "Czterowyrazowa fraza z co najmniej dwoma słowami treściowymi, która występuje w połowie lub więcej sekcji h2, licząc od trzech sekcji, to powtarzane twierdzenie. To reguła tej umiejętności (odczyt Vectorscope).",
    ),
  },
  question_missing: {
    t: ["A question with no answer", "Запитання без відповіді", "Pytanie bez odpowiedzi"],
    d: [
      "A question people would ask about this topic has no answer anywhere in the page's passages. An assistant asked it has nothing on this page to quote, so it answers from somewhere else.",
      "Запитання, яке люди поставили б на цю тему, не має відповіді в жодному уривку сторінки. Асистент, якого про це спитають, не має на цій сторінці що цитувати, тож відповідає з іншого джерела.",
      "Pytanie, które ludzie zadaliby na ten temat, nie ma odpowiedzi w żadnym fragmencie strony. Asystent, który je dostanie, nie ma na tej stronie nic do zacytowania, więc odpowiada z innego źródła.",
    ],
    x: [
      "Add a passage, ideally under its own h2 or h3, that answers the question directly in its first two sentences.",
      "Додайте уривок, бажано під власним h2 чи h3, що прямо відповідає на запитання в перших двох реченнях.",
      "Dodaj fragment, najlepiej pod własnym h2 lub h3, który odpowiada na pytanie wprost w pierwszych dwóch zdaniach.",
    ],
    r: S(
      "The agent writes the questions people ask and judges each against the passages; one that no passage answers is flagged. The questions and verdicts are the agent's judgement, and the quote is checked against the passage.",
      "Агент пише запитання, які ставлять люди, і оцінює кожне за уривками; запитання, на яке не відповідає жоден уривок, позначається. Запитання й вердикти — судження агента, а цитату перевіряють за уривком.",
      "Agent formułuje pytania, które zadają ludzie, i ocenia każde z nich względem fragmentów; pytanie, na które nie odpowiada żaden fragment, jest oznaczane. Pytania i werdykty to ocena agenta, a cytat jest sprawdzany względem fragmentu.",
    ),
  },
  question_partial: {
    t: ["A question answered in part", "Запитання з частковою відповіддю", "Pytanie z częściową odpowiedzią"],
    d: [
      "A question people would ask is answered only in part by the best passage. An assistant can quote it, but has to fill the rest from elsewhere.",
      "На запитання, яке поставили б люди, найкращий уривок відповідає лише частково. Асистент може його процитувати, але решту мусить брати з іншого джерела.",
      "Na pytanie, które ludzie by zadali, najlepszy fragment odpowiada tylko częściowo. Asystent może go zacytować, ale resztę musi uzupełnić z innych źródeł.",
    ],
    x: [
      "Complete the passage with the missing part of the answer (figures, steps, conditions) in the same section.",
      "Доповніть уривок частиною відповіді, якої бракує (числа, кроки, умови), у тому самому розділі.",
      "Uzupełnij fragment o brakującą część odpowiedzi (liczby, kroki, warunki) w tej samej sekcji.",
    ],
    r: S(
      "The agent judges each question against the passages; a passage that helps but leaves part of the answer out is a partial answer. The verdict is the agent's judgement.",
      "Агент оцінює кожне запитання за уривками; уривок, що допомагає, але пропускає частину відповіді, — часткова відповідь. Вердикт — судження агента.",
      "Agent ocenia każde pytanie względem fragmentów; fragment, który pomaga, ale pomija część odpowiedzi, to odpowiedź częściowa. Werdykt to ocena agenta.",
    ),
  },
  stock_phrases: {
    t: ["Stock phrases", "Шаблонні фрази", "Utarte frazy"],
    d: [
      "The text uses stock phrases, the kind that could stand on any page and say nothing specific. Readers skim past them, and an AI answer finds nothing particular to quote in them.",
      "Текст використовує шаблонні фрази — такі, що могли б стояти на будь-якій сторінці й не кажуть нічого конкретного. Читачі їх пропускають, а ШІ-відповідь не знаходить у них нічого конкретного для цитати.",
      "Tekst używa utartych fraz, takich, które mogłyby stać na dowolnej stronie i nie mówią nic konkretnego. Czytelnicy je przeskakują, a odpowiedź AI nie znajduje w nich nic szczególnego do zacytowania.",
    ],
    x: [
      "Replace each flagged phrase with the specific fact it stands for, or delete it.",
      "Замініть кожну позначену фразу конкретним фактом, який вона заступає, або видаліть її.",
      "Zastąp każdą oznaczoną frazę konkretnym faktem, który ma wyrażać, albo ją usuń.",
    ],
    r: S(
      "The PatternScope's detectors match phrases from a fixed list per language and count them per 1,000 words, medium from 2.0. A signal about worn writing, not an AI detector; this skill's rule.",
      "Детектори PatternScope знаходять фрази з фіксованого переліку для кожної мови й рахують їх на 1 000 слів, середня серйозність — від 2,0. Це сигнал про зношене письмо, а не детектор ШІ; правило цієї навички.",
      "Detektory PatternScope dopasowują frazy ze stałej listy dla każdego języka i liczą je na 1000 słów, poziom średni od 2,0. To sygnał zużytego stylu, a nie detektor AI; reguła tej umiejętności.",
    ),
  },
  repeated_sentence_shape: {
    t: ["Sentences of one shape", "Речення однієї форми", "Zdania o jednym kształcie"],
    d: [
      "Many sentences follow the same shape. Text like that reads as templated, and the repetition hides which sentence carries the point.",
      "Багато речень мають однакову будову. Такий текст читається як шаблонний, а повтор приховує, яке речення несе суть.",
      "Wiele zdań ma tę samą budowę. Taki tekst czyta się jak szablon, a powtórzenie ukrywa, które zdanie niesie sedno.",
    ],
    x: [
      "Vary the sentence structure; merge or cut the templated sentences.",
      "Урізноманітніть будову речень; об’єднайте або скоротіть шаблонні речення.",
      "Zróżnicuj budowę zdań; połącz lub wytnij zdania pisane według szablonu.",
    ],
    r: S(
      "The PatternScope's detectors flag sentences that repeat one structure. A signal about worn writing, not an AI detector; this skill's rule.",
      "Детектори PatternScope позначають речення, що повторюють одну будову. Це сигнал про зношене письмо, а не детектор ШІ; правило цієї навички.",
      "Detektory PatternScope oznaczają zdania powtarzające jedną strukturę. To sygnał zużytego stylu, a nie detektor AI; reguła tej umiejętności.",
    ),
  },
  uniform_openings: {
    t: ["Sentences open alike", "Речення починаються однаково", "Zdania zaczynają się tak samo"],
    d: [
      "Runs of sentences open with the same words. It reads like a list pressed into prose, and each sentence is harder to tell apart when it is quoted alone.",
      "Низки речень починаються тими самими словами. Це читається як список, утиснутий у прозу, і кожне речення важче розрізнити, коли його цитують окремо.",
      "Ciągi zdań zaczynają się od tych samych słów. Czyta się to jak listę wciśniętą w prozę, a każde zdanie trudniej odróżnić, gdy jest cytowane osobno.",
    ],
    x: [
      "Rewrite the openings so each sentence leads with its own subject, or turn the run into a real list.",
      "Перепишіть початки, щоб кожне речення починалося зі свого предмета, або зробіть із низки справжній список.",
      "Przepisz początki tak, by każde zdanie zaczynało się od własnego podmiotu, albo zamień ciąg w prawdziwą listę.",
    ],
    r: S(
      "The PatternScope's detectors flag runs of sentences that open the same way. A signal about worn writing, not an AI detector; this skill's rule.",
      "Детектори PatternScope позначають низки речень з однаковим початком. Це сигнал про зношене письмо, а не детектор ШІ; правило цієї навички.",
      "Detektory PatternScope oznaczają ciągi zdań, które zaczynają się tak samo. To sygnał zużytego stylu, a nie detektor AI; reguła tej umiejętności.",
    ),
  },
  unchecked_claims: {
    t: ["Claims with nothing to check", "Твердження без фактів для перевірки", "Twierdzenia, których nie da się sprawdzić"],
    d: [
      "Some sentences make evaluative claims, such as best, fast or easy, with no number, name or source in the same sentence. Such claims cannot be checked, so they give an AI answer nothing it can state as a fact.",
      "Деякі речення містять оцінні твердження — найкращий, швидкий, простий — без жодного числа, назви чи джерела в тому самому реченні. Такі твердження неможливо перевірити, тож вони не дають ШІ-відповіді нічого, що можна подати як факт.",
      "Niektóre zdania zawierają twierdzenia wartościujące, takie jak najlepszy, szybki czy łatwy, bez liczby, nazwy ani źródła w tym samym zdaniu. Takich twierdzeń nie da się sprawdzić, więc odpowiedź AI nie ma w nich nic, co mogłaby podać jako fakt.",
    ],
    x: [
      "Attach a figure, a named source or a concrete example in the same sentence, or drop the claim.",
      "Додайте в те саме речення число, назване джерело чи конкретний приклад або приберіть твердження.",
      "Dołącz liczbę, nazwane źródło lub konkretny przykład w tym samym zdaniu albo usuń twierdzenie.",
    ],
    r: S(
      "The PatternScope's detectors flag evaluative claims with nothing checkable in the sentence. A signal, not an AI detector; this skill's rule.",
      "Детектори PatternScope позначають оцінні твердження, у реченні яких немає нічого, що можна перевірити. Це сигнал, а не детектор ШІ; правило цієї навички.",
      "Detektory PatternScope oznaczają twierdzenia wartościujące, w których zdaniu nie ma nic sprawdzalnego. To sygnał, a nie detektor AI; reguła tej umiejętności.",
    ),
  },
  keyword_not_in_title: {
    t: ["Main phrase not in title or h1", "Головної фрази немає в title чи h1", "Głównej frazy nie ma w title ani h1"],
    d: [
      "The page's main phrase is in neither the title nor the h1. These are the first places search engines and readers look to learn what a page is about.",
      "Головної фрази сторінки немає ні в title, ні в h1. Саме туди пошукові системи й читачі дивляться першими, щоб дізнатися, про що сторінка.",
      "Głównej frazy strony nie ma ani w title, ani w h1. To pierwsze miejsca, w które patrzą wyszukiwarki i czytelnicy, by dowiedzieć się, o czym jest strona.",
    ],
    x: [
      "Put the target phrase, in its natural form, in the <title> and the <h1>.",
      "Вставте цільову фразу в природній формі в <title> і <h1>.",
      "Umieść docelową frazę, w jej naturalnej formie, w <title> i w <h1>.",
    ],
    r: Q("gStarter", "Think about the words that a user might search for to find a piece of your content."),
  },
  keyword_variant_split: {
    t: ["Main phrase written two ways", "Головну фразу написано двома способами", "Główna fraza zapisana na dwa sposoby"],
    d: [
      "The main phrase is written in two different ways across the page. A reader may not notice, but word matching treats them as different words, and the page's focus is split between them.",
      "Головну фразу на сторінці написано двома різними способами. Читач може не помітити, але зіставлення слів вважає їх різними словами, і фокус сторінки розділяється між ними.",
      "Główna fraza jest zapisana na stronie na dwa różne sposoby. Czytelnik może tego nie zauważyć, ale dopasowanie słów traktuje je jak różne słowa, a skupienie strony rozkłada się między nie.",
    ],
    x: [
      "Pick one spelling and use it in the title, the h1, the headings and the body.",
      "Оберіть одне написання й використовуйте його в title, h1, заголовках і тексті.",
      "Wybierz jedną pisownię i używaj jej w title, h1, nagłówkach i treści.",
    ],
    r: S(
      "The main phrase is expected in one written form; a second spelling (hyphenated or not, singular or plural) used alongside it splits it. This is this skill's rule.",
      "Головна фраза має бути в одній формі написання; друге написання поруч (через дефіс чи без, в однині чи множині) її розділяє. Це правило цієї навички.",
      "Główna fraza powinna mieć jedną formę zapisu; druga pisownia (z łącznikiem lub bez, w liczbie pojedynczej lub mnogiej) używana obok niej ją rozbija. To reguła tej umiejętności.",
    ),
  },
  keyword_one_section: {
    t: ["Main phrase in few sections", "Головна фраза в небагатьох розділах", "Główna fraza w nielicznych sekcjach"],
    d: [
      "The main phrase appears in only a few of the page's sections. The rest of the page reads as being about something else, and a passage taken from there does not say what it relates to.",
      "Головна фраза трапляється лише в кількох розділах сторінки. Решта сторінки читається так, ніби вона про щось інше, а уривок, узятий звідти, не каже, до чого він стосується.",
      "Główna fraza pojawia się tylko w kilku sekcjach strony. Reszta strony wygląda, jakby była o czymś innym, a fragment wzięty stamtąd nie mówi, czego dotyczy.",
    ],
    x: [
      "Name the topic (the phrase or its head word) in the headings and first sentences of the sections it is the subject of.",
      "Називайте тему (фразу чи її головне слово) в заголовках і перших реченнях розділів, де вона є предметом.",
      "Nazwij temat (frazę lub jej główne słowo) w nagłówkach i pierwszych zdaniach sekcji, których jest przedmiotem.",
    ],
    r: S(
      "On a page with three or more h2 sections, a main phrase that reaches a third of them or fewer is confined to one part of the page. This is this skill's rule.",
      "На сторінці з трьома чи більше розділами h2 головна фраза, що досягає третини з них або менше, замкнена в одній частині сторінки. Це правило цієї навички.",
      "Na stronie z trzema lub więcej sekcjami h2 główna fraza, która dociera do jednej trzeciej z nich lub mniej, jest zamknięta w jednej części strony. To reguła tej umiejętności.",
    ),
  },
  off_keyword_share: {
    t: ["Most of the text off the main phrase", "Більшість тексту без головної фрази", "Większość tekstu poza główną frazą"],
    d: [
      "Most of the passage text never mentions the main phrase. To a machine reading passage by passage, much of the page does not look related to its own topic.",
      "Більша частина тексту уривків жодного разу не згадує головної фрази. Машині, що читає уривок за уривком, значна частина сторінки не здається пов’язаною з її власною темою.",
      "Większość tekstu fragmentów ani razu nie wspomina głównej frazy. Dla maszyny czytającej fragment po fragmencie duża część strony nie wygląda na związaną z jej własnym tematem.",
    ],
    x: [
      "Tie the sections back to the topic in their headings and first sentences; cut blocks that are off the topic.",
      "Пов’яжіть розділи з темою в заголовках і перших реченнях; приберіть блоки поза темою.",
      "Powiąż sekcje z tematem w ich nagłówkach i pierwszych zdaniach; wytnij bloki niezwiązane z tematem.",
    ],
    r: S(
      "When the passages that mention the main phrase hold less than half of the passage text, most of the text is off the phrase. This is this skill's rule.",
      "Коли уривки, що згадують головну фразу, містять менше половини тексту уривків, більша частина тексту — поза фразою. Це правило цієї навички.",
      "Gdy fragmenty wspominające główną frazę zawierają mniej niż połowę tekstu fragmentów, większość tekstu jest poza frazą. To reguła tej umiejętności.",
    ),
  },
  promise_without_number: {
    t: ["A promise with no figure", "Обіцянка без числа", "Obietnica bez liczby"],
    d: [
      "A sentence speaks of a fee, a price, a deadline, opening hours or an address, but gives no figure. A reader or an AI looking for that figure finds a sentence that promises it and does not deliver.",
      "Речення говорить про збір, ціну, строк, години роботи чи адресу, але не дає жодного числа. Читач чи ШІ, що шукає це число, знаходить речення, яке його обіцяє, але не дає.",
      "Zdanie mówi o opłacie, cenie, terminie, godzinach otwarcia lub adresie, ale nie podaje żadnej liczby. Czytelnik lub AI szukający tej liczby trafia na zdanie, które ją obiecuje i jej nie daje.",
    ],
    x: [
      "State the figure in that sentence (amount and currency, the date or number of days, the hours, the full address).",
      "Вкажіть у цьому реченні число (суму й валюту, дату чи кількість днів, години, повну адресу).",
      "Podaj liczbę w tym zdaniu (kwotę i walutę, datę lub liczbę dni, godziny, pełny adres).",
    ],
    r: S(
      "A sentence that mentions a fee, a price, a deadline, hours or an address, and states no figure, is flagged; English only. This is this skill's rule.",
      "Речення, що згадує збір, ціну, строк, години чи адресу й не містить жодного числа, позначається; лише для англійської. Це правило цієї навички.",
      "Zdanie, które wspomina opłatę, cenę, termin, godziny lub adres i nie podaje żadnej liczby, jest oznaczane; tylko po angielsku. To reguła tej umiejętności.",
    ),
  },

  // ── AI gets the brand right ──────────────────────────────────────────────────
  brand_contradiction: {
    t: ["AI contradicts the page", "ШІ суперечить сторінці", "AI przeczy stronie"],
    d: [
      "What the AI model believes about the brand differs from what the page says, for a price or for a number of something. An assistant answering from memory would tell people the wrong thing.",
      "Те, що ШІ-модель вважає про бренд, розходиться з тим, що каже сторінка, — щодо ціни чи кількості чогось. Асистент, що відповідає з пам’яті, сказав би людям неправду.",
      "To, co model AI sądzi o marce, różni się od tego, co mówi strona, w kwestii ceny lub liczby czegoś. Asystent odpowiadający z pamięci powiedziałby ludziom nieprawdę.",
    ],
    x: [
      "State the fact plainly in crawlable text (pricing table, FAQ), back it with Product or Offer markup, and correct outdated third-party listings.",
      "Чітко викладіть факт у доступному для краулера тексті (таблиця цін, FAQ), підкріпіть розміткою Product чи Offer і виправте застарілі сторонні описи.",
      "Podaj fakt wprost w tekście dostępnym dla crawlerów (tabela cen, FAQ), poprzyj go znacznikami Product lub Offer i popraw nieaktualne wpisy w serwisach zewnętrznych.",
    ],
    r: S(
      "The agent's model answers five buyer questions from its own knowledge; a price, or a count of the same thing, that the page states differently is a contradiction. Fixed rules from Brandscope; the answers are one model's judgement.",
      "Модель агента відповідає на п’ять запитань покупця з власних знань; ціна чи кількість того самого, яку сторінка подає інакше, — суперечність. Фіксовані правила з Brandscope; відповіді — судження однієї моделі.",
      "Model agenta odpowiada na pięć pytań kupującego z własnej wiedzy; cena lub liczba tego samego, którą strona podaje inaczej, to sprzeczność. Stałe reguły z Brandscope; odpowiedzi to ocena jednego modelu.",
    ),
  },
  brand_fact_absent: {
    t: ["AI knows facts the page lacks", "ШІ знає факти, яких немає на сторінці", "AI zna fakty, których brak na stronie"],
    d: [
      "The model states facts about the brand that the page does not mention. They may be true, but the page cannot confirm or correct them, so assistants keep repeating what they already believe.",
      "Модель наводить факти про бренд, яких сторінка не згадує. Вони можуть бути правдивими, але сторінка не може їх підтвердити чи виправити, тож асистенти й далі повторюють те, у що вже вірять.",
      "Model podaje fakty o marce, których strona nie wspomina. Mogą być prawdziwe, ale strona nie może ich potwierdzić ani skorygować, więc asystenci powtarzają to, w co już wierzą.",
    ],
    x: [
      "Add the confirmed facts to the page (or to a linked About or pricing page) as sentences that can be quoted alone.",
      "Додайте підтверджені факти на сторінку (або на пов’язану сторінку «Про нас» чи цін) реченнями, які можна цитувати окремо.",
      "Dodaj potwierdzone fakty do strony (lub do podlinkowanej strony O nas albo cennika) jako zdania, które można zacytować osobno.",
    ],
    r: S(
      "A sentence of the model's answer about what the brand is, what it costs or what it integrates with, whose numbers and names are not on the page, is a fact the page lacks. Fixed rules from Brandscope; one model's judgement.",
      "Речення з відповіді моделі про те, що таке бренд, скільки він коштує чи з чим інтегрується, чиїх чисел і назв немає на сторінці, — факт, якого бракує сторінці. Фіксовані правила з Brandscope; судження однієї моделі.",
      "Zdanie z odpowiedzi modelu o tym, czym jest marka, ile kosztuje lub z czym się integruje, którego liczb i nazw nie ma na stronie, to fakt, którego strona nie zawiera. Stałe reguły z Brandscope; ocena jednego modelu.",
    ),
  },
  brand_unknown: {
    t: ["AI doesn't know the brand", "ШІ не знає бренду", "AI nie zna marki"],
    d: [
      "The model does not know the brand at all. An assistant answering from memory cannot describe it and depends entirely on what it can find and read.",
      "Модель зовсім не знає бренду. Асистент, що відповідає з пам’яті, не може його описати й цілком залежить від того, що зможе знайти й прочитати.",
      "Model w ogóle nie zna marki. Asystent odpowiadający z pamięci nie potrafi jej opisać i zależy całkowicie od tego, co zdoła znaleźć i przeczytać.",
    ],
    x: [
      "Make the basics explicit on key pages (what it is, for whom, the price) and earn mentions on independent sources.",
      "Чітко викладіть основне на ключових сторінках (що це, для кого, ціна) і здобувайте згадки в незалежних джерелах.",
      "Podaj podstawy wprost na kluczowych stronach (czym to jest, dla kogo, cena) i zdobywaj wzmianki w niezależnych źródłach.",
    ],
    r: S(
      "When all five of the model's answers say it does not know the brand, the brand is unknown to that model. One model's judgement; fixed rules from Brandscope.",
      "Коли всі п’ять відповідей моделі кажуть, що вона не знає бренду, бренд цій моделі невідомий. Судження однієї моделі; фіксовані правила з Brandscope.",
      "Gdy wszystkie pięć odpowiedzi modelu mówi, że nie zna marki, marka jest dla tego modelu nieznana. Ocena jednego modelu; stałe reguły z Brandscope.",
    ),
  },
  review_rating_unbacked: {
    t: ["Ratings with no source", "Рейтинги без джерела", "Oceny bez źródła"],
    d: [
      "The model gives the brand a rating on a review platform, and the page offers nothing that backs it: no mention of the platform, no link, no markup. Nobody can tell from the page whether that rating is real.",
      "Модель називає рейтинг бренду на платформі відгуків, а сторінка не дає нічого, що його підкріплює: ні згадки платформи, ні посилання, ні розмітки. Зі сторінки ніхто не може зрозуміти, чи цей рейтинг справжній.",
      "Model podaje ocenę marki na platformie z opiniami, a strona nie oferuje niczego, co by ją potwierdzało: żadnej wzmianki o platformie, linku ani znaczników. Ze strony nie da się stwierdzić, czy ta ocena jest prawdziwa.",
    ],
    x: [
      "Link the real review profiles, show ratings with their source and date; mark up only ratings the site itself collects (AggregateRating).",
      "Додайте посилання на справжні профілі відгуків, показуйте рейтинги з джерелом і датою; розмічайте лише рейтинги, які збирає сам сайт (AggregateRating).",
      "Podlinkuj prawdziwe profile z opiniami, pokazuj oceny ze źródłem i datą; oznaczaj znacznikami tylko oceny zbierane przez samą witrynę (AggregateRating).",
    ],
    r: S(
      "Each rating the model states is traced to the page: a mention of the platform, a link to it, or rating markup. A rating with none of them is flagged. This is this skill's rule; the ratings are one model's belief.",
      "Кожен рейтинг, який називає модель, простежується до сторінки: згадка платформи, посилання на неї або розмітка рейтингу. Рейтинг без жодного з них позначається. Це правило цієї навички; рейтинги — переконання однієї моделі.",
      "Każda ocena podana przez model jest śledzona do strony: wzmianka o platformie, link do niej lub znaczniki oceny. Ocena bez żadnego z nich jest oznaczana. To reguła tej umiejętności; oceny to przekonanie jednego modelu.",
    ),
  },
  review_control_hallucination: {
    t: ["AI rated a platform that doesn't exist", "ШІ оцінив платформу, якої немає", "AI oceniło nieistniejącą platformę"],
    d: [
      "The model gave a rating on a review platform that does not exist. It is inventing ratings, so none of its other ratings can be taken as knowledge.",
      "Модель назвала рейтинг на платформі відгуків, якої не існує. Вона вигадує рейтинги, тож жоден інший її рейтинг не можна вважати знанням.",
      "Model podał ocenę na platformie z opiniami, która nie istnieje. Wymyśla oceny, więc żadnej z jego pozostałych ocen nie można uznać za wiedzę.",
    ],
    x: [
      "Nothing to change on the page; treat model-stated ratings as unverified and compare with another model or the live platforms.",
      "На сторінці нічого змінювати не треба; вважайте рейтинги від моделі неперевіреними й порівняйте з іншою моделлю чи справжніми платформами.",
      "Na stronie nie trzeba nic zmieniać; traktuj oceny podawane przez model jako niezweryfikowane i porównuj z innym modelem lub z samymi platformami.",
    ],
    r: S(
      "The model is asked about Vetteral, a review platform invented for the test; any rating it gives there is invented, and its other ratings prove nothing. This is this skill's rule.",
      "Модель питають про Vetteral — платформу відгуків, вигадану для перевірки; будь-який рейтинг там вигаданий, і інші її рейтинги нічого не доводять. Це правило цієї навички.",
      "Model jest pytany o Vetteral, platformę z opiniami wymyśloną na potrzeby testu; każda ocena, którą tam poda, jest wymyślona, a jego pozostałe oceny niczego nie dowodzą. To reguła tej umiejętności.",
    ),
  },
  reviews_without_markup: {
    t: ["Ratings shown without markup", "Оцінки без розмітки", "Oceny pokazane bez znaczników"],
    d: [
      "The page shows ratings or review counts, but no rating markup describes them. Search engines read the numbers as plain text, with nothing to say what was rated or by how many people.",
      "Сторінка показує оцінки чи кількість відгуків, але жодна розмітка рейтингу їх не описує. Пошукові системи читають ці числа як звичайний текст, без пояснення, що оцінювали і скільки людей.",
      "Strona pokazuje oceny lub liczbę opinii, ale żadne znaczniki oceny ich nie opisują. Wyszukiwarki czytają te liczby jako zwykły tekst, bez informacji, co oceniono i ile osób to zrobiło.",
    ],
    x: [
      "Add AggregateRating (ratingValue, ratingCount or reviewCount, itemReviewed) equal to the visible numbers, within Google's self-serving review rules.",
      "Додайте AggregateRating (ratingValue, ratingCount або reviewCount, itemReviewed), рівний видимим числам, у межах правил Google щодо відгуків про себе.",
      "Dodaj AggregateRating (ratingValue, ratingCount lub reviewCount, itemReviewed) równe widocznym liczbom, zgodnie z zasadami Google dotyczącymi opinii o własnej firmie.",
    ],
    r: Q("gReview", "When Google finds valid reviews or ratings markup, we may show a rich snippet that includes stars and other summary info from reviews or ratings."),
  },

  // ── AI reads all of it ───────────────────────────────────────────────────────
  cap_overflow: {
    t: ["Text past the passage cap", "Текст за лімітом уривків", "Tekst poza limitem fragmentów"],
    d: [
      "The page's text fills all 26 passages and there is more after them. In this model of a retriever the rest is never stored, so nothing in it can be found or quoted.",
      "Текст сторінки заповнює всі 26 уривків, і після них є ще. У цій моделі ретривера решта ніколи не зберігається, тож нічого з неї неможливо знайти чи процитувати.",
      "Tekst strony wypełnia wszystkie 26 fragmentów i po nich jest jeszcze więcej. W tym modelu retrievera reszta nigdy nie zostaje zapisana, więc nic z niej nie da się znaleźć ani zacytować.",
    ],
    x: [
      "Shorten or split the page; move the key content up; cut repeated boilerplate from the main text.",
      "Скоротіть або розділіть сторінку; перенесіть головне вище; приберіть повторювані шаблонні блоки з основного тексту.",
      "Skróć lub podziel stronę; przenieś kluczowe treści wyżej; wytnij powtarzające się stałe elementy z głównego tekstu.",
    ],
    r: S(
      "The Vectorscope reading cuts the kept text into passages and stores at most 26; the text after the 26th is past the cap. This is this skill's rule, a working model of a typical retriever.",
      "Читання Vectorscope ріже збережений текст на уривки й зберігає щонайбільше 26; текст після 26-го — за лімітом. Це правило цієї навички, робоча модель типового ретривера.",
      "Odczyt Vectorscope tnie zachowany tekst na fragmenty i zapisuje najwyżej 26; tekst po 26. fragmencie jest poza limitem. To reguła tej umiejętności, roboczy model typowego retrievera.",
    ),
  },
  js_dependent: {
    t: ["Text that needs JavaScript", "Текст лише з JavaScript", "Tekst wymagający JavaScriptu"],
    d: [
      "A large part of the text exists only after JavaScript runs. Crawlers and AI readers that read the HTML as served do not see it.",
      "Значна частина тексту з’являється лише після виконання JavaScript. Краулери й ШІ-читачі, що читають HTML у тому вигляді, як його віддає сервер, її не бачать.",
      "Duża część tekstu istnieje dopiero po uruchomieniu JavaScriptu. Crawlery i czytniki AI, które czytają HTML w postaci serwowanej, go nie widzą.",
    ],
    x: [
      "Server-render or prerender this content so it is in the initial HTML; check view-source, not the inspector.",
      "Рендеріть цей вміст на сервері або заздалегідь, щоб він був у початковому HTML; перевіряйте view-source, а не інспектор.",
      "Renderuj tę treść po stronie serwera lub prerenderuj ją, aby była w początkowym HTML; sprawdzaj view-source, a nie inspektor.",
    ],
    r: Q("gJs", "Keep in mind that server-side or pre-rendering is still a great idea because it makes your website faster for users and crawlers, and not all bots can run JavaScript."),
  },
  hero_lede_dropped: {
    t: ["Opening paragraph unseen", "Вступ не видно", "Akapit otwierający niewidoczny"],
    d: [
      "The opening paragraph sits inside <header>, which text extractors throw away as page furniture. The sentence that says what the page is about never reaches the AI reader.",
      "Вступний абзац стоїть усередині <header>, який екстрактори тексту викидають як службову частину сторінки. Речення, що каже, про що сторінка, ніколи не доходить до ШІ-читача.",
      "Akapit otwierający znajduje się w <header>, który ekstraktory tekstu wyrzucają jako element szkieletu strony. Zdanie mówiące, o czym jest strona, nigdy nie dociera do czytnika AI.",
    ],
    x: [
      "Move the hero's h1 and lede out of <header> into <main>; keep <header> for the logo and navigation.",
      "Перенесіть h1 і вступ першого екрана з <header> у <main>; залиште <header> для логотипа й навігації.",
      "Przenieś h1 i lead sekcji hero z <header> do <main>; <header> zostaw na logo i nawigację.",
    ],
    r: Q("header", "The header element represents a group of introductory or navigational aids."),
  },
  hidden_headings: {
    t: ["Headings in hidden panels", "Заголовки в прихованих панелях", "Nagłówki w ukrytych panelach"],
    d: [
      "Headings and their text sit in panels hidden when the page loads, such as closed tabs. Readers that drop hidden content never see these sections.",
      "Заголовки та їхній текст лежать у панелях, прихованих під час завантаження сторінки, наприклад у закритих вкладках. Читачі, що відкидають прихований вміст, цих розділів не бачать.",
      "Nagłówki i ich tekst znajdują się w panelach ukrytych przy ładowaniu strony, na przykład w zamkniętych kartach. Czytniki, które odrzucają ukrytą treść, nigdy nie widzą tych sekcji.",
    ],
    x: [
      'Keep panel text in the DOM without hidden (use hidden="until-found" or a CSS-only collapse), or move it into the main flow.',
      'Тримайте текст панелей у DOM без hidden (використайте hidden="until-found" або згортання лише CSS) або перенесіть його в основний потік.',
      "Trzymaj tekst paneli w DOM bez hidden (użyj hidden=\"until-found\" lub zwijania wyłącznie w CSS) albo przenieś go do głównego przepływu.",
    ],
    r: Q("hidden", "When an element has the hidden attribute in the Hidden state, it indicates that the element is not yet, or is no longer, directly relevant to the page's current state"),
  },
  ssr_placeholder_text: {
    t: ["Loading text read as content", "Напис завантаження як зміст", "Tekst ładowania czytany jako treść"],
    d: [
      "The served HTML holds loading or placeholder text, such as “Loading…”. A reader that does not run scripts takes that message for part of the page.",
      "HTML, який віддає сервер, містить текст завантаження чи заглушку, наприклад «Loading…». Читач, що не виконує скриптів, сприймає це повідомлення як частину сторінки.",
      "Serwowany HTML zawiera tekst ładowania lub zastępczy, taki jak „Loading…”. Czytnik, który nie uruchamia skryptów, bierze ten komunikat za część strony.",
    ],
    x: [
      "Server-render the real content, or leave the container empty; no status strings in the served HTML.",
      "Рендеріть справжній вміст на сервері або залишайте контейнер порожнім; жодних службових написів у HTML від сервера.",
      "Renderuj prawdziwą treść po stronie serwera albo zostaw kontener pusty; żadnych komunikatów stanu w serwowanym HTML.",
    ],
    r: S(
      "Status text served in the HTML, such as loading lines and placeholders, is read as page content and flagged. This is this skill's rule.",
      "Службовий текст у HTML від сервера, як-от рядки завантаження й заглушки, читається як вміст сторінки й позначається. Це правило цієї навички.",
      "Tekst stanu serwowany w HTML, taki jak komunikaty ładowania i teksty zastępcze, jest czytany jako treść strony i oznaczany. To reguła tej umiejętności.",
    ),
  },
  spa_shell: {
    t: ["Empty app shell", "Порожня оболонка застосунку", "Pusta powłoka aplikacji"],
    d: [
      "The HTML as served is an empty application shell; the text arrives only after JavaScript runs. Any reader that does not run scripts finds an almost empty page.",
      "HTML у тому вигляді, як його віддає сервер, — порожня оболонка застосунку; текст з’являється лише після виконання JavaScript. Будь-який читач, що не виконує скриптів, бачить майже порожню сторінку.",
      "HTML w postaci serwowanej to pusta powłoka aplikacji; tekst pojawia się dopiero po uruchomieniu JavaScriptu. Każdy czytnik, który nie uruchamia skryptów, widzi prawie pustą stronę.",
    ],
    x: [
      "Use SSR, SSG or prerendering for public routes; view-source must hold the text.",
      "Використайте SSR, SSG чи попередній рендер для публічних маршрутів; view-source має містити текст.",
      "Użyj SSR, SSG lub prerenderingu dla publicznych tras; view-source musi zawierać tekst.",
    ],
    r: Q("gJs", "Crawling a URL and parsing the HTML response works well for classical websites or server-side rendered pages where the HTML in the HTTP response contains all content."),
  },
  h1_glued_words: {
    t: ["Heading words glued", "Слова заголовка злиплися", "Sklejone słowa nagłówka"],
    d: [
      "Two words of the main heading run together in the page's text, because the space between them exists only in the styling. Machines read the joined word, which means nothing.",
      "Два слова головного заголовка злипаються в тексті сторінки, бо пробіл між ними існує лише в стилях. Машини читають злите слово, яке нічого не означає.",
      "Dwa słowa głównego nagłówka zlewają się w tekście strony, bo odstęp między nimi istnieje tylko w stylach. Maszyny czytają sklejone słowo, które nic nie znaczy.",
    ],
    x: [
      "Insert a literal space or separator between the inline elements of the h1; CSS display:block adds no whitespace to textContent.",
      "Вставте справжній пробіл чи роздільник між вбудованими елементами h1; CSS display:block не додає пробілів у textContent.",
      "Wstaw dosłowną spację lub separator między elementami inline w h1; CSS display:block nie dodaje białych znaków do textContent.",
    ],
    r: Q("dom", "The descendant text content of a node node is the concatenation of the data of all the Text node descendants of node, in tree order."),
  },
  nav_in_content: {
    t: ["Menu lines inside the text", "Рядки меню всередині тексту", "Wiersze menu w tekście"],
    d: [
      "A run of short, menu-like lines sits inside the main text. AI readers keep it as content, and it breaks up the passage around it.",
      "Низка коротких рядків, схожих на меню, стоїть усередині основного тексту. ШІ-читачі зберігають її як вміст, і вона розриває уривок навколо себе.",
      "Ciąg krótkich wierszy przypominających menu znajduje się w głównym tekście. Czytniki AI zachowują go jako treść, a on rozbija otaczający fragment.",
    ],
    x: [
      "Wrap link lists in <nav> (or <aside>) outside the main text flow.",
      "Обгорніть списки посилань у <nav> (або <aside>) поза основним потоком тексту.",
      "Opakuj listy linków w <nav> (lub <aside>) poza głównym przepływem tekstu.",
    ],
    r: Q("nav", "The nav element represents a section of a page that links to other pages or to parts within the page: a section with navigation links."),
  },
  dominant_heading: {
    t: ["One section holds much of the page", "Один розділ тримає більшу частину сторінки", "Jedna sekcja zajmuje dużą część strony"],
    d: [
      "One section holds a large share of the page's passages. They all carry the same heading, so a machine cannot tell them apart by topic.",
      "Один розділ тримає значну частку уривків сторінки. Усі вони мають той самий заголовок, тож машина не може розрізнити їх за темою.",
      "Jedna sekcja zawiera dużą część fragmentów strony. Wszystkie mają ten sam nagłówek, więc maszyna nie odróżni ich po temacie.",
    ],
    x: [
      "Split the section with descriptive h2 or h3 subheadings.",
      "Розбийте розділ описовими підзаголовками h2 чи h3.",
      "Podziel sekcję opisowymi śródtytułami h2 lub h3.",
    ],
    r: S(
      "On a page of four or more passages, one h2 section holding more than 30% of them is flagged. This is this skill's rule (the Vectorscope reading).",
      "На сторінці з чотирма чи більше уривками розділ h2, що тримає понад 30% із них, позначається. Це правило цієї навички (читання Vectorscope).",
      "Na stronie z czterema lub więcej fragmentami jedna sekcja h2 zawierająca ponad 30% z nich jest oznaczana. To reguła tej umiejętności (odczyt Vectorscope).",
    ),
  },
  thin_section: {
    t: ["Very short sections", "Надто короткі розділи", "Bardzo krótkie sekcje"],
    d: [
      "Some sections have a heading and almost no text. They promise a topic and give a reader, or an AI, nothing to quote about it.",
      "Деякі розділи мають заголовок і майже не мають тексту. Вони обіцяють тему й не дають читачеві чи ШІ нічого для цитати про неї.",
      "Niektóre sekcje mają nagłówek i prawie żadnego tekstu. Obiecują temat i nie dają czytelnikowi ani AI nic do zacytowania.",
    ],
    x: [
      "Expand the section with substance, or merge it into a neighbouring one.",
      "Наповніть розділ змістом або об’єднайте із сусіднім.",
      "Rozbuduj sekcję o konkretną treść albo połącz ją z sąsiednią.",
    ],
    r: S(
      "An h2 section with fewer than 150 characters of text is flagged. This is this skill's rule (the Vectorscope reading).",
      "Розділ h2, що має менше ніж 150 символів тексту, позначається. Це правило цієї навички (читання Vectorscope).",
      "Sekcja h2 z mniej niż 150 znakami tekstu jest oznaczana. To reguła tej umiejętności (odczyt Vectorscope).",
    ),
  },

  // ── Languages ────────────────────────────────────────────────────────────────
  hreflang_no_return: {
    t: ["Language version without a link back", "Мовна версія без зворотного посилання", "Wersja językowa bez linku zwrotnego"],
    d: [
      "A language version this page points to does not point back to it. Search engines ignore a language pair that is not confirmed from both sides, so they may show the wrong language.",
      "Мовна версія, на яку вказує ця сторінка, не вказує назад на неї. Пошукові системи ігнорують мовну пару, не підтверджену з обох боків, тож можуть показати не ту мову.",
      "Wersja językowa, na którą wskazuje ta strona, nie wskazuje z powrotem na nią. Wyszukiwarki ignorują parę językową niepotwierdzoną z obu stron, więc mogą pokazać niewłaściwy język.",
    ],
    x: [
      "Emit the same complete hreflang set, self included, on every alternate.",
      "Виводьте той самий повний набір hreflang, разом із самою сторінкою, на кожній мовній версії.",
      "Wysyłaj ten sam pełny zestaw hreflang, łącznie z samą stroną, w każdej wersji.",
    ],
    r: Q("gHreflang", "If two pages don't both point to each other, the tags will be ignored."),
  },
  hreflang_invalid_code: {
    t: ["Invalid hreflang code", "Хибний код hreflang", "Nieprawidłowy kod hreflang"],
    d: [
      "A hreflang value is not a valid language code. Search engines skip the version it names.",
      "Значення hreflang не є коректним кодом мови. Пошукові системи пропускають версію, яку воно називає.",
      "Wartość hreflang nie jest prawidłowym kodem języka. Wyszukiwarki pomijają wersję, którą wskazuje.",
    ],
    x: [
      "Use an ISO 639-1 language code, optionally with an ISO 3166-1 alpha-2 region (en, en-GB), or x-default.",
      "Використовуйте код мови ISO 639-1, за потреби з регіоном ISO 3166-1 alpha-2 (en, en-GB), або x-default.",
      "Użyj kodu języka ISO 639-1, opcjonalnie z regionem ISO 3166-1 alpha-2 (en, en-GB), albo x-default.",
    ],
    r: Q("gHreflang", "Only language codes listed in ISO 639-1 and region codes listed in ISO 3166-1 Alpha 2 are supported"),
  },
  hreflang_no_self: {
    t: ["hreflang leaves this page out", "hreflang без цієї сторінки", "hreflang pomija tę stronę"],
    d: [
      "The page's hreflang list leaves out the page itself. The set is incomplete, and search engines may not pair the versions correctly.",
      "Список hreflang сторінки не містить її самої. Набір неповний, і пошукові системи можуть неправильно поєднати версії.",
      "Lista hreflang strony pomija samą stronę. Zestaw jest niepełny, a wyszukiwarki mogą źle sparować wersje.",
    ],
    x: [
      "Add a self-referencing hreflang link with this page's own language code.",
      "Додайте до набору посилання hreflang на саму сторінку з її власним кодом мови.",
      "Dodaj link hreflang wskazujący na samą stronę z jej własnym kodem języka.",
    ],
    r: Q("gHreflang", "Each language version must list itself as well as all other language versions."),
  },
  hreflang_alternate_broken: {
    t: ["A language version answers wrongly", "Мовна версія відповідає з помилкою", "Wersja językowa odpowiada nieprawidłowo"],
    d: [
      "A language version named in hreflang answers with an error, redirects elsewhere or says noindex. Search engines cannot use it as an alternate.",
      "Мовна версія, названа в hreflang, відповідає помилкою, переадресовує деінде або каже noindex. Пошукові системи не можуть використати її як альтернативу.",
      "Wersja językowa wskazana w hreflang odpowiada błędem, przekierowuje gdzie indziej albo ma noindex. Wyszukiwarki nie mogą jej użyć jako wersji alternatywnej.",
    ],
    x: [
      "Point every hreflang href at the final, 200, indexable, canonical URL of that version.",
      "Спрямуйте кожен href у hreflang на кінцеву, зі статусом 200, індексовану й канонічну адресу цієї версії.",
      "Skieruj każdy href hreflang na docelowy, zwracający 200, indeksowalny, kanoniczny URL tej wersji.",
    ],
    r: Q("gHreflang", "The fully-qualified URL for the version of this page for the specified language/region."),
  },
  title_duplicate_locales: {
    t: ["Same title in several languages", "Однаковий title у кількох мовах", "Ten sam title w kilku językach"],
    d: [
      "Several language versions share one title, so in at least one of them the title is not in the page's own language. Results in that language show a heading written in another.",
      "Кілька мовних версій мають один title, тож щонайменше в одній із них title написано не мовою сторінки. Результати цією мовою показують заголовок іншою.",
      "Kilka wersji językowych ma jeden title, więc przynajmniej w jednej z nich title nie jest w języku strony. Wyniki w tym języku pokazują nagłówek napisany w innym.",
    ],
    x: [
      "Translate each version's <title> into its own language.",
      "Перекладіть <title> кожної версії її власною мовою.",
      "Przetłumacz <title> każdej wersji na jej własny język.",
    ],
    r: Q("gMulti", "You can help Google determine the language correctly by using a single language for content and navigation on each page, and by avoiding side-by-side translations."),
  },
  description_duplicate_locales: {
    t: ["Same description in several languages", "Однаковий опис у кількох мовах", "Ten sam opis w kilku językach"],
    d: [
      "Several language versions share one meta description, so at least one of them describes itself in another language. Snippets in that language can show text people cannot read.",
      "Кілька мовних версій мають один meta description, тож щонайменше одна з них описує себе іншою мовою. Сніпети цією мовою можуть показувати текст, який люди не прочитають.",
      "Kilka wersji językowych ma jeden meta description, więc przynajmniej jedna z nich opisuje się w innym języku. Snippety w tym języku mogą pokazywać tekst, którego ludzie nie przeczytają.",
    ],
    x: [
      "Translate each version's meta description into its own language.",
      "Перекладіть meta description кожної версії її власною мовою.",
      "Przetłumacz meta description każdej wersji na jej własny język.",
    ],
    r: Q("gMulti", "You can help Google determine the language correctly by using a single language for content and navigation on each page, and by avoiding side-by-side translations."),
  },
  hreflang_lang_mismatch: {
    t: ["html lang differs from hreflang", "html lang не збігається з hreflang", "html lang różni się od hreflang"],
    d: [
      "The page's html lang names a different language than its hreflang. The two declarations disagree, so a machine cannot be sure which language the page is in.",
      "html lang сторінки називає іншу мову, ніж її hreflang. Два оголошення суперечать одне одному, тож машина не може бути певна, якою мовою сторінка.",
      "html lang strony wskazuje inny język niż jej hreflang. Obie deklaracje się nie zgadzają, więc maszyna nie może być pewna, w jakim języku jest strona.",
    ],
    x: [
      "Make <html lang> carry the same language as the version's hreflang code.",
      "Зробіть так, щоб <html lang> містив ту саму мову, що й код hreflang цієї версії.",
      "Spraw, by <html lang> zawierał ten sam język co kod hreflang danej wersji.",
    ],
    r: Q("i18n", "Always use a language attribute on the html tag to declare the default language of the text in the page."),
  },
  hreflang_no_x_default: {
    t: ["No x-default", "Немає x-default", "Brak x-default"],
    d: [
      "The hreflang set has no x-default, the version for people whose language is not listed. Search engines then choose a fallback themselves.",
      "Набір hreflang не має x-default — версії для людей, чию мову не перелічено. Тоді пошукові системи обирають запасну версію самі.",
      "Zestaw hreflang nie ma x-default, czyli wersji dla osób, których języka nie ma na liście. Wyszukiwarki same wybierają wtedy wersję zapasową.",
    ],
    x: [
      "Add hreflang=x-default pointing at the language chooser or the default version.",
      "Додайте hreflang=x-default, що вказує на вибір мови або версію за замовчуванням.",
      "Dodaj hreflang=x-default wskazujący na stronę wyboru języka lub wersję domyślną.",
    ],
    r: Q("gHreflang", "x-default to match any language not explicitly listed by an hreflang tag on the page"),
  },
  llms_txt_one_language: {
    t: ["llms.txt in one language only", "llms.txt лише однією мовою", "llms.txt tylko w jednym języku"],
    d: [
      "The site's llms.txt points only to pages in one language, though this page has other language versions. Agents that start from llms.txt see the site in one language.",
      "llms.txt сайту вказує лише на сторінки однією мовою, хоча ця сторінка має інші мовні версії. Агенти, що починають з llms.txt, бачать сайт однією мовою.",
      "Plik llms.txt witryny wskazuje tylko strony w jednym języku, choć ta strona ma inne wersje językowe. Agenci, którzy zaczynają od llms.txt, widzą witrynę w jednym języku.",
    ],
    x: [
      "List each language's key pages in llms.txt, or publish one llms.txt per locale and link them.",
      "Перелічіть у llms.txt ключові сторінки кожної мови або опублікуйте окремий llms.txt для кожної локалі й пов’яжіть їх.",
      "Wymień w llms.txt kluczowe strony każdego języka albo opublikuj osobny llms.txt dla każdej wersji językowej i połącz je linkami.",
    ],
    r: S(
      "On a site with several language versions, llms.txt is expected to point to more than one of them. The llms.txt proposal says nothing about languages; this is this skill's rule.",
      "На сайті з кількома мовними версіями llms.txt має вказувати більше ніж на одну з них. Пропозиція llms.txt нічого не каже про мови; це правило цієї навички.",
      "W witrynie z kilkoma wersjami językowymi llms.txt powinien wskazywać więcej niż jedną z nich. Propozycja llms.txt nic nie mówi o językach; to reguła tej umiejętności.",
    ),
  },
  locale_facts_differ: {
    t: ["Language versions state different numbers", "Мовні версії подають різні числа", "Wersje językowe podają różne liczby"],
    d: [
      "Language versions give different numbers in the same section. One of them may be out of date, and an assistant reading one version tells people something the other contradicts.",
      "Мовні версії подають різні числа в тому самому розділі. Одна з них може бути застарілою, і асистент, що читає одну версію, каже людям те, що суперечить іншій.",
      "Wersje językowe podają różne liczby w tej samej sekcji. Jedna z nich może być nieaktualna, a asystent czytający jedną wersję powie ludziom coś, czemu druga przeczy.",
    ],
    x: [
      "Sync the figures across locales from one source (prices, limits, dates); mark intended local differences in the text.",
      "Синхронізуйте числа між локалями з одного джерела (ціни, ліміти, дати); навмисні місцеві відмінності позначайте в тексті.",
      "Synchronizuj liczby między wersjami językowymi z jednego źródła (ceny, limity, daty); zamierzone lokalne różnice zaznacz w tekście.",
    ],
    r: S(
      "The numbers in each h2 section are compared across the language versions, aligned by section order when both have the same number of sections; a number one version has and the other lacks is flagged. This is this skill's rule.",
      "Числа в кожному розділі h2 порівнюють між мовними версіями, вирівнявши за порядком розділів, коли обидві мають однакову кількість розділів; число, яке одна версія має, а інша ні, позначається. Це правило цієї навички.",
      "Liczby w każdej sekcji h2 są porównywane między wersjami językowymi, z dopasowaniem według kolejności sekcji, gdy obie mają tyle samo sekcji; liczba, którą ma jedna wersja, a której brak w drugiej, jest oznaczana. To reguła tej umiejętności.",
    ),
  },
  // ── Response headers, links, anchors, sitemap dates (Lite 2.102) ─────────────
  html_not_compressed: {
    t: ["HTML not compressed", "HTML без стиснення", "HTML bez kompresji"],
    d: [
      "The page's HTML is sent without gzip, Brotli or zstd compression. Every visitor and every crawler downloads several times more bytes than needed before the text is ready.",
      "HTML сторінки надсилається без стиснення gzip, Brotli чи zstd. Кожен відвідувач і кожен краулер завантажує в кілька разів більше байтів, ніж потрібно, перш ніж текст буде готовий.",
      "HTML strony jest wysyłany bez kompresji gzip, Brotli ani zstd. Każdy odwiedzający i każdy crawler pobiera kilka razy więcej bajtów, niż trzeba, zanim tekst będzie gotowy.",
    ],
    x: [
      "Enable Brotli or gzip for text/html on the server or CDN; check Content-Encoding on a request with Accept-Encoding.",
      "Увімкніть Brotli чи gzip для text/html на сервері або CDN; перевірте Content-Encoding у запиті з Accept-Encoding.",
      "Włącz Brotli lub gzip dla text/html na serwerze lub w CDN; sprawdź Content-Encoding w żądaniu z Accept-Encoding.",
    ],
    r: Q("mdnCompression", "For some documents, size reduction of up to 70% lowers the bandwidth capacity needs."),
  },
  html_no_cache_control: {
    t: ["No Cache-Control header", "Немає заголовка Cache-Control", "Brak nagłówka Cache-Control"],
    d: [
      "The HTML answer carries no Cache-Control header. Browsers and caches then guess how long the page may be reused, so repeat visits and crawlers may fetch it more often than needed, or keep an old copy.",
      "Відповідь з HTML не має заголовка Cache-Control. Тоді браузери й кеші вгадують, скільки сторінку можна використовувати повторно, тож повторні візити й краулери можуть завантажувати її частіше, ніж треба, або тримати стару копію.",
      "Odpowiedź HTML nie ma nagłówka Cache-Control. Przeglądarki i pamięci podręczne zgadują wtedy, jak długo można ponownie używać strony, więc przy kolejnych wizytach i przez crawlery może być pobierana częściej, niż trzeba, albo trzymana w starej kopii.",
    ],
    x: [
      "Send an explicit Cache-Control for HTML (for example no-cache, or a short max-age with must-revalidate) plus ETag or Last-Modified.",
      "Надсилайте для HTML явний Cache-Control (наприклад, no-cache або короткий max-age з must-revalidate) разом з ETag чи Last-Modified.",
      "Wysyłaj jawny Cache-Control dla HTML (na przykład no-cache albo krótki max-age z must-revalidate) oraz ETag lub Last-Modified.",
    ],
    r: Q("mdnCache", "The HTTP Cache-Control header holds directives (instructions) in both requests and responses that control caching in browsers and shared caches"),
  },
  security_headers_missing: {
    t: ["Security headers missing", "Бракує заголовків безпеки", "Brak nagłówków bezpieczeństwa"],
    d: [
      "The answer lacks one or more common security headers: framing control, X-Content-Type-Options or Referrer-Policy. This does not hide the page from search; it leaves the browser's protections at their defaults.",
      "Відповідь не має одного чи кількох поширених заголовків безпеки: контролю вбудовування у фрейми, X-Content-Type-Options чи Referrer-Policy. Від пошуку це сторінку не ховає; захист браузера лишається на типових налаштуваннях.",
      "W odpowiedzi brakuje co najmniej jednego z typowych nagłówków bezpieczeństwa: kontroli osadzania w ramkach, X-Content-Type-Options lub Referrer-Policy. Nie ukrywa to strony przed wyszukiwaniem; zostawia zabezpieczenia przeglądarki na ustawieniach domyślnych.",
    ],
    x: [
      "Send Content-Security-Policy: frame-ancestors 'self' (or X-Frame-Options), X-Content-Type-Options: nosniff and a Referrer-Policy such as strict-origin-when-cross-origin.",
      "Надсилайте Content-Security-Policy: frame-ancestors 'self' (або X-Frame-Options), X-Content-Type-Options: nosniff і Referrer-Policy, наприклад strict-origin-when-cross-origin.",
      "Wysyłaj Content-Security-Policy: frame-ancestors 'self' (lub X-Frame-Options), X-Content-Type-Options: nosniff oraz Referrer-Policy, na przykład strict-origin-when-cross-origin.",
    ],
    r: Q("mdnNosniff", "The header allows you to avoid MIME type sniffing by specifying that the MIME types are deliberately configured."),
  },
  html_lang_invalid: {
    t: ["html lang is not a valid tag", "html lang — некоректний тег", "html lang nie jest prawidłowym tagiem"],
    d: [
      "The language declared on <html> is not a valid language tag. Browsers, screen readers, search engines and AI readers cannot use it, so the page is as good as undeclared.",
      "Мова, оголошена в <html>, не є коректним мовним тегом. Браузери, зчитувачі екрана, пошукові системи й ШІ-читачі не можуть ним скористатися, тож сторінка фактично без оголошеної мови.",
      "Język zadeklarowany w <html> nie jest prawidłowym tagiem języka. Przeglądarki, czytniki ekranu, wyszukiwarki i czytniki AI nie mogą go użyć, więc strona jest jak bez deklaracji.",
    ],
    x: [
      'Use a BCP 47 tag from the IANA subtag registry (en, uk, es-MX, pt-BR); no underscores, no language names.',
      'Використовуйте тег BCP 47 з реєстру IANA (en, uk, es-MX, pt-BR); без підкреслень і без назв мов.',
      "Użyj tagu BCP 47 z rejestru podtagów IANA (en, uk, es-MX, pt-BR); bez podkreśleń i bez nazw języków.",
    ],
    r: Q("i18n", "Use language tags from the IANA Language Subtag Registry"),
  },
  link_text_generic: {
    t: ["Links that say only “click here”", "Посилання лише з «натисніть тут»", "Linki z samym „kliknij tutaj”"],
    d: [
      "Some links say only “click here”, “read more” or the like. Out of context such text says nothing about where the link goes, to people scanning the page or to search engines reading it.",
      "Деякі посилання кажуть лише «натисніть тут», «докладніше» тощо. Поза контекстом такий текст нічого не каже про те, куди веде посилання, ні людям, що переглядають сторінку, ні пошуковим системам.",
      "Niektóre linki mówią tylko „kliknij tutaj”, „czytaj więcej” lub coś podobnego. Poza kontekstem taki tekst nic nie mówi o tym, dokąd prowadzi link, ani ludziom przeglądającym stronę, ani wyszukiwarkom, które ją czytają.",
    ],
    x: [
      "Rewrite the anchor text to name the target (“pricing for teams”, not “click here”); keep an aria-label in step with visible text.",
      "Перепишіть текст посилання так, щоб він називав ціль («ціни для команд», а не «натисніть тут»); aria-label тримайте узгодженим із видимим текстом.",
      "Przepisz tekst kotwicy tak, by nazywał cel („cennik dla zespołów”, a nie „kliknij tutaj”); aria-label utrzymuj zgodny z widocznym tekstem.",
    ],
    r: Q("gLinks", "Good anchor text is descriptive, reasonably concise, and relevant to the page that it's on and to the page it links to."),
  },
  image_link_alt_empty: {
    t: ["Image links with no text", "Посилання-зображення без тексту", "Linki obrazkowe bez tekstu"],
    d: [
      "Some links hold only an image whose alt is empty. Such a link has no name at all: a screen reader announces nothing useful, and a crawler learns nothing about the page it points to.",
      "Деякі посилання містять лише зображення з порожнім alt. Таке посилання не має жодної назви: зчитувач екрана не озвучує нічого корисного, а краулер нічого не дізнається про сторінку, на яку воно веде.",
      "Niektóre linki zawierają tylko obraz z pustym alt. Taki link nie ma żadnej nazwy: czytnik ekranu nie ogłasza nic przydatnego, a crawler nie dowiaduje się niczego o stronie, na którą wskazuje.",
    ],
    x: [
      "Give the image an alt that names the link's target, or add visible text or an aria-label to the <a>.",
      "Дайте зображенню alt, що називає ціль посилання, або додайте до <a> видимий текст чи aria-label.",
      "Nadaj obrazowi alt nazywający cel linku albo dodaj do <a> widoczny tekst lub aria-label.",
    ],
    r: Q("wcagH30", "When an image is the only content of a link, the text alternative for the image describes the unique function of the link."),
  },
  image_alt_repeated: {
    t: ["The same alt on many images", "Однаковий alt у багатьох зображень", "Ten sam alt na wielu obrazach"],
    d: [
      "Three or more different images share the same alt text. The alt then describes none of them in particular, and search engines get one label for several different pictures.",
      "Три чи більше різних зображень мають однаковий alt-текст. Тоді alt не описує жодного з них окремо, а пошукові системи отримують одну назву для кількох різних картинок.",
      "Trzy lub więcej różnych obrazów ma ten sam tekst alt. Alt nie opisuje wtedy żadnego z nich w szczególności, a wyszukiwarki dostają jedną etykietę dla kilku różnych obrazów.",
    ],
    x: [
      'Write an alt per image saying what that image shows; use alt="" for the purely decorative ones.',
      'Напишіть alt для кожного зображення про те, що саме воно показує; для суто декоративних — alt="".',
      "Napisz alt dla każdego obrazu o tym, co ten obraz pokazuje; dla czysto dekoracyjnych użyj alt=\"\".",
    ],
    r: S(
      "Three or more different images with the same alt text are flagged: an alt is meant to describe its own image. This is this skill's rule.",
      "Три чи більше різних зображень з однаковим alt-текстом позначаються: alt має описувати своє зображення. Це правило цієї навички.",
      "Trzy lub więcej różnych obrazów z tym samym tekstem alt jest oznaczanych: alt ma opisywać własny obraz. To reguła tej umiejętności.",
    ),
  },
  internal_nofollow: {
    t: ["Internal links marked nofollow", "Внутрішні посилання з nofollow", "Linki wewnętrzne oznaczone nofollow"],
    d: [
      "Links to other pages of the same site carry rel=nofollow. The site tells crawlers not to follow its own links, so those pages are found less easily.",
      "Посилання на інші сторінки того самого сайту мають rel=nofollow. Сайт просить краулерів не переходити за власними посиланнями, тож ці сторінки знаходять важче.",
      "Linki do innych stron tej samej witryny mają rel=nofollow. Witryna mówi crawlerom, by nie podążały za jej własnymi linkami, więc te strony trudniej znaleźć.",
    ],
    x: [
      "Drop rel=nofollow from internal links (keep it for user-generated or paid links, as rel=ugc or rel=sponsored).",
      "Приберіть rel=nofollow із внутрішніх посилань (лишіть для посилань від користувачів чи платних, як rel=ugc або rel=sponsored).",
      "Usuń rel=nofollow z linków wewnętrznych (zostaw je dla linków od użytkowników lub płatnych, jako rel=ugc lub rel=sponsored).",
    ],
    r: S(
      "A link to another page of the same site carries no nofollow. Search engines treat nofollow as a hint, so this is this skill's rule, not a published one.",
      "Посилання на іншу сторінку того самого сайту не має nofollow. Пошукові системи вважають nofollow підказкою, тож це правило цієї навички, а не опубліковане.",
      "Link do innej strony tej samej witryny nie ma nofollow. Wyszukiwarki traktują nofollow jako wskazówkę, więc to reguła tej umiejętności, a nie opublikowana.",
    ),
  },
  fragment_link_broken: {
    t: ["Links to a spot that does not exist", "Посилання на місце, якого немає", "Linki do miejsca, które nie istnieje"],
    d: [
      "Some links point to a spot on this page (#something) that no element on the page carries. Clicking them goes nowhere, and a table of contents built from them leads readers astray.",
      "Деякі посилання ведуть на місце на цій сторінці (#щось), якого не має жоден елемент сторінки. Клік за ними нікуди не веде, а зміст, побудований з них, збиває читачів.",
      "Niektóre linki wskazują miejsce na tej stronie (#coś), którego nie ma żaden element strony. Kliknięcie w nie nigdzie nie prowadzi, a zbudowany z nich spis treści wprowadza czytelników w błąd.",
    ],
    x: [
      'Give the target an id equal to the fragment, or fix the href; ids are case-sensitive.',
      'Дайте цілі id, рівний фрагменту, або виправте href; id чутливі до регістру.',
      "Nadaj elementowi docelowemu id równe fragmentowi albo popraw href; id rozróżniają wielkość liter.",
    ],
    r: Q("htmlFragment", "If there is an element in the document tree whose root is document and that has an ID equal to fragment, then return the first such element in tree order."),
  },
  robots_no_sitemap: {
    t: ["robots.txt names no sitemap", "robots.txt не називає sitemap", "robots.txt nie wskazuje sitemap"],
    d: [
      "The site's robots.txt has no Sitemap: line. Crawlers then have to guess where the sitemap is, and one at an unusual address may never be read.",
      "robots.txt сайту не має рядка Sitemap:. Тоді краулери мусять вгадувати, де sitemap, а той, що лежить за незвичною адресою, можуть і не прочитати.",
      "Plik robots.txt witryny nie ma wiersza Sitemap:. Crawlery muszą wtedy zgadywać, gdzie jest sitemap, a ta pod nietypowym adresem może nigdy nie zostać przeczytana.",
    ],
    x: [
      "Add “Sitemap: https://<host>/sitemap.xml” (absolute URL) to robots.txt; one line per sitemap or index.",
      "Додайте до robots.txt «Sitemap: https://<host>/sitemap.xml» (абсолютна адреса); по рядку на кожен sitemap чи індекс.",
      "Dodaj do robots.txt „Sitemap: https://<host>/sitemap.xml” (bezwzględny URL); jeden wiersz na każdą sitemap lub indeks.",
    ],
    r: Q("sitemaps", "specifying the location in your site's robots.txt file"),
  },
  sitemap_lastmod_invalid: {
    t: ["Sitemap dates not valid", "Некоректні дати в sitemap", "Nieprawidłowe daty w sitemap"],
    d: [
      "Dates in the sitemap's lastmod are not valid W3C dates, or lie in the future. Search engines that use lastmod to decide what to recrawl then ignore it or are misled by it.",
      "Дати в lastmod sitemap не є коректними датами W3C або стоять у майбутньому. Пошукові системи, що за lastmod вирішують, що переобходити, тоді ігнорують його або помиляються через нього.",
      "Daty w lastmod sitemap nie są prawidłowymi datami W3C albo leżą w przyszłości. Wyszukiwarki, które według lastmod decydują, co ponownie zaindeksować, ignorują go wtedy albo są przez niego wprowadzane w błąd.",
    ],
    x: [
      "Emit lastmod as YYYY-MM-DD or a full ISO 8601 timestamp with timezone, taken from the real modification date; never the generation time.",
      "Виводьте lastmod як YYYY-MM-DD або повну мітку ISO 8601 з часовим поясом, з реальної дати зміни, а не з часу генерації.",
      "Wysyłaj lastmod jako YYYY-MM-DD lub pełny znacznik czasu ISO 8601 ze strefą czasową, z rzeczywistej daty zmiany, nigdy z czasu generowania.",
    ],
    r: Q("sitemaps", "This date should be in W3C Datetime format."),
  },
  og_image_broken: {
    t: ["Preview image does not load", "Зображення прев’ю не завантажується", "Obraz podglądu się nie ładuje"],
    d: [
      "The og:image the page declares does not load. Shared in a chat or a social network, the page shows no picture, or a broken one.",
      "og:image, яке оголошує сторінка, не завантажується. Коли сторінкою діляться в чаті чи соцмережі, вона не показує картинки або показує зламану.",
      "og:image zadeklarowany przez stronę się nie ładuje. Udostępniona na czacie lub w sieci społecznościowej strona nie pokazuje obrazka albo pokazuje uszkodzony.",
    ],
    x: [
      "Point og:image at an absolute https URL that answers 200 with an image type (1200×630 is the common size).",
      "Спрямуйте og:image на абсолютну https-адресу, що відповідає 200 із типом зображення (поширений розмір — 1200×630).",
      "Skieruj og:image na bezwzględny adres https, który odpowiada 200 z typem obrazu (typowy rozmiar to 1200×630).",
    ],
    r: Q("ogp", "An image URL which should represent your object within the graph."),
  },
};

/** The words for one code; throws for a code nobody described, so a new code cannot ship bare. */
export function explain(code) {
  const e = EXPLAIN[code];
  if (!e) throw new Error(`no explanation for ${code}`);
  return e;
}

/**
 * Fold text the way the quote check compares it: HTML entities decoded, curly quotes and
 * apostrophes made straight, dashes kept, whitespace collapsed, and no space before punctuation
 * or inside brackets (stripping tags leaves "element ." and "( <h1> )" behind).
 */
export function foldQuoteText(s) {
  return String(s ?? "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&#39;|&#x27;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;|&#34;/g, '"')
    .replace(/&mdash;|&#8212;/g, "—")
    .replace(/&ndash;|&#8211;/g, "–")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?)\]])/g, "$1")
    .replace(/([(\[])\s+/g, "$1")
    .trim();
}
