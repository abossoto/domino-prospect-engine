# Presentazioni (Claude Slides e .pptx) con il Domino Design System

> **Versione 3.0 — 26 novembre 2026** (Andrea Bosso). Cambiano: canale di produzione, scala tipografica (valori interi, **corpo minimo 24 pt, nota 16,5 pt, px come misura di riferimento**), fumo su tutte le slide dark, grigi, rosso come segno, foto, tessera ritirata.
>
> **Regola di produzione (dal 26 novembre 2026):** ogni presentazione (pitch deck, sales deck, deck interno, talk) nasce in **Claude Slides** (artifact) secondo queste regole; il **.pptx** e il PDF si esportano da lì. Il **.pptx nativo** costruito per script resta per i casi in cui serve espressamente. Sostituisce la regola del 7 luglio 2026 (".pptx nativo come flusso primario"). La deck skill HTML (`Claude Design/deck-skill/`) è la sorgente di token, componenti, font e asset, non più un canale di produzione.
>
> **Come leggere i valori:** i punti (pt) valgono per il .pptx (slide 20″ × 11,25″ = 1440 × 810 pt); Claude Slides usa la tela 1920 × 1080 px (1 pt = 1,333 px). La tabella del §4 dà entrambi.
>
> **Riferimenti canonici:**
> 1. **`Presentazioni/Presentazione Domino - Novembre 2026.pptx`** (22 slide, 4 novembre 2026) — il più recente: riferimento per i layout (DARK, SMOKE_A/B/C, PAPER, RED). **In caso di disaccordo vince questo.**
> 2. **`Presentazioni/Case IH · European Social 2026.pdf`** (38 slide, luglio 2026) — deck di contenuto.
> 3. **`Presentazioni/CX Forum Rimini · Pitch Domino.pdf`** (13 slide) — pitch breve, dark-dominante.
>
> I valori derivano dai PDF di luglio, arrotondati il 26 novembre 2026. Sui contenuti (offerta, metodi, prezzi, naming) vince il Brain (§12).

---

## 0. Regola di governo

> **Editoriale, sicuro, alto contrasto.** Nero/bianco + un solo rosso `#FF303F`, geometria a blocchi, tipografia grande e stretta. Una slide si proietta, non si legge: il **corpo non scende sotto 24 pt** (27 pt il corpo grande) e le **note** possono stare a 16,5 pt. Sotto stanno solo la chrome (10,5 pt) e le label in maiuscolo (12–15 pt).

Come costruirlo: in Claude Slides su tela **1920 × 1080 px**; per il .pptx nativo con slide **20″ × 11,25″** (= 1440 × 810 pt). La conversione è **px → pt con fattore 0,75** (1 px = 0,75 pt).

Lo shader animato `flow-bg` diventa il **fondo fumo**: in Claude Slides l'immagine del fumo con un movimento CSS lento; nel .pptx e nel PDF un frame statico (PowerPoint non legge il CSS). I frame stanno in `Claude Design/deck-skill/assets/smoke/` (§3).

---

## 1. Slide e griglia

