[English](README.md) · Українська · [Polski](README.pl.md)

# AI Search Audit Full

AI Search Audit Full **2.111** — навичка (Agent Skill) від [GetLoopLoop](https://www.getlooploop.com) для claude.ai і застосунку Claude, Claude Code, Codex, opencode, Hermes Agent та інших агентів, що завантажують навички `SKILL.md`. Версії рахуються в тисячних (2.101, 2.102, …).

Перш ніж Google, Bing чи ШІ-асистент покажуть або процитують сторінку, краулер має отримати дозвіл, сторінка має сказати, що вона таке, а текст має пережити машинне читання. `ai-search-audit-full` перевіряє публічні сторінки за опублікованими правилами для всіх трьох, додає три прочитання, які може зробити лише ШІ (запитання людей, як модель агента описує бренд і що вона вважає про його відгуки), і пояснює кожну знайдену проблему: що не так і чому це важливо, що каже правило словами самого джерела і, для фахівців, у який бік іде виправлення. Навичка перевіряє одну сторінку або до 50 сторінок сайту, порівнює запуск зі старішим і зберігає локальну історію, тож кожен звіт показує, що змінилося від попереднього запуску. Унизу кожного звіту сторінки блок *Наскільки текст звучить як згенерований* ставить поруч бал шаблонності, слова, які мовні моделі вживають надміру, і тест підміни від агента. Звіти можна читати англійською, українською або польською.

Це версія Full. Вона побудована на публічній [Lite](https://github.com/Olexan-art/ai-search-audit) (2.110) і виконує всі перевірки Lite.

![Звіт сторінки з прикладу: головний висновок, що це означає для вас, знахідки, які варто переглянути першими, і де вони на сторінці](docs/ai-search-audit-full-light-1280.png)

## Що Full додає до Lite

| | Lite | Full |
|---|---|---|
| Кожна проблема | коротка назва, серйозність, місце | плюс **Що не так**: простий опис для джунів і менеджерів, без порад |
| Правило | лише в експорті | **Що каже правило**: коротка дослівна цитата з офіційного джерела з посиланням і датою перевірки або «Правило цієї навички», де ніхто такого не публікує (83 цитати, кожну звірено слово в слово з живими сторінками 17 жовтня 2026) |
| Виправлення | немає | **напрям виправлення**, технічний і стислий, лише в згорнутих «Подробицях для фахівців» кожної проблеми |
| Сторінки | одна | **до 50 на сайт**, зі списку адрес або sitemap, по одній і з дотриманням robots.txt; ліміт показано як «перевірено / знайдено», з кожною пропущеною сторінкою й причиною |
| Сайт | — | **звіт сайту**: сторінки × проблеми, проблеми, що повторюються, згруповані як «на N сторінках», і перевірки, можливі лише на наборі сторінок (однакові title, описи й h1, сторінки-сироти, глибина посилань, пари hreflang, ланцюжки canonical, внутрішні посилання через переадресацію, надто короткі сторінки) |
| До і після | — | `--compare old-export.json`: виправлені, нові й незмінні знахідки для кожної сторінки |
| Наскільки текст звучить як згенерований | той самий блок | той самий блок на кожній сторінці сайту, тест підміни з `style/<сторінка>.json` |
| Історія | — | кожен запуск зберігається знімком у власній теці користувача, яку не скидають ні новий чат, ні нова тека, ні нова версія скіла, і переноситься всередині кожного звіту; **часова шкала** кожної сторінки, **що змінилося від попереднього запуску** (title, опис, canonical, h1, слова, типи schema, robots.txt і кожен бот, hreflang, уривки нові, втрачені й змінені, проблеми виправлені, нові й без змін) і **усі аудити в історії**, по рядку на адресу, будь-яка сторінка й будь-який сайт |

У звіті кожна знахідка в розділі *Спочатку перегляньте ці знахідки* й в обраному місці розгортається до простого опису й того, що каже правило; історія та «до і після» йдуть після розділу *Де на сторінці це знайдено*; напрями виправлення — у подробицях для фахівців кожної проблеми, усередині *Усі перевірки та технічні подробиці*.

Усе лишається локальним: жодного сервера, жодного вивантаження. Скрипти не викликають жодної моделі; частини із судженнями пише агент, що виконує навичку, і вони позначені його моделлю.

**Карта відповідей** зводить питання, які ставлять люди, в одну таблицю: чи відповідає на кожне сторінка, якість зі 100 (фіксована сума: повна чи часткова відповідь, чи цитується окремо, чи стоїть на початку уривка), чого бракує, і «додати спершу» на трьох найслабших.

![Карта відповідей: кожне питання, чи відповідає на нього сторінка, якість і чого бракує](docs/ai-search-audit-full-answers-1280.png)

*Де на сторінці* має **тепло**: кожна зона залита за вагою своїх знахідок (блокувальна 8, висока 4, середня 2, низька 1) відносно найгарячішої зони; сітка «сторінки × проблеми» у звіті сайту залита так само, з рядком тепла сторінок під нею.

![Де на сторінці: кожна зона залита за вагою своїх знахідок](docs/ai-search-audit-full-heat-1280.png)

![Історія сторінки: два запуски, що змінилося між ними, і всі аудити в історії](docs/ai-search-audit-full-history-1280.png)

Наскільки текст звучить як згенерований — унизу кожного звіту сторінки: бал шаблонності, слова-маркери, тест підміни й кожен уривок із доказами. Це не детектор авторства, і блок так і каже:

![Наскільки текст звучить як згенерований](docs/ai-search-audit-full-generated-1280.png)

Звіт сайту:

![Звіт сайту з прикладу](docs/ai-search-audit-full-site-1280.png)

Кожен звіт відкривається у світлій темі, темна вмикається перемикачем; мови звіту — англійська, українська й польська.

## Приклади

Справжні запуски в [`examples/`](examples): сторінки прочитано 17 жовтня 2026 і повторно перевірено 18 жовтня версією 2.109, яка додала *Наскільки текст звучить як згенерований* (бал 1, 2 і 0 зі 100, жодного слова-маркера, а шаблонних уривків 4 із 17, 4 із 17 і 5 із 18 на трьох сторінках). Файли суджень у [`examples/judgement/`](examples/judgement) написав Claude Code з моделлю Claude Opus 5.5, яка не знала GetLoopLoop із власних знань і так і сказала; жодної моделі продукту не викликали.

- **Аудит трьох сторінок** getlooploop.com: [звіт сайту](examples/getlooploop-site/report/index.html) і його сторінки, [/vectorscope](examples/getlooploop-site/report/pages/getlooploop-com-vectorscope.html) (19 проблем: 0 блокувальних · 0 високих · 7 середніх · 12 низьких), [/uk/vectorscope](examples/getlooploop-site/report/pages/getlooploop-com-uk-vectorscope.html) (21: 0 · 0 · 8 · 13) і [/es/vectorscope](examples/getlooploop-site/report/pages/getlooploop-com-es-vectorscope.html) (18: 0 · 0 · 7 · 11). 15 проблем повторюються на сторінках; на рівні сайту жодна перевірена сторінка не посилається на іншу.
- **Два знімки історії для кожної сторінки** в [`examples/history/`](examples/history), тож зміни видно. Перший запуск /vectorscope і /uk/vectorscope прочитав копії цих сторінок, збережені 16 жовтня 2026 ([`examples/first-run/`](examples/first-run), з перевірками сайту наживо, позначено «збережена копія»); другий прочитав їх наживо. На кожній змінився один уривок, і звіт показує, де саме. /es/vectorscope прочитано наживо двічі з різницею в кілька хвилин: без змін.
- **До і після**: [/vectorscope проти експорту Lite 2.101](examples/compare/vectorscope-compare.html) тієї самої сторінки, зробленого раніше того самого дня: виправлено 0, нова 1 (перевірка заголовків безпеки, яку додала Lite 2.102), без змін 18.

Звіти відкриваються англійською; додайте `#lang=uk` для української або `#lang=pl` для польської.

## Встановлення

Потрібен Node 20.18 або новіший і **жодного `npm install`**: `dist/read.mjs` і `dist/audit.mjs` уже містять усе потрібне.

### claude.ai і застосунок Claude

1. Завантажте **`ai-search-audit-full.zip`** з [Releases](https://github.com/Olexan-art/ai-search-audit-full/releases) цього репозиторію або `gh release download v2.110 -R Olexan-art/ai-search-audit-full`. **Не розпаковуйте**: завантаження приймає zip із текою `ai-search-audit-full` на верхньому рівні.
2. Увімкніть виконання коду: **Settings > Capabilities > Code execution and file creation**. На планах Team і Enterprise це вмикає власник в Organization settings > Capabilities.
3. Завантажте навичку: **Customize > Skills**, **+**, **Create skill**, **Upload a skill**, оберіть `ai-search-audit-full.zip` і ввімкніть навичку.
4. Дозвольте пісочниці доступ до сайту: **Allow network egress** (Free, Pro, Max) або список доменів власника на Team і Enterprise. Аудит сайту робить ті самі запити, що й аудит сторінки, для кожної сторінки.
5. Попросіть: **«аудит для ШІ-пошуку https://example.com/page»** або **«перевір ці сторінки мого сайту: …»**. Claude виконає скрипти й дасть вам `report.html` (для сайту — теку звіту zip-архівом, де початок — `index.html`).

Lite і Full мають різні назви (`ai-search-audit`, `ai-search-audit-full`), тож їх можна встановити поруч.

### Claude Code, Codex, opencode, Hermes Agent

```
gh repo clone Olexan-art/ai-search-audit-full
```

Скопіюйте `skills/ai-search-audit-full` у теку навичок свого агента:

| Агент | Особисто | Для проєкту |
|---|---|---|
| Claude Code | `~/.claude/skills/ai-search-audit-full` | `.claude/skills/ai-search-audit-full` |
| Codex | `~/.agents/skills/ai-search-audit-full` | `.agents/skills/ai-search-audit-full` |
| opencode | `~/.config/opencode/skills/ai-search-audit-full` (або теки Claude чи Codex) | `.opencode/skills/ai-search-audit-full` |
| Hermes Agent | `~/.hermes/skills/ai-search-audit-full` | `.hermes/skills/` після `hermes skills trust` |

```
mkdir -p ~/.claude/skills && cp -r ai-search-audit-full/skills/ai-search-audit-full ~/.claude/skills/
```

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null
Copy-Item -Recurse ai-search-audit-full\skills\ai-search-audit-full "$HOME\.claude\skills\ai-search-audit-full"
```

**Будь-який інший агент:** вкажіть у його файлі інструкцій (наприклад, `AGENTS.md`) на навичку:

```
For an SEO or AI search audit of a web page or a site, follow skills/ai-search-audit-full/SKILL.md and run its scripts from that folder.
```

**GLM** та інші сімейства моделей працюють усередині одного з цих агентів; встановлюйте навичку для того агента.

Джерела: [Use skills in Claude](https://support.claude.com/en/articles/12512180-use-skills-in-claude) · [Claude Code skills](https://code.claude.com/docs/en/skills) · [Codex skills](https://learn.chatgpt.com/docs/build-skills) · [opencode skills](https://opencode.ai/docs/skills) · [Hermes Agent skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills). Перевірено 2026-10-16.

### Агент без інтернету в shell

Хмарні пісочниці часто запускають shell без мережі або не дають писати в теку навичок. Навичці тека навичок не потрібна: розпакуйте `ai-search-audit-full.zip` у будь-яку теку, куди агент може писати, і вкажіть йому цю теку (або прикріпіть zip у чаті). Без мережі збережіть сторінку в браузері як «Веб-сторінка, лише HTML» і, якщо можете, її `robots.txt`, і передайте обидва файли агенту: навичка прочитає збережену копію і позначить кожну перевірку, якій потрібна мережа, як неперевірену.

## Запуск коротко

Одна сторінка:

```
node dist/read.mjs https://example.com/page --out reading.json
# агент пише questions.json, style.json, brand.json і reviews.json (схеми в references/judgement-files.md)
node dist/audit.mjs reading.json --questions questions.json --style style.json --brand brand.json --reviews reviews.json --check
node dist/audit.mjs reading.json --questions questions.json --style style.json --brand brand.json --reviews reviews.json --html report.html --md report.md --json export.json [--compare old-export.json]
```

Сайт (щонайбільше 50 сторінок):

```
node dist/read.mjs --urls urls.txt --out-dir readings          # або: --sitemap https://example.com/sitemap.xml
# агент пише questions/<сторінка>.json і style/<сторінка>.json для кожної сторінки, а brand.json і reviews.json один раз
node dist/audit.mjs --site readings/site.json --questions-dir questions --style-dir style --brand brand.json --reviews reviews.json --out-dir report
```

**Ввічливість:** сторінки читаються по одній, щонайменше з секундною паузою (`--delay`, не менше 500 мс), довшою, коли robots.txt задає `Crawl-delay` (до 10 с), і лише там, де robots.txt дозволяє `GetLoopLoop` (інакше `*`); якщо robots.txt не відповідає, жодна сторінка цього сайту не читається. Запити, що повторюються між сторінками (robots.txt, sitemap, спільні посилання), беруться з пам’яті.

**Історія:** кожен запуск `audit.mjs` зберігає експорт у `~/.ai-search-audit/history/<хост>/<шлях>/<дата>.json` (або в `$AI_SEARCH_AUDIT_HISTORY`; `--history тека` для іншої теки, `--no-history`, щоб не зберігати). Тека належить користувачеві, а не скілу, тож оновлення скіла її не чіпає; теку, яку старіша версія лишила в робочій теці, буде скопійовано. Кожен звіт також несе всю історію, тож там, де диск чату не зберігається (claude.ai, нова пісочниця Cowork), наступний запуск забирає її з попереднього звіту: `--history-from report.html` (або тека зі звітами, експортами чи `site.json`), хоч би про яку сторінку чи сайт був той звіт. Повторний аудит того самого читання перезаписує його знімок. Видаліть теку, щоб видалити історію.

### Власні пороги навички

Пороги Lite діють без змін; їх перелічено в [README Lite](https://github.com/Olexan-art/ai-search-audit#this-skills-own-thresholds). Full додає для сайту: щонайбільше 50 сторінок; сторінка, що за понад 3 кліки від головної в межах перевіреного набору; сторінка, що має менше ніж 30% від медіанної кількості слів перевірених сторінок, від 4 сторінок; перевірки графа посилань від 3 сторінок; останні 20 запусків на часовій шкалі; до 8 уривків у кожен бік у змінах. Кожен поріг — іменована константа в `skills/ai-search-audit-full/scripts/lib/`.

## Чого перевірка не бачить

- **Польових даних та індексу:** Core Web Vitals і «в індексі Google» завжди *не виміряно*.
- **Що асистенти відповідають сьогодні:** прочитання бренду й відгуків — знання однієї моделі, а не вимірювання жодного асистента.
- **Сторінок за логіном, локальних і приватних адрес.**
- **Цілих сайтів:** щонайбільше 50 сторінок; перевірки на рівні сайту бачать лише перевірені сторінки (сторінка-сирота тут може мати посилання зі сторінки поза набором).
- **JavaScript, якщо не попросити** (`--render` або автоматично для порожньої оболонки застосунку, з локальним Chrome).
- **Усього за лімітами:** кожен ліміт названо у звіті.

Живі асистенти, мінливість відповідей, ембединги й Search Console — на [GetLoopLoop](https://www.getlooploop.com).

## Як доручати агентові

Коротке доручення з чіткою умовою зупинки та форматом відповіді тримає агента в межах процедури. Скопіюйте його й підставте свою сторінку:

```markdown
## Task
Run the skill `ai-search-audit-full` on 1 page (or on the pages in urls.txt). Write its report.

## Inputs
- Page: https://example.com/page
- Working folder: ./audit
- Earlier reports (optional): ./old-reports

## Rules
1. Read SKILL.md first. Follow it exactly.
2. Write every file into the working folder.
3. Pass every earlier report with --history-from.

## Stop condition
Stop when report.html exists. Show it.

## Reply format
- The report link or path.
- What changed since the last run, and the 3 biggest problems.
```

## Робота над навичкою

```
cd skills/ai-search-audit-full
npm install          # cheerio і esbuild для збирання
npm run build        # scripts/ → dist/
npm test             # 227 тестів, зокрема що dist дорівнює свіжому збиранню
npm run verify-rules # мережа: кожну цитату правила звірено з живою сторінкою
npm run zip          # dist-release/ai-search-audit-full.zip
```

Щоб узяти новий реліз Lite: застосуйте diff Lite від попереднього на `skills/ai-search-audit-full` (тека перейменована), потім напишіть пояснення для нових кодів; `tests/explain.test.mjs` не пройде, доки їх немає для кожного коду.

## Ліцензія

MIT, як і Lite: див. [LICENSE](LICENSE). Вендорений код Vectorscope зберігає свою ліцензію MIT ([`scripts/vendor/vectorscope/LICENSE`](skills/ai-search-audit-full/scripts/vendor/vectorscope/LICENSE)), а favicon — своє [повідомлення](skills/ai-search-audit-full/assets/favicons/NOTICE.txt).
