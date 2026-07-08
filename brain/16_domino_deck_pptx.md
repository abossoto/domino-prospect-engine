# Presentazioni PowerPoint (.pptx) con il Domino Design System

> **Regola di produzione (dal 7 luglio 2026):** ogni presentazione (pitch deck, sales deck, deck interno, talk) nasce come **file .pptx nativo** secondo queste regole. È il flusso primario. Il sistema HTML della deck skill (`Claude Design/deck-skill/`) resta come riferimento visivo e per i casi in cui serve espressamente un deck HTML→PDF.
>
> **Riferimento canonico:** il deck **Case IH — H1 Review & H2 Plan** (`Presentazioni/Case_IH_strategy_H2_2026.pptx`, 42 slide, luglio 2026). Tutti i valori di questa scheda sono estratti da quel file. In caso di dubbio, vince il deck di riferimento; sui contenuti (offerta, metodi, prezzi, naming) vince il Brain (§12).

---

## 0. Regola di governo

> **Editoriale, sicuro, alto contrasto.** Nero/bianco + un solo rosso `#FF303F`, geometria a blocchi, tipografia grande e stretta. Una slide si proietta, non si legge: il corpo lavora a 18–21,75 pt e non scende sotto ~14 pt (solo la chrome sta a 10,5 pt).

Come costruirlo: genera un **file .pptx nativo** con slide **20″ × 11,25″** (= 1440 × 810 pt). La conversione dal canvas HTML 1920×1080 è **px → pt con fattore 0,75** (1 px = 0,75 pt): i valori qui sotto sono già convertiti.

---

## 1. Slide e griglia

