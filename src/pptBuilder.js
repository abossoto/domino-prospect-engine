// src/pptBuilder.js
// Export PowerPoint del Prospect Engine secondo brain/16_domino_deck_pptx.md.
// Tutti i valori visivi vengono da designSystem.js; le misure sono in pt
// (slide 1440 × 810 pt = 20″ × 11,25″) e vengono convertite in pollici solo
// quando si passano a pptxgenjs.
//
// Struttura (pitch breve, dark dominante come il riferimento CX Forum Rimini):
//   1. Cover      — dark, fumo 01: display 96 pt con twist rosso, lead, meta
//   2. Sfida      — dark, fumo 02: H2, corpo, sfide con numerali romani serif
//   3. Soluzione  — paper: H2, corpo, strumenti in lista numerata 01/02/03
//   4. Proof      — dark, fumo 03: H2, corpo, tre card case study
//   5. Chiusura   — red (una sola): titolo nero, riepilogo, firma "Domino"
//
// Il twist rosso dei titoli arriva dal modello tra asterischi: "Il problema
// *non è la tecnologia*." Senza asterischi la cover colora l'ultima frase.

import pptxgen from 'pptxgenjs';
import {
  colors, alpha, fonts, type, tracking, lineHeight, slide as SLIDE, grid, chrome, assetPaths,
} from './designSystem.js';

const IN = pt => pt / 72;
const CONTENT_W = SLIDE.w - 2 * grid.padX;
const CONTENT_BOTTOM = SLIDE.h - grid.padBottom;

// ─── TESTO: twist e adattamento ──────────────────────────────────────────────

// "Titolo con *twist*" → [{ text, twist }]
export function parseTwist(str) {
  const parts = String(str || '').split(/\*+/);
  return parts
    .map((text, i) => ({ text, twist: i % 2 === 1 }))
    .filter(p => p.text);
}

export const stripTwist = str => String(str || '').replace(/\*+/g, '');

// Senza marcatori: l'ultima frase diventa il twist (come la cover di riferimento).
function twistOrLastSentence(str) {
  const runs = parseTwist(str);
  if (runs.some(r => r.twist)) return runs;
  const plain = stripTwist(str).trim();
  const m = plain.match(/^(.*?[.!?:])\s+(\S.*)$/s);
  return m ? [{ text: m[1] + ' ', twist: false }, { text: m[2], twist: true }] : [{ text: plain, twist: false }];
}

// Larghezza media del carattere in em, per stimare gli a capo. Misurata sul
// render PowerPoint con Aktiv Grotesk Trial (Black ~0,51, Regular ~0,44,
// Bold ~0,50) più un margine: meglio un corpo un filo più piccolo che un testo che sfora.
const CHAR_EM = {
  [fonts.black]: 0.53, [fonts.xbold]: 0.48, [fonts.medium]: 0.48,
  [fonts.sans]: 0.46, [fonts.serif]: 0.5,
};

function countLines(text, size, font, track, widthPt, bold) {
  const em = (CHAR_EM[font] || 0.5) + (bold ? 0.05 : 0);
  const charW = size * em + (track || 0);
  const maxChars = Math.max(1, Math.floor(widthPt / charW));
  let lines = 0;
  for (const para of String(text).split('\n')) {
    let cur = 0;
    let n = 1;
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const len = word.length;
      if (cur === 0) cur = len;
      else if (cur + 1 + len <= maxChars) cur += 1 + len;
      else { n += 1; cur = len; }
      while (cur > maxChars) { n += 1; cur -= maxChars; }
    }
    lines += n;
  }
  return lines;
}

const blockHeight = (lines, size, lh) => lines * size * lh * 1.2;

