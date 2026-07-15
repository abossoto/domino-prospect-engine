# 14 · Design dei documenti — Document Layer HTML (riferimento storico)

> Versione 1.1 — 7 luglio 2026. **Superato come regola di produzione:** dal 7 luglio 2026 i documenti stampabili nascono come .docx nativo secondo [`15_domino_document_word.md`](15_domino_document_word.md). Questo file resta il riferimento visivo del Document Layer e la guida per gli eventuali deliverable HTML (pagine web, prototipi). Sorgenti canonici in [`Claude Design/document-layer/`](Claude%20Design/document-layer/) (doc-tokens.css, doc-components.css, DOCUMENTS.md, README.md).

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

1. **Masthead**: logo `logo-domino-bcorp.png` (variante scura vietata su foglio chiaro: il wordmark bianco sparisce).
2. **Eyebrow**: kicker rosso in maiuscoletto tracciato (tipo documento).
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
| eyebrow | 13 px | Aktiv Regular, caps, +4px | Kicker rosso sopra il titolo |
| title | 44 px | Aktiv XBold | Titolo di copertina/masthead |
| lead | 19 px | PT Serif Bold | Standfirst sotto il titolo |
| h | 27 px | Aktiv XBold | Titolo di sezione |
| h-sub | 16 px | Aktiv XBold/Bold | Titolo ref, label agenda, marker |
| num | 15 px | Aktiv XBold, rosso | Numero di sezione |
| body | 15.5 px | Aktiv Regular, lh 1.65 | Corpo — il cavallo da lavoro |
| small | 14.5 px | Aktiv Regular | Testo denso dentro i blocchi |
| meta | 12.5 px | Aktiv Regular, caps, +2px | Byline, footer |
| figure | 38 px | Aktiv XBold | Numero in evidenza nel callout (€, %, ×) |

## Componenti disponibili (doc-components.css)

`.doc` (wrapper), `.doc-masthead`/`.doc-logo`, `.doc-eyebrow`, `.doc-title`, `.doc-lead`, `.doc-byline`/`.doc-meta`, `.doc-rule`, `.doc-section`/`.doc-section-num`/`.doc-section-title`, `.doc-list` (lista ordinata con marker romani I · II · III e righe hairline), `.doc-bullets` (bullet a **quadrato rosso pieno, mai punti tondi**), `.doc-callout` (blocco grigio con barra rossa a sinistra — prezzo o cifra chiave), `.doc-agenda` (griglia a due colonne giorno/fase → descrizione), `.doc-refs` (lista prove: titolo bold + una riga), `.doc-closing`/`.doc-payoff` (blocco scuro di chiusura), `.doc-footer`.

## Regole di layout

- Pagina Letter o A4, margine 0.82in; ritmo verticale 38px tra sezioni.
- **Disciplina colore**: testo nero su bianco; il rosso solo su kicker, numeri di sezione, marker di liste e bullet, barra del callout e clausola del payoff. Nessun altro colore. I colori accento dei clienti (maroon IBM Watson, navy Iveco) compaiono solo se il lavoro di quel cliente è in pagina.
- **Un solo blocco scuro per documento**, alla fine.
- Blocchi piatti: callout grigio `#F0F0F0`, chiusura ink `#0E0E0E` — senza ombra, raggio o gradiente.
- Igiene di impaginazione: sezioni, callout, refs e blocco di chiusura non si spezzano tra pagine; il titolo di sezione non resta mai orfano dal suo corpo.

## Caricamento e autonomia del file

Ordine di caricamento canonico: `colors_and_type.css` → `doc-tokens.css` → `doc-components.css` → `doc-page.js` (shell `<doc-page size margin>` che governa la geometria di stampa — non scrivere `@page` a mano). Skeleton completo in [`Claude Design/document-layer/DOCUMENTS.md`](Claude%20Design/document-layer/DOCUMENTS.md).

**Nota pratica**: il pacchetto in cartella contiene solo doc-tokens e doc-components; `colors_and_type.css` e `doc-page.js` non sono inclusi (vivono nel Domino Design System su Claude Design). Quando si produce un documento senza accesso a quei file, l'HTML va reso **autonomo**: CSS inline, variabili base definite a mano (`--domino-red: #FF303F`, `--domino-ink: #0E0E0E`, `--domino-grey-100: #F0F0F0`, nero/bianco puri; per `--domino-grey-300`, `--domino-grey-500`, `--domino-ink-2` i valori esatti sono DATI NON TROVATI nel pacchetto — usare neutri coerenti e allineare quando il file canonico è disponibile), font con fallback (`Aktiv Grotesk, "Helvetica Neue", Arial, sans-serif` / `"PT Serif", Georgia, serif`) e paginazione via `@media print`.

## Voce nei documenti

Italiano curato, sentence case, prima persona plurale, frasi sotto le ~25 parole, ordine problema → soluzione → prova. Nomi dei metodi sempre verbatim con il `!` (Core Sprint!, Design Sprint!, Build Sprint!, Brain & Identity Design Sprint!, Trainstorming!). Valgono tutte le regole ferme del CLAUDE.md: mai "agenzia" in auto-definizione, mai il verbo "firmare", "nostra soluzione" nella Core Hypothesis, DATI NON TROVATI dove il dato manca.

## Avvertenza sul README del pacchetto

Il [`README.md`](Claude%20Design/document-layer/README.md) del design system contiene, oltre alle regole visive, contenuti commerciali **non canonici** che contraddicono il Brain: descrive il Core Sprint! come "4-day discovery sprint" (canone: 2 giorni + 5 di consolidamento), elenca varianti Sprint! con naming proprio (Web Design Sprint!, Intranet Design Sprint!, Design System Design Sprint! — canone: Design Sprint! con sei specializzazioni), definisce il Trainstorming! come "travelling brainstorming format" (canone: accompagnamento strutturato). **Per tutto ciò che è offerta, metodi, prezzi e naming commerciale fa fede il Brain (CLAUDE.md e file 01–13), non il README.** Il README resta autoritativo solo per la parte visiva e tipografica.

## Riferimento

Implementazione canonica citata dal design system: `Air Dolomiti · CX Design Sprint.dc.html` (masthead, otto sezioni numerate, lista risultati a marker romani, agenda a due colonne, callout €10.000, lista referenze, blocco scuro di chiusura). Il file HTML non è in questa cartella; in `Proposte Clienti/Air Dolomiti/` c'è il PDF derivato.
