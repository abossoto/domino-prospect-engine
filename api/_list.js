// api/_list.js
// Generazione liste prospect, in due fasi come l'analisi del singolo prospect.
// Fase 1 (runListAgent) non usa il brain; fase 2 (rankList) si'.

import { callClaude, extractText, loadBrain, brainBlock, webSearchTool, tempoResiduo } from './_shared.js';
import { parseJSON } from './_generate.js';

const LIST_RESEARCH_SYSTEM = `Sei un analista commerciale senior per Domino, agenzia CX italiana.
Il tuo compito è identificare aziende prospect qualificate usando ricerche web reali.

PROFILO ICP DI DOMINO (Ideal Customer Profile):
- Settori: Automotive, B2B Industriale, Salute & Sanità, Turismo & Cultura, Finance, PA
- Caratteristiche: presenza digitale migliorabile, processi complessi, mercati multipli
- Segnali positivi: sito datato, poca presenza digitale, crescita recente, job posting digital, cambi management
- Segnali negativi: già cliente Domino, già dotata di agency strutturata dedicata

FASCE DIMENSIONALI — SOGLIE CANONICHE:
Le tre fasce sono DISGIUNTE: ogni azienda appartiene a una sola.
- PMI: fino a 50 dipendenti, oppure fatturato sotto i 10 milioni di euro
- Mid-market: da 50 a 500 dipendenti, oppure fatturato fra 10 e 100 milioni
- Enterprise: oltre 500 dipendenti, oppure fatturato sopra i 100 milioni
Se dipendenti e fatturato indicano fasce diverse, decide il FATTURATO: e' il dato
che correla con la capacita' di spesa ed e' verificabile sul bilancio depositato.
QUALE fatturato: quello della SOCIETA' ITALIANA da bilancio depositato, non quello
di gruppo. Su un'azienda con controllate estere i due numeri divergono anche molto,
e l'entita' italiana e' quella che ha il budget e firma il contratto. Cerca i bilanci
sui portali che li pubblicano in chiaro (fatturatoitalia.it, reportaziende.it e simili):
cerved.com e i rivenditori di visure li tengono dietro login, cercarli li' e' sprecato.
Attenzione: qui "PMI" significa piccola impresa sotto i 50 dipendenti, NON la
definizione UE che arriva a 250. Le soglie di questa lista sono quelle qui sopra.

CRITERIO ECONOMICO - VINCOLANTE, E' UN FILTRO DI ESCLUSIONE:
L'azienda deve poter sostenere un progetto da 20.000 a 200.000 euro. Non e' una
preferenza, e' una condizione di ammissione. Una microimpresa da 5-10 dipendenti
sta dentro la fascia PMI ma non compra un progetto da 20K: NON includerla, per
quanto il settore sia giusto e i segnali digitali interessanti.
Indicatori pratici che il filtro e' superato: fatturato almeno intorno ai 2-3
milioni; oppure una funzione marketing/comunicazione interna; oppure segnali di
investimento digitale gia' in corso (job posting digital, e-commerce attivo,
rifacimento sito recente, presenza fieristica strutturata).
Nel dubbio su un'azienda molto piccola, escludila: una lista corta di aziende
contattabili vale piu' di una lista lunga di aziende che non risponderanno.

LA FASCIA RICHIESTA COMANDA:
Cerca aziende nella fascia dimensionale indicata nella richiesta, anche quando non
coincide con il cuore storico dei clienti Domino. Una richiesta su PMI va servita
con PMI vere, non con mid-market travestite. Se in quella fascia non trovi abbastanza
aziende con segnali di bisogno reali, restituiscine meno e dillo: meglio sei aziende
giuste che dieci fuori fascia.

REGOLE:
- Cerca SOLO aziende reali — mai inventare nomi
- Per ogni azienda: verifica che esista davvero cercando il sito
- Segnala "⚠️ Non verificato" se non riesci a trovare dati sufficienti
FORMATO OBBLIGATORIO PER OGNI AZIENDA:
Per ogni azienda che includi nel report DEVI annotare esplicitamente l'URL del sito
verificato, nella forma "Sito: https://www.esempio.it". Verificare il sito senza
trascriverlo rende il dato inutilizzabile a valle: il commerciale apre il sito come
prima cosa. Se dopo la ricerca non trovi un sito attribuibile con certezza a
quell'azienda, scrivi "Sito: non trovato" - mai un dominio dedotto dal nome.

- Priorità a aziende italiane (o con sede in Italia) a meno che non specificato diversamente`;

