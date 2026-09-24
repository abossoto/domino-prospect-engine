# DOMINO BRAIN — DominoOS
> Versione 1.0 — 25 settembre 2026. Il sistema operativo aziendale di Domino: che cos'è, da dove viene, come è fatto, chi lo tiene in piedi e come si prova. Documento autoritativo della strategia AI interna. Fonte di riferimento visiva e narrativa: `Presentazioni/Domino Brain · Visione.pptx` (versione finale, 25 settembre 2026).

**Link rapidi:** [Identità](01_domino_identita.md) · [Servizi](02_domino_servizi.md) · [Metodi](03_domino_metodi.md) · [Case history](04_domino_case_history.md) · [Framework Silos](13_silos_framework.md) · [Document Layer](15_domino_document_word.md) · [Deck Layer](16_domino_deck_pptx.md)

---

## 0. Che cos'è DominoOS

**DominoOS è il sistema operativo aziendale di Domino.** Non è uno strumento, non è un progetto AI, non è un metodo da vendere: è il modo in cui l'azienda raccoglie quello che sa, decide cosa può fare da sola, produce, controlla quello che esce e impara dagli esiti.

La distinzione che regge tutto il documento:

- **Il Domino Brain** è la conoscenza — cosa c'è scritto.
- **Le skill** sono il metodo eseguibile — come si fa.
- **I progetti cliente** sono il contesto — cosa sappiamo di questo cliente.
- **DominoOS** è il sistema che li mette al lavoro insieme, con regole, proprietari e un ritmo.

Il passaggio in una riga: **da archivio a sistema operativo. Il Brain oggi risponde. Domani lavora, e impara.**

> **Nota di notazione.** Il nome è stato deciso da Andrea il 25 settembre 2026. In questo documento è scritto **DominoOS** (una parola, D e OS maiuscole). Se la forma canonica deve essere diversa (`Domino OS`, `dominoOS`), va corretta qui e in tutti i materiali prima di uscire verso l'esterno.

---

## 1. Da dove viene

Quattro fonti esterne, tutte lette a settembre 2026. Nessuna è un modello da copiare: sono il vocabolario con cui abbiamo dato un nome a cose che stavamo già facendo.

### 1.1 Y Combinator / Jason Blomfield — la self-improving company

La fonte principale. Descrive un'azienda costruita come una macchina che migliora se stessa, organizzata in **loop ricorsivi** invece che in funzioni. Concetti che abbiamo adottato per intero:

- **I cinque strati** (sensori, policy, strumenti, quality gate, apprendimento): la nomenclatura originale è quella che usiamo, tradotta ma non reinventata. Dettaglio in §2.
- **Burn tokens, not heads.** La leva non è assumere di più: è far girare più cicli sullo stesso numero di persone.
- **Roman Legion Problem.** Un'organizzazione che cresce aggiungendo persone identiche non diventa più intelligente, diventa più cara da coordinare.
- **Legible to AI.** Un processo che vive nella testa di qualcuno non è automatizzabile, nemmeno in parte. Prima di automatizzare bisogna rendere leggibile.

Fonte: https://towardsai.com/p/machine-learning/how-to-build-a-self-improving-company-with-ai

### 1.2 STAR Global — il paradosso dell'efficienza

Chi fattura a tempo si auto-cannibalizza quando l'AI accorcia il lavoro: più diventi bravo, meno incassi. La conseguenza per noi non è tecnica ma commerciale, e coincide con una tesi che avevamo già: **vendere decisioni, non output** (vedi `CLAUDE.md`, §Terms). L'esecuzione è diventata commodity, il giudizio resta scarso.

Fonte: https://star.global/posts/ai-impact-on-advertising-agencies-growth-model/

### 1.3 Matrix Internet — la struttura a bilanciere

Le organizzazioni che reggono la transizione perdono il centro e tengono i due estremi: poche persone molto senior che decidono, e un livello esecutivo molto ampliato dall'AI. È una previsione, non un piano: qui serve come avvertimento su dove si concentrerà la pressione organizzativa, non come modello di riorganizzazione.

Fonte: https://www.matrixinternet.ie/the-future-of-digital-marketing-agencies-in-the-age-of-ai/

### 1.4 Mirage — proprietari con un nome

L'impostazione più vicina alla nostra: ogni cosa che conta ha **un nome sopra** — chi risponde del gusto, chi del rischio, chi del risultato. Da qui viene l'insistenza sui ruoli di §5.

