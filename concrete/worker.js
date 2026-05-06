import html from "./index.html";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /* ── CORS pre-flight ──────────────────────────────────────────────── */
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    /* ── Anthropic API proxy — /api/analyse-image ─────────────────────── */
    if (url.pathname === "/api/analyse-image" && request.method === "POST") {
      return handleAnalyse(request, env);
    }

    /* ── Serve the SPA ────────────────────────────────────────────────── */
    return new Response(html, {
      headers: { "content-type": "text/html;charset=UTF-8" },
    });
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   PASS 1 — DEEP FORENSIC ANALYSIS
   Uses extended thinking (budget_tokens: 8000) so the model fully reasons
   through every step before committing to a JSON verdict.
   max_tokens must be > budget_tokens, so we use 10000.
═══════════════════════════════════════════════════════════════════════════ */

const FIRST_PASS_SYSTEM = `You are a senior IS 2386:1963 / IS 383:2016 certified aggregate quality inspector with 20 years of field experience.

YOUR SINGLE TASK: Determine with forensic precision whether this photograph shows LOOSE CONSTRUCTION COARSE AGGREGATE that meets IS 383 specifications.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL ANTI-BIAS REMINDER BEFORE YOU BEGIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your most common error is OVER-REJECTION: real construction aggregate photographed close-up on
the ground or on a tarp is frequently mistaken for a "surface" or "rock face". Before rejecting:
• A photo of loose gravel piled on ground IS valid aggregate — the ground/tarp IS the background
• A close-up of a gravel heap IS valid — you may only see the top layer, gaps are still visible
• Angular crushed stone in a pile IS valid even if it looks like a wall when zoomed
• Aggregate on a tarp, concrete floor, or road surface IS valid if the particles are LOOSE
The key test is: are there INDIVIDUALLY SEPARABLE PARTICLES with visible boundaries/gaps? If YES → accept.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — SCENE GEOMETRY (answer each sub-question explicitly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1a. What occupies the majority (>50%) of the frame?
1b. Is there a visible horizon, room interior, or clear outdoor background WITH OTHER ELEMENTS (not just a pile of aggregate)? → If YES → REJECT
1c. Is there a container edge, bucket rim, bowl wall, drum interior, tray border, or any curved/straight enclosure visible AND that enclosure is NOT just the ground/floor? → If YES → REJECT
1d. Are there any people, body parts, workers, or clothing visible ANYWHERE as a PRIMARY element? → If YES → REJECT
1e. Is there any rebar, metal mesh, equipment, or machinery visible as a PRIMARY element? → If YES → REJECT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — SURFACE vs PARTICLE DISCRIMINATION (CRITICAL — most false positives occur here)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2a. Is the material ONE CONTINUOUS SURFACE (rock face, bark, wall, road surface where aggregate is EMBEDDED and not loose)? → If YES → REJECT
2b. Are you seeing the INSIDE of a container with granular residue/staining (paint mixer residue, cement drum interior, mortar tray) — NOT a pile of actual aggregate? → If YES → REJECT
2c. Can you see clear GAPS / AIR SPACE / SHADOW LINES between individual particles proving they are separate and loose? → REQUIRED for ACCEPT
2d. Can you see shadow under individual particles confirming 3D loose stones on a surface (not embedded)? 
2e. Is the texture "poured/piled granular material" (ACCEPT candidate) OR "a single textured surface/wall/road" (REJECT)?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — PARTICLE COUNT & MATERIAL VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3a. Count INDIVIDUALLY DISTINCT, SEPARATED stone particles visible. State the exact count: "I count N particles".
    • If N < 10 → REJECT (insufficient sample)
    • Each particle must be individually bounded — you can trace its complete outline
    • NOTE: In a pile photo, even if overlapping, count particles whose EDGES you can distinguish
3b. Material identity: Is this definitively crushed stone or natural gravel?
    • Acceptable: granite, basalt, quartzite, limestone, dolomite, river gravel
    • Reject if: could be coal, slag, brick rubble, ceramic, glass, plastic, or other non-stone
3c. Colour palette check — natural stone colours ONLY:
    • ACCEPT palette: gray, charcoal, white, cream, beige, buff, light-brown, dark-brown, speckled
    • REJECT if dominant colours are: vivid red, blue, green, yellow, orange, purple, black uniform
3d. Particle size estimation: Are particles in 4–40 mm range?
3e. Angularity: Angular (sharp edges, crushed) / Sub-angular / Rounded (river gravel)
3f. Cleanliness: Clean / Dusty / Muddy / Contaminated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — MANDATORY REJECTION TRIGGERS (any single trigger → REJECT, no exceptions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ T1: Container wall / rim / bucket edge / drum interior visible AND is the primary framing element (not just the ground)
□ T2: Person / worker / body part / clothing / fabric visible as PRIMARY subject (not incidental background)
□ T3: Rebar / metal mesh / reinforcement / equipment / machinery as PRIMARY subject
□ T4: Active construction activity — pouring, mixing, formwork, scaffolding — as PRIMARY subject  
□ T5: Aggregate is BACKGROUND element in a scene dominated by other things (not the primary subject)
□ T6: Road / path / driveway — aggregate EMBEDDED in surface and NOT loose
□ T7: Rock face / cliff / boulder / stone wall — a single continuous surface, NOT loose particles
□ T8: Tree bark / soil / organic material / plants as PRIMARY subject
□ T9: Continuous surface with granular texture (paint residue, cement crust, mortar skin) — NOT actual loose aggregate
□ T10: Fewer than 10 individually distinct loose particles countable (even attempting generous count)
□ T11: Particles clearly embedded in concrete, mortar, or set matrix (NOT loose)
□ T12: Stockpile viewed from such distance that individual particles are completely indistinguishable blobs

State clearly: "Trigger check: T1=[Y/N], T2=[Y/N], T3=[Y/N]..." for all 12 triggers.
If ANY trigger = Y → REJECT.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — CONFIDENCE SCORING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Start at BASE = 35

POSITIVE SCORES (only add if step confirmed the criterion):
  +30  ≥15 individually distinct, clearly separated, loose stone particles
  +15  correct natural stone colour palette consistent throughout
  +10  visible fracture faces and angular/crushed texture
  +10  particles clearly dominate >75% of frame with minimal background
  +05  shadow/gap evidence confirming loose 3D particles not embedded
  +05  particle size clearly in 4–40 mm range

NEGATIVE SCORES (apply for each uncertainty):
  −40  ANY mandatory trigger confirmed (T1–T12)
  −25  container interior, residue, paint, cement paste suspected even partially
  −20  fewer than 10 distinct particles countable
  −15  organic surface (bark, soil, rock face) even partially matching
  −15  scene elements visible (construction background, horizon, room)
  −10  particle count ambiguous or obscured sections of frame
  −10  colour palette inconsistent or partially non-stone

FINAL RULE: if isAggregate=true but TOTAL score < 70 → force isAggregate=false, confidence=50

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — STRENGTH ESTIMATION (only if accepted)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Estimate 28-day compressive strength contribution (MPa) based on:
• Granite/basalt = 55–75 MPa range
• Quartzite/dolomite = 50–65 MPa range
• Limestone = 40–55 MPa range
• River gravel (rounded) = 35–50 MPa range
• Adjust: −5 if dusty/dirty, −3 if sub-angular, −8 if muddy, −10 if contaminated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
After completing ALL 6 steps above in your thinking, output ONLY valid JSON with NO markdown:
{"isAggregate":true,"confidence":88,"size":"10mm","texture":"Angular","quality":"Good","strengthMPa28":58,"reason":"[Step results summary — triggers T1-T12 all clear; counted 18 distinct particles; gray granite; sharp fracture faces; no container/scene elements]"}`;


