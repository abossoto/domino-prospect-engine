// src/designSystem.js
// Domino Design System — tokens condivisi (colori, type, dimensioni canvas).
// Fonte: Domino Design System v1 (project Claude Design 63d38cf9-...).
// Le costanti possono essere usate sia dalla UI React (con prefisso "#"
// per i colori) sia dal PPT builder.
//
// Regola d'oro del DS: solo nero, bianco e rosso #FF303F come brand.
// I client accents (maroon, navy) si usano SOLO nelle case study.
// I sector accents non si usano nei materiali sales generici.

// ─── COLORI ─────────────────────────────────────────────────────────────────
// Hex senza "#" (formato richiesto da pptxgenjs).
// Per la UI React si possono comporre come `#${colors.red}`.
export const colors = {
  // Core
  black:    '000000',
  ink:      '0E0E0E',  // near-black per superfici UI
  white:    'FFFFFF',
  red:      'FF303F',  // signature red — unico accent brand

  // Greys (dal DS — niente grigi inventati)
  grey100:  'F0F0F0',  // page bg
  grey300:  'C0C0C0',  // dividers
  grey500:  '767676',  // muted copy
  grey700:  '222222',  // dark tag bg
  grey800:  '272727',  // menu dividers

  // Client accents — esistono SOLO nelle case study, non in UI generica
  clientMaroon: '7F1A3B',
  clientNavy:   '09314E',
};

// ─── TIPOGRAFIA ──────────────────────────────────────────────────────────────
// Famiglie del DS. PowerPoint le risolve così:
// - Font installato sul sistema → render perfetto (target: Mac con font Domino).
// - Font non installato → fallback automatico (Helvetica/Calibri/Arial).
// Nota: pptxgenjs non supporta una fallback chain inline come il CSS.
// Specifichiamo solo il primo nome del DS e ci affidiamo al fallback PowerPoint.
export const fonts = {
  sans:    'Aktiv Grotesk',  // workhorse — Regular 400 / Bold 700 / XBold 800
  serif:   'PT Serif',       // body lungo + lead editoriali (solo Bold)
  display: 'DominoType',     // sign-off / chiusura — MAI body o headings
};

// Scala tipografica (pt) — adattata da scala web del DS per slide 13.33"×7.5".
// La conversione web→PPT non è 1:1: in slide servono dimensioni più contenute.
export const type = {
  display:    72,   // editoriale, raro
  hero:       44,   // hero H1 (web fs-4xl 58px → 44pt slide)
  h1:         36,
  h2:         28,
  cardTitle:  22,
  subhead:    20,
  bodyLead:   16,
  body:       14,   // PT Serif Bold standard
  bodySmall:  12,
  meta:       11,   // logo wordmark, nav
  eyebrow:    10,   // ALL CAPS labels
  caption:     9,   // fine print, footer
};

// Char spacing (pt). pptxgenjs misura il tracking in punti tipografici.
// Il DS web usa 4.3px per l'eyebrow, che a queste dimensioni di slide ≈ 3pt.
export const tracking = {
  eyebrow:   3,    // ALL CAPS labels
  flat:      0,
  tight:    -0.5,  // headline condensate
  tightest: -1,
};

// Line spacing — moltiplicatori (pptxgenjs lineSpacingMultiple).
export const lineHeight = {
  tight: 1.0,    // headings — impilate, zero aria
  snug:  1.15,
  body:  1.5,    // body sans
  serif: 1.55,   // PT Serif body
};

// ─── CANVAS / GEOMETRIA ──────────────────────────────────────────────────────
// pptxgenjs LAYOUT_WIDE = 13.333" × 7.5" (16:9).
export const canvas = {
  width:  13.333,
  height:  7.5,
};

// Margini standard.
export const margin = {
  outer:  0.4,    // sx/dx/top
  bottom: 0.5,
  frame:  0.2,    // frame bianco "firma" attorno hero/CTA (= 20px web del DS)
};

// Domino tiles — brand chrome in alto a destra (46×46 px web ≈ 0.4"×0.4").
export const tiles = {
  size: 0.4,    // pollici
  gap:  0.05,   // gap tra le due tile
};