Fonte: https://thisismirage.com/ai-and-the-future-of-the-creative-agency-industry/

### 1.5 Il dato che spiega perché quasi tutti falliscono

Il MIT ha misurato che il 95% dei progetti pilota di AI generativa non produce ritorno. La lettura che adottiamo: **il problema non è il modello, è l'infrastruttura intorno** — dati non leggibili, nessun proprietario, nessun controllo in uscita, nessun anello di ritorno. DominoOS è esattamente il tentativo di costruire quell'infrastruttura prima di comprare altri strumenti.

---

## 2. I cinque strati

La nomenclatura originale, con la definizione canonica di ciascuno strato.

| # | Strato | Che cosa fa |
|---|--------|-------------|
| 01 | **Sensori** | Raccolgono segnali e dati dal mondo reale |
| 02 | **Policy** | Stabilisce cosa si può fare, chi può farlo e con quali regole |
| 03 | **Strumenti** | Preparano le azioni tramite integrazioni affidabili |
| 04 | **Quality Gate** | Valida e garantisce la qualità prima dell'azione |
| 05 | **Apprendimento** | Impara dai risultati e migliora nel tempo |

Due regole di lettura che valgono più dello schema:

1. **Le azioni partono dopo il Quality Gate, non dopo gli Strumenti.** Gli strumenti preparano; è il gate che autorizza l'uscita verso il mondo reale. Invertire i due passaggi è l'errore che trasforma un sistema in un generatore di cose da rifare.
2. **Il loop si chiude sull'apprendimento o non è un loop.** Se gli esiti non tornano dentro come regole, il sistema produce sempre lo stesso livello di qualità e il costo del controllo non scende mai.

Al centro dei cinque strati sta **il Domino Brain**: il contesto che alimenta ogni passaggio. Intorno, la **supervisione umana**: definisce policy e guardrail in ingresso, gestisce escalation e revisione in uscita.

---

## 3. Lo stesso schema, da noi

Stato reale al 25 settembre 2026. Dove c'è scritto *da scrivere*, *da costruire* o *mezzo giro*, quello è il lavoro che manca.

| Strato | Che cosa abbiamo | Stato |
|--------|------------------|-------|
| **01 Sensori** | Microsoft Teams con registrazioni e trascrizioni · ActiveCollab (consuntivazione ore precisa, ogni progetto ha numero, ordine e budget) · vTiger (prevendita e vendita, a monte di HubSpot) · Agicap (cash flow) · Google Ads e Meta · Semrush · email · ticketing clienti | Ci sono già. Il problema non è misurare: è leggere |
| **02 Policy** | Le tre zone: verde procede, gialla fa approvare, rossa non si tocca | **Da scrivere** |
| **03 Strumenti** | Claude Team per tutti i ruoli, con progetti e skill · i connettori · Figma e Figma Weave · suite Adobe · Looker Studio per i cruscotti | Ci sono |
| **04 Quality Gate** | Il controllo in uscita. La domanda non è «è corretto?» ma **«è diverso?»** | **Da costruire** |
| **05 Apprendimento** | Il Registro degli esiti e il Trainstorming! mensile come momento di rilascio | **Mezzo giro** |

Il mondo reale da cui arrivano i segnali e verso cui tornano le azioni: clienti e prospect, riunioni, campagne, progetti e ore, cassa.

**La diagnosi in una riga:** Domino non ha un problema di strumentazione, ha un problema di lettura e di chiusura. I dati ci sono — in ActiveCollab, in vTiger, in Agicap. Nessuno li legge insieme, e quello che impariamo non torna dentro in forma di regola.

### 3.1 Le tre zone di policy

| Zona | Regola | Esempi |
|------|--------|--------|
| **Verde** | Il sistema procede da solo | Ricerca, sintesi, prime stesure interne, preparazione di materiali di lavoro |
| **Gialla** | Il sistema produce, una persona approva prima dell'uscita | Tutto ciò che vede un cliente o un prospect |
| **Rossa** | Il sistema non tocca | Prezzi, impegni contrattuali, decisioni che cambiano il perimetro di un progetto |

La zona si scrive una volta per ogni loop e sta nel documento del loop, non nella testa di chi lo esegue. **Le zone non sono ancora scritte:** è il primo pezzo mancante di DominoOS.

---

## 4. L'architettura in tre pezzi

Tre pezzi, tre velocità di aggiornamento diverse. Confonderli è il modo più rapido per rendere il sistema inaffidabile.

