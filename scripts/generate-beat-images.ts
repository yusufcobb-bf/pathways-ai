/**
 * Stage 28c: Generate 35 unique beat images using DALL-E
 *
 * Prerequisites:
 *   1. Add OPENAI_API_KEY to .env.local
 *   2. Run: npx tsx scripts/generate-beat-images.ts
 *
 * Images are saved to: public/images/science-fair-mystery/
 */

import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OUTPUT_DIR = path.join(process.cwd(), "public/images/science-fair-mystery");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const ART_STYLE = `Comic book style illustration, clean lines, soft watercolor colors, educational graphic novel aesthetic. School science fair setting, bright gymnasium with folding tables. Suitable for grades 4-5, calm and friendly tone. No text, speech bubbles, or written words in the image. Neutral, inclusive character designs with diverse representation. Warm lighting, inviting atmosphere.`;

interface Beat {
  filename: string;
  prompt: string;
}

// Story data embedded directly to avoid import issues
const BEATS: Beat[] = [
  // INTRO (10 beats)
  { filename: "beat-intro-00.png", prompt: `${ART_STYLE} Scene: A student arriving at school early in the morning on science fair day, walking toward the building entrance. POV from behind the student. Backpack visible, school building ahead.` },
  { filename: "beat-intro-01.png", prompt: `${ART_STYLE} Scene: Close-up of a student's excited expression and body language, carrying a volcano science project. Eager posture, looking forward with anticipation.` },
  { filename: "beat-intro-02.png", prompt: `${ART_STYLE} Scene: Empty school hallway with lockers, morning light streaming through windows. Quiet atmosphere, long perspective view.` },
  { filename: "beat-intro-03.png", prompt: `${ART_STYLE} Scene: Student pushing open large gymnasium double doors, viewed from inside the gym. Light streaming in from hallway.` },
  { filename: "beat-intro-04.png", prompt: `${ART_STYLE} Scene: POV shot looking at gymnasium with something amiss - an empty table where a project should be, scattered pieces visible on the floor nearby.` },
  { filename: "beat-intro-05.png", prompt: `${ART_STYLE} Scene: Focus on an empty folding table in a gymnasium, other tables with science fair displays visible in background.` },
  { filename: "beat-intro-06.png", prompt: `${ART_STYLE} Scene: Close-up of scattered model pieces on gymnasium floor - painted styrofoam planets, bent wire, craft supplies.` },
  { filename: "beat-intro-07.png", prompt: `${ART_STYLE} Scene: A student named Kai (elementary school boy) frantically searching through a cardboard box, worried expression, gymnasium background.` },
  { filename: "beat-intro-08.png", prompt: `${ART_STYLE} Scene: A student named Maya (elementary school girl) standing nearby, holding a crumpled piece of paper, concerned expression.` },
  { filename: "beat-intro-09.png", prompt: `${ART_STYLE} Scene: Mr. Rodriguez (male teacher) setting up folding chairs at the far end of gymnasium, professional but approachable.` },

  // CHECKPOINT 1 (7 beats)
  { filename: "beat-c1-00.png", prompt: `${ART_STYLE} Scene: Student placing volcano project materials (paper mache volcano, bottles, supplies) on an assigned table in gymnasium.` },
  { filename: "beat-c1-01.png", prompt: `${ART_STYLE} Scene: POV looking down at scattered science project pieces on gymnasium floor - close observation perspective.` },
  { filename: "beat-c1-02.png", prompt: `${ART_STYLE} Scene: Close-up of painted styrofoam planets in various colors (Earth, Mars, Saturn with rings) scattered on floor.` },
  { filename: "beat-c1-03.png", prompt: `${ART_STYLE} Scene: A bent wire mobile arm that once held planets in orbit, lying among broken project pieces.` },
  { filename: "beat-c1-04.png", prompt: `${ART_STYLE} Scene: Kai (elementary boy) looking up from his box, making eye contact with viewer, worried but hopeful expression.` },
  { filename: "beat-c1-05.png", prompt: `${ART_STYLE} Scene: Kai glancing toward Maya with a worried expression, visible concern for his classmate.` },
  { filename: "beat-c1-06.png", prompt: `${ART_STYLE} Scene: Maya (elementary girl) reading a crumpled paper carefully, concentrated expression, standing in gymnasium.` },

  // CHECKPOINT 2 (6 beats)
  { filename: "beat-c2-00.png", prompt: `${ART_STYLE} Scene: Maya unfolding a crumpled paper completely, revealing its contents, careful hand movements.` },
  { filename: "beat-c2-01.png", prompt: `${ART_STYLE} Scene: Close-up of a paper with hand-drawn planet diagrams and measurements (no readable text, just lines and circles).` },
  { filename: "beat-c2-02.png", prompt: `${ART_STYLE} Scene: Maya walking toward scattered pieces and kneeling down, paper in hand, gymnasium floor.` },
  { filename: "beat-c2-03.png", prompt: `${ART_STYLE} Scene: Maya comparing her paper diagram to the broken project pieces on the floor, problem-solving expression.` },
  { filename: "beat-c2-04.png", prompt: `${ART_STYLE} Scene: Maya speaking quietly, sad and confused expression visible through body language, shoulders slightly slumped.` },
  { filename: "beat-c2-05.png", prompt: `${ART_STYLE} Scene: Close-up of Maya's face and upper body showing sadness and confusion through posture, looking down.` },

  // CHECKPOINT 3 (6 beats)
  { filename: "beat-c3-00.png", prompt: `${ART_STYLE} Scene: POV shot looking down at gymnasium floor showing a small trail of sparkly glitter leading away from the scene.` },
  { filename: "beat-c3-01.png", prompt: `${ART_STYLE} Scene: Glitter trail on gymnasium floor leading from a table toward a storage closet door in the background.` },
  { filename: "beat-c3-02.png", prompt: `${ART_STYLE} Scene: A storage closet door slightly ajar, mysterious but not scary, normal school setting.` },
  { filename: "beat-c3-03.png", prompt: `${ART_STYLE} Scene: Kai and Maya working together, sorting through broken project pieces on a table, cooperative teamwork.` },
  { filename: "beat-c3-04.png", prompt: `${ART_STYLE} Scene: Wide shot of gymnasium with several students arriving, carrying various science fair projects, busy morning setup.` },
  { filename: "beat-c3-05.png", prompt: `${ART_STYLE} Scene: Gymnasium filling with activity - students setting up projects, conversations happening, energetic atmosphere.` },

  // ENDING (6 beats)
  { filename: "beat-ending-00.png", prompt: `${ART_STYLE} Scene: Crowded gymnasium during active science fair - students, parents, teachers walking between display tables.` },
  { filename: "beat-ending-01.png", prompt: `${ART_STYLE} Scene: Maya proudly standing behind a creative new display - her original drawings mounted as a backdrop with salvaged planet pieces arranged artistically.` },
  { filename: "beat-ending-02.png", prompt: `${ART_STYLE} Scene: Kai and Maya together explaining their solar system display to interested visitors, collaborative presentation.` },
  { filename: "beat-ending-03.png", prompt: `${ART_STYLE} Scene: A volcano science project demonstration with a small crowd of impressed onlookers, eruption happening.` },
  { filename: "beat-ending-04.png", prompt: `${ART_STYLE} Scene: Mr. Rodriguez walking between science fair tables with clipboard, taking notes, professional and encouraging.` },
  { filename: "beat-ending-05.png", prompt: `${ART_STYLE} Scene: Wide shot of successful science fair in full swing - students presenting, parents observing, atmosphere of discovery and excitement.` },
];

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

