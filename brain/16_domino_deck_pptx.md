# Presentazioni PowerPoint (.pptx) con il Domino Design System

> **Regola di produzione (dal 7 luglio 2026):** ogni presentazione (pitch deck, sales deck, deck interno, talk) nasce come **file .pptx nativo** secondo queste regole. È il flusso primario. Il sistema HTML della deck skill (`Claude Design/deck-skill/`) resta come riferimento visivo canonico e per i casi in cui serve espressamente un deck HTML→PDF.

È la traduzione del *deck layer* del Domino Design System (canvas HTML 1920×1080) in termini nativi di PowerPoint: punti tipografici, colori hex, layout, componenti.

**Fonte dei valori esatti:** `Claude Design/deck-skill/` — `colors_and_type.css` (palette e font), `deck-tokens.css` (scala deck), `deck-components.css` (componenti), `SKILL.md` (voce e regole visual). In caso di dubbio su un valore, vince il CSS. **Su offerta, metodi, prezzi e naming vince sempre il Brain**, non la skill: la skill governa solo il visual (vedi §11).

---

## 0. Regola di governo

> **Editoriale, sicuro, alto contrasto.** Fondazione nero/bianco + un solo rosso `#FF303F`, geometria a blocchi, tipografia enorme e stretta. Una slide si proietta, non si legge: il corpo non scende mai sotto ~14,5 pt.

Come costruirlo: genera un **file .pptx nativo** (es. con `python-pptx`). Slide **16:9, 13,333″ × 7,5″**. La conversione dal canvas HTML è **px → pt con fattore 0,5** (1920 px = 960 pt): tutti i valori qui sotto sono già convertiti.

Lo shader animato `flow-bg` non esiste in PowerPoint: le slide dark hanno **sfondo nero pieno `#000000`**. In alternativa, un'immagine statica esportata dallo shader (scurita, scrim nero ~80%) come background picture — mai gradienti generati in pptx.

---

## 1. Slide e griglia

