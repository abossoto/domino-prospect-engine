// src/dossierBuilder.js
// Esportazione dossier Word del Prospect Engine (proposta C4).
// Speculare a pptBuilder.js: gira lato client, scarica il .docx via Blob.
// La struttura visiva replica il sample approvato (Domino_Prospect_Dossier_SAMPLE_Technogym.docx)
// e segue il Domino Design System (rosso #FF303F, ink, sand, accent, Arial).
//
// La funzione exportDossier(result, options?) viene chiamata dall'App; il test
// runner usa buildDossierDocument(result, options) per ottenere il Document e
// passarlo a Packer.toBuffer in ambiente Node.

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, ExternalHyperlink
} from 'docx';

// ─── Palette dossier (hex senza "#", come pptxgenjs/docx richiedono) ──────────
const RED       = 'FF303F';
const DARK      = '1A1A1A';
const GREY      = '5A5A5A';
const ACCENT_BG = 'FBE7E9';
const SAND      = 'F7F4EE';

const NA = 'DATI NON TROVATI';

// ─── Helpers di rendering ─────────────────────────────────────────────────────
function safe(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  return String(v);
}
function withFallback(v) {
  const s = safe(v);
  return s.length ? s : NA;
}
function isMissing(v) {
  return safe(v).length === 0;
}

function runs(parts) {
  return parts.map(p => {
    if (typeof p === 'string')   return new TextRun({ text: p, font: 'Arial', size: 22 });
    if (p.b)                     return new TextRun({ text: p.b, bold: true, font: 'Arial', size: 22 });
    if (p.i)                     return new TextRun({ text: p.i, italics: true, font: 'Arial', size: 22, color: GREY });
    if (p.c)                     return new TextRun({ text: p.c, font: 'Consolas', size: 20, color: GREY });
    if (p.red)                   return new TextRun({ text: p.red, bold: true, color: RED, font: 'Arial', size: 22 });
    if (p.small)                 return new TextRun({ text: p.small, font: 'Arial', size: 18, color: GREY });
    if (p.link) return new ExternalHyperlink({
      link: p.link.url,
      children: [new TextRun({ text: p.link.text, font: 'Arial', size: 20, color: '1A56DB', underline: {} })]
    });
    return new TextRun({ text: '', font: 'Arial', size: 22 });
  });
}

const Para = (parts, opts = {}) => new Paragraph({
  spacing: { after: 140, line: 300 },
  alignment: AlignmentType.JUSTIFIED,
  ...opts,
  children: runs(parts),
});

const P = (text = '', opts = {}) => new Paragraph({
  spacing: { after: 140, line: 300 },
  alignment: AlignmentType.LEFT,
  ...opts,
  children: typeof text === 'string'
    ? [new TextRun({ text, font: 'Arial', size: 22 })]
    : text,
});

const H1 = (text, num) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 480, after: 200 },
  children: [
    new TextRun({ text: num ? `${num}.  ` : '', bold: true, color: RED,  font: 'Arial', size: 32 }),
    new TextRun({ text,                          bold: true, color: DARK, font: 'Arial', size: 32 }),
  ],
});

const H2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 140 },
  children: [new TextRun({ text, bold: true, color: DARK, font: 'Arial', size: 26 })],
});

const eyebrow = (text) => new Paragraph({
  spacing: { before: 0, after: 80 },
  children: [new TextRun({
    text: text.toUpperCase(),
    bold: true, color: RED, font: 'Arial', size: 16, characterSpacing: 60,
  })],
});

function cellBox({ shadeColor = SAND, leftBorderColor = RED, content, leftBorderSize = 24 }) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [9026],
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: 9026, type: WidthType.DXA },
        shading: { fill: shadeColor, type: ShadingType.CLEAR },
        margins: { top: 200, bottom: 200, left: 280, right: 240 },
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 4,                color: shadeColor },
          bottom: { style: BorderStyle.SINGLE, size: 4,                color: shadeColor },
          left:   { style: BorderStyle.SINGLE, size: leftBorderSize,   color: leftBorderColor },
          right:  { style: BorderStyle.SINGLE, size: 4,                color: shadeColor },
        },
        children: content,
      })],
    })],
  });
}