const FIRST_PASS_USER = `Examine this image using your complete 6-step forensic protocol.

CRITICAL INSTRUCTIONS:
1. Work through ALL 6 steps in full detail before writing your final JSON
2. For Step 3a: literally count and state the number of distinct particles you can individually trace
3. For Step 4: explicitly state each trigger T1 through T12 as Y or N
4. Do NOT rush to a conclusion — complete every step even if you think you know the answer early
5. After your full analysis, output ONLY the final JSON object — no markdown fences, no explanation text outside the JSON

Common traps that fool quick analysis — look carefully:
• Paint mixer / cement drum interior: the curved gray interior LOOKS like aggregate but has NO individual particles, only residue staining
• Dark rock face / boulder: textured surface LOOKS granular but is ONE continuous surface with NO gaps between particles  
• Aggregate in a washing bowl / sieve: container rim IS visible — reject
• Road surface close-up: aggregate IS embedded — reject
• Construction scene: aggregate may be present but as background element — reject`;


/* ═══════════════════════════════════════════════════════════════════════════
   PASS 2 — COMPLETELY BLIND INDEPENDENT VERIFICATION
   Does NOT receive Pass 1 result to eliminate anchoring/confirmation bias.
   Also uses extended thinking for deep independent reasoning.
═══════════════════════════════════════════════════════════════════════════ */

