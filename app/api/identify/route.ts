import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { searchCardsByIdentification } from "@/lib/pokemontcg";
import { IdentificationResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function cleanJson(text: string) {
  return text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

async function identifyCardFromImage(file: File): Promise<IdentificationResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "image/jpeg";
  const dataUrl = `data:${mimeType};base64,${bytes.toString("base64")}`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Identify the Pokemon trading card in this image. Return only JSON with the shape " +
              '{"pokemonName":"string","cardName":"string | null","setName":"string | null","collectorNumber":"string | null","confidence":0.0,"searchQuery":"string","notes":["string"]}. ' +
              "Prefer the exact card title when it is visible. If the image is unclear, make your best guess and lower confidence.",
          },
          {
            type: "input_image",
            image_url: dataUrl,
            detail: "high",
          },
        ],
      },
    ],
    max_output_tokens: 300,
  });

  const rawText = response.output_text?.trim();

  if (!rawText) {
    throw new Error("The image could not be identified.");
  }

  return JSON.parse(cleanJson(rawText)) as IdentificationResult;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    const identification = await identifyCardFromImage(file);
    const cards = await searchCardsByIdentification(identification);

    return NextResponse.json({ identification, cards });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to identify the card.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