async function generateImage(beat: Beat, index: number, retryCount = 0): Promise<void> {
  const filepath = path.join(OUTPUT_DIR, beat.filename);
  const MAX_RETRIES = 3;

  // Skip if already exists
  if (fs.existsSync(filepath)) {
    console.log(`[${index + 1}/${BEATS.length}] SKIP: ${beat.filename} (already exists)`);
    return;
  }

  console.log(`[${index + 1}/${BEATS.length}] Generating: ${beat.filename}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: beat.prompt,
      n: 1,
      size: "1792x1024", // Closest to 16:9 ratio
      quality: "standard",
      style: "vivid",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL returned");
    }

    await downloadImage(imageUrl, filepath);
    console.log(`[${index + 1}/${BEATS.length}] SAVED: ${beat.filename}`);

  } catch (error: unknown) {
    const err = error as { status?: number; code?: string };

    // Handle rate limiting with exponential backoff
    if (err.status === 429 || err.code === 'rate_limit_exceeded') {
      if (retryCount < MAX_RETRIES) {
        const waitTime = Math.pow(2, retryCount + 1) * 15; // 30s, 60s, 120s
        console.log(`[${index + 1}/${BEATS.length}] Rate limited. Waiting ${waitTime}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        return generateImage(beat, index, retryCount + 1);
      }
    }

    console.error(`[${index + 1}/${BEATS.length}] ERROR: ${beat.filename}`, error);
    throw error;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("STAGE 28c: GENERATING 35 UNIQUE BEAT IMAGES");
  console.log("=".repeat(60));
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Total images: ${BEATS.length}\n`);

  if (!process.env.OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY not found in .env.local");
    process.exit(1);
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < BEATS.length; i++) {
    const beat = BEATS[i];
    const filepath = path.join(OUTPUT_DIR, beat.filename);

    if (fs.existsSync(filepath)) {
      console.log(`[${i + 1}/${BEATS.length}] SKIP: ${beat.filename} (exists)`);
      skipped++;
      continue;
    }

    try {
      await generateImage(beat, i);
      generated++;
      // Wait 15 seconds between successful generations to respect rate limits
      if (i < BEATS.length - 1) {
        console.log(`Waiting 15s before next image...`);
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    } catch (error) {
      failed++;
      console.error(`Failed to generate ${beat.filename}:`, error);
      // Continue with next image
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("GENERATION COMPLETE");
  console.log("=".repeat(60));
  console.log(`Generated: ${generated}`);
  console.log(`Skipped (existing): ${skipped}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
