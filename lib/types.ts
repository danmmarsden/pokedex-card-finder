export type CurrencyCode = "USD" | "EUR" | "GBP";

export type MarketplaceOffer = {
  label: string;
  source: string;
  currency: CurrencyCode;
  price: number;
  url: string | null;
  sourceCurrency?: Exclude<CurrencyCode, "GBP">;
  sourcePrice?: number;
};

export type CardResult = {
  id: string;
  name: string;
  setName: string;
  setSeries: string;
  collectorNumber: string;
  rarity: string | null;
  image: string;
  detailsUrl: string | null;
  cheapestOffer: MarketplaceOffer | null;
  offers: MarketplaceOffer[];
};

export type IdentificationResult = {
  pokemonName: string;
  cardName: string | null;
  setName: string | null;
  collectorNumber: string | null;
  confidence: number;
  searchQuery: string;
  notes: string[];
};