const tableBorder  = { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' };
const tableBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

// ─── Date formatter per metadata strip ────────────────────────────────────────
function formatItalianDate(d = new Date()) {
  const months = [
    'gennaio','febbraio','marzo','aprile','maggio','giugno',
    'luglio','agosto','settembre','ottobre','novembre','dicembre'
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Slugify per filename ─────────────────────────────────────────────────────
function slugify(s) {
  return safe(s)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'export';
}

// ─── Sezioni del dossier ──────────────────────────────────────────────────────

function buildTitleBlock(result, options) {
  const p = result.prospect || {};
  const name   = withFallback(p.nome || options.prospectName);
  const sector = withFallback(p.settore);
  const today  = formatItalianDate();
  const layerLabel = options.layerLabel || withFallback(options.layer);
  const motionLabel = options.motionLabel || withFallback(options.motion);
  const engineVersion = options.engineVersion || 'v4.0.0';

  return [
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({
        text: 'DOMINO  ·  PROSPECT ENGINE',
        bold: true, font: 'Arial', size: 16, color: RED, characterSpacing: 60,
      })],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: 'Dossier Prospect', font: 'Arial', size: 28, color: GREY })],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: name, bold: true, font: 'Arial', size: 56, color: DARK })],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [new TextRun({
        text: sector, font: 'Arial', size: 24, color: GREY, italics: true,
      })],
    }),

    // Metadata strip (3 colonne dark)
    new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: [3000, 3000, 3026],
      rows: [new TableRow({
        children: [
          metaCell('GENERATO IL', today),
          metaCell('LAYER · MOTION', `${layerLabel} · ${motionLabel}`),
          metaCell('VERSIONE ENGINE', engineVersion, true),
        ],
      })],
    }),

    P(''),
  ];
}

function metaCell(label, value, isLast = false) {
  return new TableCell({
    width: { size: isLast ? 3026 : 3000, type: WidthType.DXA },
    shading: { fill: DARK, type: ShadingType.CLEAR },
    margins: { top: 160, bottom: 160, left: 200, right: 120 },
    borders: {
      top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right:  isLast
        ? { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
        : { style: BorderStyle.SINGLE, size: 4, color: 'FFFFFF' },
    },
    children: [
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({
          text: label, bold: true, font: 'Arial', size: 14, color: 'FF6B6B', characterSpacing: 50,
        })],
      }),
      new Paragraph({
        children: [new TextRun({ text: value, font: 'Arial', size: 22, color: 'FFFFFF' })],
      }),
    ],
  });
}

// 1. Sintesi esecutiva
function buildSection1(result) {
  const p = result.prospect || {};
  const ss = p.strumenti_suggeriti || {};
  const out = [H1('Sintesi esecutiva', '1')];

  if (p.hook) {
    out.push(Para([
      { b: 'Hook strategico: ' }, safe(p.hook),
    ]));
  }

  const profile = [];
  if (p.settore)      profile.push(`settore ${p.settore}`);
  if (p.dimensione)   profile.push(p.dimensione.toLowerCase());
  if (p.mercati)      profile.push(`mercati: ${p.mercati}`);
  if (profile.length) {
    out.push(Para([
      { b: `${withFallback(p.nome)}: ` }, profile.join(', '), '. ',
      ...(p.decisore_target ? [{ b: 'Decisore target: ' }, safe(p.decisore_target), '.'] : []),
    ]));
  }

  const tools = [
    ss.core_sprint && 'Core Sprint!',
    ss.design_sprint_tipo && `${ss.design_sprint_tipo} Design Sprint!`,
    ss.preventivo_emozionale && 'Preventivo Emozionale',
  ].filter(Boolean);
  if (tools.length) {
    out.push(Para([
      { b: 'Sales play consigliato: ' }, tools.join(', '), '.',
    ]));
  } else {
    out.push(Para([{ i: `Sales play: ${NA}.` }]));
  }

  return out;
}

