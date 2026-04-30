// src/pptBuilder.js
// Funzione di export PowerPoint del Prospect Engine.
// Applica il Domino Design System (vedi designSystem.js).
// Genera un PPTX di 5 slide pensato per essere aperto su Mac con i font
// Aktiv Grotesk e PT Serif installati. Su sistemi senza i font, PowerPoint
// usa il fallback automatico (Helvetica / Calibri / Arial).
//
// Regole DS rispettate:
// - Solo nero, bianco e rosso #FF303F (più grigi del DS).
// - Aktiv Grotesk per heading/UI, PT Serif Bold per body editoriale.
// - Niente emoji, niente Title Case, niente icone disegnate a mano.
// - Card a radius 0, senza bordo, senza ombra.
// - Eyebrow ALL CAPS con tracking 4.3px (≈3pt in PPTX).
// - Domino tiles 46x46 in alto a destra dell'hero.
// - Frame bianco 20px attorno alle artboard hero (slide 1 e 5).

import pptxgen from 'pptxgenjs';
import { LOGO_DATA_URI } from './logoBase64.js';
import {
  colors, fonts, type, tracking, lineHeight, canvas, margin, tiles
} from './designSystem.js';

// ─── HELPER ──────────────────────────────────────────────────────────────────

// Logo: immagine PNG sulle slide a sfondo chiaro,
// wordmark testuale "domino" sulle slide a sfondo dark/red.
function addLogo(slide, variant = 'image') {
  if (variant === 'image') {
    slide.addImage({
      data: LOGO_DATA_URI,
      x: margin.outer, y: 0.18,
      w: 0.9, h: 0.32,
    });
  } else {
    // Wordmark testuale per slide 1 (dark) e slide 5 (red)
    slide.addText('domino', {
      x: margin.outer, y: 0.18, w: 1.4, h: 0.3,
      fontSize: type.meta, bold: true,
      fontFace: fonts.sans,
      color: variant === 'white' ? colors.white : colors.red,
      charSpacing: tracking.eyebrow,
    });
  }
}

// Numero di slide in alto a destra (rosso, ALL CAPS feel)
function addSlideNumber(slide, n) {
  slide.addText(String(n).padStart(2, '0'), {
    x: canvas.width - 1.0, y: 0.18, w: 0.6, h: 0.3,
    fontSize: type.caption, bold: true,
    fontFace: fonts.sans,
    color: colors.red,
    charSpacing: tracking.eyebrow,
    align: 'right',
  });
}

// Brand chrome: due tile 0.4"x0.4" in alto a destra (rosso + ink),
// firma del DS sulle slide hero.
function addBrandTiles(slide) {
  const x2 = canvas.width - margin.outer - tiles.size;
  const x1 = x2 - tiles.size - tiles.gap;
  const y  = 0.6;
  slide.addShape('rect', {
    x: x1, y, w: tiles.size, h: tiles.size,
    fill: { color: colors.red },
    line: { color: colors.red, width: 0 },
  });
  slide.addShape('rect', {
    x: x2, y, w: tiles.size, h: tiles.size,
    fill: { color: colors.ink },
    line: { color: colors.ink, width: 0 },
  });
}

// Frame bianco "firma" attorno a una slide intera (per hero/CTA).
function addWhiteFrame(slide) {
  const f = margin.frame;
  const fillWhite = { fill: { color: colors.white }, line: { color: colors.white, width: 0 } };
  slide.addShape('rect', { x: 0, y: 0, w: canvas.width, h: f, ...fillWhite });
  slide.addShape('rect', { x: 0, y: canvas.height - f, w: canvas.width, h: f, ...fillWhite });
  slide.addShape('rect', { x: 0, y: 0, w: f, h: canvas.height, ...fillWhite });
  slide.addShape('rect', { x: canvas.width - f, y: 0, w: f, h: canvas.height, ...fillWhite });
}

