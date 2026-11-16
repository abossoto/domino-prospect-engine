# Domino Brain
> Release 2026-11-02 · Brain Owner Andrea Bosso ed Emiliano Cianci · changelog in `00_changelog.md` · segnalazioni in `_segnalazioni/`

## 1. Che cos'è
Il Domino Brain è la conoscenza condivisa di **Domino — Proudly Interactive** (domino.it): identità, servizi, metodi, prezzi, GTM per settore, case history, clienti e progetti. Claude lo legge in ogni sessione e lo tratta come fonte autoritativa: in caso di contraddizione con la memoria o con una skill, vince il file del Brain. Se un'informazione non c'è, si scrive **DATI NON TROVATI**; non si inventano case study, fatturati, nomi, referenti.

Domino è Partner di Customer Experience (label primario: *Domino CX Transformation Partner*), sedi a Torino e Venezia, ~50 persone, 30 anni di storia, B Corp certificata. Co-founder: Andrea Bosso (Strategy & Consulting Director) ed Emiliano Cianci. *Non eseguiamo, accompagniamo.*

È anche il sistema con cui Domino lavora: come raccogliamo quello che sappiamo, decidiamo cosa Claude può fare da solo, produciamo, controlliamo quello che esce e impariamo dagli esiti. Cinque strati (sensori, policy, strumenti, Quality Gate, apprendimento), tre pezzi (Brain, progetti, skill), quattro ruoli (§2). Scheda completa: `17_domino_brain_sistema.md`. Presentazione: `Domino Brain · Visione_3 copy.pptx` (25 settembre 2026). La frase che tiene insieme tutto: *il Brain tiene quello che resta. Il progetto cambia mentre il lavoro avanza. Le skill ripetono quello che abbiamo imparato.*

## 2. Come funziona
Lo schema è uno solo e si ripete a due livelli.

- **Un Brain** è un insieme di file `.md` in sola lettura per tutti tranne il suo owner. Cambia poco e lascia traccia.
- **Un progetto** sta sotto un Brain, è aperto in lettura e scrittura a chi ci lavora, ha un Loop Owner e un file vivo `00_scheda_progetto.md` (stato, persone, decisioni, date, punti aperti).