| Token | Valore pptx | Origine (px) |
| --- | --- | --- |
| Slide | **20″ × 11,25″** (1440 × 810 pt) | 1920×1080 |
| Gutter orizzontale (`pad-x`) | 96 pt dai bordi sx/dx | 128 |
| Inset alto contenuto (`pad-top`) | ~82 pt | 110 |
| Inset basso contenuto (`pad-bottom`) | ~112 pt | 150 |
| Chrome top (dall'alto) | 30 pt | 40 |
| Chrome bottom (dal basso) | ~24–27 pt | 36 |
| Gap titolo → contenuto (`gap-title`) | 42 pt | 56 |
| Gap tra card/item (`gap-item`) | 21 pt | 28 |

Il contenuto sta dentro il frame (96 pt laterali, ~82 pt sopra, ~112 pt sotto): non sfora mai, non tocca mai la chrome.

---

## 2. Font

I riferimenti PDF incorporano le famiglie **Trial con pesi distinti** — i nomi famiglia da scrivere nel .pptx sono questi (i file stanno in `Claude Design/deck-skill/fonts/`):

| Ruolo | Nome famiglia nel .pptx | File |
| --- | --- | --- |
| Display, H1, numeri grandi (KPI) | `Aktiv Grotesk Trial Black` (famiglia separata) | `AktivGrotesk-Black.ttf` |
| H2, H3, heading card, claim | `Aktiv Grotesk Trial XBold` (famiglia separata) | `AktivGrotesk-XBold.ttf` |
| Subtitle / lead | `Aktiv Grotesk Trial Medium` (famiglia separata) | `AktivGrotesk-Medium.ttf` |
| Corpo | `Aktiv Grotesk Trial` (Regular) | `AktivGrotesk-Regular.ttf` |
| Label, eyebrow, chrome, meta | `Aktiv Grotesk Trial` + bold | `AktivGrotesk-Bold.ttf` |
| Numerali di sezione, citazioni, firma | `PT Serif` + bold (**corsivo** per numerali e firma) | `PTSerif-Bold.ttf` |

- Black, XBold e Medium sono **famiglie separate**: non si ottengono col toggle bold sul Regular.
- **PT Serif Bold** è l'unico serif: numerali giganti di sezione (corsivi), citazioni, la firma "Domino" in chiusura.
- **DominoType mai** per corpo, heading o UI; solo eventuali chiusure/firme, con parsimonia.
- Fallback: Arial (sans), Georgia (serif). L'embedding font nel .pptx è inaffidabile cross-platform: **per destinatari esterni la consegna preferita è l'export PDF** (come i riferimenti canonici).
- **Limiti noti (26/11/2026):** i font Aktiv Grotesk sono versioni **Trial** (restano così, decisione di Andrea Bosso); PT Serif esiste solo in Bold, quindi il corsivo di numerali e firma è sintetico.

---

## 3. Colori (hex)

| Nome | Hex | Uso |
| --- | --- | --- |
| Nero | `#000000` | Sfondo slide dark, testo su paper/red |
| Near-black | `#0A0A0A` | Riempimento card/strip su slide dark |
| Bianco | `#FFFFFF` | Testo primario su dark, card su paper |
| **Rosso Domino** | `#FF303F` | Unico accento: eyebrow, dot, numerali, barre, delta, slide red |
| Paper | `#F0F0F0` | Sfondo slide paper |

**Testo attenuato: alpha, o la lista chiusa di grigi.** Dove si può, alpha vero (`solidFill` + `alpha`): nero al 60 % / 55 % / 13 % su paper, bianco al 60 % / 35 % / 12 % su dark, come i token CSS (`--c-fg-mute` 60 %, `--c-fg-faint` 35 %, `--c-line` 12 %). Dove l'alpha non c'è (tabelle, grafici, import), **solo questi tre grigi**: `#999999` (testo attenuato su dark), `#6C6C6C` (testo attenuato su paper), `#D2D2D2` (linee su paper). Sono i valori già dominanti nel deck di novembre 2026, al posto delle ~12 varianti trovate (`#737373`, `#6E6E6E`, `#666666`, `#5A5A5A`, `#606060`…). Nessun altro grigio. **DA CONFERMARE (Andrea Bosso):** i tre valori.

**Disciplina del colore:** solo nero, bianco, rosso. Maroon `#7F1A3B` e navy `#09314E` sono colori di *clienti*: solo quando quel case study è in scena. **Rosso come segno** (decisione del 26/11/2026): il rosso `#FF303F` ha contrasto 3,65:1 su bianco, 3,21:1 su paper, 5,75:1 su nero. Si usa come **segno** (barre, trattini, dot, riempimenti, slide red) e per testo **grande** (da 24 pt in su: numerali, numeri fatto, twist dei titoli). Il testo piccolo (eyebrow, kicker, label, delta di tabella) sta in nero o bianco, anche attenuato, mai in rosso. Nei grafici il rosso evidenzia un solo elemento; il resto in nero e grigi. Blocchi flat: niente ombre, niente angoli arrotondati (raggio 0; max ~2 pt su chip/tag).

**Il fondo di ogni slide dark è il fumo, non il nero piatto** (regola del 26/11/2026: tutte le slide dark, non solo cover e divisori). Immagine full-bleed di **fumo rosso su nero**, sostituto dello shader `flow-bg`. Tre frame canonici (3840×2160) sono in `Claude Design/deck-skill/assets/smoke/` (`smoke-01-cover.jpg`, `smoke-02-divider.jpg`, `smoke-03-closing.jpg`): a piena slide, contenuto e chrome sopra. Alterna i frame tra slide vicine. **Mai su paper e su red.** In Claude Slides il fumo si muove con un movimento CSS lento sull'immagine; nell'export .pptx e PDF resta un frame fisso. Nessun gradiente generato in PowerPoint. Il layout DARK del deck di novembre 2026 è ancora senza fumo: da allineare nel template.

---

## 4. Scala tipografica → punti PowerPoint

Valori e pesi osservati nel riferimento Case IH.

**Il px è la misura di riferimento** (tela Claude Slides 1920 × 1080); il pt si ricava con **pt = px × 0,75**. Tutte le misure sono multipli di 4 px, così i pt escono interi o a mezzo punto (scala v3, 26/11/2026). Al posto dei 13 stili precedenti ce ne sono 11 per il testo corrente: «claim» è fuso con «H3», le label in maiuscolo sono due.

| Stile | px (tela Slides) | pt (.pptx) | Font / peso | Note | Uso |
| --- | --- | --- | --- | --- | --- |
| **Display** | 128 px | 96 pt | Aktiv **Black** | interlinea ~0,95, tracking negativo (~−1,5 %), twist in rosso | Solo cover |
| **H1 divider** | 112 px | 84 pt | Aktiv **Black** | idem | Titolo dei divisori di sezione dark e della chiusura |
| **H2** | 80 px | 60 pt | Aktiv **XBold** | il cavallo da lavoro dei titoli | Heading delle slide di contenuto |
| **H3 / agenda / claim** | 56 px | 42 pt | Aktiv **XBold** | clausola finale in rosso nei claim | Titoli agenda, claim e verdetti ("Budget reduced. The content is working.") |
| **Card heading** | 40 px | 30 pt | Aktiv XBold/Black | | Titolo di card / colonna, numerale di lista |
| **Numero fatto** | 52 px | 39 pt | Aktiv **Black** | | KPI, importi nelle card |
| **Cifra grande** | 104 px | 78 pt | Aktiv **Black** | | Facts row e prezzo in evidenza |
| **Subtitle / lead** | 32–52 px (di norma 48) | 24–39 pt (di norma 36) | Aktiv **Medium** | attenuato | Lead sotto i titoli, sottotitoli |
| **Body large** | 36 px | 27 pt | Aktiv Regular | | Corpo primario |
| **Body** | 32 px | 24 pt | Aktiv Regular | | Corpo nelle card e liste: **minimo del corpo** |
| **Nota** | 22 px | 16,5 pt | Aktiv Regular | | Caption, note: l'unico testo corrente sotto il corpo minimo; più in basso solo label in maiuscolo e chrome (§0) |
| **Label / eyebrow** | 20 px | 15 pt | Aktiv Bold | CAPS, tracking 0,2 em, nero, bianco o attenuato (non rosso) | Eyebrow sopra i titoli, brand label |
| **Label di card** | 16 px | 12 pt | Aktiv Bold | CAPS, tracking 0,18 em | Label e kicker dentro card e colonne, dettagli |
| **Chrome** | 14 px | 10,5 pt | Aktiv Bold | CAPS, tracking 0,16 em | Header/footer slide. Eccezione ai minimi |
| **Numerale sezione (serif)** | 40–96 px | 30–72 pt | **PT Serif Bold corsivo** | rosso su paper, bianco/rosso su dark | "01", "I", numerali giganti |
| **Citazione** | 60 px | 45 pt | PT Serif Bold | virgolette 52 px rosse | Quote a piena slide |
| **Firma chiusura** | 52 px | 39 pt | PT Serif Bold corsivo ("Domino") + 28 px caps | | Slide red finale |

---

## 5. Varianti di slide — e quando usarle

1. **Paper `#F0F0F0`** — testo nero (attenuato via alpha), card bianche `#FFFFFF`, hairline nere a bassa alpha. Per tutto ciò che è denso: dati, tabelle, griglie, piani.
2. **Dark `#000000`** — testo bianco, card `#0A0A0A`, hairline bianche al 12 %, **fondo fumo** (§3) su cover, divisori e slide d'impatto.
3. **Red `#FF303F`** — **una sola per deck**, la chiusura. Tutto il testo **nero**, firma "Domino" in PT Serif Bold corsivo.

**Il bilanciamento dipende dal tipo di deck** (entrambi i riferimenti chiudono con una sola red):

- **Deck di contenuto / report** (Case IH, 38 slide): **paper dominante** (~21), dark per cover, divisori, citazioni ed evidenze (~16).
- **Pitch breve** (Rimini, 13 slide): **dark dominante** con fumo quasi ovunque, una sola paper (la slide prezzo/audit).

Il ritmo tipico: cover dark (fumo) → divisori dark tra i capitoli → contenuto paper → chiusura red.

---

## 6. Chrome (su ogni slide)

- **Top:** logo Domino/cliente a sinistra a (96, 30) pt, altezza ~34,5 pt; a destra **quadratino rosso 6×6 pt** (un dot, segno di chrome; non è la tessera domino) + etichetta slide 10,5 pt CAPS Bold tracking 1,7 pt (es. "03 · WHERE WE ARE"). Sulle slide red il dot diventa nero.
- **Bottom:** a ~24 pt dal fondo, due elementi agli estremi, 10,5 pt CAPS Bold: titolo del progetto (sx) · sezione corrente (dx). Colore attenuato (bianco 35 % su dark, nero 55 % su paper, nero pieno su red).
- **Cover:** brand label 15 pt CAPS tracking 0,2 em (es. "CASE IH · DOMINO"). **La tessera domino a due quadrati è ritirata** (26/11/2026): non si usa come chrome né come motivo.

---

## 7. Componenti (come farli in pptx)

Blocchi flat, riempimento pieno. Card su dark: fill `#0A0A0A`, bordo 0,5–0,75 pt bianco 12 %. Card su paper: fill `#FFFFFF`, bordo nero ~10 %. Padding interno generoso (~20–24 pt).

| Componente | Costruzione (valori dal riferimento) |
| --- | --- |
| **Eyebrow** | Trattino rosso ~36×1,5 pt + testo 15 pt CAPS tracciato, nero o bianco |
| **Facts row** (KPI) | 3+ colonne sopra hairline: numero 39 pt (cifra grande 78 pt) Bold + nota 16,5 pt attenuata; delta con segno (`+2.47pp`) in rosso solo se il corpo è da 24 pt in su, altrimenti nero |
| **Lista numerata 01/02/03** | Numerale 30 pt **PT Serif Bold corsivo** rosso + titolo 30 pt Bold + testo 24 pt attenuato |
| **Numerale gigante di sezione** | PT Serif Bold corsivo 48–72 pt, rosso su paper, bianco su dark |
| **Quote slide** | Virgolette PT Serif 39 pt rosse + citazione PT Serif Bold 45 pt + chiusa secca in Bold sans ("This is the audience.") |
| **Card contenuto** (griglie 3–4 col) | Kicker 12 pt CAPS nero, titolo 30 pt Bold, testo 24 pt attenuato (16,5 pt solo se è una nota), hairline interne |
| **Agenda / indice** | Numerale serif corsivo grande + voce 42 pt Bold + descrizione 27 pt attenuata, righe separate da hairline |
| **Tabella dati** | Testata CAPS 12 pt attenuata, righe con hairline, numeri Bold, delta in nero |
| **Timeline / settimane** | Colonne sopra hairline: label CAPS nera, titolo Bold, testo attenuato |
| **Checklist / recap** | Righe con voce Bold + stato; label CAPS; hairline tra le righe |
| **Screenshot e mockup** | Post reali, telefoni, mockup dispositivo come immagini; foto sempre desaturate/scurite |
| **Divider di sezione** (dark) | Eyebrow + titolo 84 pt Black con parola chiave in rosso (es. "Voice. **Keep our edge**"), fondo fumo |
| **Closing** (red) | "Thank you." 84 pt nero, riepilogo 27 pt Bold, firma "Domino" PT Serif Bold 39 pt + "PROUDLY INTERACTIVE" 21 pt CAPS |

---

## 8. Immagini e icone

- **Foto:** desaturate e scurite (scrim nero) così il testo bianco vince sempre; a tutta slide nei divisori. **Le foto degli asset (case history) si mostrano intere, mai ritagliate sopra e sotto**; si possono scontornare (decisione del 26/11/2026). Mai illustrazioni disegnate a mano, texture, pattern.
- **Screenshot reali** (post social, SERP, device) sono benvenuti nelle slide di evidenza: incorniciati in card flat.
- **Icone:** Lucide (stroke 1,5–2) come sostituto approvato, da segnalare. Nessun icon-font, nessuna emoji.
- **Loghi:** `Claude Design/deck-skill/assets/` — `logo-domino-bcorp-su-scuro.png` (wordmark bianco) su dark; `logo-domino-bcorp-su-chiaro.png` (wordmark scuro) su paper; su red il logo scuro (nomi dal 26/11/2026: i vecchi `-light`/`-dark` erano invertiti rispetto ai pixel). Logo cliente accanto a quello Domino quando il deck è per un cliente.

---

## 9. Voce (contenuti)

- Lingua del deck secondo il destinatario (il riferimento è in inglese; l'italiano resta il default per deck interni e clienti italiani). Sentence case; l'inglese per i termini di settore.
- Tono diretto, concreto: frasi corte, risultati misurabili. Headline con il twist in rosso.
- Struttura narrativa: **problema → soluzione → proof point**. I dati prima delle opinioni ("Budget reduced. Engagement held.").
- ALL CAPS tracciate solo per eyebrow, label, chrome. **Nessuna emoji.**
- I nomi dei metodi sempre col `!`: Core Sprint!, Design Sprint!, Build Sprint!, Brain & Identity Design Sprint!, Trainstorming Sprint!.

---

## 10. Struttura tipo di un deck

1. **Cover** (dark, fumo) — brand label, display 96 pt con twist rosso, sottotitolo, meta (scope, timeframe, canali).
2. **Indice/agenda** (dark) — numerali serif + voci.
3. **Capitoli**: divisore dark → slide di contenuto paper (dati, griglie, card, tabelle).
4. **Chiusura** (red, una sola) — thank you, riepilogo, firma Domino.

Definisci prima il sistema (layout di cover, divisore, contenuto, chiusura), poi riempi.

---

## 11. QA obbligatoria

Dopo la generazione: guarda la presentazione renderizzata (per un .pptx: LibreOffice → PDF → jpg) e controlla overflow, sovrapposizioni, contrasto, coerenza chrome. Correggi e riverifica solo le slide toccate.

---

## 12. Gerarchia delle fonti

- **Visual:** questa scheda ← i riferimenti in `Presentazioni/` (in conflitto tra loro vince **Presentazione Domino - Novembre 2026**, il più recente) ← CSS in `Claude Design/deck-skill/`. In caso di conflitto tra scheda e riferimenti, vincono i riferimenti.
- **Contenuti (offerta, metodi, prezzi, naming, case study):** **vince il Brain** (file 01–13 + CLAUDE.md). Il `SKILL.md` della deck skill contiene una fotografia della narrativa 2026 che può invecchiare: non usarla come fonte per prezzi o naming. In particolare: regola "diversità 3" per i case study; mai "agenzia" in auto-definizione.

---

### Nota d'uso per Claude

Quando Andrea chiede un deck (pitch, sales, interno, talk):

1. Chiedi/deduci contesto, pubblico, lingua e numero indicativo di slide.
2. Prendi i contenuti dal Brain (§12), il visual da qui.
3. Costruisci la presentazione in **Claude Slides** (tela 1920 × 1080; .pptx nativo 20″×11,25″ solo se richiesto) con la scala di §4, le varianti di §5 (paper per il contenuto, dark per cover/divisori, una sola red in chiusura) e i componenti di §7.
4. Esegui la QA di §11; l'export in .pptx o PDF lo fa Andrea Bosso da Claude Slides.