function buildListGenSystem(brain) {
  const rest = `Sei il generatore di liste prospect per Domino. Ricevi una lista di aziende trovate nella research e produci l'output strutturato.

FASCE DIMENSIONALI (stesse soglie usate nella ricerca, disgiunte):
PMI = fino a 50 dipendenti o meno di 10 milioni di fatturato.
Mid-market = 50-500 dipendenti o 10-100 milioni.
Enterprise = oltre 500 dipendenti o oltre 100 milioni.
A parita' di conflitto fra dipendenti e fatturato decide il fatturato.
Il campo "dimensione" di ogni azienda va compilato con queste soglie, non a occhio.

SCORING (1-10) — fit con Domino RISPETTO AI CRITERI RICHIESTI:
La fascia dimensionale richiesta fa parte dei criteri: un'azienda dentro la fascia
chiesta non va penalizzata perche' e' piu' piccola del cliente Domino tipico. Se la
richiesta e' su PMI, una PMI con segnali forti vale 9, non 5. Penalizza invece chi
sta FUORI dalla fascia richiesta.
Il criterio economico resta: l'azienda deve poter sostenere un progetto da 20K-200K.

10: Fit perfetto — settore Domino, dentro la fascia richiesta, segnali digitali chiari, nessun competitor evidente
8-9: Ottimo fit — 2-3 criteri positivi forti
6-7: Buon potenziale — fit di settore ma meno segnali
4-5: Potenziale — settore adiacente, segnali deboli, o fascia dimensionale diversa da quella richiesta
1-3: Poco probabile — fuori target, già ben servito, o incapace di sostenere l'investimento

CAMPO "sito" - COMPILALO SEMPRE QUANDO IL DATO C'E':
Il sito e' il primo dato che il commerciale apre. Se nel report compare il dominio
o l'URL dell'azienda, riportalo SEMPRE in "sito" in forma completa (https://www.esempio.it).
Usa null SOLO se nel report non c'e' nessun riferimento al sito di quell'azienda.
Non dedurre mai il dominio dal nome dell'azienda.

Restituisci ESCLUSIVAMENTE JSON puro. Zero testo. Zero markdown. Zero backtick.

{
  "lista": [
    {
      "nome": "string",
      "sito": "string | null",
      "settore": "string",
      "sede": "string",
      "dimensione": "PMI | Mid-market | Enterprise — secondo le soglie sopra",
      "fatturato_stimato": "string | null",
      "score": 8,
      "score_motivazione": "string — max 1 frase, perché è un buon prospect",
      "segnale_principale": "string — il segnale più rilevante trovato"
    }
  ],
  "totale_trovate": 10,
  "criteri_applicati": "string — riassunto breve dei criteri usati nella ricerca"
}`;

  return [
    brainBlock(brain),
    { type: 'text', text: rest },
  ];
}

// Stessa logica di _research.js: web_search e' server-side, l'unica cosa da
// gestire client-side e' il pause_turn a fine loop server.
const MAX_RESUMES = 3;
// Con 12 il modello esauriva le ricerche nella scoperta e restituiva una lista
// vuota con HTTP 200, un fallimento silenzioso. Era poi sceso a 25 per stare
// dentro un budget di 300s che si e' rivelato inesistente: su piano Pro il
// massimo e' 800s, i 300 erano solo il default di Vercel. Con il budget reale
// (600s su questo endpoint) 40 ricerche ci stanno comode - la singola chiamata
// misurava ~270s. Il numero e' dichiarato anche nel messaggio utente, perche' un
// tetto che il modello non conosce lo fa lavorare fino a sbatterci contro invece
// di dosarsi.
const MAX_RICERCHE = 40;
// Dopo lo split la generazione vive in un'altra function, quindi qui serve
// solo il tempo per restituire il report.
const RISERVA_MS = 30000;

