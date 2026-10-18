// src/designSystem.js
// Domino Design System per le presentazioni .pptx — token condivisi.
// Fonte: brain/16_domino_deck_pptx.md (valori estratti dai deck di riferimento
// "Case IH · European Social 2026" e "CX Forum Rimini · Pitch Domino").
// Se la scheda del Brain cambia, si aggiorna qui: il builder legge solo questi token.
//
// Regola di governo: editoriale, sicuro, alto contrasto. Nero/bianco + un solo
// rosso #FF303F, blocchi flat (niente ombre, raggio 0), tipografia grande.
// Il corpo non scende sotto ~14 pt; solo la chrome sta a 10,5 pt.

// ─── COLORI ─────────────────────────────────────────────────────────────────
// Hex senza "#" (formato pptxgenjs).
export const colors = {
  black:    '000000',  // sfondo slide dark, testo su paper/red
  ink:      '0A0A0A',  // near-black: card e strip su slide dark
  white:    'FFFFFF',  // testo primario su dark, card su paper
  red:      'FF303F',  // unico accento
  paper:    'F0F0F0',  // sfondo slide paper

  // Colori di clienti: solo quando quel case study è in scena.
  clientMaroon: '7F1A3B',
  clientNavy:   '09314E',
};

// Testo attenuato: alpha vero, non grigi equivalenti. pptxgenjs esprime
// l'alpha come "transparency" (0 = pieno, 100 = invisibile).
export const alpha = {
  onPaper: { mute: 40, soft: 45, faint: 58, line: 87 },  // nero al 60 / 55 / 42 / 13 %
  onDark:  { mute: 40, faint: 65, line: 88 },            // bianco al 60 / 35 / 12 %
};

// ─── FONT ───────────────────────────────────────────────────────────────────
// Black, XBold e Medium sono famiglie separate: non si ottengono col bold.
// Fallback PowerPoint: Arial / Georgia. Per destinatari esterni conviene il PDF.
export const fonts = {
  black:  'Aktiv Grotesk Trial Black',   // display, H1, numeri grandi
  xbold:  'Aktiv Grotesk Trial XBold',   // H2, H3, heading card, claim
  medium: 'Aktiv Grotesk Trial Medium',  // subtitle / lead
  sans:   'Aktiv Grotesk Trial',         // corpo (Regular) e, con bold, label/chrome
  serif:  'PT Serif',                    // solo numerali, citazioni, firma (bold)
};

// ─── SCALA TIPOGRAFICA (pt) ─────────────────────────────────────────────────
export const type = {
  display:     96,     // solo cover
  h1:          85.5,   // divisori dark e chiusura
  h2:          57,     // titoli delle slide di contenuto
  h3:          42,
  claim:       33,
  cardHeading: 28.5,
  fact:        52.5,   // KPI (range 34,5–52,5)
  lead:        26.25,  // subtitle / lead (range 24–38,25)
  bodyLarge:   21.75,
  body:        18,
  small:       14.25,
  eyebrow:     15.75,
  eyebrowCard: 12.75,
  micro:       11.25,
  chrome:      10.5,
  numeral:     38.25,  // numerali serif delle liste 01/02/03
  signature:   39.75,  // firma "Domino" in chiusura
  signatureTag: 20.25, // "PROUDLY INTERACTIVE"
  minBody:     14,     // soglia sotto cui il corpo non scende
};

// Tracking in pt (charSpacing di pptxgenjs).
export const tracking = {
  eyebrow:  3.15,  // 0,2 em
  card:     2,
  chrome:   1.7,   // 0,16 em
  display: -1.4,   // ~−1,5 %
  heading: -0.6,
};

export const lineHeight = {
  display: 0.95,
  heading: 1.0,
  body:    1.3,
};

// ─── SLIDE E GRIGLIA ─────────────────────────────────────────────────────────
// 20″ × 11,25″ = 1440 × 810 pt. Le misure sono in pt, il builder converte in pollici.
export const slide = { widthIn: 20, heightIn: 11.25, w: 1440, h: 810 };

export const grid = {
  padX:      90,   // gutter sx/dx
  padTop:    82,   // inset alto del contenuto
  padBottom: 112,  // inset basso del contenuto
  chromeTop: 30,
  chromeBottom: 24,
  gapTitle:  42,
  gapItem:   21,
  cardPad:   22,
};

// Chrome: logo in alto a sinistra, quadratino rosso + etichetta a destra.
export const chrome = {
  logoH:   34.5,
  logoAspect: 2610 / 1350,  // logo Domino + B Corp
  dot:     6,
};

// Fondi fumo (sostituto statico dello shader flow-bg) e loghi, in public/deck/.
// Copie degli asset in Brain/Claude Design/deck-skill/assets/.
export const assetPaths = {
  smokeCover:   '/deck/smoke-01-cover.jpg',
  smokeDivider: '/deck/smoke-02-divider.jpg',
  smokeClosing: '/deck/smoke-03-closing.jpg',
  logoOnDark:   '/deck/logo-on-dark.png',
  logoOnLight:  '/deck/logo-on-light.png',
  logoOnRed:    '/deck/logo-on-red.png',  // tutto nero: il marchio rosso sparirebbe sul rosso
};
