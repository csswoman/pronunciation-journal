# Pronunciation Journal

A personal web app built with **Next.js** to help you track and improve your English pronunciation — one entry at a time.

## Getting Started

Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to get started.

---

## Cloud Storage with Supabase (optional)

By default, all data is saved locally in your browser's `localStorage` — no setup needed.

If you'd like to sync your data to the cloud, add your Supabase credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

With Supabase enabled, you'll see an auth screen to **sign in**, **sign up**, or **continue as guest** before accessing the journal.

→ Full setup guide: [docs/SUPABASE_DESDE_CERO.md](./docs/SUPABASE_DESDE_CERO.md)

---

## Project Structure
app/         → Next.js app router pages and layouts
components/  → Reusable React components
lib/         → Utility functions and libraries
hooks/       → Custom React hooks
styles/      → Additional stylesheets
public/      → Static assets

---

## Built With

- [Next.js](https://nextjs.org/) — React framework
- [Supabase](https://supabase.com/) — Backend and auth (optional)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

---

## License & Attribution

Sound files under `public/sounds/` are licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) and are the respective works of Peter Isotalo, User:Erutoon, User:TFighterPilot, and User:Adamsa123.