// 2. Profilo aziendale
function buildSection2(result) {
  const p = result.prospect || {};
  const out = [H1('Profilo aziendale', '2'), H2('Anagrafica')];

  out.push(Para([
    { b: 'Ragione sociale: ' }, withFallback(p.nome), '. ',
    { b: 'Settore: ' },         withFallback(p.settore), '. ',
    { b: 'Dimensione: ' },      withFallback(p.dimensione), '. ',
    { b: 'Fatturato stimato: ' }, withFallback(p.fatturato_stimato), '. ',
    { b: 'Mercati: ' },         withFallback(p.mercati), '.',
  ]));

  out.push(H2('Maturità digitale'));
  out.push(isMissing(p.maturita_digitale)
    ? Para([{ i: NA }])
    : Para([safe(p.maturita_digitale)]));

  if (Array.isArray(p.persone_chiave) && p.persone_chiave.length) {
    out.push(H2('Persone chiave'));
    p.persone_chiave.forEach(pk => {
      const meta = [pk.ruolo, pk.anzianita].filter(Boolean).join(' · ');
      out.push(Para([
        { b: withFallback(pk.nome) }, meta ? ` — ${meta}` : '',
      ]));
    });
  }

  return out;
}

// 3. Persona target
function buildSection3(result, options) {
  const p = result.prospect || {};
  const decisor = withFallback(p.decisore_target);
  const layerLabel = options.layerLabel || withFallback(options.layer);
  const out = [
    H1('Persona target identificata', '3'),
    cellBox({
      shadeColor: SAND,
      content: [
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: decisor, bold: true, font: 'Arial', size: 26, color: DARK })],
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({
            text: `Layer GTM: ${layerLabel}`,
            italics: true, color: GREY, font: 'Arial', size: 20,
          })],
        }),
        new Paragraph({
          spacing: { after: 100, line: 280 },
          children: [
            new TextRun({ text: 'Hook. ', bold: true, font: 'Arial', size: 22, color: DARK }),
            new TextRun({ text: withFallback(p.hook), font: 'Arial', size: 22 }),
          ],
        }),
      ],
    }),
    P(''),
    Para([
      { small: 'Fonte: ' },
      { c: '07_domino_gtm_b2b.md (e fratelli 08–11)' },
      { small: '  ·  classificazione automatica del Prospect Engine sui segnali raccolti.' },
    ]),
  ];
  return out;
}

// 4. Segnali recenti
function buildSection4(result) {
  const segnali = (result.prospect && result.prospect.segnali_recenti) || [];
  const out = [
    H1('Segnali recenti', '4'),
    Para([
      { i: 'Ogni segnale è verificato con citation-check sul campo ' },
      { c: 'fonte_url' },
      { i: '. Vengono scartati i segnali senza URL HTTP valido (logica già nel server).' },
    ]),
  ];

  if (!segnali.length) {
    out.push(Para([{ i: `${NA}: nessun segnale verificabile per questo prospect.` }]));
    return out;
  }

  segnali.forEach(s => {
    out.push(cellBox({
      shadeColor: 'FAFAFA',
      leftBorderColor: RED,
      leftBorderSize: 16,
      content: [
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({
            text: withFallback(s.testo), bold: true, font: 'Arial', size: 22, color: DARK,
          })],
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({
            text: (safe(s.data) || NA).toUpperCase(),
            font: 'Arial', size: 14, color: RED, characterSpacing: 50, bold: true,
          })],
        }),
        new Paragraph({
          spacing: { after: 0 },
          children: [
            new TextRun({ text: 'Fonte: ', font: 'Arial', size: 18, color: GREY }),
            new ExternalHyperlink({
              link: s.fonte_url,
              children: [new TextRun({
                text: safe(s.fonte_titolo) || s.fonte_url,
                font: 'Consolas', size: 18, color: '1A56DB', underline: {},
              })],
            }),
          ],
        }),
      ],
    }));
    out.push(P(''));
  });

  return out;
}

