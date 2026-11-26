# 14 · Design dei documenti — Document Layer HTML (riferimento storico)

> Versione 1.2 — 26 novembre 2026 (v1.1 del 7 luglio 2026). **Superato come regola di produzione:** dal 7 luglio 2026 i documenti stampabili nascono come .docx nativo secondo [`15_domino_document_word.md`](15_domino_document_word.md). Questo file resta il riferimento visivo del Document Layer e la guida per gli eventuali deliverable HTML (pagine web, prototipi). Sorgenti canonici in [`Claude Design/document-layer/`](Claude%20Design/document-layer/) (doc-tokens.css, doc-components.css, DOCUMENTS.md, README.md).

## Quando si applica

Solo ai deliverable che nascono come **HTML autonomo** (pagine web, prototipi stampabili via browser). Per proposte, offerte, analisi, report, one-pager e lettere vale il flusso .docx del file 15. Gerarchia tipografica, disciplina colore e voce sono le stesse nei due formati; qui la scala è in px, nel 15 in pt.

Non si applica ai deck (1920×1080, layer scuro separato) né al sito. **Mai portare il dramma da deck in un documento**: niente display type, niente `<flow-bg>`, niente fotografia full-bleed, niente slide rossa di chiusura.

## Principio di governo

**Leggibilità prima della grafica.** Un documento si legge, non si proietta. Tipografia calma e piccola, riga di testo con lunghezza limitata, pagina quasi tutta nero su bianco. Il colore si spende con parsimonia: un solo accento rosso per regione di pagina.

## Fondamenta

Stessa palette del brand — nero, bianco e un solo rosso `#FF303F` — stessi font (Aktiv Grotesk + PT Serif Bold), griglia 4-pt, regola "blocky flat": niente ombre, niente gradienti, niente angoli arrotondati.

- **Aktiv Grotesk Regular** è il corpo del testo (non il serif: su molti paragrafi il sans legge meglio). XBold per titoli e heading.
- **PT Serif Bold** è riservato a due soli punti: lo standfirst sotto il titolo e il payoff di chiusura.
- **DominoType mai nei documenti.**
- Niente emoji, mai. Icone solo se indispensabili: Lucide, stroke 1.5–2, segnalando la sostituzione.

## Struttura canonica del documento

1. **Masthead**: logo `Claude Design/deck-skill/assets/logo-domino-bcorp-su-chiaro.png` (la variante `-su-scuro` è vietata su foglio chiaro: il wordmark bianco sparisce).
2. **Eyebrow**: kicker nero in maiuscoletto tracciato (tipo documento).
3. **Titolo** Aktiv XBold, anche su due righe.
4. **Lead**: una frase di standfirst in PT Serif Bold.
5. **Byline/meta**: "Domino · Torino e Venezia · mese anno" in caps tracciato.
6. **Regola nera pesante** (2px) che chiude il masthead.
7. **Sezioni numerate** `01…NN`: numero rosso + titolo Aktiv XBold, corpo in Aktiv Regular.
8. **Chiusura**: un solo blocco scuro (`#0E0E0E`) a fine documento, con payoff in PT Serif e clausola finale in rosso.
9. **Footer ricorrente**: titolo documento · "Domino · Proudly Interactive".

## Scala tipografica

| Token | Dimensione | Font / peso | Uso |
| --- | --- | --- | --- |
| eyebrow | 13 px | Aktiv Regular, caps, +1,33px (= +1 pt Word) | Kicker nero sopra il titolo |
| title | 44 px | Aktiv XBold | Titolo di copertina/masthead |
| lead | 19 px | PT Serif Bold | Standfirst sotto il titolo |
| h | 27 px | Aktiv XBold | Titolo di sezione |
| h-sub | 16 px | Aktiv XBold/Bold | Titolo ref, label agenda, marker |
| num | 15 px | Aktiv XBold, rosso | Numero di sezione |
| body | 15.5 px | Aktiv Regular, lh 1.2 (singola, come Word) | Corpo — il cavallo da lavoro |
| small | 14.5 px | Aktiv Regular | Testo denso dentro i blocchi |
| meta | 12.5 px | Aktiv Regular, caps, +0,67px (= +0,5 pt Word) | Byline, footer |
| figure | 38 px | Aktiv XBold | Numero in evidenza nel callout (€, %, ×) |

## Componenti disponibili (doc-components.css)