| Token | Valore pptx | Origine (px) |
| --- | --- | --- |
| Slide | **20″ × 11,25″** (1440 × 810 pt) | 1920×1080 |
| Gutter orizzontale (`pad-x`) | 90 pt dai bordi sx/dx | 120 |
| Inset alto contenuto (`pad-top`) | ~82 pt | 110 |
| Inset basso contenuto (`pad-bottom`) | ~112 pt | 150 |
| Chrome top (dall'alto) | 30 pt | 40 |
| Chrome bottom (dal basso) | ~24–27 pt | 36 |
| Gap titolo → contenuto (`gap-title`) | 42 pt | 56 |
| Gap tra card/item (`gap-item`) | 21 pt | 28 |

Il contenuto sta dentro il frame (90 pt laterali, ~82 pt sopra, ~112 pt sotto): non sfora mai, non tocca mai la chrome.

---

## 2. Font

Nel deck di riferimento i nomi famiglia scritti nel .pptx sono **i nomi pieni, senza "Trial"**:

| Ruolo | Nome famiglia nel .pptx | Peso |
| --- | --- | --- |
| Tutto il sans: headline, heading, corpo, label, chrome | `Aktiv Grotesk` | Regular; **Bold via toggle** per headline, heading, label |
| Numerali di sezione, citazioni, firma | `PT Serif` | Bold; **corsivo** per i numerali e la firma |

- Niente famiglie XBold/Black separate nel .pptx: la gerarchia si fa con **corpo + bold + tracking**, non con pesi intermedi.
- **PT Serif Bold** è l'unico serif: numerali giganti di sezione (spesso corsivi), citazioni, la firma "Domino" in chiusura.
- **DominoType mai** per corpo, heading o UI; solo eventuali chiusure/firme, con parsimonia.
- I file font stanno in `Claude Design/deck-skill/fonts/` (versioni Trial per l'installazione locale: se il .pptx deve essere aperto su macchine con le Trial installate, i nomi famiglia diventano `Aktiv Grotesk Trial` ecc. — chiedi in caso di dubbio). Fallback: Arial (sans), Georgia (serif). Per destinatari esterni senza font, valuta l'export PDF.

---

## 3. Colori (hex)

| Nome | Hex | Uso |
| --- | --- | --- |
| Nero | `#000000` | Sfondo slide dark, testo su paper/red |
| Near-black | `#0A0A0A` | Riempimento card/strip su slide dark |
| Bianco | `#FFFFFF` | Testo primario su dark, card su paper |
| **Rosso Domino** | `#FF303F` | Unico accento: eyebrow, dot, numerali, barre, delta, slide red |
| Paper | `#F0F0F0` | Sfondo slide paper |

**Testo attenuato: usa l'alpha vero, non grigi equivalenti.** PowerPoint supporta la trasparenza nel colore del testo (`solidFill` + `alpha`): il deck di riferimento usa nero al 60 % / 55 % / 42 % / 13 % (su paper) e bianco al 60 % / 35 % / 12 % (su dark), come i token CSS (`--c-fg-mute` 60 %, `--c-fg-faint` 35 %, `--c-line` 12 %).

**Disciplina del colore:** solo nero, bianco, rosso. Maroon `#7F1A3B` e navy `#09314E` sono colori di *clienti*: solo quando quel case study è in scena. Blocchi flat: niente ombre, niente angoli arrotondati (raggio 0; max ~2 pt su chip/tag).

**Unica eccezione al "niente gradienti": il glow.** Sulle slide dark d'impatto è ammesso un **gradiente radiale** full-canvas da `#FF303F` **alpha 13 %** (centro) a nero pieno (bordo, stop ~58 %) — è il sostituto statico dello shader `flow-bg`. Nel riferimento compare su ~6 slide dark su 11: usalo per cover e momenti enfatici, non ovunque.

---

## 4. Scala tipografica → punti PowerPoint

Valori osservati nel deck di riferimento (Aktiv Grotesk Bold salvo indicazione).

| Stile | pt | Note | Uso |
| --- | --- | --- | --- |
| **Display** | 96 pt | interlinea ~0,95, tracking negativo (~−1,5 %) | Solo cover |
| **H1 divider** | 85,5 pt | idem | Titolo dei divisori di sezione dark |
| **H2** | 57 pt | il cavallo da lavoro dei titoli | Heading delle slide di contenuto |
| **H3 / agenda** | 42–42,75 pt | | Titoli agenda, claim secondari |
| **Card heading** | 27,75 pt | | Titolo di card / colonna |
| **Numero fatto** | 34,5–52,5 pt | | KPI, numeri grandi nelle card |
| **Subtitle / lead** | 24 pt | Regular, attenuato | Lead sotto i titoli, sottotitoli |
| **Body large** | 21,75 pt | Regular | Corpo primario |
| **Body** | 18 pt | Regular | Corpo nelle card e liste |
| **Small** | 14,25–13,5 pt | | Caption, note |
| **Label / eyebrow grande** | 15,75 pt | CAPS, tracking ~3,15 pt (0,2 em), rosso o attenuato | Eyebrow sopra i titoli, brand label |
| **Eyebrow card** | 12,75 pt | CAPS, tracking ~2 pt | Label dentro card e colonne |
| **Micro-label** | 11,25 pt | CAPS Bold | Kicker di card dense |
| **Chrome** | 10,5 pt | CAPS Bold, tracking ~1,7 pt (0,16 em) | Header/footer slide |
| **Numerale sezione (serif)** | 29,25–73,5 pt | **PT Serif Bold corsivo**, rosso o nero | "01", "I", numerali giganti |
| **Citazione** | 46,5 pt | PT Serif Bold | Quote a piena slide |
| **Firma chiusura** | 39,75 pt | PT Serif Bold ("Domino") + 20,25 pt caps | Slide red finale |

---

## 5. Varianti di slide — e quando usarle

1. **Paper `#F0F0F0`** — **la variante dominante nei deck di contenuto**: nel riferimento 25 slide su 42. Testo nero (attenuato via alpha), card bianche `#FFFFFF`, hairline nere a bassa alpha. Per tutto ciò che è denso: dati, tabelle, griglie, piani.
2. **Dark `#000000`** — cover, divisori di sezione, slide d'impatto e citazioni (11 su 42). Testo bianco, card `#0A0A0A`, hairline bianche al 12 %. Su una parte di queste, il glow radiale rosso (§3).
3. **Red `#FF303F`** — **una sola per deck**, la chiusura. Tutto il testo **nero**, firma "Domino" in PT Serif Bold.

Il ritmo tipico: cover dark (con glow) → divisori dark tra i capitoli → contenuto paper → chiusura red.

---

## 6. Chrome (su ogni slide)

- **Top:** logo Domino/cliente a sinistra a (90, 30) pt, altezza ~34,5 pt; a destra **quadratino rosso 6×6 pt** + etichetta slide 10,5 pt CAPS Bold tracking 1,7 pt (es. "03 · WHERE WE ARE"). Sulle slide red il dot diventa nero.
- **Bottom:** a ~24 pt dal fondo, due elementi agli estremi, 10,5 pt CAPS Bold: titolo del progetto (sx) · sezione corrente (dx). Colore attenuato (bianco 35 % su dark, nero 55 % su paper, nero pieno su red).
- **Cover:** brand label 15,75 pt CAPS tracking 3,15 pt (es. "CASE IH · DOMINO"); la tessera domino a due quadrati come chrome in alto a destra.

---

## 7. Componenti (come farli in pptx)

Blocchi flat, riempimento pieno. Card su dark: fill `#0A0A0A`, bordo 0,5–0,75 pt bianco 12 %. Card su paper: fill `#FFFFFF`, bordo nero ~10 %. Padding interno generoso (~20–24 pt).

| Componente | Costruzione (valori dal riferimento) |
| --- | --- |
| **Eyebrow** | Trattino rosso ~36×1,5 pt + testo 12,75–15,75 pt CAPS rosso tracciato |
| **Facts row** (KPI) | 3+ colonne sopra hairline: numero 34,5–52,5 pt Bold + label 12,75 pt attenuata; delta con segno in rosso (`+2.47pp`) |
| **Lista numerata 01/02/03** | Numerale 38,25 pt **PT Serif Bold corsivo** rosso + titolo 27,75 pt Bold + testo 18 pt attenuato |
| **Numerale gigante di sezione** | PT Serif Bold corsivo 63,75–73,5 pt, rosso su paper, bianco su dark |
| **Quote slide** | Virgolette PT Serif 51 pt rosse + citazione PT Serif Bold 46,5 pt + chiusa secca in Bold sans ("This is the audience.") |
| **Card contenuto** (griglie 3–4 col) | Kicker 11,25 pt CAPS rosso, titolo 16,5–21 pt Bold, testo 14,25–15 pt attenuato, hairline interne |
| **Agenda / indice** | Numerale serif corsivo grande + voce 42,75 pt Bold + descrizione 21,75 pt attenuata, righe separate da hairline |
| **Tabella dati** | Testata CAPS 11,25–12,75 pt attenuata, righe con hairline, numeri Bold, delta rossi |
| **Timeline / settimane** | Colonne sopra hairline: label CAPS rossa, titolo Bold, testo attenuato |
| **Checklist / recap** | Righe con voce Bold + stato; label CAPS; hairline tra le righe |
| **Screenshot e mockup** | Post reali, telefoni, mockup dispositivo come immagini; foto sempre desaturate/scurite |
| **Divider di sezione** (dark) | Eyebrow + titolo 85,5 pt con parola chiave in rosso (es. "Voice. **Keep our edge**"), eventuale glow |
| **Closing** (red) | "Thank you." 85,5 pt nero, riepilogo 26,25 pt Bold, firma "Domino" PT Serif Bold 39,75 pt + "PROUDLY INTERACTIVE" 20,25 pt CAPS |

---

## 8. Immagini e icone

- **Foto:** desaturate e scurite (scrim nero) così il testo bianco vince sempre; a tutta slide nei divisori. Mai illustrazioni disegnate a mano, texture, pattern.
- **Screenshot reali** (post social, SERP, device) sono benvenuti nelle slide di evidenza: incorniciati in card flat.
- **Icone:** Lucide (stroke 1,5–2) come sostituto approvato, da segnalare. Nessun icon-font, nessuna emoji.
- **Loghi:** `Claude Design/deck-skill/assets/` — variante light su dark, dark su paper/red. Logo cliente accanto a quello Domino quando il deck è per un cliente.

---

## 9. Voce (contenuti)

- Lingua del deck secondo il destinatario (il riferimento è in inglese; l'italiano resta il default per deck interni e clienti italiani). Sentence case; l'inglese per i termini di settore.
- Tono diretto, concreto: frasi corte, risultati misurabili. Headline con il twist in rosso.
- Struttura narrativa: **problema → soluzione → proof point**. I dati prima delle opinioni ("Budget reduced. Engagement held.").
- ALL CAPS tracciate solo per eyebrow, label, chrome. **Nessuna emoji.**
- I nomi dei metodi sempre col `!`: Core Sprint!, Design Sprint!, Build Sprint!, Brain & Identity Design Sprint!, Trainstorming!.

---

## 10. Struttura tipo di un deck

1. **Cover** (dark, glow) — brand label, display 96 pt con twist rosso, sottotitolo, meta (scope, timeframe, canali).
2. **Indice/agenda** (dark) — numerali serif + voci.
3. **Capitoli**: divisore dark → slide di contenuto paper (dati, griglie, card, tabelle).
4. **Chiusura** (red, una sola) — thank you, riepilogo, firma Domino.

Definisci prima il sistema (layout di cover, divisore, contenuto, chiusura), poi riempi.

---

## 11. QA obbligatoria

Dopo la generazione: converti in immagini (LibreOffice → PDF → jpg) e controlla overflow, sovrapposizioni, contrasto, coerenza chrome. Correggi e riverifica solo le slide toccate.

---

## 12. Gerarchia delle fonti

- **Visual:** questa scheda ← deck di riferimento Case IH ← CSS in `Claude Design/deck-skill/`. In caso di conflitto tra scheda e deck di riferimento, vince il deck.
- **Contenuti (offerta, metodi, prezzi, naming, case study):** **vince il Brain** (file 01–13 + CLAUDE.md). Il `SKILL.md` della deck skill contiene una fotografia della narrativa 2026 che può invecchiare: non usarla come fonte per prezzi o naming. In particolare: l'Audit tattico non si propone mai spontaneamente; regola "diversità 3" per i case study; mai "agenzia" in auto-definizione.

---

### Nota d'uso per Claude

Quando Andrea chiede un deck (pitch, sales, interno, talk):

1. Chiedi/deduci contesto, pubblico, lingua e numero indicativo di slide.
2. Prendi i contenuti dal Brain (§12), il visual da qui.
3. Costruisci un **file .pptx nativo 20″×11,25″** con la scala di §4, le varianti di §5 (paper per il contenuto, dark per cover/divisori, una sola red in chiusura) e i componenti di §7.
4. Esegui la QA di §11, poi consegna il .pptx; PDF solo se richiesto o per destinatari senza i font.