// 5. Proof attivabili (mappato sui casi_studio del JSON)
function buildSection5(result) {
  const casi = (result.prospect && result.prospect.casi_studio) || [];
  const out = [
    H1('Proof attivabili (referenze coerenti)', '5'),
    Para([
      'Il Prospect Engine seleziona casi studio coerenti con settore, sub-target e metodologia (regola dei 3, ',
      { c: '04_domino_case_history.md' }, ' + ', { c: '06_domino_referenze.md' }, ').',
    ]),
  ];

  if (!casi.length) {
    out.push(Para([{ i: `${NA}: nessun caso studio agganciato in output.` }]));
    return out;
  }

  const labels = ['CASE PIÙ AFFINE', 'STESSO SETTORE', 'METODOLOGIA SPECIFICA'];
  casi.slice(0, 3).forEach((cs, i) => {
    out.push(cellBox({
      shadeColor: SAND,
      content: [
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: `${labels[i] || 'CASE'}  ·  `,
              bold: true, color: RED, font: 'Arial', size: 14, characterSpacing: 60,
            }),
            new TextRun({
              text: `${withFallback(cs.cliente)} — ${withFallback(cs.progetto)}`,
              bold: true, font: 'Arial', size: 22, color: DARK,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 80, line: 280 },
          children: [new TextRun({
            text: cs.kpi ? `KPI: ${cs.kpi}` : `KPI: ${NA}`,
            font: 'Arial', size: 22,
          })],
        }),
        new Paragraph({
          spacing: { after: 0 },
          children: [
            new TextRun({ text: 'Coherence rule: ', bold: true, font: 'Arial', size: 18, color: GREY }),
            new TextRun({
              text: withFallback(cs.perche_affine), font: 'Arial', size: 18, color: GREY,
            }),
            new TextRun({ text: '  ·  Fonte: ', font: 'Arial', size: 18, color: GREY }),
            new TextRun({ text: '04_domino_case_history.md', font: 'Consolas', size: 18, color: GREY }),
          ],
        }),
      ],
    }));
    out.push(P(''));
  });

  return out;
}

// 6. Mail di primo contatto
function buildSection6(result, options) {
  const mail = result.mail || {};
  const oggetto = withFallback(mail.oggetto);
  const corpo   = withFallback(mail.corpo);
  const corpoLines = corpo.split(/\r?\n/);
  const layerLabel = options.layerLabel || withFallback(options.layer);
  const motionLabel = options.motionLabel || withFallback(options.motion);

  const corpoParas = corpoLines.map(line => new Paragraph({
    spacing: { after: 140, line: 320 },
    children: [new TextRun({ text: line, font: 'Arial', size: 22 })],
  }));

  return [
    H1('Mail di primo contatto', '6'),
    cellBox({
      shadeColor: 'FFFFFF',
      leftBorderColor: DARK,
      leftBorderSize: 16,
      content: [
        eyebrow('Subject'),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: oggetto, bold: true, font: 'Arial', size: 26, color: DARK })],
        }),
        eyebrow('Mittente · Destinatario'),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: 'Da: ', bold: true, font: 'Arial', size: 20, color: GREY }),
            new TextRun({ text: 'Domino · Proudly Interactive  ', font: 'Arial', size: 20, color: DARK }),
            new TextRun({ text: '  →  ', font: 'Arial', size: 20, color: GREY }),
            new TextRun({ text: 'A: ', bold: true, font: 'Arial', size: 20, color: GREY }),
            new TextRun({ text: withFallback(result.prospect?.decisore_target), font: 'Arial', size: 20, color: DARK }),
          ],
        }),
        eyebrow('Corpo'),
        ...corpoParas,
      ],
    }),
    P(''),
    Para([
      { small: 'Layer: ' },  { c: layerLabel },
      { small: '  ·  Motion: ' }, { c: motionLabel },
      { small: '  ·  Length: ' }, { c: `${corpo.length} caratteri` },
    ]),
  ];
}

// 7. LinkedIn
function buildSection7(result) {
  const li = result.linkedin || {};
  const messaggio = withFallback(li.messaggio);
  const tipo      = withFallback(li.tipo);

  return [
    H1('Messaggio LinkedIn', '7'),
    cellBox({
      shadeColor: 'FFFFFF',
      leftBorderColor: '0A66C2',
      leftBorderSize: 16,
      content: [
        eyebrow(`${tipo} — ${messaggio.length} caratteri`),
        new Paragraph({
          spacing: { after: 0, line: 320 },
          children: [new TextRun({ text: messaggio, font: 'Arial', size: 22 })],
        }),
      ],
    }),
    P(''),
    Para([
      { small: 'Tipo: ' }, { c: tipo },
      { small: '  ·  Lunghezza: ' }, { c: `${messaggio.length}/300 char` },
      ...(messaggio.length > 300 ? [{ small: '  ·  ' }, { red: '⚠ sopra il limite raccomandato' }] : []),
    ]),
  ];
}

