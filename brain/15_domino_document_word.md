# Documenti Word (.docx) con il Domino Design System

> **Regola di produzione (dal 7 luglio 2026):** ogni documento stampabile (proposta, offerta, analisi, report, one-pager, lettera) nasce come **file .docx nativo** secondo queste regole. Sostituisce il flusso HTML del Document Layer descritto in `14_domino_document_design.md`, che resta come riferimento visivo storico.

È la traduzione del *document layer* del Domino Design System in termini nativi di Word: punti tipografici, colori hex, stili di paragrafo, margini.

---

## 0. Regola di governo

> **Leggibilità prima della grafica.** Un documento si legge, non si proietta.
> Testo nero su bianco, tipografia calma e piccola, **un solo rosso** per regione di pagina.
> Non portare mai nel documento la drammaticità delle slide (display type enormi, sfondi
> animati, foto a tutta pagina, slide rossa di chiusura).

Come costruirlo: genera un **file .docx nativo** (es. con `python-docx`). Definisci gli
**stili di paragrafo e di carattere** elencati sotto e applicali — non impostare formattazione
manuale sparsa. I blocchi con sfondo (callout, chiusura) si realizzano con **tabelle a cella
singola** con riempimento e bordi (in Word/python-docx lo sfondo di paragrafo va impostato via XML,
la tabella è più affidabile).

---

## 1. Pagina