| Pezzo | Che cos'è | Chi lo modifica | Con che frequenza |
|-------|-----------|-----------------|-------------------|
| **Il Domino Brain** | Identità, metodi, prezzi, GTM, case history. Ogni modifica lascia traccia | Poche persone | Cambia due volte l'anno |
| **I progetti cliente** | Un Brain per ogni cliente: glossario, decisioni, vincoli, cosa ha funzionato | Chi ci lavora | Cambia ogni giorno |
| **Le skill** | Il metodo eseguibile: come si conduce un Core Sprint!, come si affronta una gara, come si crea una campagna, come si aggiorna una pagina | Caricate una volta | Si aggiornano per tutti |

> **La skill dice come si fa. Il Brain dice cosa c'è scritto. Il progetto dice cosa sappiamo di questo cliente.**

### 4.1 La regola delle tre volte

**Una skill si scrive solo quando lo stesso processo è già stato fatto tre volte a mano.** Prima di tre volte non si conosce ancora il processo: si sta codificando un'ipotesi.

Corollario: **se una cosa cambia più spesso di una volta al trimestre non va nella skill, va nel progetto.** La skill è il metodo stabile; il progetto è il contesto che si muove.

### 4.2 Le famiglie di skill e la nomenclatura

Tre famiglie, con un prefisso che dice subito a quale appartiene una skill.

| Famiglia | Prefisso | Contiene |
|----------|----------|----------|
| **Metodo** | `domino-metodo-*` | I metodi Domino resi eseguibili: Core Sprint!, Design Sprint!, Build Sprint!, Trainstorming! |
| **Funzione** | `domino-funzione-*` | I mestieri trasversali: gare pubbliche, RFQ e gare private, offerte, report analytics |
| **Cliente** | `cliente-*` | Un cliente per skill: come funziona l'azienda, chi decide, i vincoli, il design system |

I quattro esempi portati in presentazione:

| Famiglia | Skill | Che cosa fa | La possiede |
|----------|-------|-------------|-------------|
| Metodo | `core-sprint-facilitazione` | Prepara e conduce un Core Sprint!: i sette deliverable, i due giorni più i cinque di consolidamento, cosa fare quando gli stakeholder si bloccano | Brain Owner |
| Funzione | `gare-pubbliche` | Il procedimento, non la normativa: legge il bando, estrae da lì requisiti e scadenze, struttura l'offerta sui criteri di aggiudicazione | Chi guida la funzione |
| Funzione | `report-analytics` | Legge le campagne mercato per mercato e propone la riallocazione. Quello che funziona in Germania arriva in Spagna senza passare da una riunione | Loop Owner |
| Cliente | `cliente-case-ih` | Due pagine: chi decide, il ciclo di approvazione, i vincoli multi-mercato, gli errori già fatti. Il design system allegato. Prodotti e referenti restano nel progetto | Account lead |

**Distribuzione.** Le skill d'organizzazione si caricano una volta come pacchetto (`.zip` con `SKILL.md`) e da quel momento sono disponibili a tutti; l'approvazione di una nuova versione aggiorna automaticamente tutti gli utenti. Il caricamento è riservato agli owner dell'organizzazione: è questo che rende il Brain Owner un ruolo con potere reale e non un bibliotecario.

---

## 5. Chi lo fa vivere

**Quattro ruoli. Nomi, non caselle.** Un ruolo funziona solo se chi lo tiene ha già l'autorità su quel processo. Altrimenti è un segnalatore, e il loop si spegne.

| Quanti | Ruolo | Che cosa fa |
|--------|-------|-------------|
| Uno solo | **Brain Owner** | Presidia cosa c'è scritto. Decide cosa entra nel Brain, pubblica le release e tiene una versione sola, valida per tutti |
| Uno per processo | **Loop Owner** | Possiede la catena intera — processi, skill, regole — e il numero che dice se funziona. Quando un output esce male cambia la regola, non l'output |
| Uno per cliente | **Editor di progetto** | Tiene vivo il Brain del suo conto: fatti aggiornati, decisioni registrate, materiali che non invecchiano alle spalle di chi lavora |
| Tutti gli altri | **Chi lavora dentro** | Non devono sapere com'è fatto il sistema. Devono trovarci quello che serve, e segnalare quando non lo trovano |

**Nessun software nuovo, gli strumenti ci sono già. Servono quattro nomi veri e l'autorità di cambiare le regole.**

### 5.1 Il Loop Owner in dettaglio