const SECOND_PASS_SYSTEM = `You are an INDEPENDENT QUALITY AUDITOR for a construction materials laboratory. You are performing a blind verification audit.

You have NOT seen any previous analysis of this image. You must form your own independent judgment from scratch.

YOUR TASK: Determine whether this photograph shows LOOSE CONSTRUCTION COARSE AGGREGATE meeting IS 383:2016 specifications.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL ANTI-BIAS REMINDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your most common error is OVER-REJECTION: real aggregate photographed close-up on ground/tarp is
frequently wrongly flagged as a "surface" or "rock face". Remember:
• A photo of loose gravel on ground/tarp = VALID — the ground IS just the background surface
• A close-up of a gravel heap = VALID — top layer view, gaps still visible between stones
• Angular crushed stone pile = VALID even if it looks dense when zoomed in
• Aggregate resting ON a surface = VALID if particles are LOOSE (not embedded INTO it)
The decisive test: are there INDIVIDUALLY SEPARABLE PARTICLES with traceable boundaries? If YES → accept.

AUDIT PROTOCOL — complete every section:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUDIT A — FIRST IMPRESSION TRAP-CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before anything else, check these common false positives:

A1. PAINT MIXER / CEMENT DRUM INTERIOR
    • Signs: circular/cylindrical container, smooth curved gray/white walls with granular texture or residue
    • The residue MIMICS aggregate texture but has NO individual loose particles with air gaps
    → If this matches: REJECT immediately

A2. MORTAR TRAY / MIXING BOWL WITH RESIDUE  
    • Signs: flat container, dried granular residue coating the surface
    → If this matches: REJECT immediately

A3. ROCK FACE / BOULDER SURFACE / STONE WALL
    • Signs: one continuous textured surface filling the frame, no air gaps, no individual loose pieces
    → If this matches: REJECT immediately

A4. DARK TREE BARK / ORGANIC SURFACE
    • Signs: dark, rough, fibrous or scaly continuous surface
    → If this matches: REJECT immediately

A5. CONSTRUCTION SCENE / STOCKPILE FROM DISTANCE
    • Signs: sky, horizon, workers, buildings, equipment, background elements visible
    → If this matches: REJECT immediately

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUDIT B — PARTICLE VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
B1. Can I see CLEAR AIR GAPS between individual stones? (YES/NO — required for ACCEPT)
B2. Can I count at least 10 individually bounded particles? State count: "I count N"
B3. Are particles clearly LOOSE and THREE-DIMENSIONAL (not painted on, not embedded, not residue)?
B4. Is the dominant material definitively natural stone (granite/basalt/limestone/gravel)?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUDIT C — DISQUALIFICATION SCAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
State YES or NO for each:
C1: Container wall/rim/bucket/bowl edge anywhere in frame?
C2: Person/worker/clothing/fabric anywhere in frame?
C3: Metal rebar/mesh/equipment/machinery?
C4: Active construction (pouring/mixing/formwork)?
C5: Aggregate is secondary/background in a larger scene?
C6: Particles embedded in road/concrete/mortar/surface?
C7: This is a rock face, cliff, boulder, or stone wall surface?
C8: Organic material (bark/soil/grass/plants) present?
C9: Granular residue or surface staining inside a container?

ANY C1–C9 = YES → REJECT, no exceptions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUDIT D — ACCEPT CONFIRMATION (only if all above clear)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
D1. Particle count ≥ 10: YES/NO
D2. Air gaps visible between particles: YES/NO  
D3. Natural stone material confirmed: YES/NO
D4. Particles are loose (not embedded): YES/NO
D5. Particles dominate >65% of frame: YES/NO
D6. Size in 4–40 mm range: YES/NO

ALL of D1–D6 must be YES to ACCEPT. Any NO → REJECT.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT: After completing Audits A–D, output ONLY valid JSON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{"isAggregate":true,"confidence":91,"size":"10mm","texture":"Angular","quality":"Good","strengthMPa28":60,"reason":"Blind audit: all A-traps clear; counted 20 loose particles; air gaps confirmed; C1-C9 all NO; D1-D6 all YES; angular gray granite"}`;


