"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { CardResult, IdentificationResult } from "@/lib/types";

type SearchResponse = {
  cards?: CardResult[];
  error?: string;
};

type IdentifyResponse = {
  identification?: IdentificationResult;
  cards?: CardResult[];
  error?: string;
};

function formatAmount(value: number, currency: "USD" | "EUR") {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<CardResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [identification, setIdentification] = useState<IdentificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  async function handleNameSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!query.trim()) {
      setError("Enter a Pokemon name to search.");
      return;
    }

    setLoading(true);
    setError(null);
    setIdentification(null);

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query.trim())}`);
      const data = (await response.json()) as SearchResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error || "Unable to search right now.");
      }

      setCards(data.cards ?? []);
    } catch (err) {
      setCards([]);
      setError(err instanceof Error ? err.message : "Unable to search right now.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }

  async function handleIdentify() {
    if (!selectedFile) {
      setError("Choose a card image first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/identify", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as IdentifyResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error || "Unable to identify the card.");
      }

      setIdentification(data.identification ?? null);
      setCards(data.cards ?? []);
      if (data.identification?.pokemonName) {
        setQuery(data.identification.pokemonName);
      }
    } catch (err) {
      setCards([]);
      setIdentification(null);
      setError(err instanceof Error ? err.message : "Unable to identify the card.");
    } finally {
      setLoading(false);
    }
  }

  const bestOffer = cards[0]?.cheapestOffer ?? null;

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <span className="eyebrow">Pokemon card deal finder</span>
          <h1>Spot the card. Find the cheapest listing.</h1>
          <p>
            Search by Pokemon name or snap a card photo from your camera or camera roll. The app
            identifies likely matches, checks marketplace pricing, and pulls the cheapest known
            offers to the top.
          </p>
          <div className="hero-badges">
            <span>Name lookup</span>
            <span>Camera upload</span>
            <span>AI card identification</span>
            <span>Price-ranked results</span>
          </div>
        </div>

        <aside className="hero-card aside-card">
          <div>
            <span className="eyebrow">Best current result</span>
            <div className="price-stat">
              <div className="meta">Cheapest surfaced offer</div>
              <strong>
                {bestOffer ? formatAmount(bestOffer.price, bestOffer.currency) : "Waiting for a search"}
              </strong>
            </div>
          </div>
          <p className="fine-print">
            Cheapest ranking prefers TCGplayer pricing so results stay in one marketplace currency.
            Availability and shipping can still change before checkout.
          </p>
        </aside>
      </section>

      <section className="main-grid">
        <div className="stack">
          <div className="panel">
            <h2>Search by name</h2>
            <p>Enter a Pokemon name like Charizard, Pikachu, or Mew to compare card listings.</p>
            <form className="stack" onSubmit={handleNameSearch}>
              <div className="field">
                <label htmlFor="query">Pokemon name</label>
                <input
                  id="query"
                  type="text"
                  placeholder="Try Charizard"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="button-row">
                <button className="button" type="submit" disabled={loading}>
                  {loading ? "Searching..." : "Find cards"}
                </button>
              </div>
            </form>
          </div>

          <div className="panel">
            <h2>Search from a photo</h2>
            <p>Use your camera on mobile or upload a saved photo. The app will identify the card.</p>
            <div className="upload-box">
              <div className="preview">
                {previewUrl ? (
                  <img src={previewUrl} alt="Selected Pokemon card preview" />
                ) : (
                  <span className="meta">No image selected yet</span>
                )}
              </div>
              <div className="button-row">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  Choose from camera roll
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={loading}
                >
                  Open camera
                </button>
                <button className="button" type="button" onClick={handleIdentify} disabled={loading}>
                  {loading ? "Identifying..." : "Identify card"}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                hidden
              />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="results-header">
            <div>
              <h2>Cheapest matches</h2>
              <p>Results are sorted by the lowest available marketplace price we can find.</p>
              <p className="fine-print">Primary ranking uses TCGplayer data when available.</p>
            </div>
            {identification ? (
              <div className="pill">
                <span>{Math.round(identification.confidence * 100)}% match</span>
                <span>{identification.cardName ?? identification.pokemonName}</span>
              </div>
            ) : null}
          </div>

          {identification ? (
            <div className="status-box">
              <strong>AI match:</strong> {identification.cardName ?? identification.pokemonName}
              {identification.setName ? ` from ${identification.setName}` : ""}
              {identification.collectorNumber ? ` (#${identification.collectorNumber})` : ""}.
            </div>
          ) : null}

          {error ? <div className="status-box">{error}</div> : null}

          {!error && cards.length === 0 ? (
            <div className="empty-state">
              Search by name or upload a card photo to see price-ranked cards here.
            </div>
          ) : null}

          <div className="results-grid">
            {cards.map((card) => (
              <article className="card-tile" key={card.id}>
                {card.image ? <img className="card-art" src={card.image} alt={card.name} /> : null}
                <div>
                  <h3>{card.name}</h3>
                  <div className="meta">
                    {card.setName} · #{card.collectorNumber}
                  </div>
                  <div className="meta">
                    {card.setSeries}
                    {card.rarity ? ` · ${card.rarity}` : ""}
                  </div>
                </div>

                <div className="price-tag">
                  <span>Best price</span>
                  <strong>
                    {card.cheapestOffer
                      ? formatAmount(card.cheapestOffer.price, card.cheapestOffer.currency)
                      : "No price data"}
                  </strong>
                </div>

                <div className="offer-list">
                  {card.offers.map((offer) => (
                    <div className="offer" key={`${card.id}-${offer.label}`}>
                      <span>{offer.label}</span>
                      <strong>{formatAmount(offer.price, offer.currency)}</strong>
                    </div>
                  ))}
                </div>

                <div className="button-row">
                  {card.cheapestOffer?.url ? (
                    <a className="button" href={card.cheapestOffer.url} target="_blank" rel="noreferrer">
                      Open cheapest listing
                    </a>
                  ) : null}
                  {card.detailsUrl && card.detailsUrl !== card.cheapestOffer?.url ? (
                    <a className="ghost-button" href={card.detailsUrl} target="_blank" rel="noreferrer">
                      Open alternate marketplace
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
