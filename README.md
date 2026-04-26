# PokePrice Scout

A Next.js web app that helps you find Pokemon cards by:

- typing a Pokemon name
- taking a card photo with your camera
- uploading a card image from your camera roll

It uses OpenAI vision to identify the card from an image, then queries the Pokemon TCG API and sorts matches by the cheapest known marketplace price.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file and add your key:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

This app is a good fit for Vercel because it uses Next.js server routes for:

- OpenAI-powered image identification
- Pokemon TCG API lookups

### Before you deploy

You will need:

- a GitHub repository containing this project
- a Vercel account
- an `OPENAI_API_KEY`
- optionally a `POKEMON_TCG_API_KEY`

### Deploy steps

1. Push this project to GitHub.
2. In Vercel, choose **Add New Project**.
3. Import the GitHub repository.
4. Keep the default Next.js build settings.
5. Add these environment variables in the Vercel project settings:
   - `OPENAI_API_KEY` required
   - `POKEMON_TCG_API_KEY` optional
6. Deploy the project.

Vercel will detect Next.js automatically and build the app without extra configuration.

### Redeploy after env changes

If you add or change environment variables after the first deploy, trigger a new deployment so the new values are applied.

## Environment variables

- `OPENAI_API_KEY` is required for image-based card identification.
- `POKEMON_TCG_API_KEY` is optional but recommended if you expect heavier usage.

## Notes

- The image flow works best with clear photos of a single card.
- Cheapest offers are inferred from marketplace pricing fields exposed by the Pokemon TCG API.
- Some results may not have active price data.
- Vercel is the recommended host for this version because the app uses server-side API routes.
