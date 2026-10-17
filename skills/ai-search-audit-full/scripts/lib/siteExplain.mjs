// The words for the site-wide checks (siteChecks.mjs), with the same three layers as explain.mjs:
// a plain description with no advice, "What the rule says" (a verified quote, or this skill's
// rule, which for these Full-only checks carries no link), and the fix direction for specialists.

import { RULES_CHECKED } from "./explain.mjs";

const Q = (src, quote) => ({ kind: "quote", src, quote, checked: RULES_CHECKED });
const S = (en, uk) => ({ kind: "skill", text: [en, uk], fullOnly: true });

export const SITE_EXPLAIN = {
  site_title_duplicate: {
    t: ["The same title on several pages", "Однаковий title на кількох сторінках"],
    d: [
      "Several audited pages in the same language share one title. In results they look like the same page, and search engines have to guess which one answers a query.",
      "Кілька перевірених сторінок однією мовою мають один title. У результатах вони виглядають як та сама сторінка, і пошуковим системам доводиться вгадувати, яка з них відповідає на запит.",
    ],
    x: ["Give each page a title that names what that page alone covers; template the brand suffix, not the topic.", "Дайте кожній сторінці title, що називає саме її тему; у шаблон виносьте суфікс бренду, а не тему."],
    r: Q("gStarter", "a good title is unique to the page, clear and concise, and accurately describes the contents of the page."),
  },
  site_description_duplicate: {
    t: ["The same description on several pages", "Однаковий опис на кількох сторінках"],
    d: [
      "Several audited pages in the same language share one meta description. Their snippets say the same thing, so a searcher cannot tell the pages apart.",
      "Кілька перевірених сторінок однією мовою мають один meta description. Їхні сніпети кажуть те саме, тож людина не може розрізнити ці сторінки.",
    ],
    x: ["Write a description per page from its own content; never a site-wide default.", "Пишіть опис для кожної сторінки з її власного вмісту; ніколи не загальний для сайту."],
    r: Q("gSnippet", "Identical or similar descriptions on every page of a site aren't helpful when individual pages appear in search results."),
  },
  site_h1_duplicate: {
    t: ["The same h1 on several pages", "Однаковий h1 на кількох сторінках"],
    d: [
      "Several audited pages in the same language share one main heading. Each claims the same topic, so readers and machines cannot tell what sets them apart.",
      "Кілька перевірених сторінок однією мовою мають той самий головний заголовок. Кожна заявляє ту саму тему, тож читачі й машини не бачать, чим вони відрізняються.",
    ],
    x: ["Make each h1 name that page's own subject.", "Зробіть так, щоб кожен h1 називав власний предмет своєї сторінки."],
    r: S(
      "Pages in the same language each name their own main topic in the h1, so two audited pages with the same h1 are flagged. This is this skill's rule.",
      "Сторінки однією мовою називають у h1 кожна свою головну тему, тож дві перевірені сторінки з однаковим h1 позначаються. Це правило цієї навички.",
    ),
  },
  site_orphan_page: {
    t: ["Pages no other audited page links to", "Сторінки, на які не посилається жодна інша перевірена"],
    d: [
      "No other page in this audit links to these pages. Crawlers find pages by following links, so a page reached by no link depends on the sitemap alone. Only the audited pages were looked at: a page outside the set may still link to it.",
      "Жодна інша сторінка цього аудиту не посилається на ці сторінки. Краулери знаходять сторінки за посиланнями, тож сторінка, до якої не веде жодне посилання, залежить лише від sitemap. Розглянуто лише перевірені сторінки: сторінка поза набором ще може на неї посилатися.",
    ],
    x: ["Link the page from its parent section, navigation or related pages with a crawlable <a href>.", "Додайте посилання на сторінку з її батьківського розділу, навігації чи пов’язаних сторінок через придатний для обходу <a href>."],
    r: Q("gLinks", "so that Google can find other pages on your site via the links on your page"),
  },
  site_link_depth: {
    t: ["Pages far from the home page", "Сторінки далеко від головної"],
    d: [
      "Following links from the home page, these pages take more than three clicks to reach, or cannot be reached at all, within the audited pages. Pages deep in a site are found and revisited less often.",
      "Якщо йти за посиланнями від головної, до цих сторінок у межах перевірених сторінок потрібно понад три кліки або до них не дістатися зовсім. Глибокі сторінки сайту знаходять і переобходять рідше.",
    ],
    x: ["Link key pages from the home page or a hub page; flatten the navigation to three clicks or fewer.", "Додайте посилання на ключові сторінки з головної чи сторінки-хаба; сплющте навігацію до трьох кліків або менше."],
    r: S(
      "Within the audited pages, a page more than three clicks from the home page, or unreachable from it, is flagged; the home page must be in the set. This is this skill's rule.",
      "У межах перевірених сторінок сторінка, що за понад три кліки від головної або недосяжна з неї, позначається; головна має бути в наборі. Це правило цієї навички.",
    ),
  },
  site_hreflang_not_reciprocal: {
    t: ["Language pairs not confirmed both ways", "Мовні пари не підтверджені з обох боків"],
    d: [
      "Among the audited pages, one names another as its language version and the other does not name it back. Search engines ignore such a pair, so they may show the wrong language.",
      "Серед перевірених сторінок одна називає іншу своєю мовною версією, а та не називає її у відповідь. Пошукові системи ігнорують таку пару, тож можуть показати не ту мову.",
    ],
    x: ["Emit the identical full hreflang set, self included, on every version.", "Виводьте ідентичний повний набір hreflang, разом із самою сторінкою, на кожній версії."],
    r: Q("gHreflang", "If two pages don't both point to each other, the tags will be ignored."),
  },
  site_canonical_chain: {
    t: ["Canonicals that lead on to another page", "Canonical, що веде далі на іншу сторінку"],
    d: [
      "A page's canonical names another audited page, whose own canonical names a third address. The chain leaves search engines to pick the end themselves, and the first page's hint can be ignored.",
      "Canonical сторінки називає іншу перевірену сторінку, чий власний canonical називає третю адресу. Ланцюжок змушує пошукові системи самостійно обирати кінець, і підказку першої сторінки можуть проігнорувати.",
    ],
    x: ["Point every canonical straight at the final canonical URL, which must name itself.", "Спрямуйте кожен canonical одразу на кінцеву канонічну адресу, яка має називати саму себе."],
    r: S(
      "A canonical points at a page that names itself as canonical, so a canonical leading to an audited page whose own canonical leads elsewhere is flagged. This is this skill's rule.",
      "Canonical вказує на сторінку, що називає канонічною саму себе, тож canonical, який веде на перевірену сторінку з canonical деінде, позначається. Це правило цієї навички.",
    ),
  },
  site_internal_redirect: {
    t: ["Internal links that go through a redirect", "Внутрішні посилання через переадресацію"],
    d: [
      "Some links between the audited pages reach their page only after a redirect. Every such click and crawl costs an extra request, and the link points at an address that is not the page's own.",
      "Деякі посилання між перевіреними сторінками досягають своєї сторінки лише після переадресації. Кожен такий клік і обхід коштує зайвого запиту, а посилання вказує на адресу, яка не є власною адресою сторінки.",
    ],
    x: ["Update the hrefs to the final URL of each target.", "Оновіть href на кінцеву адресу кожної цілі."],
    r: S(
      "A link between audited pages points at the target's final address, so one that lands there only after a redirect is flagged; only the links each page's check followed (30 per page) are seen. This is this skill's rule.",
      "Посилання між перевіреними сторінками вказує на кінцеву адресу цілі, тож те, що потрапляє туди лише після переадресації, позначається; видно лише посилання, які перевірка кожної сторінки пройшла (30 на сторінку). Це правило цієї навички.",
    ),
  },
  site_thin_page: {
    t: ["Pages much shorter than the rest", "Сторінки набагато коротші за решту"],
    d: [
      "These pages have far fewer words than the typical audited page of the site. They may say too little to answer the questions their titles raise.",
      "Ці сторінки мають набагато менше слів, ніж типова перевірена сторінка сайту. Вони можуть казати надто мало, щоб відповісти на запитання, які ставлять їхні заголовки.",
    ],
    x: ["Expand with substance, merge into a related page, or keep it out of the index if it is a stub.", "Наповніть змістом, об’єднайте з пов’язаною сторінкою або виключіть з індексу, якщо це заглушка."],
    r: S(
      "With four or more audited pages, a page under 30% of their median word count is flagged. This is this skill's rule.",
      "Коли перевірених сторінок чотири чи більше, сторінка з менше ніж 30% від їхньої медіанної кількості слів позначається. Це правило цієї навички.",
    ),
  },
};