Al primo livello c'è il **Domino Brain** (owner: Brain Owner) con sotto i **progetti Domino** (Domino30, piano editoriale, campagne). Al secondo livello c'è un **Brain cliente** per ogni cliente (owner: il Direttore Clienti; lo aggiorna l'Account Manager) con sotto i **progetti di quel cliente**.

| Ruolo | Quanti | Cosa fa |
|---|---|---|
| **Brain Owner** | due | Presidia il Domino Brain: decide cosa entra, pubblica le release, tiene una versione sola. Oggi: Andrea Bosso ed Emiliano Cianci, con gli stessi permessi (decisione del 16 ottobre 2026). |
| **Direttore Clienti** | uno per cliente | Proprietario del cliente: coordina redditività e tutti i progetti di quel cliente, è l'owner del Brain cliente e porta il cliente nel board commerciale Domino. Riceve l'health check del cliente. |
| **Account Manager** | uno o più per cliente | Lavora sotto il Direttore Clienti e segue uno o più progetti del cliente. Tiene aggiornato il Brain cliente per conto del direttore. Riceve l'health check del cliente per il seguito operativo. |
| **Loop Owner** (PM, account, specialista) | uno per progetto o processo | Possiede la catena intera (processo, skill, regole) e il numero che dice se funziona. Quando un output esce male cambia la regola, non l'output. Sui progetti complessi, di solito sul piano tecnico, è un Project Manager. |
| **Chi lavora dentro** | tutti | Trova quello che serve, lavora nei progetti, segnala quando non trova. |

**Direttori Clienti oggi:** Andrea Bosso (Air Dolomiti, Slow Food, Stellantis, 4stars, CNH Industrial), Emiliano Cianci (CIA, Poltrona Frau In Motion, FARID, IVECO), Giovanni Borgna e Antonio Rossi (nessun cliente ancora assegnato).

**Regole di scrittura per Claude.** Claude scrive in un Brain solo se chi parla ne è l'owner (riconosciuto dall'email); nel Brain cliente scrivono Direttore Clienti e Account Manager. **Andrea Bosso ed Emiliano Cianci** (co-founder; emiliano.cianci@domino.it) sono entrambi Brain Owner, per decisione del 16 ottobre 2026, con gli stessi permessi: possono scrivere nel Domino Brain e ovunque, creare, cambiare e far partire clienti e progetti, decidere cosa entra, pubblicare le release. Nei progetti scrive per chiunque ci lavori. Le tre zone: **verde** procede da solo (lettura, sintesi, bozze dentro un progetto), **gialla** fa approvare (modifiche a schede progetto, documenti verso il cliente, mail), **rossa** non tocca (file dei Brain senza l'owner, prezzi, naming dei prodotti, `_superate/`). I permessi SharePoint li impostano i sistemisti; fino ad allora valgono queste regole per convenzione.

**Messaggi ai colleghi** (Emiliano Cianci, 30/10/2026). Le mail e i messaggi Teams che Claude manda ai colleghi Domino dicono che sono messaggi automatici scritti da Claude e si chiudono con «Domino.Brain». Si aggiunge «per conto di <nome>» solo quando il mittente visibile non è la persona per cui Claude scrive. Restano zona gialla: partono solo con l'ok di chi parla.

**Quando consultare il Brain.** Sempre, prima di rispondere su offerta, prezzi, metodi, terminologia, clienti, case history. Prima il file del livello più vicino (progetto → Brain cliente → Domino Brain), poi si risale.

## 3. Mappa delle cartelle
```
Domino Brain/
├── CLAUDE.md                    questo file
├── 01_… 18_….md                 i 17 file numerati del Brain (identità, servizi, metodi, case, settori, GTM, silos, document e deck layer, sistema, persone); il 12 non è un file: è Progetti Domino/12_domino30/
├── case_*.md, personas_*, …     schede di dettaglio citate dai file 01–18
├── Progetti Domino/             un progetto per cartella, ciascuno con 00_scheda_progetto.md: 12_domino30/, Piano editoriale social 2026/, …
├── Proposte a prospect/<Prospect Tema>/   proposte aperte o non andate a buon fine; un prospect non è un cliente (prospect = proposta Open nel CRM; cliente = proposta Awarded)
├── Clienti/<Cliente>/
│   ├── CLAUDE.md                rimanda a questo file e dice chi sono Direttore Clienti e Account Manager
│   ├── 00_brain/                il Brain cliente: 00_cliente, 01_referenti, 02_sistemi_e_link, 03_prodotti, 04_design_system, 05_skill
│   ├── Proposte/<Tema>/         nuove proposte a un cliente esistente: stessa struttura di Proposte a prospect (00_scheda_proposta.md · 01_brief/ · 02_lavoro/ · 03_consegna/ · _superate/)
│   └── <anno>_<Progetto>/       00_scheda_progetto.md · 01_proposta/ · 02_preparazione/ (materiali_cliente/, call/) · 03_workshop/ · 04_consolidamento/ · _superate/
├── Offerte/                     procedura delle offerte formali e specchio della numerazione (`registro_offerte_<anno>.csv`); lo storico delle offerte e i canoni stanno solo su SharePoint (decisione di Andrea Bosso, 2/11/2026)
├── Presentazioni/               deck canonici e riferimenti visivi
├── Eventi e Talk/               forum, convegni, interventi
├── Claude Design/               sorgenti visive (document layer, deck skill, asset)
├── assets_case_history/         immagini dei case
├── _health_check/               report settimanali AAAA-MM-GG_health_check.md; per cliente in clienti/<Cliente>/
├── _segnalazioni/               l'unica cartella del Brain aperta a tutti in scrittura: «non ho trovato X», un file per segnalazione
├── _skills/                     sorgenti (SKILL.md) delle skill distribuite da Claude Team
└── _superate/                   versioni precedenti (CLAUDE.md personale, backup Domino30), non si modificano
```
Transcript di call: `AAAA-MM-GG_tema.md` in `02_preparazione/call/`. Un nuovo progetto con lo stesso cliente è una nuova sottocartella `<anno>_<Progetto>/`. Quando il Direttore Clienti porta la proposta da Open ad Awarded nel CRM (vTiger), di solito all'arrivo dell'ordine ma anche su accordo verbale, il prospect diventa cliente: la skill *crea cliente* costruisce il Brain cliente e la proposta finisce in `01_proposta/` del primo progetto, dove non si modifica più. Se l'ordine non c'è ancora, è una responsabilità che si prende il Direttore Clienti, annotata nella scheda progetto.

**Proposte a clienti esistenti** (regola di Emiliano Cianci, 24/10/2026). Una nuova proposta a chi è già cliente non va in `Proposte a prospect/`: si registra in `Clienti/<Cliente>/Proposte/<Tema>/`, con la stessa struttura e la stessa `00_scheda_proposta.md` delle proposte a prospect. Il CLAUDE.md del cliente la elenca tra le proposte aperte. Quando il Direttore Clienti la porta ad Awarded diventa un nuovo progetto `<anno>_<Progetto>/` del cliente e la cartella passa nel suo `01_proposta/`; se non va, resta in `Proposte/` con `00_esito.md`.

**Gruppi già clienti** (regola di Andrea Bosso, 2/11/2026). La regola vale anche quando il committente è un'altra società o divisione di un gruppo che ha già un Brain cliente (Stellantis; CNH Capital rispetto a CNH): la proposta sta dentro la cartella del cliente del gruppo, in `Clienti/<Cliente>/Proposte/<Tema>/`, non in `Proposte a prospect/`. Se il gruppo non ha ancora un Brain cliente, la proposta resta tra i prospect finché non nasce.


## 4. Le skill
Vivono in Claude Team e sono distribuite centralmente dal Brain Owner. Una skill si scrive solo quando lo stesso processo è già stato fatto tre volte a mano; se cambia più di una volta a trimestre non va nella skill, va nel progetto.

| Skill | Cosa fa | La possiede |
|---|---|---|
| **domino-brain-init** | Una per tutta Domino. All'avvio verifica che la cartella del Brain sia collegata (collegarla è un'azione della persona), legge questo file, riconosce chi parla e i suoi ruoli, controlla i connettori necessari (HubSpot, Microsoft 365 per mail, calendario e Teams, Figma) e applica le regole del §2. | Brain Owner |
| **domino-crea-cliente** | Parte da una proposta Awarded (il Direttore Clienti l'ha portata da Open ad Awarded nel CRM). Chiede nome, settore, Direttore Clienti, Account Manager, referenti, ufficio acquisti, link HubSpot; cerca da sola in HubSpot i link ad azienda e contatti, chiede il riferimento della trattativa in vTiger e, se non trova un link, lo chiede; crea `Clienti/<Cliente>/00_brain/` e il CLAUDE.md del cliente; genera la richiesta permessi ai sistemisti; aggiorna la tabella clienti qui sotto. | Brain Owner |
| **domino-crea-progetto** | Sotto un cliente o sotto Domino: chiede nome, tipo (Core, Design, Build Sprint!, Trainstorming Sprint!, altro), Loop Owner, perimetro, date, stato dell'ordine (arrivato o atteso); chiede il riferimento della trattativa in vTiger; crea la struttura del progetto e il suo CLAUDE.md, sposta la proposta Awarded in `01_proposta/`; aggiorna la scheda del Brain sopra. | Loop Owner |
| **domino-health-check** | Controllo settimanale, eseguito una volta sola come attività pianificata (lunedì ore 8, Mac del Brain Owner), mai correttivo. *Generale*, sul Brain Domino senza `Clienti/`: governance (release, segnalazioni, campi vuoti, cartelle fuori standard, proposte Awarded ancora tra i prospect, proposte a clienti esistenti finite tra i prospect, skill), contraddizioni, pagine superate, riferimenti rotti, notazione, dati web, concetti senza pagina, pagine orfane, release proposta; report in `_health_check/`, mail al Brain Owner. *Per cliente*, completo su `Clienti/<Cliente>/`: Brain cliente, schede progetto (stato attivo / in attesa / chiuso, ordine arrivato o atteso, movimento reale in calendario e cartelle), proposte aperte in `Proposte/`, gli stessi controlli di contenuto, tre azioni; segnalazioni aperte instradate a chi deve rispondere; ogni rapporto chiude con le domande per persona (Brain Owner, Direttore Clienti, Account Manager, Loop Owner); report in `_health_check/clienti/`, mail a Direttore Clienti e Account Manager con Apple Mail. | Brain Owner |
| **domino-case-history** | Una fonte per case, molte declinazioni. Scrive la scheda case da un progetto chiuso o da un racconto interattivo (domande a giri corti, richiesta di materiali), la aggiorna, e la declina: riga per il prospecting, paragrafo per mail commerciale, post LinkedIn e Instagram con brief visuale, slide da pitch e modulo a tre slide, pagina domino.it in italiano e inglese, paragrafo per gara, one-pager di settore, richiesta di testimonianza, case in 60 secondi; scheda premio su richiesta. Citabilità verificata prima di ogni uscita; nel Brain entra solo la scheda, le uscite stanno in chat e nelle cartelle di progetto. | Brain Owner |
| **domino-proposta-prospect** | Prepara la proposta per un prospect privato (la cui proposta è ancora Open nel CRM) o una nuova proposta a un cliente esistente, da un brief, da una gara privata o senza brief (call, incontro, mail): cartella in `Proposte a prospect/` o in `Clienti/<Cliente>/Proposte/<Tema>/` (§3), lettura del bisogno, soluzione Sprint!, deck, esito. Non scrive l'offerta formale. | Brain Owner |
| **domino-segnalazione** | Crea una segnalazione in `_segnalazioni/` nel formato giusto: poche domande mirate (cosa non torna, dove hai guardato, cosa ti aspettavi, a cosa si riferisce, scadenza), controlla prima che il dato manchi davvero nel Brain, sceglie il destinatario con nome (Brain Owner, Direttore Clienti, Account Manager, Loop Owner) e salva il file dopo l'ok. Scrive solo in `_segnalazioni/`. | Brain Owner |
| Skill di metodo | core-sprint-facilitazione, gare-pubbliche, report-analytics, … (vedi `17_domino_brain_sistema.md` §4.2) | Loop Owner del processo |

## 5. Progetti Domino
| Progetto | Cosa | Loop Owner |
|---|---|---|
| **Domino30 / 30inSprint!** | 30 anni di Domino (2026): 4 Sprint! gratuiti a 2 startup + 2 non profit, due classifiche; 100 punti per classifica (30 voto online + 70 giuria; 12 giurati, presidente Paolo Accossato, 1°/2°/3° posto per categoria riportati su 70, voto della giuria online fino al 25/10/2026; voto pubblico chiuso, 5.274 voti); voto di sala eliminato il 24/09/2026. 36 candidature (22 non profit, 14 startup); proclamazione il **30 ottobre 2026 all'Esperia sul Po**. Pagina domino.it/domino30. Cartella `Progetti Domino/12_domino30/`: partire da `00_scheda_progetto.md` e `00_indice.md`; promessa canonica in `12_concept.md`; stato in `12b_stato.md`; serata in `12c_serata_30ottobre.md`. | Virginia Girardi |
| **Piano editoriale social 2026** | `Progetti Domino/Piano editoriale social 2026/`: scheda e `Piano_editoriale_social_2026.docx`; riunione con Fabrizio Porro il 3/09/2026, punti aperti. | Virginia Girardi |
| **Produzione e valore aggiunto** | **Riservato** (Brain Owner, Direttori Clienti ed Ernesto Nicolosi per le estrazioni). Presidio di produzione, valore aggiunto e margine da ActiveCollab: estrazioni in `01_estrazioni/`, analisi e script in `02_analisi/`, vademecum PM in `03_presentazioni/`. `Progetti Domino/Produzione e valore aggiunto/`: partire da `00_scheda_progetto.md` (definizioni e decisioni). Aggiornato quando serve. | Emiliano Cianci |

## 6. Clienti e prospect
Cliente è chi ha una proposta Awarded nel CRM (§7). Chi ha ricevuto una proposta ancora Open è un prospect.

### Clienti
| Cliente | Direttore Clienti / Account Manager | Stato | Cartella |
|---|---|---|---|
| **Air Dolomiti** | Andrea Bosso / Valentina Venza | CX Design Sprint! chiuso e fatturato (workshop il 5 e 6 ottobre 2026, presentazione finale il 23 ottobre); sessione Austrian ancora da fare, in attesa del cliente, con quotazione a parte; il 28/10/2026 Andrea Bosso ha mandato al cliente uno stimolo sul seguito (Build Sprint!), non una proposta | `Clienti/Air Dolomiti/` — Brain cliente in `00_brain/`; progetto in `2026_CX Design Sprint!/` (Loop Owner Valentina Venza), partire da `00_scheda_progetto.md` |
| **Slow Food** | Andrea Bosso / Andrea Bosso | Workshop di attivazione pre-Core Sprint! del 24/08/2026 svolto; documento autoritativo "Da progetti a partnership"; stand by dal 2/11/2026 (attesa risposta del Direttivo); Loop Owner Andrea Bosso | `Clienti/Slow Food/` — Brain cliente in `00_brain/`; progetto in `2026_Core Sprint!/`, partire da `00_scheda_progetto.md` |
| **CIA** | Emiliano Cianci / Emiliano Cianci | percorso Sprint! 2025-2026 consegnato a gennaio 2026; seguito da definire; stand by dal 24/10/2026 (deciso da Emiliano Cianci) | `Clienti/CIA/` — Brain cliente in `00_brain/` |
| **Poltrona Frau In Motion** | Emiliano Cianci / Giulia Palazzo | Brain cliente creato il 13 ottobre 2026; progetto DATI NON TROVATI | `Clienti/Poltrona Frau In Motion/` — Brain cliente in `00_brain/` |
| **FARID** | Emiliano Cianci / Antonio Rossi | Brain cliente creato il 19 ottobre 2026; nuovo sito: go live previsto lunedì 2/11/2026 (Ecomondo dal 3 al 6 novembre), esito da registrare; traduzioni FR ed ES della sezione prodotto da verificare; monte ore 107_26 in attesa d'ordine; proposta Digitale 2027 (roadmap e budget 2027) presentata il 28/10/2026, primo feedback a fine novembre, decisione sul budget entro fine anno | `Clienti/FARID/` — Brain cliente in `00_brain/`; progetto in `2025_Website Design Sprint!/`; proposta in `Proposte/Digitale 2027/` |
| **IVECO** | Emiliano Cianci / per filone (Marta Carletti su iveco.com, Iveco Bus e attività verticali; Emiliano Cianci su design system, UX/UI e Workshop Assistant) | Cliente storico, cinque filoni attivi (iveco.com, design system e UX/UI, Workshop Assistant, Iveco Bus, attività verticali), referenti per filone; Brain cliente aggiornato il 23 ottobre 2026; nel Brain: UX Reviewer, sottoprogetto del monte ore Design System (Loop Owner Francesca Fazio); proposta aperta: Workshop Assistant Contenuti (in valutazione) | `Clienti/IVECO/` — Brain cliente in `00_brain/`, partire da `00_cliente.md` |
| **Stellantis** | Andrea Bosso / Marta Carletti e Nadia Ortale (PM Gianluca Pelissetti) | Cliente storico, più filoni (comunicazione interna Italia ed Enlarged Europe, Parts & Services, Pro One, Stellantis Club, Trofeo Agnelli, video tutorial, Employee Portal), referenti per filone; Brain cliente creato il 24 ottobre 2026; ordini non elencati. La gara HR & ESG 2027 (nuovo committente nel gruppo) è una proposta aperta in `Proposte/HR ESG Communications 2027/` | `Clienti/Stellantis/` — Brain cliente in `00_brain/`, partire da `00_cliente.md` |
| **4stars** | Andrea Bosso / Antonio Rossi (PM Antonio Rossi) | Cliente storico dal 2023 (Website Design Sprint! 2024, manutenzione a pacchetti); filone hosting e gestionale: accordo verbale del 19/10/2026, ordine atteso (si parte il 6/11/2026 sotto la responsabilità di Andrea Bosso); due progetti dal 2/11, Manutenzione gestionale con la rifondazione (90 giornate entro il 31/12/2027, OFF_140_26 rev02) e Hosting gestionale (OFF_148_26), Loop Owner Antonio Rossi; Brain cliente creato il 27 ottobre 2026 | `Clienti/4stars/` — Brain cliente in `00_brain/`, partire da `00_cliente.md` |
| **CNH Industrial** | Andrea Bosso / Giulia Palazzo (PM) | Cliente storico, brand Case IH e STEYR; Brain cliente creato il 2 novembre 2026 sulla base del lavoro di Giulia Palazzo; contratti 2026 26-011 (Case IH) e 26-012 (STEYR) su accordo quadro con listino a Story Point; ordini non elencati. La gara CNH Capital EMEA SEO/GEO 2027 (nuovo committente nel gruppo) è una proposta aperta in `Proposte/CNH Capital SEO GEO Lead Generation 2027/` (primo incontro del 3/11/2026 svolto, rilancio di signagecapital.com; brief atteso, feedback di Andrea Bosso dopo circa una settimana) | `Clienti/CNH Industrial/` — Brain cliente in `00_brain/`, partire da `00_cliente.md` |

### Prospect
| Prospect | Referente Domino | Stato | Cartella |
|---|---|---|---|
| **Vemer Brand e Formazione Installatori** | Andrea Bosso | Call del 21/10/2026 svolta; in attesa delle desiderata di Anna Plazzotta, poi proposta con due interventi (brand, formazione installatori) e stima di budget; incontro a Feltre a metà novembre | `Proposte a prospect/Vemer Brand e Formazione Installatori/` — scheda in `00_scheda_proposta.md` |
| **ED&F Man Sugar Plus** | Andrea Bosso | Stand by dal 5/11/2026: proposta presentata (reel dalla stalla, Completa €11.306 o Smart €4.564, IVA esclusa); in riunione Alice Bizzarri ha detto che decideranno a marzo 2027, quando si riprende; Flavio Pedazzini può risentire la cliente nel frattempo | `Proposte a prospect/ED&F Man Sugar Plus/` — scheda in `00_scheda_proposta.md` |
| **Casappa Sito di Gruppo** | Emiliano Cianci | Due proposte aperte. A, sito del 75° (€12.000): linea strategica concordata con Paita il 27/10, call tecnica del 29/10 favorevole, hosting in verifica, decisione attesa prima del 14/11/2026. B, sito di Gruppo (Core Sprint! + Design Sprint! Website): presentata a Collecchio il 20/10/2026, aggiornamento a dicembre 2026 dopo il CdA | `Proposte a prospect/Casappa Sito di Gruppo/` — scheda in `00_scheda_proposta.md` |
| **FPT Listino Digitale** | Emiliano Cianci | Gara privata Iveco Group «Digitalization Commercial Catalogue» per FPT Industrial: briefing del cliente il 26/10/2026, kickoff interno lunedì 2/11; in attesa dei materiali di gara da Flavio Pedazzini; concorrenti Reply, Mediacross, Blank Spaces (forse BTS) | `Proposte a prospect/FPT Listino Digitale/` — scheda in `00_scheda_proposta.md` |
| **Clinica Veterinaria Rivoli** | — | Stand by dal 2/11/2026 (decisione di Andrea Bosso); ultima bozza: scaletta v3 dell'8 giugno 2026 | `Proposte a prospect/Clinica Veterinaria Rivoli/` |
| **Humanitas SEO GEO** | — | Proposta non accettata (settembre 2026): scelto un altro partner, che non lavora con KPMG | `Proposte a prospect/Humanitas SEO GEO/` — esito in `00_esito.md` |

Settori target: B2B Industriale/Manifatturiero · Salute/Sanità & Beauty · Turismo & Cultura · Finance/Assicurazioni & PA · Automotive.

## 7. Terminologia
| Termine | Significato |
|---|---|
| **Core Sprint!** | Notazione canonica con `!`. **2 giorni di workshop con il cliente + 2 giorni di lavoro Domino**; dossier entro 5 giorni lavorativi dalla chiusura del workshop. Sette deliverable: Ipotesi Core, mappa di differenziazione competitiva, mappa delle priorità, mappa stakeholder, trade-off considerati, prossimi passi, poster A3. €6.000. "Foundation Sprint" non si usa verso il cliente (linguaggio startup, noi serviamo enterprise); ammesso come riferimento metodologico interno se il buyer chiede il fondamento. |
| **Design Sprint!** | Adattamento Domino del metodo Google Ventures. 2 giorni di workshop + 2 giorni di lavoro Domino sul prototipo. €10.000. User testing opzionale, **dopo** lo Sprint!. Sei varianti: Service, CX, Brand, Digital Marketing, Website, Intranet. |
| **Brain & Identity Design Sprint!** | Variante del Design Sprint! e prodotto di punta 2026: progetta il *brain aziendale* del cliente (conoscenza interrogabile via AI) e il *design system*. *"Il brain governa cosa si sa, il design system governa come si appare."* |
| **Build Sprint!** | Esecuzione con metodo sprint: blocchi di 2 settimane o 1 mese, deliverable verificabili, perimetro aperto. 8-52 settimane, €20-60K. Sostituisce "Progetto completo (execution)". Terzo passo del percorso Core → Design → Build → Trainstorming Sprint!. |
| **Trainstorming Sprint!** | Accompagnamento strutturato (NON formazione, NON consulenza). *"I progetti finiscono. Le transizioni no. Il Trainstorming! fa funzionare l'organizzazione finché il cambiamento diventa sistema."* |
| **Decision Design** | Cuore del lavoro Domino, su tre piani. **Organizzativo** (conseguenze a 6-12 mesi, chi decide; piano primario in vendita), **di Team** (facilitazione visiva delle scelte: chiarezza visiva, gestione alternative, contesto e ruoli; problema → esplorazione → valutazione → scelta), **di Prodotto** (choice architecture: defaults, friction, reference points, cognitive load). Formula: *"Le decisioni: simboli di un'organizzazione che sa decidere — e sa perché."* Slogan storico: *"da come si naviga a come si sceglie"*. Già nel Codice Etico (sez. 4, 8 luglio 2024). Mappatura: Core → Organizzativo; Design → di Team + di Prodotto; Build → di Prodotto; Trainstorming Sprint! → Organizzativo + di Team. I piani di Team e di Prodotto non escono mai senza l'Organizzativo sopra. C-level → solo Organizzativo; CX manager → Organizzativo + di Team; head of digital → Organizzativo + di Prodotto. I tre piani insieme non in pitch enterprise. |
| **Vendere decisioni, non output** | Tesi 2026: *"Vendere output significa essere confrontabili. Vendere decisioni significa essere insostituibili."* |
| **Framework Silos** | Tassonomia HBR (marzo 2025): silos sistemici → Core Sprint!, elitari → Brain & Identity Design Sprint!, protezionistici → Trainstorming Sprint!. *"I tuoi clienti non si perdono nel journey. Si perdono nei tuoi silos."* Dati Mentimeter (Richmond CX Forum Rimini 2026): attrito vendite-operations 64%. Fonte: `13_silos_framework.md`. |
| **Regola di notazione** | Tutti i prodotti Domino che terminano con "Sprint" portano il `!` finale, quindi anche Trainstorming Sprint! (nome del prodotto dal 2/11/2026, decisione di Andrea Bosso). «Trainstorming!» indica il rituale interno mensile di Domino e la formula canonica «I progetti finiscono. Le transizioni no. Il Trainstorming! fa funzionare…». |
| **Payoff** | *"Semplifichiamo la complessità, liberiamo il potenziale."* |
| **Cliente** | Chi ha una proposta **Awarded** nel CRM (vTiger, o quello che useremo): il Direttore Clienti si è preso la responsabilità di farne un cliente, in genere all'arrivo dell'ordine, ma anche su accordo verbale. Se l'ordine non c'è ancora, è una responsabilità del Direttore Clienti, annotata nella scheda progetto (ordine arrivato o atteso). Ha un Brain cliente in `Clienti/` (skill *crea cliente*). Le sue nuove proposte stanno in `Clienti/<Cliente>/Proposte/` (§3). |
| **Stand by** | Stato di un progetto o di una proposta su cui non serve avere un aggiornamento (decisione di Andrea Bosso, 2/11/2026). La scheda riporta «Stand by dal <data>», il motivo e, se c'è, quando o a quale evento si riprende. L'health check lo registra e non lo conta come ritardo né come silenzio. Si riattiva con una decisione del Direttore Clienti (progetto) o del referente Domino (proposta). |
| **Trattative e offerte (vTiger)** | Trattative e offerte stanno solo in vTiger; HubSpot tiene aziende e contatti (segnalazione di Emiliano Cianci, 26/10/2026). Le skill non cercano né aggiornano trattative in HubSpot: chiedono il riferimento in vTiger. |
| **Prospect** | Chi riceve una proposta e aspetta l'esito, accettata o respinta: la proposta è **Open** nel CRM. Sta in `Proposte a prospect/`, anche dopo un esito negativo. Diventa cliente quando il Direttore Clienti porta la proposta da Open ad Awarded. |

## 8. Regole di produzione
**Documenti.** Ogni documento stampabile (proposta, offerta, analisi, report, one-pager, lettera) nasce come **.docx nativo** nel formato Document Layer del Domino Design System, senza HTML intermedio (dal 7 luglio 2026): nero su bianco + un solo rosso `#FF303F`, Aktiv Grotesk (corpo, fallback Arial) + PT Serif Bold (lead e payoff), sezioni numerate con numero rosso, bullet `■` rosso, callout via tabelle a cella singola, un solo blocco scuro di chiusura, mai DominoType né elementi da deck. Regole complete: `15_domino_document_word.md`. Riferimento visivo storico: `14_domino_document_design.md` + `Claude Design/document-layer/`.

**Deck.** Ogni presentazione nasce come **.pptx nativo 20″×11,25″** (1440×810 pt) nel formato Deck Layer. Riferimenti canonici in `Presentazioni/`: `Case IH · European Social 2026.pdf` (vince in caso di disaccordo) e `CX Forum Rimini · Pitch Domino.pdf`. Nero/bianco + `#FF303F`; `Aktiv Grotesk Trial` (Black display, XBold heading, Medium lead, Regular corpo, Bold label) + `PT Serif` Bold; testo attenuato via alpha, non grigi; paper `#F0F0F0` per contenuto denso, dark `#000000` con fondo fumo (`Claude Design/deck-skill/assets/smoke/`) per cover e divisori; una sola slide red di chiusura; chrome 10,5 pt CAPS, gutter 90 pt, corpo 18–21,75 pt. Regole complete: `16_domino_deck_pptx.md`. QA visiva obbligatoria prima della consegna.

Su offerta, metodi, prezzi e naming vince sempre il Brain, non la skill.

## 9. Lingua e stile
- Italiano, prosa concisa, liste solo quando servono.
- "Nostra soluzione", mai "nostro approccio" nella Core Hypothesis.
- Espressioni vietate: "che si mette a terra", "stakeholder war".
- Verbo vietato: **"firmare"** e derivati, anche in metafora ("perimetro firmato"). Sostituire con *definire / chiarire / decidere / prendere*. "Firma" come sostantivo solo se non confondibile; in dubbio *cifra* o *impronta*.
- **"Agenzia" / "agency" vietato in auto-definizione.** Domino è *partner*. Ammesso per dire cosa non siamo, per competitor e categorie di mercato, per reti di vendita del cliente, nomi propri e citazioni verbatim.
- Case study nei materiali: esattamente tre (il più rilevante, uno dello stesso settore, uno della stessa metodologia); mai Fiat/Costa Crociere soli.
- Il file su OneDrive (`Domino Brain - main`) è sempre la fonte autoritativa, non una versione ricostruita in chat.