// Sceglie il corpo più grande tra max e min che sta nel riquadro; se non basta
// neanche il minimo, accorcia il testo a parole intere e chiude con "…".
export function fitText({ text, font, max, min, w, h, lh = lineHeight.body, track = 0, bold = false }) {
  let content = String(text || '').trim();
  // Se non c'è spazio neanche per una riga al corpo minimo, il testo non entra.
  if (!content || h < blockHeight(1, min, lh)) return { text: '', size: max, height: 0 };
  for (let size = max; size >= min; size -= 0.75) {
    const lines = countLines(content, size, font, track, w, bold);
    if (blockHeight(lines, size, lh) <= h) return { text: content, size, height: blockHeight(lines, size, lh) };
  }
  const words = content.split(/\s+/);
  while (words.length > 1) {
    words.pop();
    content = words.join(' ').replace(/[,;:.\s]+$/, '') + '…';
    const lines = countLines(content, min, font, track, w, bold);
    if (blockHeight(lines, min, lh) <= h) return { text: content, size: min, height: blockHeight(lines, min, lh) };
  }
  return { text: content, size: min, height: blockHeight(1, min, lh) };
}

// ─── PRIMITIVE ───────────────────────────────────────────────────────────────

// Le dimensioni non possono mai essere negative: PowerPoint considera il file
// corrotto e lo "ripara". Le linee orizzontali restano a h = 0.
function box(x, y, w, h) {
  return { x: IN(x), y: IN(y), w: IN(Math.max(w, 1)), h: IN(Math.max(h, 0)) };
}

function text(s, content, { x, y, w, h, ...opts }) {
  s.addText(content, {
    ...box(x, y, w, h),
    margin: 0, valign: 'top', fit: 'none', paraSpaceAfter: 0,
    ...opts,
  });
}

function hairline(s, x, y, w, color, transparency = 0, width = 0.75) {
  s.addShape('line', { ...box(x, y, w, 0), line: { color, width, transparency } });
}

function rect(s, x, y, w, h, fill, line) {
  s.addShape('rect', {
    ...box(x, y, w, h),
    fill: { color: fill },
    line: line || { color: fill, width: 0 },
  });
}

// Titolo con twist: restituisce l'altezza occupata per impilare il resto.
function addTitle(s, raw, { x, y, w, h, font, max, min, color, twistColor, lh, track, forceTwist = false }) {
  const runs = forceTwist ? twistOrLastSentence(raw) : parseTwist(raw);
  const plain = runs.map(r => r.text).join('');
  const fit = fitText({ text: plain, font, max, min, w, h, lh, track });
  if (!fit.text) return 0;
  const truncated = fit.text !== plain;
  const parts = truncated ? [{ text: fit.text, twist: false }] : runs;
  text(s, parts.map(r => ({
    text: r.text,
    options: { color: r.twist ? twistColor : color },
  })), {
    x, y, w, h: fit.height + 4,
    fontFace: font, fontSize: fit.size, charSpacing: track, lineSpacingMultiple: lh,
  });
  return fit.height;
}

function addBody(s, raw, { x, y, w, h, font = fonts.sans, max = type.bodyLarge, min = type.minBody, color, transparency = 0, bold = false, lh = lineHeight.body, cautious = false }) {
  // cautious: stima più larga (come il bold) per i testi impilati in spazi stretti.
  const fit = fitText({ text: stripTwist(raw), font, max, min, w, h, lh, bold: bold || cautious });
  if (!fit.text) return 0;
  text(s, fit.text, {
    x, y, w, h: fit.height + 4,
    fontFace: font, fontSize: fit.size, bold, color, transparency, lineSpacingMultiple: lh,
  });
  return fit.height;
}

// Eyebrow: trattino rosso 36 × 1,5 pt + testo CAPS rosso tracciato.
function addEyebrow(s, label, x, y, color = colors.red) {
  rect(s, x, y + 7, 36, 1.5, color);
  text(s, String(label).toUpperCase(), {
    x: x + 48, y, w: CONTENT_W - 48, h: 18,
    fontFace: fonts.sans, bold: true, fontSize: type.eyebrow,
    charSpacing: tracking.eyebrow, color,
  });
  return 18;
}

