/**
 * Stage 28d: Generate 8 choice images with unified art style
 *
 * Run with: npx tsx scripts/generate-choice-images.ts
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

// Style lock prefix for all prompts
const STYLE_LOCK = `Children's watercolor storybook illustration, soft pastel palette, light paper texture, gentle outlines, minimal detail, no harsh shadows, no realism, no facial features, calm quiet tone, consistent with the 35 story beat images, school science fair setting.`;

const FACIAL_RULE = `Child figure with no facial features (no eyes, nose, mouth, eyebrows).`;

const FRAMING = `Soft even lighting. Mid-distance storybook framing.`;

interface ChoiceImage {
  filename: string;
  scene: string;
}

const CHOICES: ChoiceImage[] = [
  {
    filename: "choice-c1-a.png",
    scene: "A child walking across gymnasium floor toward another student searching through a box. Back view of walking child, distant figure.",
  },
  {
    filename: "choice-c1-b.png",
    scene: "A child kneeling on gymnasium floor, carefully picking up colorful painted styrofoam planets. Gentle helpful gesture. Scattered craft pieces around.",
  },
  {
    filename: "choice-c1-c.png",
    scene: "A child arranging a paper mache volcano on a table, head slightly turned to look across the room.",
  },
  {
    filename: "choice-c2-a.png",
    scene: "A child kneeling beside another student who is looking at scattered project pieces. Offering gesture, supportive body language.",
  },
  {
    filename: "choice-c2-b.png",
    scene: "A child standing in gymnasium, scanning the room carefully. Observant pose, looking toward distant areas of the gym.",
  },
  {
    filename: "choice-c3-a.png",
    scene: "A child walking along a sparkly glitter trail on gymnasium floor, heading toward a storage closet door. Curious posture.",
  },
  {
    filename: "choice-c3-b.png",
    scene: "A child walking toward an adult teacher figure holding a clipboard. Teacher also has no facial features.",
  },
  {
    filename: "choice-c3-c.png",
    scene: "A child carefully adjusting their volcano science project on a display table. Focused on hands working on project.",
  },
];

function buildPrompt(scene: string): string {
  return `${STYLE_LOCK} ${FACIAL_RULE} ${scene} ${FRAMING}`;
}

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
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function generateImage(choice: ChoiceImage, index: number, retryCount = 0): Promise<void> {
  const filepath = path.join(OUTPUT_DIR, choice.filename);
  const MAX_RETRIES = 3;
  const prompt = buildPrompt(choice.scene);

  console.log(`[${index + 1}/${CHOICES.length}] Generating: ${choice.filename}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
      style: "vivid",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL returned");
    }

    await downloadImage(imageUrl, filepath);
    console.log(`[${index + 1}/${CHOICES.length}] SAVED: ${choice.filename}`);

  } catch (error: unknown) {
    const err = error as { status?: number; code?: string };

    if (err.status === 429 || err.code === 'rate_limit_exceeded') {
      if (retryCount < MAX_RETRIES) {
        const waitTime = Math.pow(2, retryCount + 1) * 15;
        console.log(`[${index + 1}/${CHOICES.length}] Rate limited. Waiting ${waitTime}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        return generateImage(choice, index, retryCount + 1);
      }
    }

    console.error(`[${index + 1}/${CHOICES.length}] ERROR: ${choice.filename}`, error);
    throw error;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("STAGE 28d: GENERATING 8 CHOICE IMAGES");
  console.log("=".repeat(60));
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Total images: ${CHOICES.length}\n`);

  if (!process.env.OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY not found in .env.local");
    process.exit(1);
  }

  let generated = 0;
  let failed = 0;

  for (let i = 0; i < CHOICES.length; i++) {
    try {
      await generateImage(CHOICES[i], i);
      generated++;

      // Wait 15 seconds between generations
      if (i < CHOICES.length - 1) {
        console.log(`Waiting 15s before next image...`);
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    } catch (error) {
      failed++;
      console.error(`Failed to generate ${CHOICES[i].filename}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("GENERATION COMPLETE");
  console.log("=".repeat(60));
  console.log(`Generated: ${generated}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
