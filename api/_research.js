// api/_research.js
// Fase 1: dossier di intelligence sul prospect via web search server-side.
// Non usa il brain: il contesto e' solo il system prompt di ricerca, quindi
// questa fase costa pochi token di input.

import { callClaude, extractText, webSearchTool, tempoResiduo } from './_shared.js';

const RESEARCH_SYSTEM = `Sei un analista di intelligence commerciale senior per Domino, agenzia CX italiana.
Produci un dossier completo e preciso su un'azienda prospect usando ESCLUSIVAMENTE dati reali trovati sul web.

REGOLA FONDAMENTALE: MAI INVENTARE.
Se una fonte non da risultati, scrivi "Non trovato" per quella sezione.
Un dato mancante segnalato e' piu' utile di un dato inventato.

FONTI DA CERCARE IN ORDINE:
1. SITO WEB AZIENDALE - homepage, chi siamo, prodotti/servizi, case study
2. DATI FINANZIARI - "[azienda] fatturato bilancio dipendenti", "[azienda] site:cerved.com", Registro Imprese
3. NEWS E COMUNICATI (ultimi 12 mesi) - acquisizioni, lanci, finanziamenti, cambi management
4. LINKEDIN - profilo aziendale + persone chiave (CEO, CMO, CDO, Dir. Marketing/Digital/CX)
5. JOB POSTING ATTIVI - interpreta le priorita' strategiche
6. PRESENZA DIGITALE - qualita' sito, social, blog, newsletter, maturita' digitale

Fai almeno 8-10 ricerche. Leggi le pagine intere, non solo snippet.

STRUTTURA OBBLIGATORIA DEL REPORT:
## PROFILO AZIENDA
## DATI FINANZIARI
## PERSONE CHIAVE
## SEGNALI RECENTI (ultimi 12 mesi)
## JOB POSTING E PRIORITA' STRATEGICHE
## PRESENZA E MATURITA' DIGITALE
## SFIDE PROBABILI
## OPPORTUNITA' PER DOMINO
## DATI NON TROVATI

REGOLA SPECIALE - SEGNALI RECENTI - VERIFICABILITA' OBBLIGATORIA:
Per ogni segnale recente DEVI raccogliere e includere nel report l'URL della fonte
(comunicato stampa, articolo testata giornalistica, post LinkedIn ufficiale, ecc.).
Formato: "Evento (data) - URL: https://..." oppure su due righe.
Esempio:
- Acquisizione di X SpA (marzo 2025) - URL: https://www.ilsole24ore.com/art/...
- Lancio prodotto Y (gennaio 2026) - URL: https://comunicati.azienda.it/...
Se per un evento NON riesci a trovare la URL fonte verificabile, OMETTILO completamente
dalla sezione SEGNALI RECENTI. Meglio segnalare 2 eventi verificabili che 5 eventi senza prova.`;

// Il loop server-side di web_search si ferma a 10 iterazioni e restituisce
// stop_reason "pause_turn" con un report ancora incompleto. Si riprende
// rimandando la stessa conversazione con la risposta parziale in coda: il
// server riconosce il server_tool_use finale e riparte da solo. Non va
// aggiunto nessun messaggio utente di continuazione.
const MAX_RESUMES = 3;
// Il prompt chiede "almeno 8-10 ricerche": 20 lascia margine senza diventare un
// assegno in bianco sul costo delle ricerche.
const MAX_RICERCHE = 20;
// Sotto questa soglia non si avvia un'altra ripresa: meglio un report un po'
// piu' corto che un 504.
const RISERVA_MS = 70000;

export async function runResearch(prospect, note, scadenza) {
  const userContent = `Produci un dossier completo su: "${prospect}"${note ? `\nNote: ${note}` : ''}
Cerca: sito web, dati finanziari Cerved/CCIAA, news ultimi 12 mesi, LinkedIn con nomi reali, job posting, presenza digitale.
Per ogni segnale recente raccogli SEMPRE l'URL della fonte. Senza URL non includerlo.
Fai almeno 8-10 ricerche. Produci il report con tutte le sezioni.`;
  const messages = [{ role: 'user', content: userContent }];
  const tool = webSearchTool(MAX_RICERCHE);
  let data = await callClaude({
    system: RESEARCH_SYSTEM, messages, tools: [tool],
    max_tokens: 16000, timeoutMs: 240000, scadenza,
  });

  let resumes = 0;
  while (data.stop_reason === 'pause_turn' && resumes < MAX_RESUMES
         && tempoResiduo(scadenza) > RISERVA_MS) {
    resumes++;
    messages.push({ role: 'assistant', content: data.content });
    data = await callClaude({
      system: RESEARCH_SYSTEM, messages, tools: [tool],
      max_tokens: 16000, timeoutMs: 240000, scadenza,
    });
  }

  const report = extractText(data).trim();
  if (!report) {
    throw new Error('La ricerca non ha prodotto nessun report (stop_reason: ' + data.stop_reason + '). Riprova.');
  }
  return {
    report,
    incompleto: data.stop_reason === 'pause_turn' || data.stop_reason === 'max_tokens',
  };
}