È il ruolo nuovo, quello che non esiste in nessun organigramma di agenzia. Possiede **un processo intero** e il numero che lo misura, non uno strumento e non un pezzo. Fa quattro cose:

1. **Tiene il numero.** Ogni loop ha una metrica sola e dichiarata — giorni dal bando alla consegna, percentuale di prospect qualificati, ore di rilavorazione su un piano editoriale. Senza numero non è un loop, è un'abitudine.
2. **Decide le regole.** Scrive la zona verde, gialla e rossa del suo loop. Quando qualcosa esce male la correzione non è «stai più attento»: è una riga di regola in più.
3. **Presidia il Quality Gate.** Non controlla ogni output — sarebbe il contrario del punto — ma decide dove sta il gate e con quale criterio. Quando il gate boccia sempre la stessa cosa, il difetto è a monte e si cambiano le regole invece di continuare a bocciare.
4. **Chiude l'anello dell'apprendimento.** Ogni scarto del gate, ogni correzione a mano, ogni «l'ho dovuto rifare» torna dentro come modifica alla skill o al Brain. Vale la regola delle tre volte.

Differenza con il Brain Owner: il Brain Owner è uno solo e presidia **cosa c'è scritto**; i Loop Owner sono diversi, uno per processo, e presidiano **come funziona**.

**Assegnazioni:** DATI NON TROVATI. I quattro nomi non sono ancora stati decisi.

---

## 6. La prova: Digital Communication Forum Italia, Rimini, 20–22 settembre 2026

Il loop ha già girato una volta per intero, senza che lo chiamassimo per nome. È il riferimento con cui si spiega DominoOS a chi non l'ha mai sentito nominare: non una promessa, una cosa successa.

| # | Passaggio | Strato | Che cosa è successo |
|---|-----------|--------|---------------------|
| 01 | **Fonti** | Sensori | 43 delegati profilati, agenda, sessione E05. Più il Brain |
| 02 | **Brief** | Strumenti | Sedici schede incontro nel design system. In due giorni |
| 03 | **Incontro** | Sensori | Registrato dove possibile. La trascrizione è materia prima |
| 04 | **Esito** | Apprendimento (1° grado) | Aldino, Compass, CNH: cosa è successo e cosa fare |
| 05 | **Regole** | Apprendimento (2° grado) | Quattordici lezioni generalizzate dalle sedici schede |
| 06 | **Recap** | Da chiudere | Mail di riepilogo e contatti in HubSpot. Oggi a mano |

**Il loop gira già. Non si chiude:** le lezioni restano in un documento invece di diventare regole, e il passaggio a HubSpot è manuale. Sono i due buchi che il primo test commerciale deve chiudere.

### 6.1 Che cosa produce — la scheda Casappa

L'esempio concreto di output: **Scheda incontro · Casappa SpA**, nove pagine preparate per Emiliano prima di un appuntamento da quindici minuti, nel formato Document Layer. Sedici schede come questa, una per ogni appuntamento dei due giorni.

Come è fatta:

- **La conoscenza viene dal Brain.** Il GTM B2B e i case dello stesso mondo — CNH, Rollon, Comau, Danieli. Nessuno li ha riscritti a mano.
- **I dati vengono dalle fonti.** Il file di selezione Richmond: delegato numero 8, budget dichiarato, cosa ha scritto nel form.
- **Il giudizio resta umano.** L'obiettivo dell'incontro lo decide chi ci va: quindici minuti per ottenere un secondo appuntamento a Collecchio.

Le sedici schede sono nel progetto Claude *Domino Brain* con prefisso `dcf2026_scheda_*`; il quadro d'insieme dei due giorni è in `18_dcf_rimini_2026.md` (stesso progetto).

---

## 7. Dove le persone contano ancora

Non è una clausola di cortesia: è il perimetro che tiene il sistema dentro il rischio accettabile. Sette ambiti in cui la decisione resta umana per intero.

| Ambito | Perché |
|--------|--------|
| **Giudizio etico** | Decisioni morali complesse |
| **Situazioni nuove** | Decisioni che l'AI non ha mai visto |
| **Conferenze** | Presenza nel mondo fisico |
| **Relazione umana** | Fiducia che l'AI non può replicare |
| **Trattative commerciali** | Umane per i prossimi vent'anni |
| **Controllo qualità di output delicati** | Ciò che esce e non si può richiamare |
| **Alta posta, alta emozione** | Grandi progetti, criticità, opportunità strategiche |

---

