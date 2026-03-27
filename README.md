# SKU Engine — Frontend

Next.js 14 frontend for the SKU Engine API.

## Stack
- **Next.js 14** (App Router)
- **Tailwind CSS** — white/minimal design system
- **shadcn-style** UI components (Button, Input, Card, Badge)
- **TanStack Query** — data fetching + caching
- **React Hook Form + Zod** — form validation
- **Sonner** — toast notifications
- **Lucide React** — icons

## Getting Started

```bash
# 1. Clone
git clone https://github.com/VGS-SOFT/sku-frontend.git
cd sku-frontend

# 2. Install deps
npm install

# 3. Create env file
cp .env.local.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL

# 4. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Authentication |
| `/dashboard` | Stats + recent SKUs + quick actions |
| `/masters` | Master categories CRUD |
| `/categories` | N-level category tree builder |
| `/variants` | Variant types + values |
| `/skus` | SKU Generator (main screen) |
| `/catalog` | Full SKU list with search + pagination |
| `/import` | Bulk import wizard |
| `/templates` | Saved SKU templates |
| `/audit` | Audit logs (admin only) |

## Backend

Make sure the [SKU Engine API](https://github.com/VGS-SOFT/sku) is running on `http://localhost:3001`.
