import { CardResult, IdentificationResult, MarketplaceOffer } from "@/lib/types";

type PokemonTcgCard = {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  images?: {
    small?: string;
    large?: string;
  };
  set?: {
    name?: string;
    series?: string;
  };
  tcgplayer?: {
    url?: string;
    prices?: Record<string, Record<string, number | null | undefined>>;
  };
  cardmarket?: {
    url?: string;
    prices?: Record<string, number | null | undefined>;
  };
};

const API_URL = "https://api.pokemontcg.io/v2/cards";

function buildHeaders() {
  const apiKey = process.env.POKEMON_TCG_API_KEY;

  return apiKey ? { "X-Api-Key": apiKey } : undefined;
}

function priceLabel(prefix: string, valueKey: string) {
  return `${prefix} ${valueKey}`
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim();
}

function collectOffers(card: PokemonTcgCard): MarketplaceOffer[] {
  const tcgplayerOffers: MarketplaceOffer[] = [];
  const cardmarketOffers: MarketplaceOffer[] = [];

  for (const [finish, values] of Object.entries(card.tcgplayer?.prices ?? {})) {
    for (const [kind, rawPrice] of Object.entries(values ?? {})) {
      if (typeof rawPrice !== "number" || Number.isNaN(rawPrice) || rawPrice <= 0) {
        continue;
      }

      if (!["directLow", "low", "market"].includes(kind)) {
        continue;
      }

      tcgplayerOffers.push({
        label: priceLabel(`TCGplayer ${finish}`, kind),
        source: "TCGplayer",
        currency: "USD",
        price: rawPrice,
        url: card.tcgplayer?.url ?? null,
      });
    }
  }

  for (const [kind, rawPrice] of Object.entries(card.cardmarket?.prices ?? {})) {
    if (typeof rawPrice !== "number" || Number.isNaN(rawPrice) || rawPrice <= 0) {
      continue;
    }

    if (!["lowPrice", "averageSellPrice", "trendPrice"].includes(kind)) {
      continue;
    }

    cardmarketOffers.push({
      label: priceLabel("Cardmarket", kind),
      source: "Cardmarket",
      currency: "EUR",
      price: rawPrice,
      url: card.cardmarket?.url ?? null,
    });
  }

  const preferred = tcgplayerOffers.length > 0 ? tcgplayerOffers : cardmarketOffers;
  return preferred.sort((a, b) => a.price - b.price);
}

function quoteValue(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function buildSearchExpression(input: Partial<IdentificationResult> & { searchQuery?: string }) {
  const filters: string[] = [];

  if (input.cardName) {
    filters.push(`name:${quoteValue(input.cardName)}`);
  } else if (input.pokemonName) {
    filters.push(`name:${quoteValue(input.pokemonName)}`);
  } else if (input.searchQuery) {
    filters.push(`name:${quoteValue(input.searchQuery)}`);
  }

  if (input.setName) {
    filters.push(`set.name:${quoteValue(input.setName)}`);
  }

  if (input.collectorNumber) {
    filters.push(`number:${quoteValue(input.collectorNumber)}`);
  }

  return filters.join(" AND ");
}

async function fetchCards(query: string) {
  const url = new URL(API_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("pageSize", "50");
  url.searchParams.set("orderBy", "set.releaseDate,number");

  const response = await fetch(url.toString(), {
    headers: buildHeaders(),
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Pokemon TCG API request failed with ${response.status}.`);
  }

  const json = (await response.json()) as { data?: PokemonTcgCard[] };

  return json.data ?? [];
}

function toCardResult(card: PokemonTcgCard): CardResult {
  const offers = collectOffers(card);

  return {
    id: card.id,
    name: card.name,
    setName: card.set?.name ?? "Unknown set",
    setSeries: card.set?.series ?? "Unknown series",
    collectorNumber: card.number,
    rarity: card.rarity ?? null,
    image: card.images?.large ?? card.images?.small ?? "",
    detailsUrl: card.tcgplayer?.url ?? card.cardmarket?.url ?? null,
    cheapestOffer: offers[0] ?? null,
    offers: offers.slice(0, 4),
  };
}

export async function searchCardsByPokemonName(name: string) {
  const query = buildSearchExpression({ pokemonName: name });
  const cards = await fetchCards(query);

  return cards.map(toCardResult).sort((a, b) => {
    const aPrice = a.cheapestOffer?.price ?? Number.POSITIVE_INFINITY;
    const bPrice = b.cheapestOffer?.price ?? Number.POSITIVE_INFINITY;
    return aPrice - bPrice;
  });
}

export async function searchCardsByIdentification(identification: IdentificationResult) {
  const exactQuery = buildSearchExpression(identification);
  let cards = exactQuery ? await fetchCards(exactQuery) : [];

  if (cards.length === 0 && identification.cardName !== identification.pokemonName) {
    cards = await fetchCards(buildSearchExpression({ pokemonName: identification.pokemonName }));
  }

  return cards.map(toCardResult).sort((a, b) => {
    const aPrice = a.cheapestOffer?.price ?? Number.POSITIVE_INFINITY;
    const bPrice = b.cheapestOffer?.price ?? Number.POSITIVE_INFINITY;
    return aPrice - bPrice;
  });
}
