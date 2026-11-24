// Shows maths text with exponents drawn as real raised numbers. The text keeps superscript characters
// (x², y⁴) but fonts draw many of them small or on the line, so each run of them becomes a raised <sup>.
import type { ReactNode } from 'react';

const SUP_TO_DIGIT: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '−' };
const RUN = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g;

export function mx(text: string | number | null | undefined): ReactNode {
  if (text === null || text === undefined) return text;
  const s = String(text);
  if (!RUN.test(s)) return s;
  RUN.lastIndex = 0;
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of s.matchAll(RUN)) {
    if (m.index! > last) out.push(s.slice(last, m.index));
    out.push(<sup key={k++} className="ex">{[...m[0]].map((c) => SUP_TO_DIGIT[c]).join('')}</sup>);
    last = m.index! + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

/** <M>3x²y</M> */
export function M({ children }: { children: string | number | null | undefined }) {
  return <>{mx(children)}</>;
}