- **Formato:** A4 (21 × 29,7 cm) oppure Letter (21,6 × 27,9 cm) — chiedi/deduci dal contesto.
- **Margini:** 2,1 cm su tutti i lati (equivale a 0,82").
- **Colonna unica.** Nessuna intestazione grafica; solo il piè di pagina ricorrente (§8).

---

## 2. Font

| Ruolo | Font | Se non installato, fallback |
| --- | --- | --- |
| Sans (workhorse) | **Aktiv Grotesk** (pesi: Regular 400, Bold 700, XBold 800) | Helvetica Neue → Arial |
| Serif (solo standfirst e payoff) | **PT Serif Bold** | Georgia → Times New Roman |

- Il corpo del testo è **Aktiv Grotesk Regular**, non il serif.
- **PT Serif Bold** è riservato a due soli usi: il *lead* (standfirst sotto il titolo) e il
  *payoff* di chiusura.
- Il font `DominoType` **non si usa mai** nei documenti.
- Se Aktiv Grotesk non è disponibile sul sistema, usa Arial ovunque: mantiene il tono pulito.

**File font canonici:** `Claude Design/fonts/` (caricati il 7 luglio 2026). Sono le versioni **Trial**: i nomi famiglia interni, da usare come nome font nel .docx, sono questi.

| Uso nel documento | Nome famiglia da scrivere nel .docx | File |
| --- | --- | --- |
| Body, Small, Meta, Eyebrow | `Aktiv Grotesk Trial` (Regular) | `AktivGrotesk_Trial_Rg.ttf` |
| Bold (H-sub, grassetti nel corpo) | `Aktiv Grotesk Trial` + bold | `AktivGrotesk_Trial_Bd.ttf` |
| Titolo, H sezione, Numero sezione, Figure | `Aktiv Grotesk Trial XBold` (famiglia separata — l'XBold non si ottiene col toggle bold) | `AktivGrotesk_Trial_XBd.ttf` |
| Lead e payoff | `PT Serif` + bold | `PT_Serif-Web-Bold.ttf` |

Nella cartella ci sono anche Light, Medium, Hairline, Black e `DominoType.otf`: non si usano nei documenti.

---

## 3. Colori (hex)

| Nome | Hex | Uso |
| --- | --- | --- |
| Nero | `#000000` | Testo, riga masthead |
| Ink | `#0E0E0E` | Unico blocco scuro (chiusura) |
| Bianco | `#FFFFFF` | Pagina, testo su scuro |
| **Rosso Domino** | `#FF303F` | Solo: eyebrow, numeri sezione, marker liste/bullet, barra callout, clausola del payoff |
| Grigio 100 | `#F0F0F0` | Sfondo callout |
| Grigio 300 | `#C0C0C0` | Righe sottili (hairline) |
| Grigio 500 | `#767676` | Testo attenuato (meta) |

**Disciplina del colore:** nero su bianco; il rosso solo negli usi elencati. Nessun altro
colore. Colori accento cliente (maroon `#7F1A3B`, navy `#09314E`) solo se in pagina c'è un
caso studio di quel cliente.

---

## 4. Scala tipografica → punti Word

Valori convertiti dal design system (px) in **punti** per la stampa. Usa questi `pt`.

| Stile | Dimensione | Font / peso | Note | Uso |
| --- | --- | --- | --- | --- |
| **Eyebrow** | 10 pt | Aktiv Regular | MAIUSCOLO, spaziatura +1 pt, colore rosso | Kicker rosso sopra il titolo |
| **Titolo** | 33 pt | Aktiv **XBold** (800) | interlinea 1.0 | Titolo di copertina/masthead |
| **Lead** | 14 pt | **PT Serif Bold** | interlinea 1.5 | Standfirst sotto il titolo |
| **H sezione** | 20 pt | Aktiv **XBold** | interlinea 1.05 | Titolo di sezione |
| **H-sub** | 12 pt | Aktiv XBold/Bold | | Titolo referenza, label agenda |
| **Numero sezione** | 11 pt | Aktiv XBold, **rosso** | | "01", "02"… e marker romani liste |
| **Body** | 11,5 pt | Aktiv Regular | interlinea 1.65, spazio dopo 8 pt | Corpo del testo — il workhorse |
| **Small** | 11 pt | Aktiv Regular | | Testo denso dentro i blocchi |
| **Meta** | 9,5 pt | Aktiv Regular | MAIUSCOLO, spaziatura +0,5 pt | Byline, piè di pagina |
| **Figure** | 28 pt | Aktiv XBold | | Numero-chiave del callout (€, %, ×) |

Interlinea in Word: imposta "multipla" col fattore indicato (es. body = multipla 1.65).

---

## 5. Struttura del documento (nell'ordine)

1. **Masthead** — logo Domino in alto (usa `logo-domino-bcorp.png`, variante scura su carta
   chiara: la versione chiara ha il wordmark bianco e sparisce). Altezza logo ~0,9 cm.
2. **Eyebrow** — kicker rosso maiuscolo (es. "Analisi · CX Design Sprint").
3. **Titolo** — Aktiv XBold 33 pt, anche su due righe.
4. **Lead** — una frase in PT Serif Bold 14 pt.
5. **Byline/meta** — riga maiuscola: "Domino · Torino e Venezia · mese anno".
6. **Riga masthead** — bordo inferiore **nero spesso 2 pt** a piena larghezza che chiude la testata.
7. **Sezioni numerate** — vedi §6.
8. **Blocco di chiusura** (opzionale, uno solo) — vedi §7.

---

## 6. Componenti (come farli in Word)

**Sezione numerata**

- Testa: numero rosso ("01") a sinistra + titolo Aktiv XBold 20 pt sulla stessa riga.
- Corpo: paragrafi Body 11,5 pt.
- ~14 pt di spazio prima di ogni nuova sezione. La testa non deve restare orfana dal corpo
  (imposta "mantieni con successivo").

**Lista classificata** (`I · II · III`)

- Marker romani in grassetto a sinistra + testo.
- Righe separate da hairline grigio `#C0C0C0` (bordo inferiore 1 pt del paragrafo/riga tabella).

**Bullet**

- Quadratino **rosso pieno** `■` come marker (mai pallino tondo). In Word: elenco puntato con
  carattere `■` colorato di rosso.

**Callout** (prezzo / cifra chiave)

- Tabella a cella singola, sfondo grigio `#F0F0F0`, **barra sinistra rossa spessa 4 pt**
  (bordo sinistro cella), padding ~24 pt.
- Dentro: label maiuscola piccola + Figure 28 pt (Aktiv XBold) + nota piccola.

**Agenda** (giorno/fase → descrizione)

- Tabella a due colonne. Riga superiore chiusa da bordo **nero 1 pt**, righe interne separate
  da hairline grigio, chiusura in basso con hairline.
- Colonna sinistra: "Giorno 1" (grassetto) + sottotitolo. Colonna destra: descrizione.

**Referenze** (proof / casi)

- Elenco: titolo in grassetto (H-sub 12 pt) + una riga di descrizione.

**Piè di pagina** (§8).

---

## 7. Blocco di chiusura (una sola superficie scura per documento)

- Tabella a cella singola, sfondo **Ink `#0E0E0E`**, testo bianco, padding ~38 pt.
- Termina con un **payoff in PT Serif Bold** in cui l'ultima clausola è in **rosso `#FF303F`**.
- Massimo **un** blocco scuro per documento, sempre alla fine.

---

## 8. Piè di pagina

- Ricorrente su ogni pagina, stile Meta (9,5 pt maiuscolo).
- Due elementi allineati agli estremi: `Titolo del documento` (sx) · `Domino · Proudly Interactive` (dx).

---

## 9. Regole di impaginazione

- **Blocchi piatti:** nessuna ombra, nessun angolo arrotondato, nessun gradiente.
- **Un solo rosso** per regione. Nessun colore extra.
- Evita che sezioni, callout, referenze e chiusura si spezzino tra due pagine
  ("mantieni righe insieme").
- Interlinea generosa nel corpo (1.65) per la lettura lunga.

---

## 10. Voce (contenuti)

- **Italiano**, sentence case, prima persona plurale diretta, niente emoji.
- Frasi sotto le ~25 parole. Ordine: problema → soluzione → prova.
- I nomi del metodo `Sprint!` si scrivono sempre col `!`.

---

### Nota d'uso per Claude

Quando Andrea chiede un documento (offerta, analisi, report, one-pager, lettera):

1. Chiedi/deduci formato (A4 o Letter) e lingua.
2. Definisci gli stili di §4 nel .docx e applicali.
3. Costruisci nell'ordine di §5, usando i componenti di §6–8.
4. Consegna un **file .docx** pronto, non HTML.