## 8. Il prossimo passo: tre test, in quest'ordine

Non si annuncia un sistema. Si prova su lavoro vero.

### 01 · Air Dolomiti · CX Design Sprint!

Partito a settembre 2026. Scelto come primo test perché il ciclo si segue dall'inizio, il metodo è già codificato e la dimensione è governabile. Le quattro condizioni con cui si conduce:

- Brain di progetto dal primo giorno
- Tutto il lavoro dentro il progetto condiviso
- Il controllo in uscita su ogni consegna
- Due numeri a chiusura: **regole nuove entrate nel Brain** e **stima contro consuntivo**

Cartella: `Progetti Clienti/Air Dolomiti/2026_CX Design Sprint!/`, partendo da `00_scheda_progetto.md`.

### 02 · Il seguito del Forum

Aldino, Compass, TÜV Italia, Casappa, Engel & Völkers portate fino all'esito, con il Registro compilato. È il test del ciclo commerciale, e serve a chiudere i due buchi del §6: le lezioni che diventano regole e il passaggio a HubSpot.

### 03 · Case IH

Cinque lingue, cinque mercati, tre servizi: piano editoriale europeo, media e lead generation, gestione e manutenzione del sito europeo. È il test difficile e si affronta **quando i primi due hanno prodotto numeri**, non prima.

---

## 9. Che cosa manca, in ordine

1. **Le tre zone di policy, scritte.** Finché non esistono, ogni decisione su cosa il sistema può fare da solo è un caso singolo.
2. **Il Quality Gate.** Il controllo in uscita che chiede «è diverso?» e non «è corretto?». Con l'AI la correttezza è gratis: la riconoscibilità no.
3. **Il Registro degli esiti.** Il posto dove un esito diventa una regola. Senza, l'apprendimento resta mezzo giro.
4. **I quattro nomi.** Brain Owner, Loop Owner, editor di progetto assegnati a persone che hanno già l'autorità sui rispettivi processi.
5. **Il passaggio automatico dei contatti a HubSpot**, oggi a mano.

---

## 10. I rischi

- **Il sistema che nessuno mantiene.** Un Brain non aggiornato è peggio di nessun Brain, perché produce risposte sbagliate con la stessa sicurezza di quelle giuste.
- **La qualità media uniforme.** Se il gate controlla solo la correttezza, il risultato è un lavoro corretto e indistinguibile da quello di chiunque altro. È la posizione esatta che non vogliamo occupare.
- **L'annuncio prima della prova.** Un sistema presentato al team prima di avere prodotto numeri diventa un'iniziativa, e le iniziative si spengono.
- **I ruoli senza autorità.** Un Loop Owner che deve chiedere il permesso per cambiare una regola non è un proprietario: è un segnalatore.

---

## 11. Fonti e file collegati

**Presentazione:** `Presentazioni/Domino Brain · Visione.pptx` — 12 slide, Deck Layer, versione finale del 25 settembre 2026.

**Nel Brain:** `CLAUDE.md` (terminologia canonica e regole di produzione) · `03_domino_metodi.md` (metodi e prezzi, fonte unica) · `13_silos_framework.md` · `16_domino_deck_pptx.md` · `Progetti Clienti/Air Dolomiti/2026_CX Design Sprint!/`

**Nel progetto Claude *Domino Brain*:** `17_domino_ai_native.md` (l'analisi preparatoria da cui nasce questo documento: i quattro casi d'uso, la simulazione del ciclo commerciale e dei tre loop Case IH) · `18_dcf_rimini_2026.md` · le sedici schede `dcf2026_scheda_*`.

**Fonti esterne:** Blomfield / Y Combinator, STAR Global, Matrix Internet, Mirage — indirizzi in §1.

---

## 12. Regole d'uso di questo documento

- **DominoOS è un nome interno.** Non esce verso clienti o prospect finché i tre test del §8 non hanno prodotto numeri. Verso l'esterno si parla di quello che sappiamo fare, non del sistema con cui lo facciamo.
- **DominoOS non è il Brain & Identity Design Sprint!.** Il Design Sprint! è un prodotto che vendiamo; DominoOS è come lavoriamo noi. La tentazione di presentarlo come «il nostro metodo applicato a noi stessi» va evitata: è un'altra cosa, ed è più grande.
- Su offerta, metodi, prezzi e naming **vince il Brain**, non questo documento.
- Dove un dato non c'è, si scrive **DATI NON TROVATI**. Non si arrotonda.
