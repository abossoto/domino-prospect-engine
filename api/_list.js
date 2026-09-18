// api/_list.js
// Generazione liste prospect, in due fasi come l'analisi del singolo prospect.
// Fase 1 (runListAgent) non usa il brain; fase 2 (rankList) si'.

import { callClaude, extractText, loadBrain, brainBlock, webSearchTool, tempoResiduo } from './_shared.js';
import { parseJSON } from './_generate.js';

const LIST_RESEARCH_SYSTEM = `Sei un analista commerciale senior per Domino, agenzia CX italiana.
Il tuo compito è identificare aziende prospect qualificate usando ricerche web reali.

PROFILO ICP DI DOMINO (Ideal Customer Profile):
- Settori: Automotive, B2B Industriale, Salute & Sanità, Turismo & Cultura, Finance, PA
- Dimensione ideale: Mid-market (50-500 dipendenti) o Enterprise (500+)
- Caratteristiche: presenza digitale migliorabile, processi complessi, mercati multipli
- Segnali positivi: sito datato, poca presenza digitale, crescita recente, job posting digital, cambi management
- Segnali negativi: già cliente Domino, già dotata di agency strutturata dedicata

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

SCORING (1-10) — basato su fit con Domino:
10: Fit perfetto — settore Domino, dimensione giusta, segnali digitali chiari, nessun competitor evidente
8-9: Ottimo fit — 2-3 criteri positivi forti
6-7: Buon potenziale — fit di settore ma meno segnali
4-5: Potenziale — settore adiacente o segnali deboli
1-3: Poco probabile — fuori target o già ben servito

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
      "dimensione": "PMI | Mid-market | Enterprise",
      "fatturato_stimato": "string | null",
      "score": 8,
      "score_motivazione": "string — max 1 frase, perché è un buon prospect",
      "segnale_principale": "string — il segnale più rilevante trovato",
      "decisore_probabile": "string — es. Direttore Marketing, CMO, CDO"
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
// Qui servono molte piu' ricerche che per il singolo prospect: il prompt chiede
// di TROVARE N aziende e di VERIFICARE il sito di ognuna. Con un tetto basso il
// modello esaurisce le ricerche nella scoperta e restituisce una lista vuota.
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
5. Identifica il probabile decisore da contattare (CMO, Direttore Marketing, CDO, ecc.)

Fai almeno 6-8 ricerche per trovare e verificare le aziende.
Priorità: aziende con segnali chiari di bisogno digitale e dimensione coerente con progetti Domino (budget tipico 20K-200K€).
Escludi clienti Domino già noti: Rollon, Bitron, IVECO, Case IH, Stellantis, Comau, IPI, Megadyne, Masi, Costa Crociere, Arca, Alpitour, Biennale Venezia.`;

  const messages = [{ role: 'user', content: userMsg }];
  const tool = webSearchTool(MAX_RICERCHE);
  let data = await callClaude({
    system: LIST_RESEARCH_SYSTEM, messages, tools: [tool],
    max_tokens: 16000, timeoutMs: 240000, scadenza,
  });

  let resumes = 0;
  while (data.stop_reason === 'pause_turn' && resumes < MAX_RESUMES
         && tempoResiduo(scadenza) > RISERVA_MS) {
    resumes++;
    messages.push({ role: 'assistant', content: data.content });
    data = await callClaude({
      system: LIST_RESEARCH_SYSTEM, messages, tools: [tool],
      max_tokens: 16000, timeoutMs: 240000, scadenza,
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
