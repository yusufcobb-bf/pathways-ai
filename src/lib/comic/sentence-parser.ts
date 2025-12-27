/**
 * Stage 26d: Sentence Parser for Illustrated Story Pages
 *
 * PRE-SENTENCE visual beat segmentation.
 * Visual beats are split BEFORE sentence normalization to prevent merging.
 * Rule: One page = one image = one visual story beat.
 */

// Common abbreviations that should NOT trigger sentence splits
const ABBREVIATIONS = [
  "Mr.",
  "Mrs.",
  "Ms.",
  "Dr.",
  "Jr.",
  "Sr.",
  "St.",
  "Prof.",
  "vs.",
  "etc.",
  "i.e.",
  "e.g.",
];

// Placeholder to protect abbreviations during splitting
const ABBREV_PLACEHOLDER = "\u0000ABBREV\u0000";

/**
 * Parse narrative text into individual sentences for comic panels.
 *
 * Design principles:
 * - Keep dialogue/quoted speech intact as single unit
 * - Only split on clear sentence boundaries
 * - When ambiguous, keep together
 * - Prefer slightly longer panels over fragmented ones
 *
 * @param narrative - Full narrative text (may contain \n\n paragraph breaks)
 * @returns Array of sentences, trimmed and non-empty
 */
export function parseNarrativeToSentences(narrative: string): string[] {
  if (!narrative || narrative.trim().length === 0) {
    return [];
  }

  // Step 1: Normalize paragraph breaks to spaces
  // (paragraph structure doesn't affect panel boundaries)
  let text = narrative.replace(/\n\n+/g, " ").replace(/\n/g, " ");

  // Step 2: Protect abbreviations from being split
  for (const abbrev of ABBREVIATIONS) {
    const escaped = abbrev.replace(".", "\\.");
    const regex = new RegExp(escaped, "gi");
    text = text.replace(regex, abbrev.replace(".", ABBREV_PLACEHOLDER));
  }

  // Step 3: Protect quoted dialogue - keep quotes intact
  // Match text in quotes and temporarily replace periods inside
  text = text.replace(/"([^"]+)"/g, (match) => {
    return match.replace(/\./g, ABBREV_PLACEHOLDER);
  });

  // Step 4: Split on clear sentence boundaries
  // Only split on . ! ? followed by space and uppercase letter (or end of string)
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => {
      // Restore abbreviation periods
      return s.replace(new RegExp(ABBREV_PLACEHOLDER, "g"), ".").trim();
    })
    .filter((s) => s.length > 0);

  // Step 5: Handle edge case where no splits occurred
  if (sentences.length === 0 && text.trim().length > 0) {
    return [text.replace(new RegExp(ABBREV_PLACEHOLDER, "g"), ".").trim()];
  }

  return sentences;
}

/**
 * Stage 26c: Maximum number of pages to display.
 * Increased to accommodate more visual beat splitting.
 */
export const MAX_SENTENCES = 50;

/**
 * Stage 26c: Minimum length for a page to avoid overly short fragments.
 * Shorter pages OK for clear visual beats.
 */
const MIN_PAGE_LENGTH = 20;

/**
 * Stage 26d: Determines whether a sentence introduces a new visual beat.
 * Returns true if this sentence should START a new page.
 * SHORT PATTERNS to prevent line wrapping.
 */
