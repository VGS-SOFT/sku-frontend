# SKU Generator — Frontend

Next.js 15 + shadcn/ui + Tailwind CSS frontend for the SKU Generator system.

## Prerequisites

- Node.js v18+
- Backend running at `http://localhost:3001/api`

## Setup

```bash
# 1. Navigate to frontend folder
cd sku-frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

App runs at: **http://localhost:3000**

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats |
| `/code-registry` | Manage all short code mappings |
| `/categories` | N-level category tree builder |
| `/products` | Product catalog |
| `/products/new` | Add product with live SKU preview |
| `/products/:id` | Product detail + SKU breakdown |

## Workflow

1. **Code Registry** → Register short codes for every concept
2. **Categories** → Build hierarchy, define attribute schemas on leaf nodes
3. **Products** → Add products; SKU auto-generates as you select attributes

## Tech Stack

- **Next.js 15** (App Router)
- **shadcn/ui** components
- **Tailwind CSS** with Apple-inspired design tokens
- **Radix UI** primitives
- **Axios** for API calls
- **Sonner** for toast notifications
- **Lucide React** for icons