// 8. Deck
function buildSection8(result) {
  const d = result.deck || {};
  const slides = [
    { n: '01', title: d.slide_1_titolo, content: d.slide_1_contenuto, style: 'Hero — sfondo dark, frame bianco firma.' },
    { n: '02', title: d.slide_2_titolo, content: d.slide_2_contenuto, style: 'Sfondo bianco, accent bar rossa.' },
    { n: '03', title: d.slide_3_titolo, content: d.slide_3_contenuto, style: 'Soluzione + strip strumenti in basso.' },
    { n: '04', title: d.slide_4_titolo || "Chi l'ha fatto con noi", content: d.slide_4_contenuto, style: 'Split layout: case visivo a sinistra, KPI a destra.' },
    { n: '05', title: d.slide_5_titolo, content: d.slide_5_contenuto, style: 'CTA — sfondo rosso brand, frame bianco firma.' },
  ];

  const out = [
    H1('Deck 5 slide — sintesi', '8'),
    Para([
      'Il deck viene prodotto come PPTX brandizzato (Domino Design System v1, Aktiv Grotesk + PT Serif, accent rosso ',
      { c: '#FF303F' }, '). Sintesi qui per il dossier.',
    ]),
    P(''),
  ];

  slides.forEach(s => {
    out.push(cellBox({
      shadeColor: 'FFFFFF',
      leftBorderColor: RED,
      leftBorderSize: 16,
      content: [
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: s.n, bold: true, color: RED, font: 'Arial', size: 28 }),
            new TextRun({ text: '  ·  ', color: GREY, font: 'Arial', size: 22 }),
            new TextRun({ text: withFallback(s.title), bold: true, color: DARK, font: 'Arial', size: 22 }),
          ],
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: s.style, italics: true, color: GREY, font: 'Arial', size: 18 })],
        }),
        new Paragraph({
          spacing: { after: 0, line: 280 },
          children: [new TextRun({ text: withFallback(s.content), font: 'Arial', size: 22 })],
        }),
      ],
    }));
    out.push(P(''));
  });

  return out;
}

// 9. Workflow
function buildSection9(result) {
  const wf = Array.isArray(result.workflow) ? result.workflow : [];
  const out = [
    H1('Workflow di sequenza — 14 giorni', '9'),
    Para([
      'Sequenza multicanale generata dall\'engine. Ogni touchpoint riporta canale e azione attesa. Stop condition: reply o opt-out.',
    ]),
    P(''),
  ];

  if (!wf.length) {
    out.push(Para([{ i: `${NA}: workflow non popolato in output.` }]));
    return out;
  }

  out.push(new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [1100, 1500, 6426],
    rows: [
      new TableRow({
        tableHeader: true,
        children: ['GIORNO','CANALE','AZIONE'].map(h => new TableCell({
          borders: tableBorders,
          shading: { fill: DARK, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
          children: [new Paragraph({
            children: [new TextRun({
              text: h, bold: true, color: 'FFFFFF', font: 'Arial', size: 18, characterSpacing: 30,
            })],
          })],
        })),
      }),
      ...wf.map((step, i) => new TableRow({
        children: [`Gg ${withFallback(step.giorno)}`, withFallback(step.canale), withFallback(step.azione)]
          .map((cell, j) => new TableCell({
            borders: tableBorders,
            width: { size: [1100, 1500, 6426][j], type: WidthType.DXA },
            shading: { fill: i % 2 ? 'FAFAFA' : 'FFFFFF', type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [new Paragraph({
              spacing: { after: 0, line: 260 },
              children: [new TextRun({
                text: cell,
                font: 'Arial', size: 20, color: DARK,
              })],
            })],
          })),
      })),
    ],
  }));

  return out;
}