function introducesNewVisualBeat(next: string): boolean {
  // You + observation
  if (/^\s*You\s+(notice|see|hear|spot|realize|find|watch|feel)\b/i.test(next)) return true;
  if (/^\s*You\s+(look|turn)\b/i.test(next)) return true;
  // Character names (split) - with optional leading quote
  if (/^[\s"'"'"]*\s*(Kai|Zara|Maya|Leo|Sam|Alex|Jordan|Taylor)\b/i.test(next)) return true;
  if (/^[\s"'"'"]*\s*(Mr\.|Ms\.|Mrs\.|Dr\.)\b/i.test(next)) return true;
  // Pronouns + verbs (split)
  if (/^\s*(She|He|They|It)\s+(walks?|says?|looks?|turns?)\b/i.test(next)) return true;
  if (/^\s*(She|He|They|It)\s+(points?|kneels?|stands?|picks?)\b/i.test(next)) return true;
  if (/^\s*(She|He|They|It)\s+(notices?|moves?|steps?|reaches?)\b/i.test(next)) return true;
  // Dialogue - straight AND curly quotes (all variants)
  if (/^\s*["'"'"']/.test(next)) return true;
  // Environment (split)
  if (/^\s*(The|A|An)\s+(garden|room|table|floor|door|window)\b/i.test(next)) return true;
  if (/^\s*(The|A|An)\s+(spade|tool|bin|trail|mark|soil|sound|voice|air)\b/i.test(next)) return true;
  // Closing quote + character (happens when sentence ends mid-quote)
  if (/^["'"'"']\s*(Kai|Zara|Maya|Leo|Sam|Alex|Jordan|Taylor|You|She|He|They)\b/i.test(next)) return true;
  return false;
}

/**
 * Stage 26d: Pre-sentence visual beat segmentation.
 * Splits raw text into visual beats BEFORE sentence normalization.
 * This is the PRIMARY enforcement of one-beat-per-page.
 */
function splitParagraphIntoVisualBeats(text: string): string[] {
  if (!text || text.length < MIN_PAGE_LENGTH) {
    return text ? [text] : [];
  }

  // Split on sentence-ending punctuation
  const roughSentences = text.match(/[^.!?]*[.!?]+/g) ?? [text];

  const beats: string[] = [];
  let buffer = "";

  for (const sentence of roughSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // If buffer has content AND this sentence introduces a new visual beat → flush
    if (buffer && introducesNewVisualBeat(trimmed)) {
      beats.push(buffer.trim());
      buffer = trimmed;
    } else {
      buffer = buffer ? `${buffer} ${trimmed}` : trimmed;
    }
  }

  if (buffer) {
    beats.push(buffer.trim());
  }

  return beats.filter(b => b.length >= MIN_PAGE_LENGTH);
}

/**
 * Stage 26c: Story beat patterns for splitting narrative text.
 * These identify natural visual/narrative transitions in the story.
 * CRITICAL: All patterns MUST be valid single-line RegExp literals.
 */
const STORY_BEAT_PATTERNS: RegExp[] = [
  /(?<=[.!?]["'])\s+/,
  /(?<=[.!?,])\s*(?=You (?:notice|see|hear|spot|realize|look|find|turn|walk|step|feel|watch))/i,
  /(?<=[.!?,])\s*(?=(?:Kai|Zara|Maya|Leo|Sam|Alex|Jordan|Taylor|The teacher|The student|Mrs\.|Mr\.|Ms\.)\s)/,
  /(?<=[.!?,])\s*(?=(?:She|He|They|It)\s+(?:walks?|says?|looks?|turns?|points?|kneels?|stands?|picks?|notices?|sees?|hears?|reaches?|steps?|moves?|runs?|smiles?|frowns?|nods?|shakes?))/i,
  /(?<=[.!?,])\s*(?=The (?:garden|classroom|room|door|window|table|desk|floor|wall|ground|sky|sun|wind|rain|sound|voice|noise|air|smell|feeling))/i,
  /(?<=[.!?,])\s*(?=An? (?:small|large|old|new|strange|familiar|quiet|loud|bright|dark|soft|hard|warm|cold|sudden|gentle))/i,
  /, (?=and (?:Kai|Zara|Maya|Leo|she|he|they|you|the)\s)/i,
  /, (?=(?:noticing|seeing|hearing|spotting|watching|feeling)\s)/i,
];

/**
 * Stage 26c-R: Detect if text contains multiple visual beats.
 * Returns true if text has multiple actors, speakers, or focus changes.
 */
function hasMultipleVisualBeats(text: string): boolean {
  // Count sentence-ending punctuation (rough sentence count)
  const sentenceEnders = (text.match(/[.!?]+/g) || []).length;
  if (sentenceEnders >= 2) return true;

  // Check for multiple character names
  const characterPattern = /\b(Kai|Zara|Maya|Leo|Sam|Alex|Jordan|Taylor|She|He|They|You)\b/gi;
  const characters = text.match(characterPattern) || [];
  const uniqueCharacters = new Set(characters.map(c => c.toLowerCase()));
  if (uniqueCharacters.size >= 2) return true;

  // Check for dialogue + action combo (straight AND curly quotes)
  const hasDialogue = /["'"'"'][^"'"'"']+["'"'"']/.test(text);
  const hasAction = /\b(walks?|says?|looks?|turns?|points?|kneels?|stands?|picks?|notices?|sees?|hears?|reaches?|steps?|moves?)\b/i.test(text);
  if (hasDialogue && hasAction && text.length > 80) return true;

  return false;
}

/**
 * Stage 26c-R: Hard fallback for visual beat splitting.
 * Splits text on sentence boundaries when regex patterns fail.
 * Guarantees no multi-action paragraphs remain.
 */
function forceVisualBeatSplit(text: string): string[] {
  // Split on sentence-ending punctuation
  const sentences = text.match(/[^.!?]*[.!?]+/g);
  if (!sentences || sentences.length <= 1) {
    return [text];
  }

  return sentences
    .map(s => s.trim())
    .filter(s => s.length >= MIN_PAGE_LENGTH);
}

/**
 * Stage 26c: Split text at story beats for illustrated pages.
 * ALWAYS check for story beats (no length gate).
 * If the image would change, split the page.
 */
function splitAtStoryBeats(text: string): string[] {
  // Safety guard: text too short to split meaningfully
  if (text.length < 2 * MIN_PAGE_LENGTH) {
    return [text];
  }

  // Try regex patterns first
  for (const pattern of STORY_BEAT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      const splitPoint = match.index + match[0].length;
      const first = text.slice(0, splitPoint).trim();
      const rest = text.slice(splitPoint).trim();

      // Only split if both parts have meaningful content
      if (first.length >= MIN_PAGE_LENGTH && rest.length >= MIN_PAGE_LENGTH) {
        // Recursively split rest for additional beats
        return [first, ...splitAtStoryBeats(rest)];
      }
    }
  }

  // Stage 26c-R: Hard fallback when regex fails but multiple beats detected
  if (hasMultipleVisualBeats(text)) {
    const forceSplit = forceVisualBeatSplit(text);
    if (forceSplit.length > 1) {
      // Recursively process each split chunk
      return forceSplit.flatMap(chunk => splitAtStoryBeats(chunk));
    }
  }

  // No beat found - return as single page
  return [text];
}

/**
 * Split all sentences into panels at story beats.
 * Results in more panels with more readable text lengths.
 */
function splitNarrativeIntoPanels(sentences: string[]): string[] {
  const result: string[] = [];
  for (const sentence of sentences) {
    const parts = splitAtStoryBeats(sentence);
    result.push(...parts);
  }
  return result;
}

/**
 * Stage 26d: Parse narrative into pages for illustrated story display.
 * Visual beats are split FIRST, then each beat is processed individually.
 * All text is preserved - no truncation.
 */
export function parseNarrativeWithLimit(narrative: string): string[] {
  if (!narrative || narrative.trim().length === 0) {
    return [];
  }

  // Stage 26d: Split by paragraphs FIRST (respect author-intended breaks)
  const paragraphs = narrative.split(/\n{2,}/);

  // Stage 26d: Split each paragraph into visual beats
  const visualBeats = paragraphs.flatMap(paragraph =>
    splitParagraphIntoVisualBeats(paragraph)
  );

  // Process each beat through existing pipeline
  const pages: string[] = [];
  for (const beat of visualBeats) {
    // Apply existing sentence parsing to each beat individually
    const sentences = parseNarrativeToSentences(beat);
    // Apply story beat splitting as secondary pass
    const panels = splitNarrativeIntoPanels(sentences);
    pages.push(...panels);
  }

  return pages.slice(0, MAX_SENTENCES);
}