// Eyebrow ALL CAPS rosso (o personalizzato) — pattern ricorrente del DS.
function addEyebrow(slide, text, position) {
  slide.addText((text || '').toUpperCase(), {
    fontFace: fonts.sans,
    fontSize: type.eyebrow,
    color: position.color || colors.red,
    bold: false,
    charSpacing: tracking.eyebrow,
    ...position,
  });
}

// ─── EXPORT PPT ──────────────────────────────────────────────────────────────

export function exportPPT(result) {
  const prs = new pptxgen();
  prs.layout = 'LAYOUT_WIDE';

  const p = result.prospect;
  const d = result.deck;

  // ─── SLIDE 1: Hero ────────────────────────────────────────────────────────
  // Sfondo dark + frame bianco firma + Domino tiles in alto a destra.
  const s1 = prs.addSlide();
  s1.background = { color: colors.ink };

  addWhiteFrame(s1);
  addLogo(s1, 'red');           // wordmark rosso su dark
  addSlideNumber(s1, 1);
  addBrandTiles(s1);

  addEyebrow(s1, `Prospect · ${p.nome || ''}`, {
    x: margin.outer + 0.2, y: 1.1, w: 12, h: 0.4,
  });

  // Hero title (Aktiv Grotesk XBold 800 — pptxgenjs usa bold:true)
  s1.addText(d.slide_1_titolo || '', {
    x: margin.outer + 0.2, y: 1.7, w: 11.5, h: 3.0,
    fontFace: fonts.sans,
    fontSize: type.hero,
    bold: true,
    color: colors.white,
    charSpacing: tracking.tightest,
    lineSpacingMultiple: lineHeight.tight,
  });

  // Body editoriale (PT Serif Bold)
  s1.addText(d.slide_1_contenuto || '', {
    x: margin.outer + 0.2, y: 4.9, w: 10, h: 1.7,
    fontFace: fonts.serif,
    fontSize: type.bodyLead,
    bold: true,
    color: colors.grey300,
    breakLine: true,
    lineSpacingMultiple: lineHeight.serif,
  });

  // Footer meta
  s1.addText(`${new Date().toLocaleDateString('it-IT')}   ·   domino.it`, {
    x: margin.outer + 0.2, y: 6.85, w: 8, h: 0.3,
    fontFace: fonts.sans,
    fontSize: type.caption,
    color: colors.grey500,
    charSpacing: tracking.eyebrow,
  });

  // ─── SLIDE 2: Sfida / Problema ────────────────────────────────────────────
  // Sfondo bianco + accent bar rossa + eyebrow + H2.
  const s2 = prs.addSlide();
  s2.background = { color: colors.white };

  addLogo(s2, 'image');
  addSlideNumber(s2, 2);

  addEyebrow(s2, 'Sfida · contesto', {
    x: margin.outer, y: 1.1, w: 12, h: 0.3,
  });

  // Accent bar rossa (sottile)
  s2.addShape('rect', {
    x: margin.outer, y: 1.6, w: 0.05, h: 0.95,
    fill: { color: colors.red },
    line: { color: colors.red, width: 0 },
  });

  s2.addText(d.slide_2_titolo || '', {
    x: margin.outer + 0.2, y: 1.5, w: 11.5, h: 1.3,
    fontFace: fonts.sans,
    fontSize: type.h2,
    bold: true,
    color: colors.ink,
    charSpacing: tracking.tight,
    lineSpacingMultiple: lineHeight.tight,
  });

  // Body editoriale (PT Serif Bold)
  s2.addText(d.slide_2_contenuto || '', {
    x: margin.outer, y: 3.1, w: 12.5, h: 3.7,
    fontFace: fonts.serif,
    fontSize: type.body,
    bold: true,
    color: colors.grey700,
    breakLine: true,
    lineSpacingMultiple: lineHeight.serif,
  });

  // ─── SLIDE 3: Soluzione + Strumenti ───────────────────────────────────────
  const s3 = prs.addSlide();
  s3.background = { color: colors.white };

  addLogo(s3, 'image');
  addSlideNumber(s3, 3);

  addEyebrow(s3, 'Soluzione · approccio', {
    x: margin.outer, y: 1.1, w: 12, h: 0.3,
  });

  s3.addShape('rect', {
    x: margin.outer, y: 1.6, w: 0.05, h: 0.95,
    fill: { color: colors.red },
    line: { color: colors.red, width: 0 },
  });

  s3.addText(d.slide_3_titolo || '', {
    x: margin.outer + 0.2, y: 1.5, w: 11.5, h: 1.3,
    fontFace: fonts.sans,
    fontSize: type.h2,
    bold: true,
    color: colors.ink,
    charSpacing: tracking.tight,
    lineSpacingMultiple: lineHeight.tight,
  });

  s3.addText(d.slide_3_contenuto || '', {
    x: margin.outer, y: 3.1, w: 12.5, h: 2.5,
    fontFace: fonts.serif,
    fontSize: type.body,
    bold: true,
    color: colors.grey700,
    breakLine: true,
    lineSpacingMultiple: lineHeight.serif,
  });

  // Strumenti suggeriti — strip in basso (rispettando "!" canonico)
  const ss = p.strumenti_suggeriti || {};
  const tools = [
    ss.core_sprint && 'Core Sprint!',
    ss.design_sprint_tipo && `${ss.design_sprint_tipo} Design Sprint!`,
    ss.preventivo_emozionale && 'Preventivo Emozionale',
  ].filter(Boolean);

  if (tools.length) {
    // Divider
    s3.addShape('rect', {
      x: margin.outer, y: 5.85, w: 12.5, h: 0.02,
      fill: { color: colors.grey300 },
      line: { color: colors.grey300, width: 0 },
    });
    addEyebrow(s3, 'Strumenti', {
      x: margin.outer, y: 6.05, w: 2.5, h: 0.3,
    });
    s3.addText(tools.join('   ·   '), {
      x: margin.outer, y: 6.4, w: 12.5, h: 0.5,
      fontFace: fonts.sans,
      fontSize: type.bodyLead,
      bold: true,
      color: colors.ink,
    });
  }

  // ─── SLIDE 4: Casi studio (split layout) ──────────────────────────────────
  const s4 = prs.addSlide();
  s4.background = { color: colors.white };

  // Colonna scura a sinistra (~50%)
  s4.addShape('rect', {
    x: 0, y: 0, w: 6.4, h: canvas.height,
    fill: { color: colors.ink },
    line: { color: colors.ink, width: 0 },
  });

  addSlideNumber(s4, 4);

  // Logo wordmark sulla colonna dark (rosso brand)
  s4.addText('domino', {
    x: margin.outer, y: 0.18, w: 1.4, h: 0.3,
    fontFace: fonts.sans, fontSize: type.meta, bold: true,
    color: colors.red,
    charSpacing: tracking.eyebrow,
  });

  // Eyebrow + titolo a destra (colonna chiara)
  addEyebrow(s4, 'Proof point', {
    x: 6.7, y: 0.6, w: 6, h: 0.3,
  });
  s4.addText(d.slide_4_titolo || 'Chi l\'ha fatto con noi', {
    x: 6.7, y: 1.0, w: 6.4, h: 1.0,
    fontFace: fonts.sans,
    fontSize: type.cardTitle,
    bold: true,
    color: colors.ink,
    charSpacing: tracking.tight,
    lineSpacingMultiple: lineHeight.tight,
  });

  // 3 case study sulla colonna dark — accent bar in gerarchia DS-compliant
  // (rosso brand per il più affine, grigi per gli altri due)
  const caseAccents = [colors.red, colors.grey500, colors.grey700];
  (p.casi_studio || []).slice(0, 3).forEach((cs, i) => {
    const y = 1.0 + i * 1.95;

    // Accent bar
    s4.addShape('rect', {
      x: margin.outer, y, w: 0.04, h: 1.5,
      fill: { color: caseAccents[i] },
      line: { color: caseAccents[i], width: 0 },
    });

    // Cliente (Aktiv Grotesk Bold)
    s4.addText(cs.cliente || '', {
      x: margin.outer + 0.2, y, w: 5.6, h: 0.4,
      fontFace: fonts.sans,
      fontSize: type.bodyLead,
      bold: true,
      color: colors.white,
    });

    // Progetto
    s4.addText(cs.progetto || '', {
      x: margin.outer + 0.2, y: y + 0.42, w: 5.6, h: 0.35,
      fontFace: fonts.sans,
      fontSize: type.bodySmall,
      color: colors.grey300,
    });

    // KPI (niente emoji — DS vieta)
    if (cs.kpi) {
      s4.addText(cs.kpi, {
        x: margin.outer + 0.2, y: y + 0.78, w: 5.6, h: 0.3,
        fontFace: fonts.sans,
        fontSize: type.meta,
        bold: true,
        color: caseAccents[i] === colors.red ? colors.red : colors.grey300,
      });
    }

    // Perché affine (PT Serif Bold)
    if (cs.perche_affine) {
      s4.addText(cs.perche_affine, {
        x: margin.outer + 0.2, y: y + 1.1, w: 5.6, h: 0.4,
        fontFace: fonts.serif,
        fontSize: type.bodySmall,
        bold: true,
        color: colors.grey500,
        breakLine: true,
        lineSpacingMultiple: lineHeight.serif,
      });
    }
  });

  // Body content sulla colonna chiara (destra)
  s4.addText(d.slide_4_contenuto || '', {
    x: 6.7, y: 2.5, w: 6.4, h: 4.3,
    fontFace: fonts.serif,
    fontSize: type.body,
    bold: true,
    color: colors.grey700,
    breakLine: true,
    lineSpacingMultiple: lineHeight.serif,
  });

  // ─── SLIDE 5: CTA / Closing ───────────────────────────────────────────────
  // Sfondo rosso brand + frame bianco firma.
  const s5 = prs.addSlide();
  s5.background = { color: colors.red };

  addWhiteFrame(s5);
  addLogo(s5, 'white');         // wordmark bianco su rosso
  addSlideNumber(s5, 5);

  addEyebrow(s5, 'Next step', {
    x: margin.outer + 0.2, y: 1.1, w: 12, h: 0.4,
    color: colors.white,
  });

  s5.addText(d.slide_5_titolo || '', {
    x: margin.outer + 0.2, y: 1.8, w: 12.2, h: 2.6,
    fontFace: fonts.sans,
    fontSize: type.hero,
    bold: true,
    color: colors.white,
    charSpacing: tracking.tightest,
    lineSpacingMultiple: lineHeight.tight,
  });

  s5.addText(d.slide_5_contenuto || '', {
    x: margin.outer + 0.2, y: 4.6, w: 10.5, h: 1.8,
    fontFace: fonts.serif,
    fontSize: type.bodyLead,
    bold: true,
    color: colors.white,
    breakLine: true,
    lineSpacingMultiple: lineHeight.serif,
  });

  s5.addText('domino.it   ·   +39 011 544770   ·   Torino & Venezia', {
    x: margin.outer + 0.2, y: 6.85, w: 12, h: 0.3,
    fontFace: fonts.sans,
    fontSize: type.caption,
    color: colors.white,
    charSpacing: tracking.eyebrow,
  });

  // ─── Download ─────────────────────────────────────────────────────────────
  prs.writeFile({
    fileName: `domino-prospect-${(p.nome || 'export').replace(/\s+/g, '-').toLowerCase()}.pptx`,
  });
}
