# AGENTS.md

This document is designed to help AI Agents better understand and modify the Jumble project.

## Project Overview

Jumble is a user-friendly Nostr client for exploring relay feeds.

- **Project Name**: Jumble
- **Main Tech Stack**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + Radix UI
- **State Management**: Jotai
- **Core Protocol**: Nostr (using nostr-tools)

## Technical Architecture

### Core Dependencies

- **Build Tool**: Vite 5.x
- **Frontend Framework**: React 18.3.x + TypeScript
- **Styling Solution**:
  - Tailwind CSS (primary styling framework)
  - Radix UI (unstyled component library)
  - next-themes (theme management)
  - tailwindcss-animate (animations)
- **State Management**: Jotai 2.x
- **Routing**: path-to-regexp (custom routing solution)
- **Rich Text Editor**: TipTap 2.x
- **Nostr Protocol**: nostr-tools 2.x
- **Other Key Libraries**:
  - i18next (internationalization)
  - dayjs (date handling)
  - flexsearch (search)
  - qr-code-styling (QR codes)
  - yet-another-react-lightbox (image viewer)

### Project Structure

```
jumble/
├── src/
│   ├── components/           # React components
│   │   ├── ui/               # Base UI components (shadcn/ui style)
│   │   └── ...               # Other feature components
│   ├── providers/            # React Context Providers
│   ├── services/             # Business logic service layer
│   ├── hooks/                # Custom React Hooks
│   ├── lib/                  # Utility functions and libraries
│   ├── types/                # TypeScript type definitions
│   ├── pages/                # Page components
|   |   ├── primary           # Primary page components (Left column)
│   │   └── secondary         # secondary page components (Right column)
│   ├── layouts/              # Layout components
│   ├── i18n/                 # Internationalization resources
|   |   ├── locales           # Localization files
│   │   └── index.tx          # Basic i18n setup
│   ├── assets/               # Static assets
│   ├── App.tsx               # App root component
│   ├── PageManager.tsx       # Page manager (custom routing logic)
│   ├── routes                # Route configuration
|   |   ├── primary.tsx       # Primary routes (Left column)
│   │   └── secondary.tsx     # Secondary routes (Right column)
│   └── constants.ts          # Constants definition
├── public/                   # Public static assets
└── resources/                # Design resources
```

## Development Guide

### Environment Setup

### Environment Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## Code Conventions

### Component Development

1. **Component Structure**: Each major feature component is typically in its own folder, containing index.tsx and related sub-components
2. **Styling**: Use Tailwind CSS utility classes, complex components can use class-variance-authority (cva)
3. **Type Safety**: All components should have explicit TypeScript type definitions
4. **State Management**:
   - Use Jotai atoms for global state management
   - Use Context Providers for cross-component data

### Service Layer (Services)

Service files located in `src/services/` encapsulate business logic:

- `client.service.ts` - Nostr client core logic for fetching and publishing events
- `indexed-db.service.ts` - IndexedDB data storage
- `local-storage.service.ts` - LocalStorage management
- `media-upload.service.ts` - Media upload service
- `translation.service.ts` - Translation service
- `lightning.service.ts` - Lightning Network integration
- `relay-info.service.ts` - Relay information management
- `blossom.service.ts` - Blossom integration
- `custom-emoji.service.ts` - Custom emoji management
- `libre-translate.service.ts` - LibreTranslate API integration
- `media-manager.service.ts` - Managing media play state
- `modal-manager.service.ts` - Managing modal stack for back navigation (ensures modals close one by one before actual page navigation)
- `note-stats.service.ts` - Note statistics storage and retrieval (likes, zaps, reposts)
- `poll-results.service.ts` - Poll results storage and retrieval
- `post-editor-cache.service.ts` - Caching post editor content to prevent data loss
- `web.push.service.ts` - Web metadata fetching for link previews

### Providers Architecture

The app uses a multi-layered Provider nesting structure (see `App.tsx`):

```
ScreenSizeProvider
  └─ UserPreferencesProvider
      └─ ThemeProvider
          └─ ContentPolicyProvider
              └─ NostrProvider
                  └─ ... (more providers)
```

Pay attention to Provider dependencies when modifying functionality.

### Routing System

- Route configuration in `src/routes/primary.tsx` and `src/routes/secondary.tsx`
- Using `PageManager.tsx` to manage page navigation, rendering, and state. Normally, you don't need to modify this file.

### Internationalization (i18n)

- Translation files located in `src/i18n/`
- Using `react-i18next` for internationalization
- Supported languages: [TODO: List supported languages]

## Nostr Protocol Integration

### Core Concepts

- **Events**: Nostr events (notes, profile updates, etc.)
- **Relays**: Relay servers
- **Keys**: Public/private key pairs
- **NIPs**: Nostr Implementation Proposals

### Main Features

- Publishing and reading notes
- User follow/unfollow
- Zap (Lightning payments)
- Bookmark management
- Relay management
- [TODO: Add other features]

## Common Modification Scenarios

### Adding a New Component

1. Create a component folder in `src/components/`
2. Create `index.tsx` and necessary sub-components
3. Define TypeScript types
4. Write styles using Tailwind CSS
5. If needed, add base UI components in `src/components/ui/`

### Adding a New Page