| Token | Valore pptx | Origine (px) |
| --- | --- | --- |
| Slide | 13,333″ × 7,5″ (960 × 540 pt) | 1920×1080 |
| Gutter orizzontale (`pad-x`) | 60 pt dai bordi sx/dx | 120 |
| Inset alto contenuto (`pad-top`) | 55 pt | 110 |
| Inset basso contenuto (`pad-bottom`) | 75 pt | 150 |
| Chrome top (distanza dall'alto) | 20 pt | 40 |
| Chrome bottom (distanza dal basso) | 18 pt | 36 |
| Gap titolo → contenuto (`gap-title`) | 28 pt | 56 |
| Gap tra card/item (`gap-item`) | 14 pt | 28 |
| Gap colonne `split` (2 col) | 50 pt | 100 |

Il contenuto sta sempre dentro il *frame* (60 pt laterali, 55 pt sopra, 75 pt sotto): non sfora mai, non tocca mai la chrome.

---

## 2. Font

Font canonici in `Claude Design/deck-skill/fonts/` (versioni Trial: i nomi famiglia interni sono questi, da usare come nome font nel .pptx).

| Ruolo | Nome famiglia nel .pptx | File |
| --- | --- | --- |
| Corpo, sottotitoli, meta | `Aktiv Grotesk Trial` (Regular; Bold via toggle) | `AktivGrotesk-Regular.ttf` / `-Bold.ttf` |
| H2/H3, heading card | `Aktiv Grotesk Trial XBold` (famiglia separata — non si ottiene col toggle bold) | `AktivGrotesk-XBold.ttf` |
| Display, H1, numeri monster | `Aktiv Grotesk Trial Black` (famiglia separata) | `AktivGrotesk-Black.ttf` |
| Citazioni, numerali romani, firma | `PT Serif` + bold (corsivo per numerali e firma) | `PTSerif-Bold.ttf` |
| Solo messaggi di chiusura/firme, con parsimonia | `DominoType` | `DominoType.otf` |

- **Aktiv Grotesk è il cavallo da lavoro.** PT Serif Bold è l'unico serif (citazioni, tono print-magazine). **DominoType mai** per corpo, heading o UI.
- Fallback se i font non sono sul sistema di chi apre il file: Arial (sans), Georgia (serif). L'embedding dei font nel .pptx è inaffidabile cross-platform: per destinatari esterni valuta l'export PDF.

---

## 3. Colori (hex)

| Nome | Hex | Uso |
| --- | --- | --- |
| Nero | `#000000` | Sfondo slide dark, testo su paper/red |
| Near-black | `#0A0A0A` | Riempimento card/strip su slide dark |
| Bianco | `#FFFFFF` | Testo primario su dark, card su paper |
| **Rosso Domino** | `#FF303F` | Unico accento: eyebrow, dot, numerali, barre, chip, slide red |
| Paper | `#F0F0F0` | Sfondo slide paper (prezzi/dati) |
| Testo attenuato su dark | `#999999` | equivalente del bianco al 60% |
| Chrome/meta su dark | `#595959` | equivalente del bianco al 35% |
| Hairline su dark | `#1F1F1F` | bordi card, righe sottili (bianco 12%) |
| Testo attenuato su paper/red | `#000000` al 55–70% → usa `#737373` (paper) / `#4D4D4D` (red) | chrome invertita |

**Disciplina del colore:** solo nero, bianco, rosso. Maroon `#7F1A3B` e navy `#09314E` sono colori di *clienti* (IBM Watson, Iveco): solo quando quel case study è in scena. Blocchi sempre flat: **niente ombre, niente gradienti, niente angoli arrotondati** (raggio 0; max 1–1,5 pt su bottoni/pill, 2–2,5 pt su tag).

---

## 4. Scala tipografica → punti PowerPoint

| Stile | pt | Font / peso | Note | Uso |
| --- | --- | --- | --- | --- |
| **Display** | 89 pt | Aktiv Black | interlinea 0,9–0,95, tracking −2% | Solo cover / closing monster |
| **H1** | 57 pt | Aktiv Black | interlinea 0,95, tracking −2,5% | Titolo primario slide |
| **H2** | 38 pt | Aktiv XBold | interlinea 1,0 | Heading slide di contenuto |
| **H3** | 31 pt | Aktiv XBold/Bold | interlinea 1,05 | Heading card / colonna |
| **Subtitle** | 25,5 pt | Aktiv Medium/Regular | interlinea 1,2, colore `#999999` | Lead sotto H2 |
| **Body** | 18,5 pt | Aktiv Regular | interlinea 1,35 | Corpo testo slide |
| **Small** | 14,5 pt | Aktiv Regular | | Meta / caption — **minimo assoluto** |
| **Eyebrow** | 10,5 pt | Aktiv Bold | MAIUSCOLO, spaziatura ~2 pt, **rosso** | Label sopra i titoli |
| **Chrome** | 7 pt | Aktiv Bold | MAIUSCOLO, spaziatura ~1,1 pt | Header/footer slide |

Interlinea stretta sulle headline (100% o meno): stretto, impilato. Sotto i 14,5 pt scende solo la chrome (7 pt) e le chip metodi (6,5 pt).

---

## 5. Varianti di slide

1. **Dark (default)** — sfondo nero `#000000`, testo bianco. La maggior parte del deck.
2. **Paper** — sfondo `#F0F0F0`, testo nero. Per slide prezzi / dati / densità numerica. La chrome si inverte (testo `#737373`, logo versione dark).
3. **Red** — sfondo `#FF303F`, testo nero. **Una sola per deck**, sempre la chiusura (total-impact / CTA).

---

## 6. Chrome (su ogni slide)

- **Top** (a 20 pt dall'alto, dentro i 60 pt laterali): logo Domino a sinistra (h ~23 pt; su dark `assets/logo-domino-bcorp-light.png`, su paper/red `-dark.png`), a destra meta MAIUSCOLA 7 pt con **quadratino rosso 4×4 pt** (nero su slide red) + etichetta slide ("01 · Cover").
- **Bottom** (a 18 pt dal basso): due elementi agli estremi, 7 pt MAIUSCOLO, colore `#595959` su dark — es. `Evento · Città data` (sx) · `Pitch Domino` (dx).
- **Motivo firma:** la tessera domino a due quadrati (~23×23 pt l'uno, uno rosso, uno nero/bianco) in alto a destra della cover. È chrome, non un'icona.

---

## 7. Componenti (come farli in pptx)

Blocchi flat, riempimento pieno, niente ombra/bordo-raggio. Le card su dark: fill `#0A0A0A`, bordo 0,5 pt `#1F1F1F`, padding interno generoso (~13–16 pt).

| Componente | Costruzione pptx (valori chiave) |
| --- | --- |
| **Eyebrow** | Trattino rosso 24×1 pt + testo 10,5 pt MAIUSCOLO rosso, sulla stessa riga |
| **Facts row** (3 numeri) | Riga hairline sopra; 3 colonne: numero 51 pt Black + label 10,5 pt `#999999` |
| **Symptoms** (I·II·III) | 3 colonne: numerale romano PT Serif corsivo 21 pt rosso, titolo 18,5 pt XBold, testo 12 pt `#999999` |
| **Problem quotes** | 3 colonne, barra sinistra rossa 2 pt: fonte 8,5 pt caps rossa + citazione PT Serif Bold 17 pt bianca |
| **Product cols** (Brain + Identity) | 2 colonne: layer 8,5 pt caps rosso, H 31 pt Black, descrizione 13,5 pt `#999999`, meta caps 9,5 pt |
| **AI-agnostic strip** | Rettangolo fill `#0A0A0A` bordo `#1F1F1F`: label caps rossa 8,5 pt + vendor 12 pt Bold + "l'azienda sceglie" 10,5 pt (b rosso) |
| **Output card** | Card: kind 7,5 pt caps rosso, titolo 14,5 pt XBold, testo 10 pt `#999999` |
| **Kit col** (×3) | Card: numerale serif corsivo 25,5 pt rosso, titolo 19,5 pt Black, buyer 9,5 pt, benefit 10,5 pt, KPI in fondo oltre hairline |
| **Case** (×4) | Card: verticale 7 pt caps rosso, nome 16 pt Black, numero 25,5 pt Black + small 7,5 pt, desc 9 pt, chip metodi 6,5 pt bordate `#1F1F1F` |
| **Timeline** (settimane Sprint!) | 4 colonne sopra hairline: label 8,5 pt caps rossa, titolo 18,5 pt XBold, testo 11 pt `#999999` |
| **Audit card** (slide paper) | Card bianca bordo nero 8%: prezzo 51 pt Black (valuta 26,5 pt rossa), deliverable 11 pt con trattino rosso 6×1 pt, meta-line 7,5 pt caps |
| **Pivot block** | Barra sinistra rossa 3 pt, rientro 28 pt: testo 21 pt `#999999` con parte barrata (strikethrough, ideale rosso) |
| **Closing frame** (slide red) | H 57 pt Black nero max ~14 caratteri/riga (parola chiave barrata con linea nera inclinata ≈ shape); footer sopra bordo nero 2 pt: next-step 17,5 pt Bold + firma a dx (nome PT Serif corsivo 26,5 pt + ruolo 13,5 pt caps) |
| **Clients strip** | Riga sopra hairline: label caps rossa 8,5 pt + clienti 13,5 pt Bold separati da `·` `#595959` |
| **Cover byline** (×3) | 3 celle sopra hairline: chiave 8,5 pt caps rossa + valore 16 pt Bold |

---

## 8. Immagini e icone

- **Foto:** desaturate e scurite (scrim nero ~80%) così il testo bianco vince sempre. Mai illustrazioni disegnate a mano, texture, mesh gradient, pattern.
- **Icone:** Domino non ha una icon library estesa. Usa **Lucide** (stroke 1,5–2) come sostituto approvato e segnalalo. Nessun icon-font, nessuna emoji.
- **Loghi:** in `Claude Design/deck-skill/assets/` — `logo-domino-bcorp-light.png` su dark, `-dark.png` su paper/red.

---

## 9. Voce (contenuti)

- **Italiano** curato, sentence case; l'inglese resta per i termini di settore ("Customer Experience", "Inbound Marketing"). Non sovra-tradurre.
- Tono diretto, concreto: frasi corte, zero gergo da consulenza, risultati misurabili. La CX è una *leva di business*.
- Struttura narrativa: **problema → soluzione → proof point**. I case study partono dal partner ("Domino e Iveco…").
- ALL CAPS tracciate solo per eyebrow, label, chrome. Title Case evitato.
- "Noi" inclusivo + "tu" diretto. **Nessuna emoji.** Punteggiatura italiana corretta.
- I nomi dei metodi si scrivono sempre col `!`: Core Sprint!, Design Sprint!, Build Sprint!, Brain & Identity Design Sprint!, Trainstorming!.

---

## 10. Struttura tipo di un deck

1. **Cover** (dark) — eyebrow, H1/Display con twist in rosso, subtitle, cover byline, tessera domino.
2. **Slide di contenuto** (dark) — problema, sintomi, quote, prodotto, output, kit, case, timeline.
3. **Slide paper** — prezzi, dati, densità numerica.
4. **Chiusura** (red, una sola) — closing frame con CTA e firma.

Definisci prima il sistema (quali layout per cover, section header, contenuto, chiusura), poi riempi.

---

## 11. Gerarchia delle fonti

- **Visual (colori, type, layout, componenti):** questa scheda + i CSS in `Claude Design/deck-skill/`.
- **Contenuti (offerta, metodi, prezzi, naming, case study):** **vince il Brain** (file 01–13 + CLAUDE.md). Il `SKILL.md` della deck skill contiene una fotografia della narrativa 2026 che può invecchiare: non usarla come fonte per prezzi o naming. In particolare: l'Audit tattico non si propone mai spontaneamente; regola "diversità 3" per i case study; mai "agenzia" in auto-definizione.

---

### Nota d'uso per Claude

Quando Andrea chiede un deck (pitch, sales, interno, talk):

1. Chiedi/deduci contesto, pubblico e numero indicativo di slide.
2. Prendi i contenuti dal Brain (§11), il visual da qui.
3. Costruisci un **file .pptx nativo** 13,333″×7,5″ con gli stili di §4 e i componenti di §7; una sola slide red, in chiusura.
4. Consegna il .pptx pronto; PDF solo se richiesto o per destinatari senza i font.
