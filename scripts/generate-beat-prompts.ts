/**
 * Stage 28c: Generate image prompts for all 35 visual beats
 *
 * Run with: npx ts-node scripts/generate-beat-prompts.ts
 *
 * Output: Prompts ready for DALL-E, Midjourney, or other image generators
 */

import storyData from "../src/data/visual-stories/the-missing-project.json";

const ART_STYLE = `Comic book style illustration, clean lines, soft watercolor colors, educational graphic novel aesthetic. School science fair setting, bright gymnasium. Suitable for grades 4-5, calm and friendly tone. No text, speech bubbles, or written words. Neutral, inclusive character designs. 16:9 aspect ratio, 800x500px.`;

interface BeatPrompt {
  filename: string;
  beat: string;
  text: string;
  focus: string;
  prompt: string;
}

function generatePrompt(text: string, focus: string, actor?: string): string {
  const focusDescriptions: Record<string, string> = {
    "character-action": "Focus on a character performing an action",
    "character-emotion": "Close-up on character's emotional expression through posture",
    "dialogue": "Character speaking, expressive body language",
    "observation": "POV shot, 'you notice' perspective",
    "environment": "Wide establishing shot of the setting",
    "object": "Focus on a specific item or detail",
    "group": "Multiple characters together in frame",
    "transition": "Scene transition, time passing",
  };

  const focusGuide = focusDescriptions[focus] || "General scene";
  const actorNote = actor ? `Character: ${actor} (elementary school student or teacher).` : "POV: viewer is the main character.";

  return `${ART_STYLE}

Scene: ${text}
${actorNote}
Visual focus: ${focusGuide}`;
}

const prompts: BeatPrompt[] = [];

// Intro beats (10)
storyData.intro.forEach((beat, index) => {
  const filename = `beat-intro-${index.toString().padStart(2, "0")}.png`;
  prompts.push({
    filename,
    beat: beat.id,
    text: beat.text,
    focus: beat.focus,
    prompt: generatePrompt(beat.text, beat.focus, (beat as { actor?: string }).actor),
  });
});

// Checkpoint beats
storyData.checkpoints.forEach((checkpoint) => {
  const cpNum = checkpoint.id.replace("c", "");
  checkpoint.beats.forEach((beat, index) => {
    const filename = `beat-c${cpNum}-${index.toString().padStart(2, "0")}.png`;
    prompts.push({
      filename,
      beat: beat.id,
      text: beat.text,
      focus: beat.focus,
      prompt: generatePrompt(beat.text, beat.focus, (beat as { actor?: string }).actor),
    });
  });
});

// Ending beats (6)
storyData.ending.forEach((beat, index) => {
  const filename = `beat-ending-${index.toString().padStart(2, "0")}.png`;
  prompts.push({
    filename,
    beat: beat.id,
    text: beat.text,
    focus: beat.focus,
    prompt: generatePrompt(beat.text, beat.focus, (beat as { actor?: string }).actor),
  });
});

// Output
console.log("=" .repeat(80));
console.log("STAGE 28c: 35 UNIQUE BEAT IMAGE PROMPTS");
console.log("=" .repeat(80));
console.log(`\nTotal prompts: ${prompts.length}\n`);

prompts.forEach((p, i) => {
  console.log(`\n${"─".repeat(80)}`);
  console.log(`[${i + 1}/${prompts.length}] ${p.filename}`);
  console.log(`Beat ID: ${p.beat}`);
  console.log(`Text: "${p.text}"`);
  console.log(`Focus: ${p.focus}`);
  console.log(`\nPROMPT:\n${p.prompt}`);
});

console.log(`\n${"=".repeat(80)}`);
console.log("IMAGE FILES TO CREATE:");
console.log("=".repeat(80));
prompts.forEach((p) => console.log(`  /images/science-fair-mystery/${p.filename}`));
