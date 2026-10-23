/**
 * Article renderer for a deliberately small Markdown subset:
 *
 *   ## Heading / ### Subheading     paragraphs (blank line between)
 *   - item / * item / 1. item       > quote
 *   **bold**  *italic*  [text](url)  ![alt text](image-url) on its own line
 *
 * Safety model: the input is HTML-escaped first, then only the tags above are produced.
 * URLs are allow-listed (https, mailto, site-relative paths); anything else is dropped.
 * The output therefore cannot contain scripts, event handlers or arbitrary markup, which is
 * why it is safe to inject. Pure function, used for both the public page and the editor preview.
 */

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Takes an already-escaped URL; returns it if allowed, else null. */
function safeUrl(escaped: string, kind: "link" | "image"): string | null {
  const url = escaped.trim();
  if (/^https:\/\/[^\s]+$/i.test(url)) return url;
  if (/^\/(?!\/)[^\s]*$/.test(url)) return url;
  if (kind === "link" && /^mailto:[^\s]+$/i.test(url)) return url;
  return null;
}

function inline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, href: string) => {
      const url = safeUrl(href, "link");
      if (!url) return label;
      const external = url.startsWith("https://");
      return `<a href="${url}"${external ? ' rel="noopener noreferrer nofollow" target="_blank"' : ""}>${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
}

export function renderMarkdown(source: string): string {
  const lines = escapeHtml(source.replace(/\r\n?/g, "\n")).split("\n");
  const out: string[] = [];
  let paragraph: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  let quote: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.type}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) out.push(`<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`);
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    let m: RegExpExecArray | null;

    if (!line.trim()) {
      flushAll();
    } else if ((m = /^(#{2,3})\s+(.+)$/.exec(line))) {
      flushAll();
      const level = m[1].length;
      out.push(`<h${level}>${inline(m[2])}</h${level}>`);
    } else if ((m = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(line.trim()))) {
      flushAll();
      const src = safeUrl(m[2], "image");
      if (src) out.push(`<figure><img src="${src}" alt="${m[1]}" loading="lazy" decoding="async"></figure>`);
    } else if ((m = /^\s*[-*]\s+(.+)$/.exec(line))) {
      flushParagraph();
      flushQuote();
      if (list?.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(m[1]);
    } else if ((m = /^\s*\d+[.)]\s+(.+)$/.exec(line))) {
      flushParagraph();
      flushQuote();
      if (list?.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(m[1]);
    } else if ((m = /^&gt;\s?(.*)$/.exec(line))) {
      flushParagraph();
      flushList();
      quote.push(m[1]);
    } else {
      flushList();
      flushQuote();
      paragraph.push(line.trim());
    }
  }
  flushAll();
  return out.join("\n");
}

/** Plain-text excerpt for meta descriptions and listings. */
export function markdownToText(source: string, max = 160): string {
  const text = source
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
