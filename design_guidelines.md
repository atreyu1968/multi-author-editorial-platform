# Author Website Design Guidelines

## Design Approach
**Selected Direction:** Reference-based with literary aesthetic inspiration
Drawing from: Penguin Classics' timeless elegance, The New Yorker's sophisticated typography, and boutique bookstore ambiance. This creates a distinguished author presence that feels both professional and intimately literary.

## Core Design Elements

### A. Color Palette
**Primary Colors (Dark Mode Default):**
- Background Base: 28 15% 12% (deep charcoal brown)
- Surface: 32 18% 18% (warm dark brown)
- Card Background: 35 20% 22% (burnished brown)

**Accent & Text:**
- Primary Ochre: 38 65% 58% (warm golden ochre)
- Text Primary: 40 25% 88% (cream parchment)
- Text Secondary: 38 20% 68% (faded ochre)
- Border/Divider: 35 15% 28% (subtle sepia)

**Light Mode:**
- Background: 42 40% 96% (aged paper cream)
- Surface: 38 35% 92% (warm ivory)
- Text: 28 25% 20% (deep brown)

### B. Typography
**Font Stack:**
- Headings: 'Crimson Text' or 'Playfair Display' (serif, literary elegance)
- Body: 'Lora' or 'Merriweather' (readable serif)
- Accents: 'Cinzel' for author name (classical elegance)

**Scale:**
- Hero Title: text-6xl md:text-7xl lg:text-8xl font-bold
- Section Headings: text-4xl md:text-5xl font-serif
- Body: text-lg leading-relaxed
- Quotes: text-xl md:text-2xl italic

### C. Layout System
**Spacing Primitives:** Use Tailwind units of 4, 6, 8, 12, 16, 20, 24
- Section padding: py-16 md:py-24 lg:py-32
- Container: max-w-7xl mx-auto px-6
- Content blocks: space-y-12 md:space-y-16

### D. Component Library

**Navigation:**
Sticky header with subtle backdrop-blur, elegant serif typography, minimal underline hover states on ochre accent.

**Hero Section (Full-width with image):**
Asymmetric layout - large atmospheric library/writing desk image (70% width) with author introduction overlaid on dark semi-transparent panel. CTA buttons with blur background when over image.

**Books Showcase:**
Masonry grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3) with book covers, hover states reveal title/synopsis with ochre underline treatment.

**About Section:**
Two-column split (lg:grid-cols-2) - author portrait on left, biographical text on right with decorative quotation marks in ochre.

**Featured Excerpts:**
Full-width cards with paper texture overlay, generous line-height (leading-loose), drop-cap initial letters in ochre serif.

**Events/Appearances:**
Timeline-style vertical layout with date badges in ochre circles, event details in elegant cards.

**Newsletter Signup:**
Centered form with literary quote above, subtle paper texture background, ochre accent on submit button.

**Footer:**
Rich three-column layout (md:grid-cols-3) - Social links, Recent posts preview, Contact info. Include vintage ornamental dividers.

### E. Distinctive Elements

**Visual Motifs:**
- Subtle paper grain texture overlay (opacity-5) on backgrounds
- Decorative flourishes (vintage ornamental rules) between sections
- Drop shadows: shadow-xl with warm brown tones
- Border treatments: border-ochre with decorative corner accents

**Interactive States:**
- Buttons: Solid ochre background, cream text, subtle scale on hover (scale-105)
- Links: Underline decoration on hover in ochre
- Cards: Gentle lift on hover (translate-y-1) with enhanced shadow

## Images Section

**Hero Image:** Large atmospheric photograph - vintage library shelves, leather-bound books, warm lamp lighting, or author's writing desk with scattered pages. Should occupy 60-70% of viewport height, with text overlay panel on dark translucent background.

**Author Portrait:** Professional headshot or candid writing shot, sepia or warm-toned treatment, placed in About section in rounded frame with subtle ochre border.

**Book Covers:** High-resolution cover images in Books section, displayed at consistent aspect ratio (3:4), with elegant hover zoom effect.

**Background Textures:** Subtle repeating paper grain pattern as overlay on major sections, very low opacity (5-10%) to add tactile warmth.

**Decorative Elements:** Vintage pen/quill illustrations as section dividers, antique key or bookmark icons for navigation accents.