// Etichetta CAPS piccola (kicker di card, label dei meta).
function addLabel(s, label, { x, y, w, color, transparency = 0, size = type.micro }) {
  text(s, String(label).toUpperCase(), {
    x, y, w, h: size * 1.4,
    fontFace: fonts.sans, bold: true, fontSize: size,
    charSpacing: tracking.card, color, transparency,
  });
}

// ─── SFONDO E CHROME ─────────────────────────────────────────────────────────

const VARIANTS = {
  dark:  { bg: colors.black, fg: colors.white, mute: alpha.onDark.mute, faint: alpha.onDark.faint, line: alpha.onDark.line, dot: colors.red, logo: 'logoOnDark' },
  paper: { bg: colors.paper, fg: colors.black, mute: alpha.onPaper.mute, faint: alpha.onPaper.soft, line: alpha.onPaper.line, dot: colors.red, logo: 'logoOnLight' },
  red:   { bg: colors.red,   fg: colors.black, mute: 0, faint: 0, line: 0, dot: colors.black, logo: 'logoOnRed' },
};

function newSlide(prs, assets, variant, smoke) {
  const s = prs.addSlide();
  s.background = { color: VARIANTS[variant].bg };
  if (smoke && assets[smoke]) {
    s.addImage({ data: assets[smoke], x: 0, y: 0, w: SLIDE.widthIn, h: SLIDE.heightIn });
  }
  return s;
}

function addChrome(s, assets, variant, { n, label, footerLeft, footerRight }) {
  const v = VARIANTS[variant];
  const logoW = chrome.logoH * chrome.logoAspect;
  if (assets[v.logo]) {
    s.addImage({ data: assets[v.logo], ...box(grid.padX, grid.chromeTop, logoW, chrome.logoH) });
  }

  // In alto a destra: quadratino 6 × 6 + "02 · SFIDA"
  const tag = `${String(n).padStart(2, '0')} · ${label}`.toUpperCase();
  const right = SLIDE.w - grid.padX;
  const tagW = tag.length * (type.chrome * 0.62 + tracking.chrome);
  const tagY = grid.chromeTop + chrome.logoH / 2 - 7;
  rect(s, right - tagW - 14, tagY + 4, chrome.dot, chrome.dot, v.dot);
  text(s, tag, {
    x: right - tagW, y: tagY, w: tagW, h: 14, align: 'right',
    fontFace: fonts.sans, bold: true, fontSize: type.chrome, charSpacing: tracking.chrome,
    color: v.fg, transparency: variant === 'red' ? 0 : v.mute,
  });

  // In basso: progetto (sx) · sezione (dx)
  const fy = SLIDE.h - grid.chromeBottom - 13;
  const footer = { y: fy, w: CONTENT_W / 2, h: 14, fontFace: fonts.sans, bold: true, fontSize: type.chrome, charSpacing: tracking.chrome, color: v.fg, transparency: v.faint };
  text(s, footerLeft.toUpperCase(), { ...footer, x: grid.padX });
  text(s, footerRight.toUpperCase(), { ...footer, x: grid.padX + CONTENT_W / 2, align: 'right' });
}

// ─── STRUMENTI E CASE STUDY ──────────────────────────────────────────────────

function designSprintName(tipo) {
  const t = String(tipo || '').replace(/design sprint!?/i, '').trim();
  return t ? `${t} Design Sprint!` : 'Design Sprint!';
}

function strumenti(p) {
  const ss = p.strumenti_suggeriti || {};
  return [
    ss.core_sprint && { nome: 'Core Sprint!', testo: ss.core_sprint_motivazione },
    ss.design_sprint_tipo && { nome: designSprintName(ss.design_sprint_tipo), testo: ss.design_sprint_motivazione },
    ss.preventivo_emozionale && { nome: 'Preventivo Emozionale', testo: ss.preventivo_emozionale_motivazione },
  ].filter(Boolean);
}