const SECOND_PASS_USER = `Perform your complete blind audit on this image now.

Work through ALL sections A, B, C, D methodically.
Do NOT skip any section even if you feel certain early.
Explicitly state your answers to each sub-question (A1–A5, B1–B4, C1–C9, D1–D6).
After completing the full audit, output ONLY the final JSON — no markdown, no extra text.`;


/* ═══════════════════════════════════════════════════════════════════════════
   PASS 3 — TIEBREAKER (only when Pass 1 and Pass 2 disagree)
   Senior arbitrator with full context of the disagreement.
   Given extra high thinking budget to resolve edge cases.
═══════════════════════════════════════════════════════════════════════════ */

const THIRD_PASS_SYSTEM = `You are the CHIEF QUALITY ARBITRATOR for a certified construction materials testing laboratory.

Two independent inspectors have examined this image and reached OPPOSITE conclusions. Your job is to make the FINAL binding decision.

You will receive information about their disagreement. Study the image extremely carefully and make the correct call.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ARBITRATION PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 1 — Re-examine from scratch (ignore both inspectors' verdicts)
  • Look at the image as if for the first time
  • Answer: What is literally in this photograph?

PHASE 2 — The core question (answer this single question with extreme care)
  • Are there INDIVIDUAL, LOOSE, SEPARABLE STONE PARTICLES visible?
  • "Loose" means: if you could reach into the photo, could you pick up individual stones?
  • "Separable" means: can you trace the boundary of individual particles?

PHASE 3 — False-positive check
  • Could this be a PAINTED SURFACE, CEMENT RESIDUE, or MORTAR SKIN that merely looks granular?
  • Could this be a ROCK FACE or STONE WALL — a single continuous surface?
  • If either answer is YES with certainty → REJECT

PHASE 4 — False-negative check  
  • Could this be REAL LOOSE AGGREGATE that was incorrectly rejected because:
    - It is sitting on a flat surface (floor, tarp, ground) — which is normal and valid?
    - It is a pile/heap photographed from the top — which is normal and valid?
    - The close-up view makes it look like a "surface" when it is actually loose stones?
  • If YES to any of these → these are NOT rejection reasons → reconsider as ACCEPT

PHASE 5 — Binding verdict
  • State: ACCEPT or REJECT with your final confidence 0–100
  • Strength estimate if accepted (MPa 28d)

OUTPUT: ONLY valid JSON, no markdown:
{"isAggregate":true,"confidence":85,"size":"10mm","texture":"Angular","quality":"Good","strengthMPa28":62,"reason":"Arbitration: [reason for overruling one inspector]"}`;

const THIRD_PASS_USER = `ARBITRATION REQUIRED: Two inspectors disagreed on this image.

Inspector 1 verdict: PASS1_VERDICT (PASS1_CONF% confidence)
Inspector 2 verdict: PASS2_VERDICT (PASS2_CONF% confidence)

Study this image very carefully and make the FINAL binding decision.
Work through all 5 phases of your arbitration protocol before outputting JSON.
Your decision is final — no further review.`;