`.doc` (wrapper), `.doc-masthead`/`.doc-logo`, `.doc-eyebrow`, `.doc-title`, `.doc-lead`, `.doc-byline`/`.doc-meta`, `.doc-rule`, `.doc-section`/`.doc-section-num`/`.doc-section-title`, `.doc-list` (lista ordinata con marker romani I · II · III e righe hairline), `.doc-bullets` (bullet a **quadrato rosso pieno, mai punti tondi**), `.doc-callout` (blocco grigio con barra rossa a sinistra — prezzo o cifra chiave), `.doc-agenda` (griglia a due colonne giorno/fase → descrizione), `.doc-refs` (lista prove: titolo bold + una riga), `.doc-closing`/`.doc-payoff` (blocco scuro di chiusura), `.doc-footer`.

## Regole di layout

- Pagina Letter o A4, margine 0.82in; ritmo verticale 38px tra sezioni.
- **Disciplina colore**: testo nero su bianco; il rosso come segno: numeri di sezione, marker di liste e bullet, barra del callout e clausola del payoff. Il testo piccolo (kicker, label, sottotitoli) è nero. Nessun altro colore. I colori accento dei clienti (maroon IBM Watson, navy Iveco) compaiono solo se il lavoro di quel cliente è in pagina.
- **Un solo blocco scuro per documento**, alla fine.
- Blocchi piatti: callout grigio `#F0F0F0`, chiusura ink `#0E0E0E` — senza ombra, raggio o gradiente.
- Igiene di impaginazione: sezioni, callout, refs e blocco di chiusura non si spezzano tra pagine; il titolo di sezione non resta mai orfano dal suo corpo.

## Caricamento e autonomia del file

Ordine di caricamento canonico: `colors_and_type.css` → `doc-tokens.css` → `doc-components.css` → `doc-page.js` (shell `<doc-page size margin>` che governa la geometria di stampa — non scrivere `@page` a mano). Skeleton completo in [`Claude Design/document-layer/DOCUMENTS.md`](Claude%20Design/document-layer/DOCUMENTS.md).

**Nota pratica**: il pacchetto in cartella contiene `doc-tokens.css`, `doc-components.css` e (in `Claude Design/deck-skill/`) `colors_and_type.css`; `doc-page.js` non è incluso (DATI NON TROVATI). Quando si produce un documento senza accesso a quei file, l'HTML va reso **autonomo**: CSS inline, variabili base definite a mano (`--domino-red: #FF303F`, `--domino-ink: #0E0E0E`, `--domino-grey-100: #F0F0F0`, `--domino-grey-300: #C0C0C0`, `--domino-grey-500: #767676`, nero/bianco puri; per `--domino-ink-2`: `rgb(20, 19, 16)` = `#141310`), font con fallback (`Aktiv Grotesk, "Helvetica Neue", Arial, sans-serif` / `"PT Serif", Georgia, serif`) e paginazione via `@media print`.

## Voce nei documenti

Italiano curato, sentence case, prima persona plurale, frasi sotto le ~25 parole, ordine problema → soluzione → prova. Nomi dei metodi sempre verbatim con il `!` (Core Sprint!, Design Sprint!, Build Sprint!, Brain & Identity Design Sprint!, Trainstorming Sprint!). Valgono tutte le regole ferme del CLAUDE.md: mai "agenzia" in auto-definizione, mai il verbo "firmare", "nostra soluzione" nella Core Hypothesis, DATI NON TROVATI dove il dato manca.

## README del pacchetto

Dal 26 novembre 2026 il [`README.md`](Claude%20Design/document-layer/README.md) contiene solo le regole visive e tipografiche: la sezione su naming, metodi e posizionamento è stata tolta per non duplicare il Brain. Per offerta, metodi, prezzi e naming commerciale fa fede il Brain (CLAUDE.md e file 01–13).

## Riferimento

Implementazione canonica citata dal design system: `Air Dolomiti · CX Design Sprint.dc.html` (masthead, otto sezioni numerate, lista risultati a marker romani, agenda a due colonne, callout €10.000, lista referenze, blocco scuro di chiusura). Il file HTML non è in questa cartella; in `Clienti/Air Dolomiti/2026_CX Design Sprint!/01_proposta/` c'è il PDF derivato.

Ponte tra Brain e Claude Design (flussi e template dei brief): `Claude Design/00_PONTE_brain_claude_design.md`.