// 10. Note operative e integrazioni
function buildSection10(result, options) {
  const out = [
    H1('Note operative e integrazioni', '10'),
    H2('HubSpot CRM'),
    Para([
      'Il match account viene eseguito al click "→ HubSpot" dall\'app. Owner e stato deal sono sincronizzati come ',
      { c: 'note' }, ' sull\'azienda. ',
      { i: 'Funzionalità futura: lookup automatico nel research agent (proposta C3).' },
    ]),
    H2('Engine config usata'),
    Para([
      { b: 'Layer: ' },     options.layerLabel || withFallback(options.layer), '.  ',
      { b: 'Motion: ' },    options.motionLabel || withFallback(options.motion), '.  ',
      { b: 'Modello: ' },   { c: 'claude-sonnet-4-20250514' }, '.  ',
      { b: 'Versione engine: ' }, { c: options.engineVersion || 'v4.0.0' }, '.',
    ]),
    H2('Verifica finale'),
    Para([
      'Tutti i ', { c: 'segnali_recenti' }, ' inclusi hanno ', { c: 'fonte_url' },
      ' HTTP valido (citation-check passato lato server). Notazione canonica Domino verificata su ',
      { c: 'Core Sprint!' }, ', ', { c: 'Trainstorming!' }, ', ', { c: 'Design Sprint!' },
      ' (normalizzazione applicata in ', { c: 'analyze.js' }, ').',
    ]),
  ];
  return out;
}

// ─── Document factory ─────────────────────────────────────────────────────────
export function buildDossierDocument(result, options = {}) {
  const p = result?.prospect || {};
  const headerName = withFallback(p.nome || options.prospectName).toUpperCase();

  const sections = [
    ...buildTitleBlock(result, options),
    ...buildSection1(result),
    ...buildSection2(result),
    ...buildSection3(result, options),
    ...buildSection4(result),
    ...buildSection5(result),
    ...buildSection6(result, options),
    ...buildSection7(result),
    ...buildSection8(result),
    ...buildSection9(result),
    ...buildSection10(result, options),
  ];

  return new Document({
    creator: 'Domino · Prospect Engine',
    title: `Domino Prospect Dossier — ${withFallback(p.nome || options.prospectName)}`,
    description: 'Dossier consolidato prodotto dal Domino Prospect Engine.',
    styles: {
      default: { document: { run: { font: 'Arial', size: 22, color: DARK } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 32, bold: true, color: DARK, font: 'Arial' },
          paragraph: { spacing: { before: 480, after: 200 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 26, bold: true, color: DARK, font: 'Arial' },
          paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      ],
    },
    numbering: {
      config: [
        { reference: 'bullets',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { color: RED } } }] },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 0 },
            children: [new TextRun({
              text: `DOMINO  ·  PROSPECT ENGINE  ·  DOSSIER · ${headerName}`,
              font: 'Arial', size: 14, color: GREY, characterSpacing: 30,
            })],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RED, space: 6 } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'Pagina ', font: 'Arial', size: 16, color: GREY }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: GREY }),
              new TextRun({ text: ' / ', font: 'Arial', size: 16, color: GREY }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 16, color: GREY }),
            ],
          })],
        }),
      },
      children: sections,
    }],
  });
}

// ─── Etichette layer / motion (mirror del frontend) ───────────────────────────
const LAYER_LABELS  = { clevel: 'C-Level', headof: 'Head of', manager: 'Manager / Operativo' };
const MOTION_LABELS = { bottomup: 'Bottom-up', topdown: 'Top-down' };

// ─── Browser-side download trigger ────────────────────────────────────────────
export async function exportDossier(result, options = {}) {
  const opts = {
    ...options,
    layerLabel:  options.layerLabel  || LAYER_LABELS[options.layer]  || options.layer || '',
    motionLabel: options.motionLabel || MOTION_LABELS[options.motion] || options.motion || '',
  };

  const doc = buildDossierDocument(result, opts);
  const blob = await Packer.toBlob(doc);

  const name = result?.prospect?.nome || options.prospectName || 'export';
  const filename = `domino-prospect-dossier-${slugify(name)}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // micro-defer per Safari prima della revoke
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
