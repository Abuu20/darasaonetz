// Lesson content is authored as HTML by RichTextEditor and rendered here on
// the student side via dangerouslySetInnerHTML — so this allow-list is a
// real security boundary, not a formatting nicety. Written without an
// external dependency (matching the rest of this codebase — see uuid.ts and
// RichTextEditor.tsx for the same choice) using the browser's native
// DOMParser, so there's nothing extra to `npm install` before this builds.
//
// Approach: parse into a detached document, walk every node, and for each
// element either keep it (allowed tag, attributes filtered) or unwrap it
// (disallowed but harmless tag — keep its text/children) or drop it
// entirely (script/style/iframe/object/embed/etc — content is not safe to
// keep even as text, since e.g. <style> content is CSS not prose).

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "span",
  "ul", "ol", "li", "a", "h1", "h2", "h3", "blockquote",
  "code", "pre", "img",
]);

const ALLOWED_ATTR: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
  img: new Set(["src", "alt", "class"]),
  span: new Set(["class"]),
};

// Tags whose content must be discarded outright, not unwound into plain text.
const DROP_ENTIRELY = new Set([
  "script", "style", "iframe", "object", "embed", "link", "meta",
  "form", "input", "button", "textarea", "select", "svg", "canvas",
  "video", "audio", "noscript",
]);

const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i;

function sanitizeAttributes(el: Element) {
  const allowed = ALLOWED_ATTR[el.tagName.toLowerCase()] ?? new Set<string>();
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (!allowed.has(name)) {
      el.removeAttribute(attr.name);
      continue;
    }
    if ((name === "href" || name === "src") && !SAFE_URL.test(attr.value.trim())) {
      el.removeAttribute(attr.name);
      continue;
    }
  }
  if (el.tagName.toLowerCase() === "a") {
    // Any link opening in a new tab must not be able to control the
    // opener (classic reverse-tabnabbing protection).
    if (el.getAttribute("target") === "_blank") {
      el.setAttribute("rel", "noopener noreferrer");
    }
  }
}

function walk(node: Node) {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) continue;
    if (child.nodeType !== Node.ELEMENT_NODE) {
      child.parentNode?.removeChild(child);
      continue;
    }
    const el = child as Element;
    const tag = el.tagName.toLowerCase();

    if (DROP_ENTIRELY.has(tag)) {
      el.parentNode?.removeChild(el);
      continue;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      // Unwrap: keep children (and their text), drop just this wrapper.
      walk(el); // sanitize its children first
      while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
      el.parentNode?.removeChild(el);
      continue;
    }

    sanitizeAttributes(el);
    walk(el);
  }
}

export function sanitizeLessonContent(html: string): string {
  if (!html) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  walk(doc.body);
  return doc.body.innerHTML;
}