const CASE_KICKER = { affine: 'Sfida affine', settore: 'Settore vicino', metodologia: 'Metodo' };

// ─── BUILD ───────────────────────────────────────────────────────────────────

export function buildPPT(result, assets = {}) {
  const prs = new pptxgen();
  prs.defineLayout({ name: 'DOMINO_20x11', width: SLIDE.widthIn, height: SLIDE.heightIn });
  prs.layout = 'DOMINO_20x11';
  prs.company = 'Domino — Proudly Interactive';

  const p = result.prospect || {};
  const d = result.deck || {};
  const nome = p.nome || 'Prospect';
  const data = new Date().toLocaleDateString('it-IT');
  const footerLeft = `${nome} · Domino · ${data}`;
  const X = grid.padX;

  // ─── 1. Cover ─────────────────────────────────────────────────────────────
  {
    const s = newSlide(prs, assets, 'dark', 'smokeCover');
    addChrome(s, assets, 'dark', { n: 1, label: 'Proposta', footerLeft, footerRight: 'Pitch Domino' });

    let y = 180;
    y += addEyebrow(s, `${nome} · Domino`, X, y) + 24;
    y += addTitle(s, d.slide_1_titolo, {
      x: X, y, w: CONTENT_W, h: 260,
      font: fonts.black, max: type.display, min: 56, lh: lineHeight.display, track: tracking.display,
      color: colors.white, twistColor: colors.red, forceTwist: true,
    }) + 28;
    addBody(s, d.slide_1_contenuto, {
      x: X, y, w: 820, h: 580 - y,  // titolo al massimo fino a ~510: restano almeno due righe di lead
      font: fonts.medium, max: type.lead, min: 18, color: colors.white, transparency: alpha.onDark.mute,
    });

    hairline(s, X, 600, CONTENT_W, colors.red, 0, 1);
    const meta = [
      ['Per', p.decisore_target],
      ['Settore', p.settore],
      ['Mercati', p.mercati],
    ].filter(([, v]) => v);
    const colW = CONTENT_W / 3;
    meta.forEach(([label, value], i) => {
      const x = X + i * colW;
      addLabel(s, label, { x, y: 620, w: colW - 24, color: colors.white, transparency: alpha.onDark.faint });
      addBody(s, value, { x, y: 640, w: colW - 24, h: 60, bold: true, max: type.eyebrow, min: 12, color: colors.white });
    });
  }

  // ─── 2. Sfida ─────────────────────────────────────────────────────────────
  {
    const s = newSlide(prs, assets, 'dark', 'smokeDivider');
    addChrome(s, assets, 'dark', { n: 2, label: 'Sfida', footerLeft, footerRight: 'Sfida' });

    const sfide = (p.sfide_probabili || []).filter(Boolean).slice(0, 3);
    const colsTop = sfide.length ? 500 : CONTENT_BOTTOM;
    let y = 120;
    y += addEyebrow(s, 'Sfida · contesto', X, y) + 30;
    y += addTitle(s, d.slide_2_titolo, {
      x: X, y, w: 1150, h: 200,
      font: fonts.xbold, max: type.h2, min: 38, lh: lineHeight.heading, track: tracking.heading,
      color: colors.white, twistColor: colors.red,
    }) + 28;
    addBody(s, d.slide_2_contenuto, {
      x: X, y, w: 980, h: colsTop - 32 - y, color: colors.white, transparency: alpha.onDark.mute,
    });

    const romani = ['I', 'II', 'III'];
    const colW = (CONTENT_W - 2 * 40) / 3;
    sfide.forEach((sfida, i) => {
      const x = X + i * (colW + 40);
      hairline(s, x, colsTop, colW, colors.red, 0, 1);
      text(s, romani[i], {
        x, y: colsTop + 14, w: 80, h: 44,
        fontFace: fonts.serif, bold: true, italic: true, fontSize: type.numeral, color: colors.red,
      });
      addBody(s, sfida, {
        x, y: colsTop + 66, w: colW, h: CONTENT_BOTTOM - colsTop - 66,
        bold: true, max: type.body, min: type.minBody, color: colors.white,
      });
    });
  }

  // ─── 3. Soluzione ─────────────────────────────────────────────────────────
  {
    const s = newSlide(prs, assets, 'paper');
    addChrome(s, assets, 'paper', { n: 3, label: 'Soluzione', footerLeft, footerRight: 'Soluzione' });

    const tools = strumenti(p);
    const listTop = tools.length ? 470 : CONTENT_BOTTOM;
    let y = 120;
    y += addEyebrow(s, 'Soluzione · approccio', X, y) + 30;
    y += addTitle(s, d.slide_3_titolo, {
      x: X, y, w: 1150, h: 200,
      font: fonts.xbold, max: type.h2, min: 38, lh: lineHeight.heading, track: tracking.heading,
      color: colors.black, twistColor: colors.red,
    }) + 28;
    addBody(s, d.slide_3_contenuto, {
      x: X, y, w: 980, h: listTop - 32 - y, color: colors.black, transparency: alpha.onPaper.mute,
    });

    const colW = (CONTENT_W - (tools.length - 1) * 40) / Math.max(tools.length, 1);
    tools.forEach((t, i) => {
      const x = X + i * (colW + 40);
      hairline(s, x, listTop, colW, colors.black, alpha.onPaper.line);
      text(s, String(i + 1).padStart(2, '0'), {
        x, y: listTop + 14, w: 90, h: 44,
        fontFace: fonts.serif, bold: true, italic: true, fontSize: type.numeral, color: colors.red,
      });
      const th = addBody(s, t.nome, {
        x, y: listTop + 66, w: colW, h: 70,
        font: fonts.xbold, max: 27.75, min: 20, lh: lineHeight.heading, color: colors.black,
      });
      addBody(s, t.testo, {
        x, y: listTop + 66 + th + 12, w: colW, h: CONTENT_BOTTOM - (listTop + 66 + th + 12),
        max: type.body, min: type.minBody, color: colors.black, transparency: alpha.onPaper.mute,
      });
    });
  }

  // ─── 4. Proof point ───────────────────────────────────────────────────────
  {
    const s = newSlide(prs, assets, 'dark', 'smokeClosing');
    addChrome(s, assets, 'dark', { n: 4, label: 'Le prove', footerLeft, footerRight: 'Casi studio' });

    const casi = (p.casi_studio || []).filter(c => c && c.cliente).slice(0, 3);
    const cardH = 270;
    const cardsTop = casi.length ? CONTENT_BOTTOM - cardH : CONTENT_BOTTOM;
    let y = 120;
    y += addEyebrow(s, 'Proof point · casi studio', X, y) + 30;
    y += addTitle(s, d.slide_4_titolo || 'Chi l\'ha fatto con noi', {
      x: X, y, w: 1150, h: 140,
      font: fonts.xbold, max: type.h2, min: 38, lh: lineHeight.heading, track: tracking.heading,
      color: colors.white, twistColor: colors.red,
    }) + 20;
    addBody(s, d.slide_4_contenuto, {
      x: X, y, w: 980, h: cardsTop - 28 - y, max: type.body, color: colors.white, transparency: alpha.onDark.mute,
    });

    const gap = grid.gapItem;
    const cardW = (CONTENT_W - (casi.length - 1) * gap) / Math.max(casi.length, 1);
    const pad = grid.cardPad;
    casi.forEach((cs, i) => {
      const x = X + i * (cardW + gap);
      const innerW = cardW - 2 * pad;
      rect(s, x, cardsTop, cardW, cardH, colors.ink, { color: colors.white, width: 0.75, transparency: alpha.onDark.line });
      addLabel(s, CASE_KICKER[cs.tipo] || 'Caso studio', { x: x + pad, y: cardsTop + pad, w: innerW, color: colors.red });
      let cy = cardsTop + pad + 24;
      cy += addBody(s, cs.cliente, {
        x: x + pad, y: cy, w: innerW, h: 64,
        font: fonts.xbold, max: 24, min: 18, lh: lineHeight.heading, color: colors.white,
      }) + 10;
      if (cs.kpi) {
        cy += addBody(s, cs.kpi, {
          x: x + pad, y: cy, w: innerW, h: 76,
          font: fonts.black, max: 34.5, min: 18, lh: lineHeight.heading, color: colors.white, cautious: true,
        }) + 8;
      }
      if (cs.progetto) {
        const ph = addBody(s, cs.progetto.toUpperCase(), {
          x: x + pad, y: cy, w: innerW, h: 34,
          bold: true, max: type.micro, min: 10.5, lh: 1.15, color: colors.white, transparency: alpha.onDark.faint,
        });
        cy += ph + 10;
      }
      addBody(s, cs.perche_affine, {
        x: x + pad, y: cy, w: innerW, h: cardsTop + cardH - pad - cy,
        max: type.small, min: 12, lh: 1.25, color: colors.white, transparency: alpha.onDark.mute,
      });
    });
  }

  // ─── 5. Chiusura (red) ────────────────────────────────────────────────────
  {
    const s = newSlide(prs, assets, 'red');
    addChrome(s, assets, 'red', { n: 5, label: 'Prossimo passo', footerLeft, footerRight: 'Pitch Domino' });

    let y = 150;
    addTitle(s, stripTwist(d.slide_5_titolo), {
      x: X, y, w: 1150, h: 330,
      font: fonts.black, max: type.h1, min: 48, lh: lineHeight.display, track: tracking.display,
      color: colors.black, twistColor: colors.black,
    });

    y = 520;
    hairline(s, X, y, CONTENT_W, colors.black, 0, 1);
    addBody(s, d.slide_5_contenuto, {
      x: X, y: y + 26, w: 760, h: CONTENT_BOTTOM - y - 26,
      font: fonts.sans, bold: true, max: type.lead, min: 16, lh: 1.2, color: colors.black,
    });

    const fx = SLIDE.w - grid.padX - 420;
    text(s, 'Domino', {
      x: fx, y: y + 22, w: 420, h: 50, align: 'right',
      fontFace: fonts.serif, bold: true, italic: true, fontSize: type.signature, color: colors.black,
    });
    text(s, 'PROUDLY INTERACTIVE', {
      x: fx, y: y + 76, w: 420, h: 26, align: 'right',
      fontFace: fonts.sans, bold: true, fontSize: type.signatureTag, charSpacing: tracking.card, color: colors.black,
    });
    text(s, 'DOMINO.IT · TORINO +39 011 544770 · VENEZIA +39 041 0991410', {
      x: fx - 200, y: y + 112, w: 620, h: 16, align: 'right',
      fontFace: fonts.sans, bold: true, fontSize: type.chrome, charSpacing: tracking.chrome, color: colors.black,
    });
  }

  return prs;
}

// ─── ASSET E DOWNLOAD ────────────────────────────────────────────────────────

async function toDataUri(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

// Un asset mancante non blocca l'export: la slide resta sul colore pieno.
export async function loadDeckAssets() {
  const entries = await Promise.all(Object.entries(assetPaths).map(async ([key, url]) => {
    try { return [key, await toDataUri(url)]; }
    catch (e) { console.warn('[pptBuilder] asset non caricato', e); return [key, null]; }
  }));
  return Object.fromEntries(entries);
}

export async function exportPPT(result) {
  const assets = await loadDeckAssets();
  const prs = buildPPT(result, assets);
  const nome = (result.prospect?.nome || 'export').replace(/\s+/g, '-').toLowerCase();
  await prs.writeFile({ fileName: `domino-prospect-${nome}.pptx` });
}
