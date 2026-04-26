export type MarketplaceOffer = {
  label: string;
  source: string;
  currency: "USD" | "EUR";
  price: number;
  url: string | null;
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
