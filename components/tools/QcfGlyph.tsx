import { isQcf4FontLoaded, type Qcf4Word } from "@/lib/quran/qcf4";

interface QcfGlyphProps {
  word: Qcf4Word;
  className?: string;
}

// Renders one QCF4 word: the real page-glyph once its font has loaded, or
// the plain Arabic fallback text before that — the same progressive-load
// pattern quran.com itself uses, so the reader sees readable text
// immediately instead of a blank line while ~a dozen KB of font streams in.
export default function QcfGlyph({ word, className }: QcfGlyphProps) {
  const fontLoaded = isQcf4FontLoaded(word.font);

  // The ayah-end circle marker's raw fallback text is a placeholder like
  // "V12", not real Arabic — showing it before the font loads would look
  // like a stray typo sitting in the middle of the verse, so it simply
  // doesn't render until its font is ready (a fraction of a second later).
  if (!fontLoaded && word.type === "end") return null;

  return (
    <span
      lang="ar"
      // QCF4's `char` values are Private Use Area codepoints (U+E000–F8FF /
      // the supplementary PUA planes). Unicode's bidi algorithm has no idea
      // these PUA codepoints are "supposed to be" Arabic glyphs — unassigned
      // PUA codepoints default to Bidi_Class "L" (strong left-to-right),
      // the same class as Latin letters. So even inside this <span>'s
      // inherited `direction: rtl`, the browser's bidi reordering (UAX #9)
      // treats each glyph run as strong-LTR content and can flip multi-
      // codepoint glyph sequences (and, in some browsers, the run's
      // placement relative to neighboring word spans) into left-to-right
      // order — which is exactly the "beautiful font but reversed" symptom:
      // the plain-text fallback (`word.text`) is real Arabic (Bidi_Class
      // AL/R), so it was never affected.
      // `unicode-bidi: bidi-override` turns the bidi algorithm off for this
      // element's content and just renders it in source order according to
      // `direction`, so the PUA codepoints can no longer be reordered.
      style={{
        fontFamily: fontLoaded ? `"${word.font}"` : undefined,
        fontFeatureSettings: "normal",
        direction: "rtl",
        unicodeBidi: "bidi-override",
      }}
      className={className}
    >
      {fontLoaded ? word.char : word.text}
    </span>
  );
}