async function handleAnalyse(request, env) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const body = await request.json();
    const { base64, mime } = body;

    if (!base64 || !mime) {
      return new Response(
        JSON.stringify({ error: "Missing base64 or mime field" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY env variable not set in Cloudflare dashboard" }),
        { status: 500, headers: corsHeaders }
      );
    }

    /* ── Pass 1: Deep forensic analysis with extended thinking ── */
    const firstPass = await callClaudeWithThinking(
      apiKey, base64, mime,
      FIRST_PASS_SYSTEM,
      FIRST_PASS_USER,
      16000,  // thinking budget tokens — HIGH: forces full 6-step reasoning
      20000   // max_tokens (must exceed thinking budget)
    );
    const conf1 = parseFloat(firstPass.confidence) || 0;

    /*
      Second pass logic:
        • First pass ACCEPTED → ALWAYS run blind second pass (no single-pass accepts)
        • First pass REJECTED with confidence < 90% → run second pass to confirm
        • First pass REJECTED with confidence ≥ 90% → skip second pass (clear rejection)
    */
    const needsSecondPass = firstPass.isAggregate === true || conf1 < 90;

    if (needsSecondPass) {
      let secondPass;
      try {
        secondPass = await callClaudeWithThinking(
          apiKey, base64, mime,
          SECOND_PASS_SYSTEM,
          SECOND_PASS_USER,
          12000,  // thinking budget tokens — HIGH: forces full audit A-D
          16000   // max_tokens
        );
      } catch (verifyErr) {
        console.warn("Second pass failed:", verifyErr.message);
        if (firstPass.isAggregate === true) {
          return new Response(JSON.stringify({
            isAggregate: false,
            confidence: conf1,
            size: "N/A", texture: "N/A",
            quality: "Rejected",
            strengthMPa28: 0,
            reason: `Verification pass failed — rejected for safety (Pass 1 accepted at ${conf1}%)`,
            _passes: 1,
            _source: "claude",
            _verifyError: verifyErr.message,
          }), { headers: corsHeaders });
        }
        firstPass._passes = 1;
        firstPass._source = "claude";
        return new Response(JSON.stringify(firstPass), { headers: corsHeaders });
      }

      const conf2 = parseFloat(secondPass.confidence) || 0;

      /* ── CASE A: Both ACCEPT ── */
      if (firstPass.isAggregate === true && secondPass.isAggregate === true) {
        // Require BOTH passes to be ≥ 70% for a final accept
        if (conf1 >= 70 && conf2 >= 70) {
          const avgConf = Math.min(95, Math.round((conf1 + conf2) / 2));
          return new Response(JSON.stringify({
            ...secondPass,
            confidence: avgConf,
            reason: `Dual-pass verified: Pass1=${conf1}% | Pass2=${conf2}% | ${secondPass.reason}`,
            _passes: 2,
            _source: "claude",
          }), { headers: corsHeaders });
        }
        // Both accepted but confidence below threshold → reject
        return new Response(JSON.stringify({
          isAggregate: false,
          confidence: Math.max(conf1, conf2),
          size: "N/A", texture: "N/A",
          quality: "Rejected",
          strengthMPa28: 0,
          reason: `Dual-pass confidence insufficient — Pass1: ${conf1}%, Pass2: ${conf2}% (minimum 70% each required for acceptance)`,
          _passes: 2,
          _source: "claude",
        }), { headers: corsHeaders });
      }

      /* ── CASE B: Both REJECT ── */
      if (firstPass.isAggregate === false && secondPass.isAggregate === false) {
        const rejectConf = Math.min(99, Math.round((conf1 + conf2) / 2) + 5);
        return new Response(JSON.stringify({
          ...secondPass,
          isAggregate: false,
          confidence: rejectConf,
          quality: "Rejected",
          strengthMPa28: 0,
          reason: `Dual-pass rejection: Pass1=${conf1}% | Pass2=${conf2}% | ${secondPass.reason}`,
          _passes: 2,
          _source: "claude",
        }), { headers: corsHeaders });
      }

      /* ── CASE C: DISAGREEMENT → run Pass 3 tiebreaker ── */
      const thirdPassUser = THIRD_PASS_USER
        .replace("PASS1_VERDICT", firstPass.isAggregate ? "ACCEPT" : "REJECT")
        .replace("PASS1_CONF", conf1)
        .replace("PASS2_VERDICT", secondPass.isAggregate ? "ACCEPT" : "REJECT")
        .replace("PASS2_CONF", conf2);

      let thirdPass;
      try {
        thirdPass = await callClaudeWithThinking(
          apiKey, base64, mime,
          THIRD_PASS_SYSTEM,
          thirdPassUser,
          20000,  // maximum thinking budget for tiebreaker
          24000
        );
      } catch (arbErr) {
        // If tiebreaker fails, reject for safety
        return new Response(JSON.stringify({
          isAggregate: false,
          confidence: Math.min(conf1, conf2),
          size: "N/A", texture: "N/A",
          quality: "Rejected",
          strengthMPa28: 0,
          reason: `Inspector disagreement — Pass1: ${firstPass.isAggregate ? "ACCEPT" : "REJECT"} (${conf1}%) | Pass2: ${secondPass.isAggregate ? "ACCEPT" : "REJECT"} (${conf2}%) — arbitration failed, rejected for safety`,
          _passes: 3,
          _source: "claude",
        }), { headers: corsHeaders });
      }

      const conf3 = parseFloat(thirdPass.confidence) || 0;
      return new Response(JSON.stringify({
        ...thirdPass,
        confidence: Math.min(92, conf3),
        reason: `3-Pass arbitration: P1=${firstPass.isAggregate ? "ACC" : "REJ"}(${conf1}%) P2=${secondPass.isAggregate ? "ACC" : "REJ"}(${conf2}%) P3=${thirdPass.isAggregate ? "ACC" : "REJ"}(${conf3}%) | ${thirdPass.reason}`,
        _passes: 3,
        _source: "claude",
      }), { headers: corsHeaders });
    }

    /* ── High-confidence single-pass rejection (isAggregate:false, conf≥85%) ── */
    firstPass._passes = 1;
    firstPass._source = "claude";
    return new Response(JSON.stringify(firstPass), { headers: corsHeaders });

  } catch (e) {
    console.error("handleAnalyse error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Analysis failed" }),
      { status: 500, headers: corsHeaders }
    );
  }
}


