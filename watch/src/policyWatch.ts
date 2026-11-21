// Open Cycle Rail: the page watch. The sentences of an operator's conditions
// page that mention a bicycle, in the page's language, fingerprinted so a
// layout change is silent and a policy change is not.
import { createHash } from 'node:crypto';

// The bike paragraphs of an operator's conditions page. Layout, menus and
// cookie banners change every month; the sentences that mention a bicycle
// change when the policy does. So the fingerprint is taken over those alone.
const BIKE = /\b(bike|bikes|bicycle|bicycles|cycle|cycles|cycling|v[ée]lo|v[ée]los|bicyclette|fahrrad|fahrr[äa]der|velo|fiets|fietsen|bicicleta|bicicletas|bici|bicicletta|biciclette|cykel|cyklar|cykler|sykkel|sykler|polkupy[öo]r|rower|rowery|rowerów|kerékp[áa]r|bicikl|bicikli|велосипед|колело|dviračiai|dvirat|bisiklet)\w*/i;

export function textOf(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<!--[\s\S]*?-->/gi, ' ')
    .replace(/<(br|p|div|li|h\d|tr|td|th|section|article|dd|dt)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&euro;/g, '€').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/[ \t ]+/g, ' ').replace(/\s*\n\s*/g, '\n');
}

export function bikeExtract(html: string, max = 6000): string {
  const lines = textOf(html).split('\n').map(l => l.trim()).filter(l => l.length > 24 && BIKE.test(l));
  const seen = new Set<string>(), out: string[] = [];
  for (const l of lines) { const k = l.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(l); } }
  return out.join('\n').slice(0, max);
}

export const fingerprint = (extract: string) => createHash('sha1').update(extract.replace(/\d{1,2}[./]\d{1,2}[./]\d{2,4}/g, '').replace(/\s+/g, ' ').trim().toLowerCase()).digest('hex');

export async function fetchExtract(url: string): Promise<{ status: number; extract: string }> {
  const r = await fetch(url, { headers: { 'User-Agent': 'OpenCycleRail-policy-watch/1.0 (+https://opencyclerail.tech; edhunton@tourtrax.guide)', Accept: 'text/html,application/xhtml+xml,application/pdf;q=0.8,*/*;q=0.5' }, redirect: 'follow', signal: AbortSignal.timeout(20_000) });
  const type = r.headers.get('content-type') ?? '';
  if (!r.ok) return { status: r.status, extract: '' };
  if (/pdf/i.test(type)) {
    const buf = Buffer.from(await r.arrayBuffer());
    const { default: pdfParse } = await import('pdf-parse') as unknown as { default: (b: Buffer) => Promise<{ text: string }> };
    const text = (await pdfParse(buf)).text;
    return { status: r.status, extract: bikeExtract(text.split('\n').map(l => `<p>${l}</p>`).join('')) };
  }
  return { status: r.status, extract: bikeExtract(await r.text()) };
}
