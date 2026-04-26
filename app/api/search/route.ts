import { NextRequest, NextResponse } from "next/server";
import { searchCardsByPokemonName } from "@/lib/pokemontcg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter." }, { status: 400 });
  }

  try {
    const cards = await searchCardsByPokemonName(query);
    return NextResponse.json({ cards });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to search cards.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