#### Adding a Primary Page (Left Column)

Primary pages are the main navigation pages that appear in the left column (or full screen on mobile).

1. **Create the page component**:

   ```bash
   # Create a new folder under src/pages/primary/
   mkdir src/pages/primary/YourNewPage
   ```

2. **Implement the component** (`src/pages/primary/YourNewPage/index.tsx`):

   ```tsx
   import PrimaryPageLayout from '@/layouts/PrimaryPageLayout'
   import { TPageRef } from '@/types'
   import { forwardRef } from 'react'

   const YourNewPage = forwardRef<TPageRef>((_, ref) => {
     return (
       <PrimaryPageLayout ref={ref} title="Your Page Title" icon={<YourIcon />}>
         {/* Your page content */}
       </PrimaryPageLayout>
     )
   })

   export default YourNewPage
   ```

   **Important**:

   - Primary pages MUST use `forwardRef<TPageRef>`
   - Wrap content with `PrimaryPageLayout`
   - The ref is used by PageManager for navigation control

3. **Register the route** in `src/routes/primary.tsx`:

   ```tsx
   import YourNewPage from '@/pages/primary/YourNewPage'

   const PRIMARY_ROUTE_CONFIGS: RouteConfig[] = [
     // ... existing routes
     { key: 'yourNewPage', component: YourNewPage }
   ]
   ```

4. **Navigate to the page** using the `usePrimaryPage` hook:

   ```tsx
   import { usePrimaryPage } from '@/PageManager'

   const { navigate } = usePrimaryPage()
   navigate('yourNewPage')
   ```

#### Adding a Secondary Page (Right Column)

Secondary pages appear in the right column (or full screen on mobile) and support stack-based navigation.

1. **Create the page component**:

   ```bash
   # Create a new folder under src/pages/secondary/
   mkdir src/pages/secondary/YourNewPage
   ```

2. **Implement the component** (`src/pages/secondary/YourNewPage/index.tsx`):

   ```tsx
   import SecondaryPageLayout from '@/layouts/SecondaryPageLayout'
   import { forwardRef } from 'react'

   const YourNewPage = forwardRef(({ index }: { index?: number }, ref) => {
     return (
       <SecondaryPageLayout ref={ref} index={index} title="Your Page Title">
         {/* Your page content */}
       </SecondaryPageLayout>
     )
   })

   export default YourNewPage
   ```

   **Important**:

   - Secondary pages receive an `index` prop for stack navigation
   - Use `SecondaryPageLayout` for consistent styling
   - The ref enables navigation control

3. **Register the route** in `src/routes/secondary.tsx`:

   ```tsx
   import YourNewPage from '@/pages/secondary/YourNewPage'

   const SECONDARY_ROUTE_CONFIGS = [
     // ... existing routes
     { path: '/your-path/:id', element: <YourNewPage /> }
   ]
   ```

   Add the corresponding path generation function in `src/lib/link.ts` for the new route:

   ```tsx
   export const toYourNewPage = (id: string) => `/your-path/${id}`
   ```

4. **Navigate to the page**:

   ```tsx
   import { useSecondaryPage } from '@/PageManager'
   import { toYourNewPage } from '@/lib/link'

   const { push, pop } = useSecondaryPage()

   // Navigate to new page
   push(toYourNewPage('some-id'))

   // Navigate back
   pop()
   ```

5. **Access route parameters**:

   ```tsx
   const YourNewPage = forwardRef(({ id, index }: { id?: string; index?: number }, ref) => {
     console.log('Route param id:', id)
     // ...
   })
   ```

#### Key Differences

| Aspect         | Primary Pages                       | Secondary Pages                 |
| -------------- | ----------------------------------- | ------------------------------- |
| **Location**   | Left column (main navigation)       | Right column (detail view)      |
| **Navigation** | Replace-based (`navigate`)          | Stack-based (`push`/`pop`)      |
| **Layout**     | `PrimaryPageLayout`                 | `SecondaryPageLayout`           |
| **Routes**     | Key-based (e.g., 'home', 'explore') | Path-based (e.g., '/notes/:id') |

On mobile devices or single-column layouts, primary pages occupy the full screen, while secondary pages are accessed via stack navigation. When navigating to another primary page, it will clear the secondary page stack.

### Adding New State Management

1. For global state, create a new Provider in `src/providers/`
2. Add Provider in `App.tsx` in the correct dependency order
3. Manage state using Jotai atoms

### Adding New Business Logic

1. Create a new service file in `src/services/`
2. Export service functions or classes
3. Import and use in components as needed

### Style Modifications

- Global styles: `src/index.css`
- Tailwind configuration: `tailwind.config.js`
- Component styles: Use Tailwind class names directly

## Important Notes

### PWA Support

The project uses `vite-plugin-pwa` for PWA functionality.

### Performance Optimization

- Use React.lazy and Suspense for code splitting
- Use lazy loading for images
- [TODO: Add other optimization strategies]

### Security Considerations

- Be extra careful when handling Nostr private keys
- User data is primarily stored on the client side
- [TODO: Add security best practices]

## Testing

[TODO: Add testing strategy and test file locations]

## Environment Variables

[TODO: List environment variables to configure]

---

**Repository**: https://github.com/CodyTseng/jumble
