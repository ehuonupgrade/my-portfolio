# Terminal Portfolio Hub

A high-speed developer portfolio and subdomain application hub built with **Astro**, **Tailwind CSS v4**, and **Vercel Edge**.

Designed with a high-end developer terminal aesthetic: `#0a0a0a` dark obsidian background, `#00ff41` phosphor green typography, and CRT scanlines.

## Architecture

- **Root Domain (`huon.si`)**: Hosts the portfolio.
- **CNAME Subdomains (`*.huon.si`)**: Host individual projects.

## File Structure

```
├── astro.config.mjs          # Astro + Tailwind v4 build configuration
├── vercel.json               # Vercel Edge deployment settings
├── src/
│   ├── data/
│   │   └── projects.json     # Application metadata and subdomain routing registry
│   ├── layouts/
│   │   └── Layout.astro      # Base terminal layout with CSS scanline effects
│   └── pages/
│       └── index.astro       # Terminal homepage ($ USER_IDENT, >> cat about_me.txt)
```

## Local Development & Astro Setup

To run as an Astro project:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Vercel Deployment & CNAME Configuration

1. Connect this repository to your Vercel account.
2. In Vercel Project Settings &rarr; **Domains**:
   - Add your root apex domain: `yourdomain.com`
   - Add your subdomains: `timer.yourdomain.com`, `sql.yourdomain.com`, etc.
3. In your DNS provider (Cloudflare, Namecheap, Route53, etc.):
   - Set `@ IN A 76.76.21.21` (Apex)
   - Set `timer IN CNAME cname.vercel-dns.com.`
   - Set `sql IN CNAME cname.vercel-dns.com.`