/* ═══════════════════════════════════════════════════════════════════════════
   CLAUDE API CALL — WITH EXTENDED THINKING
   
   Extended thinking forces the model to reason step-by-step internally
   before producing output. This eliminates "fast guessing" and ensures
   all 6 forensic steps are actually executed, not skimmed.
   
   thinkingBudget: tokens allocated for internal reasoning (hidden from output)
   maxTokens: must be > thinkingBudget (covers thinking + output)
═══════════════════════════════════════════════════════════════════════════ */
async function callClaudeWithThinking(apiKey, base64, mime, systemPrompt, userText, thinkingBudget, maxTokens) {
  /* ── Attempt 1: Extended thinking (deep reasoning) ── */
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        // Required header for extended thinking feature
        "anthropic-beta": "interleaved-thinking-2025-05-14",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: maxTokens,
        thinking: {
          type: "enabled",
          budget_tokens: thinkingBudget,
        },
        system: systemPrompt,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mime, data: base64 },
            },
            {
              type: "text",
              text: userText,
            },
          ],
        }],
      }),
    });

    const data = await response.json();

    // If thinking API returns an error (e.g. beta header wrong, timeout), fall through to attempt 2
    if (data.error) {
      console.warn("Thinking API error, falling back:", data.error.message);
      throw new Error(data.error.message);
    }

    // Extract the text block (thinking blocks are type="thinking", we want type="text")
    const tc = data.content?.find((c) => c.type === "text");
    if (!tc) throw new Error("No text block in thinking response");

    return parseJSON(tc.text);

  } catch (thinkingErr) {
    console.warn("Extended thinking failed, using fallback prompt:", thinkingErr.message);
  }

  /* ── Attempt 2: Fallback — high max_tokens without thinking feature ──
     Uses same prompts but without the thinking block.
     Still much better than the old 700-token calls because:
     - max_tokens is 8000 (model can write full chain-of-thought in text)
     - Prompts explicitly demand step-by-step answers written out
     - User message asks model to show all working before JSON
  ── */
  const fallbackUserText = userText + `

IMPORTANT — since you must output your reasoning as TEXT (not internal thinking):
Write out your COMPLETE step-by-step analysis FIRST (all 6 steps in full detail), then end with the JSON on the final line.
DO NOT skip any step. DO NOT rush. Take your time and be thorough.
Format:
STEP 1a: [your answer]
STEP 1b: [your answer]
...
STEP 3a: I count exactly N particles [describe each]
STEP 4 TRIGGERS: T1=[Y/N] T2=[Y/N] T3=[Y/N] T4=[Y/N] T5=[Y/N] T6=[Y/N] T7=[Y/N] T8=[Y/N] T9=[Y/N] T10=[Y/N] T11=[Y/N] T12=[Y/N]
STEP 5 SCORE: BASE=35 [list each addition/subtraction] TOTAL=[N]
VERDICT: [ACCEPT/REJECT] at [confidence]%
{"isAggregate":...}`;

  const response2 = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mime, data: base64 },
          },
          {
            type: "text",
            text: fallbackUserText,
          },
        ],
      }],
    }),
  });

  const data2 = await response2.json();
  if (data2.error) throw new Error(data2.error.message || "Anthropic API error (fallback)");

  const tc2 = data2.content?.find((c) => c.type === "text");
  if (!tc2) throw new Error("No text block in fallback response");

  return parseJSON(tc2.text);
}

/* ── JSON extraction helper ── */
function parseJSON(text) {
  let clean = text.trim().replace(/^```json\s*|^```\s*|```\s*$/gm, "").trim();
  // Extract last JSON object in the text (after chain-of-thought reasoning)
  const matches = [...clean.matchAll(/\{[\s\S]*?\}/g)];
  if (matches.length > 0) {
    // Use the last match — the final JSON verdict, not any intermediate JSON-like text
    for (let i = matches.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(matches[i][0]);
        if ("isAggregate" in parsed) return parsed;
      } catch (_) { /* try next */ }
    }
  }
  // Last resort: try full text
  return JSON.parse(clean);
}