export async function runListAgent(settore, geografia, dimensione, keywords, numero, scadenza) {
  const dimLabel = dimensione?.length ? dimensione.join(' o ') : 'qualsiasi dimensione';

  const userMsg = `Trova ${numero} aziende prospect qualificate per Domino con questi criteri:

SETTORE: ${settore}
AREA GEOGRAFICA: ${geografia || 'Italia'}
DIMENSIONE: ${dimLabel}
PAROLE CHIAVE: ${keywords || 'nessuna specifica'}

PROCEDURA:
1. Cerca aziende del settore indicato nell'area geografica specificata
2. Per ogni azienda trovata, verifica che esista realmente cercando il sito web
3. Valuta la qualità della loro presenza digitale (sito, social, news)
4. Cerca segnali di bisogno: sito datato, job posting digital, crescita recente, riorganizzazioni

NON cercare il decisore da contattare in questa fase. E' lavoro duplicato: quando
l'azienda passa all'analisi singola, i decisori arrivano verificati da RocketReach
con nome, ruolo, profilo LinkedIn ed email. Qui serve solo capire SE l'azienda vale
il contatto, non CHI contattare. Ogni ricerca risparmiata qui e' una ricerca in piu'
per verificare un'altra azienda.

BUDGET DI RICERCA: hai al massimo 40 ricerche web per l'intero compito, condivise
fra scoperta e verifica. Spendine al massimo 3 per singola azienda e tienine da
parte per la scoperta iniziale.
Quando il budget sta finendo, CHIUDI con le aziende che hai gia' verificato invece
di lasciare il lavoro a meta': meglio 6 aziende complete che 10 abbozzate, e molto
meglio di un compito interrotto a budget esaurito.

ARRENDITI PRESTO SE L'INSIEME E' VUOTO: alcune combinazioni di criteri hanno pochissime
aziende, o nessuna. Una fascia dimensionale piccola unita al filtro economico dei
20-200K e' il caso tipico: le due condizioni quasi si escludono. Se dopo circa 15
ricerche hai meno di 3 aziende che superano TUTTI i filtri, fermati e restituisci
quelle poche che hai, dicendo esplicitamente nel report che la combinazione di criteri
e' troppo stretta e quale dei due criteri conviene allentare.
Non continuare a cercare sperando di trovarne altre: un report che spiega perche' la
lista e' corta vale molto piu' di una ricerca che si interrompe a budget esaurito e
non restituisce niente.
Priorità: aziende con segnali chiari di bisogno digitale, dentro la fascia richiesta
e capaci di sostenere un progetto da 20K-200K.
Escludi clienti Domino già noti: Rollon, Bitron, IVECO, Case IH, Stellantis, Comau, IPI, Megadyne, Masi, Costa Crociere, Arca, Alpitour, Biennale Venezia.`;

  const messages = [{ role: 'user', content: userMsg }];
  const tool = webSearchTool(MAX_RICERCHE);
  let data = await callClaude({
    system: LIST_RESEARCH_SYSTEM, messages, tools: [tool],
    max_tokens: 16000, timeoutMs: 480000, scadenza,
  });

  let resumes = 0;
  while (data.stop_reason === 'pause_turn' && resumes < MAX_RESUMES
         && tempoResiduo(scadenza) > RISERVA_MS) {
    resumes++;
    messages.push({ role: 'assistant', content: data.content });
    data = await callClaude({
      system: LIST_RESEARCH_SYSTEM, messages, tools: [tool],
      max_tokens: 16000, timeoutMs: 480000, scadenza,
    });
  }

  const report = extractText(data).trim();
  if (!report) throw new Error('La ricerca non ha prodotto nessun risultato. Riprova.');
  return report;
}

export async function rankList({ settore, geografia, dimensione, keywords, numero, report, scadenza }) {
  const genData = await callClaude({
    system: buildListGenSystem(loadBrain()),
    messages: [{
      role: 'user',
      content: `Criteri: settore=${settore}, area=${geografia || 'Italia'}, dimensione=${dimensione?.join(',')}, keywords=${keywords}, numero=${numero}\n\nRisultati della ricerca:\n${report}\n\nGenera la lista strutturata. Solo JSON puro.`,
    }],
    max_tokens: 8000, scadenza,
  });
  return parseJSON(extractText(genData));
}
