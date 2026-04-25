import nodemailer from 'nodemailer';
import type { Author, Book, EditorialSettings } from '@shared/schema';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: {
    name: string;
    email: string;
  };
  // RFC 2369 / 8058 one-click unsubscribe. When set, providers add
  // `List-Unsubscribe: <url>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
  // headers so Gmail/Outlook surface a native "Unsubscribe" button.
  listUnsubscribeUrl?: string;
  // Optional opaque tags for provider-side categorization (Resend supports
  // up to 10 key/value tags per email; other providers ignore this).
  tags?: Record<string, string>;
}

interface EmailProvider {
  send(options: EmailOptions): Promise<void>;
}

// ----- Author-branded email rendering -----------------------------------
//
// All mailing-list emails (welcome, free-book, broadcasts) share the same
// visual language as the public author landing page so the inbox feels like
// a natural extension of the site:
//
//   * Warm gold gradient hero (matching the `.hero-gradient` CSS used on
//     /autor/:slug — `linear-gradient(135deg, hsl(40 65% 50%), hsl(28 50% 40%))`).
//   * Playfair Display headlines + Georgia fallback for the serif look.
//   * Circular author avatar (`author.photo`) anchored at the top of the
//     hero, with a subtle white border so it pops against the gradient.
//   * Cream background (`#faf6ee`) and rich brown body text matching the
//     site's `--background` / `--foreground` tokens.
//   * Inline-only CSS + outer table layout for Outlook/Gmail compatibility.

function escapeHtml(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderCtaButton(href: string, label: string): string {
  // Bulletproof button using nested table so Outlook renders the rounded
  // accent-coloured CTA correctly.
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 8px auto 24px auto;">
      <tr>
        <td align="center" bgcolor="#c89b3c" style="border-radius: 999px; background: hsl(42, 70%, 60%);">
          <a href="${safeHref}"
             style="display: inline-block; padding: 14px 36px; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 999px;">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>
  `;
}

interface AuthorBrandedEmailOpts {
  author?: Author | null;
  from: { name: string; email: string };
  previewText?: string;
  heroTitle: string;
  heroSubtitle?: string;
  bodyHtml: string;
  preferencesUrl?: string;
  // Used to make relative asset URLs (e.g. `/objects/...`) absolute so they
  // load inside the email client.
  baseUrl?: string;
}

function absolutize(url: string | null | undefined, baseUrl?: string): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (!baseUrl) return url;
  return `${baseUrl.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
}

function renderAuthorBrandedEmail(opts: AuthorBrandedEmailOpts): string {
  const { author, from, previewText, heroTitle, heroSubtitle, bodyHtml, preferencesUrl, baseUrl } = opts;

  const displayName = escapeHtml(author?.name || from.name);
  const photoUrl = absolutize(author?.photo, baseUrl);
  // Author background color overrides the default warm cream wallpaper when set.
  const wallpaper = author?.backgroundColor || '#faf6ee';
  // Hero gradient - mirrors `.hero-gradient` from client/src/index.css.
  const heroGradient = 'linear-gradient(135deg, hsl(40, 65%, 50%) 0%, hsl(28, 50%, 40%) 100%)';

  const avatarBlock = photoUrl
    ? `
        <img src="${escapeHtml(photoUrl)}" width="96" height="96" alt="${escapeHtml(author?.name || from.name)}"
             style="display: block; width: 96px; height: 96px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.85); box-shadow: 0 6px 18px rgba(0,0,0,0.18); object-fit: cover; margin: 0 auto 16px auto;" />
      `
    : '';

  const subtitleBlock = heroSubtitle
    ? `<p style="margin: 8px 0 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 15px; color: rgba(255,255,255,0.92);">${escapeHtml(heroSubtitle)}</p>`
    : '';

  const previewSpan = previewText
    ? `<div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: ${wallpaper};">${escapeHtml(previewText)}</div>`
    : '';

  const preferencesLink = preferencesUrl
    ? `<a href="${escapeHtml(preferencesUrl)}" style="color: hsl(28, 50%, 40%); text-decoration: underline;">gestionar tus preferencias</a> · `
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(heroTitle)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
</head>
<body style="margin: 0; padding: 0; background-color: ${wallpaper}; font-family: Helvetica, Arial, sans-serif; color: #2b1d10; line-height: 1.6;">
  ${previewSpan}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${wallpaper}"
         style="background-color: ${wallpaper}; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(43,29,16,0.08);">
          <tr>
            <td align="center" style="background: ${heroGradient}; padding: 36px 28px; color: #ffffff;">
              ${avatarBlock}
              <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                ${heroTitle}
              </h1>
              ${subtitleBlock}
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 8px 32px; color: #2b1d10; font-family: Helvetica, Arial, sans-serif; font-size: 16px;">
              ${bodyHtml}
              <p style="margin: 24px 0 0 0; color: #4a3a2a;">Con cariño,</p>
              <p style="margin: 4px 0 0 0; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 18px; color: hsl(28, 50%, 40%);">
                ${displayName}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 32px 32px; border-top: 1px solid #e9dcc4; color: #8a7560; font-size: 12px; font-family: Helvetica, Arial, sans-serif; line-height: 1.6;">
              <p style="margin: 0;">Recibes este correo porque te suscribiste a la newsletter de ${displayName}. Puedes ${preferencesLink}darte de baja en cualquier momento.</p>
              <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} ${displayName}. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

class ResendProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(options: EmailOptions): Promise<void> {
    const fromEmail = options.from 
      ? `${options.from.name} <${options.from.email}>`
      : 'noreply@example.com';

    // Resend supports custom headers (used for List-Unsubscribe per RFC 8058)
    // and key/value tags for analytics segmentation.
    const headers: Record<string, string> = {};
    if (options.listUnsubscribeUrl) {
      headers['List-Unsubscribe'] = `<${options.listUnsubscribeUrl}>`;
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }
    const tags = options.tags
      ? Object.entries(options.tags).slice(0, 10).map(([name, value]) => ({ name, value }))
      : undefined;

    const body: Record<string, unknown> = {
      from: fromEmail,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    };
    if (Object.keys(headers).length > 0) body.headers = headers;
    if (tags && tags.length > 0) body.tags = tags;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }
  }
}

class SendGridProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(options: EmailOptions): Promise<void> {
    const headers: Record<string, string> = {};
    if (options.listUnsubscribeUrl) {
      headers['List-Unsubscribe'] = `<${options.listUnsubscribeUrl}>`;
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }
    const body: Record<string, unknown> = {
      personalizations: [{
        to: [{ email: options.to }],
      }],
      from: {
        email: options.from?.email || 'noreply@example.com',
        name: options.from?.name || 'Newsletter',
      },
      subject: options.subject,
      content: [{ type: 'text/html', value: options.html }],
    };
    if (Object.keys(headers).length > 0) body.headers = headers;
    if (options.tags) body.categories = Object.values(options.tags).slice(0, 10);

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${error}`);
    }
  }
}

class MailchimpProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(options: EmailOptions): Promise<void> {
    const messageHeaders: Record<string, string> = {};
    if (options.listUnsubscribeUrl) {
      messageHeaders['List-Unsubscribe'] = `<${options.listUnsubscribeUrl}>`;
      messageHeaders['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }
    const message: Record<string, unknown> = {
      html: options.html,
      subject: options.subject,
      from_email: options.from?.email || 'noreply@example.com',
      from_name: options.from?.name || 'Newsletter',
      to: [{ email: options.to, type: 'to' }],
    };
    if (Object.keys(messageHeaders).length > 0) message.headers = messageHeaders;
    if (options.tags) message.tags = Object.values(options.tags).slice(0, 10);

    const response = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: this.apiKey, message }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mailchimp Transactional API error: ${error}`);
    }
  }
}

class BrevoProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(options: EmailOptions): Promise<void> {
    const headers: Record<string, string> = {};
    if (options.listUnsubscribeUrl) {
      headers['List-Unsubscribe'] = `<${options.listUnsubscribeUrl}>`;
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }
    const body: Record<string, unknown> = {
      sender: {
        email: options.from?.email || 'noreply@example.com',
        name: options.from?.name || 'Newsletter',
      },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
    };
    if (Object.keys(headers).length > 0) body.headers = headers;
    if (options.tags) body.tags = Object.values(options.tags).slice(0, 10);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Brevo API error: ${error}`);
    }
  }
}

class PostmarkProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(options: EmailOptions): Promise<void> {
    const headerArr: { Name: string; Value: string }[] = [];
    if (options.listUnsubscribeUrl) {
      headerArr.push({ Name: 'List-Unsubscribe', Value: `<${options.listUnsubscribeUrl}>` });
      headerArr.push({ Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' });
    }
    const body: Record<string, unknown> = {
      From: options.from
        ? `${options.from.name} <${options.from.email}>`
        : 'noreply@example.com',
      To: options.to,
      Subject: options.subject,
      HtmlBody: options.html,
    };
    if (headerArr.length > 0) body.Headers = headerArr;
    if (options.tags) body.Tag = Object.values(options.tags)[0];

    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Postmark API error: ${error}`);
    }
  }
}

class MailgunProvider implements EmailProvider {
  private apiKey: string;
  private domain: string;

  constructor(apiKeyWithDomain: string) {
    // Parse format "APIKEY:DOMAIN" - domain is required for Mailgun
    const parts = apiKeyWithDomain.split(':');
    if (parts.length < 2 || !parts[1]) {
      throw new Error('Mailgun requires API key in format "APIKEY:DOMAIN" (e.g., "key-abc123:mg.yourdomain.com")');
    }
    this.apiKey = parts[0];
    this.domain = parts[1];
  }

  async send(options: EmailOptions): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('from', options.from 
      ? `${options.from.name} <${options.from.email}>`
      : 'noreply@example.com');
    formData.append('to', options.to);
    formData.append('subject', options.subject);
    formData.append('html', options.html);
    if (options.listUnsubscribeUrl) {
      // Mailgun forwards arbitrary headers when prefixed with "h:".
      formData.append('h:List-Unsubscribe', `<${options.listUnsubscribeUrl}>`);
      formData.append('h:List-Unsubscribe-Post', 'List-Unsubscribe=One-Click');
    }
    if (options.tags) {
      // Mailgun supports up to 3 tags via repeated "o:tag" form fields.
      Object.values(options.tags).slice(0, 3).forEach((t) => formData.append('o:tag', t));
    }

    const response = await fetch(`https://api.mailgun.net/v3/${this.domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mailgun API error: ${error}`);
    }
  }
}

class GmailProvider implements EmailProvider {
  private transporter: any;

  constructor(apiKey: string) {
    // apiKey format: "email@gmail.com:app-password"
    const parts = apiKey.split(':');
    if (parts.length < 2 || !parts[1]) {
      throw new Error('Gmail requires credentials in format "email@gmail.com:app-password"');
    }
    const email = parts[0].trim();
    const password = parts[1].replace(/\s+/g, ''); // Remove all whitespace from app password

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: email,
        pass: password,
      },
    });
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      if (options.listUnsubscribeUrl) {
        headers['List-Unsubscribe'] = `<${options.listUnsubscribeUrl}>`;
        headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
      }
      await this.transporter.sendMail({
        from: options.from 
          ? `${options.from.name} <${options.from.email}>`
          : 'noreply@example.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });
    } catch (error: any) {
      throw new Error(`Gmail SMTP error: ${error.message}`);
    }
  }
}

interface EmailConfig {
  provider: string;
  apiKey: string;
  fromName: string;
  fromEmail: string;
}

// ----- Broadcast (campaign) rendering ----------------------------------
//
// Renders the body block for a "new release" or "promotion" broadcast,
// reusing `renderAuthorBrandedEmail` for the wrapper so the inbox piece
// matches the public author page (gold gradient hero, Playfair, avatar,
// cream wallpaper). The body always contains:
//
//   * Optional admin intro paragraph (`customMessage`).
//   * Featured book card: cover image (left/top) + title + description.
//   * For promotions: was/now price block with the validity dates.
//   * Primary CTA: Amazon link if the book has one (with a fallback to
//     the public author page so the email always has somewhere to go).
//   * For series books: a "Si te perdiste los anteriores" grid with the
//     previous books in the same series, ordered by `orderInSeries`.
//
// All inputs are escaped before interpolation; URLs are absolutized
// against `PUBLIC_BASE_URL` so relative `/objects/...` paths resolve in
// the inbox.

interface BroadcastEmailOpts {
  type: 'new_release' | 'promotion';
  author: Author | null | undefined;
  from: { name: string; email: string };
  book: Book;
  previousBooks?: Book[]; // previous entries in the same series
  customMessage?: string | null;
  promo?: {
    priceCents: number;
    currency: string;
    startsAt?: string | null;
    endsAt?: string | null;
  };
  preferencesUrl?: string;
  baseUrl?: string;
  authorPageUrl?: string;
  // Optional explicit hero copy (defaults derived from `type` + book).
  heroTitle?: string;
  heroSubtitle?: string;
  previewText?: string;
}

function formatPrice(cents: number, currency: string): string {
  // Always render with two decimals using a dot, currency suffix to keep
  // it readable in clients that strip locale-specific spaces.
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function formatDateEs(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderBookCard(book: Book, baseUrl: string | undefined): string {
  const cover = absolutize(book.coverImage, baseUrl);
  const coverHtml = cover
    ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(book.title)}" width="160"
            style="display: block; width: 160px; height: auto; border-radius: 8px; box-shadow: 0 4px 16px rgba(43,29,16,0.18); margin: 0 auto 16px auto;" />`
    : '';
  const description = book.description
    ? `<p style="margin: 8px 0 0 0; color: #6b5a47; line-height: 1.6;">${escapeHtml(book.description)}</p>`
    : '';
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background: #ffffff; border: 1px solid #e9dcc4; border-left: 4px solid hsl(40, 65%, 50%); border-radius: 8px; margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="padding: 24px;">
          ${coverHtml}
          <h3 style="margin: 0; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 22px; color: #2b1d10; text-align: center;">
            ${escapeHtml(book.title)}
          </h3>
          ${description}
        </td>
      </tr>
    </table>
  `;
}

function renderPromoBlock(book: Book, promo: NonNullable<BroadcastEmailOpts['promo']>): string {
  // book.price is stored as a decimal (e.g. 9.99) so we convert to the same
  // cents-based formatting we use for the promo price for visual parity.
  const original = (book.price ?? null) !== null
    ? formatPrice(Math.round((book.price as number) * 100), promo.currency)
    : null;
  const now = formatPrice(promo.priceCents, promo.currency);
  const validity = (promo.startsAt || promo.endsAt)
    ? `<p style="margin: 8px 0 0 0; color: #6b5a47; font-size: 14px;">Oferta válida ${promo.startsAt ? `del <strong>${escapeHtml(formatDateEs(promo.startsAt))}</strong> ` : ''}${promo.endsAt ? `hasta el <strong>${escapeHtml(formatDateEs(promo.endsAt))}</strong>` : ''}.</p>`
    : '';
  const wasBlock = original
    ? `<span style="color: #8a7560; text-decoration: line-through; margin-right: 12px; font-size: 18px;">${escapeHtml(original)}</span>`
    : '';
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background: #fff8e6; border: 1px solid #f0d68c; border-radius: 8px; margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="padding: 20px 16px;">
          <p style="margin: 0; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 14px; color: hsl(28, 50%, 40%); letter-spacing: 0.12em; text-transform: uppercase;">Oferta especial</p>
          <p style="margin: 6px 0 0 0;">
            ${wasBlock}<strong style="color: hsl(28, 50%, 30%); font-size: 28px; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;">${escapeHtml(now)}</strong>
          </p>
          ${validity}
        </td>
      </tr>
    </table>
  `;
}

function renderPreviousBooksGrid(previous: Book[], baseUrl: string | undefined): string {
  if (!previous || previous.length === 0) return '';
  const cells = previous.slice(0, 6).map((b) => {
    const cover = absolutize(b.coverImage, baseUrl);
    const link = b.amazonUrl || '#';
    const coverHtml = cover
      ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(b.title)}" width="120"
              style="display: block; width: 120px; height: auto; border-radius: 6px; box-shadow: 0 2px 10px rgba(43,29,16,0.18); margin: 0 auto 8px auto;" />`
      : '';
    return `
      <td valign="top" align="center" style="padding: 8px; width: 33%;">
        <a href="${escapeHtml(link)}" style="text-decoration: none; color: #2b1d10;">
          ${coverHtml}
          <p style="margin: 0; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 14px; color: #2b1d10; line-height: 1.3;">${escapeHtml(b.title)}</p>
        </a>
      </td>
    `;
  });

  // 3 columns per row.
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 3) {
    rows.push(`<tr>${cells.slice(i, i + 3).join('')}</tr>`);
  }

  return `
    <h3 style="margin: 32px 0 12px 0; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 20px; color: #2b1d10;">
      Si te perdiste los anteriores de la serie
    </h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin: 0 0 24px 0;">
      ${rows.join('')}
    </table>
  `;
}

function renderBroadcastEmail(opts: BroadcastEmailOpts): string {
  const { type, author, from, book, previousBooks, customMessage, promo, preferencesUrl, baseUrl, authorPageUrl } = opts;

  const heroTitle = opts.heroTitle
    || (type === 'promotion' ? `${book.title} en oferta` : `Nueva publicación: ${book.title}`);
  const heroSubtitle = opts.heroSubtitle
    || (type === 'promotion' ? 'Una oportunidad por tiempo limitado' : 'Acabo de publicarlo y quería que tú lo supieras primero');
  const previewText = opts.previewText
    || (type === 'promotion'
      ? `Oferta especial en "${book.title}" — solo por tiempo limitado.`
      : `Ya puedes leer "${book.title}".`);

  const intro = customMessage && customMessage.trim().length > 0
    ? `<p style="margin: 0 0 16px 0; color: #4a3a2a; white-space: pre-wrap;">${escapeHtml(customMessage)}</p>`
    : '';

  const promoBlock = type === 'promotion' && promo ? renderPromoBlock(book, promo) : '';

  const ctaHref = book.amazonUrl || authorPageUrl || '#';
  const ctaLabel = book.amazonUrl
    ? (type === 'promotion' ? 'Aprovechar la oferta en Amazon' : 'Conseguirlo en Amazon')
    : 'Saber más';
  const ctaBlock = ctaHref !== '#' ? renderCtaButton(ctaHref, ctaLabel) : '';

  const seriesGrid = renderPreviousBooksGrid(previousBooks ?? [], baseUrl);

  const bodyHtml = `
    ${intro}
    ${renderBookCard(book, baseUrl)}
    ${promoBlock}
    ${ctaBlock}
    ${seriesGrid}
  `;

  return renderAuthorBrandedEmail({
    author,
    from,
    previewText,
    heroTitle,
    heroSubtitle,
    bodyHtml,
    preferencesUrl,
    baseUrl,
  });
}

export class EmailService {
  private provider: EmailProvider | null = null;
  private fromName: string = '';
  private fromEmail: string = '';

  configure(config: EmailConfig) {
    const { provider, apiKey, fromName, fromEmail } = config;
    
    this.fromName = fromName;
    this.fromEmail = fromEmail;

    switch (provider.toLowerCase()) {
      case 'resend':
        this.provider = new ResendProvider(apiKey);
        break;
      case 'sendgrid':
        this.provider = new SendGridProvider(apiKey);
        break;
      case 'mailchimp':
        this.provider = new MailchimpProvider(apiKey);
        break;
      case 'brevo':
        this.provider = new BrevoProvider(apiKey);
        break;
      case 'postmark':
        this.provider = new PostmarkProvider(apiKey);
        break;
      case 'mailgun':
        this.provider = new MailgunProvider(apiKey);
        break;
      case 'gmail':
        this.provider = new GmailProvider(apiKey);
        break;
      default:
        throw new Error(`Unsupported email provider: ${provider}`);
    }
  }

  /**
   * Configure from a per-author override. Falls back to editorial settings if author lacks fields.
   * Returns true if configuration succeeded.
   */
  configureForAuthor(
    type: 'newsletter' | 'digital' | 'invoice',
    author: Author | null | undefined,
    editorialSettings: EditorialSettings | null | undefined
  ): boolean {
    // Per-author override (only for newsletter type). The author's sender
    // identity (fromName/fromEmail) and provider/apiKey are independent: when
    // the author only filled in a sender we still want emails to go out as
    // that sender, but transported by the editorial provider/API key.
    if (type === 'newsletter' && author) {
      const editorialProvider = editorialSettings?.emailNewsletterProvider || '';
      const editorialApiKey = editorialSettings?.emailNewsletterApiKey || '';
      const editorialFromName = editorialSettings?.emailNewsletterFromName || '';
      const editorialFromEmail = editorialSettings?.emailNewsletterFromEmail || '';

      const provider = author.emailProvider || editorialProvider;
      const apiKey = author.emailApiKey || editorialApiKey;
      const fromName = author.emailFromName || editorialFromName;
      const fromEmail = author.emailFromEmail || editorialFromEmail;

      if (provider && apiKey && fromName && fromEmail) {
        this.configure({ provider, apiKey, fromName, fromEmail });
        return true;
      }
    }
    // Fallback to editorial settings
    try {
      this.configureFromSettings(type, editorialSettings);
      return true;
    } catch {
      return false;
    }
  }

  configureFromSettings(type: 'newsletter' | 'digital' | 'invoice', settings: EditorialSettings | null | undefined) {
    if (!settings) {
      throw new Error(`Email configuration for ${type} is incomplete. Please configure it in editorial settings.`);
    }
    let provider = '';
    let apiKey = '';
    let fromName = '';
    let fromEmail = '';

    switch (type) {
      case 'newsletter':
        provider = settings.emailNewsletterProvider || '';
        apiKey = settings.emailNewsletterApiKey || '';
        fromName = settings.emailNewsletterFromName || '';
        fromEmail = settings.emailNewsletterFromEmail || '';
        break;
      case 'digital':
        provider = settings.emailDigitalProvider || '';
        apiKey = settings.emailDigitalApiKey || '';
        fromName = settings.emailDigitalFromName || '';
        fromEmail = settings.emailDigitalFromEmail || '';
        break;
      case 'invoice':
        provider = settings.emailInvoiceProvider || '';
        apiKey = settings.emailInvoiceApiKey || '';
        fromName = settings.emailInvoiceFromName || '';
        fromEmail = settings.emailInvoiceFromEmail || '';
        break;
    }

    if (!provider || !apiKey || !fromName || !fromEmail) {
      throw new Error(`Email configuration for ${type} is incomplete. Please configure it in editorial settings.`);
    }

    this.configure({ provider, apiKey, fromName, fromEmail });
  }

  getDefaultFrom(): { name: string; email: string } {
    return {
      name: this.fromName || 'Newsletter',
      email: this.fromEmail || 'noreply@example.com',
    };
  }

  async sendWelcomeEmail(
    recipientEmail: string,
    recipientName: string,
    bookTitle: string,
    bookDescription: string,
    bookDownloadUrl: string,
    from: { name: string; email: string },
    author?: Author | null,
  ): Promise<void> {
    if (!this.provider) {
      throw new Error('Email provider not configured');
    }

    const html = renderAuthorBrandedEmail({
      author,
      from,
      baseUrl: process.env.PUBLIC_BASE_URL || undefined,
      previewText: `Tu libro de regalo "${bookTitle}" te está esperando.`,
      heroTitle: `¡Bienvenido/a, ${escapeHtml(recipientName)}!`,
      heroSubtitle: 'Gracias por suscribirte a la newsletter',
      bodyHtml: `
        <h2 style="margin: 0 0 16px 0; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 24px; color: #2b1d10; font-weight: 700;">
          Tu libro de regalo está listo
        </h2>
        <p style="margin: 0 0 20px 0; color: #4a3a2a;">
          Como agradecimiento por unirte a la comunidad, te regalo:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background: #ffffff; border: 1px solid #e9dcc4; border-left: 4px solid hsl(40, 65%, 50%); border-radius: 6px; margin: 0 0 24px 0;">
          <tr>
            <td style="padding: 20px;">
              <h3 style="margin: 0 0 8px 0; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 20px; color: #2b1d10;">
                ${escapeHtml(bookTitle)}
              </h3>
              <p style="margin: 0; color: #6b5a47; line-height: 1.6;">${escapeHtml(bookDescription)}</p>
            </td>
          </tr>
        </table>
        ${renderCtaButton(bookDownloadUrl, 'Descargar mi libro gratis')}
        <p style="margin: 28px 0 8px 0; color: #4a3a2a;">¿Qué más recibirás?</p>
        <ul style="margin: 0 0 8px 18px; padding: 0; color: #6b5a47; line-height: 1.9;">
          <li>Acceso anticipado a los nuevos lanzamientos</li>
          <li>Ofertas y descuentos exclusivos</li>
          <li>Contenido especial y extras de las historias</li>
          <li>Noticias y novedades directamente del autor o autora</li>
        </ul>
      `,
    });

    await this.provider.send({
      to: recipientEmail,
      subject: `¡Bienvenido/a! Aquí tienes tu libro de regalo: ${bookTitle}`,
      html,
      from,
    });
  }

  /**
   * Renders a campaign email body for previewing in the admin UI without
   * sending it. Centralizes the renderer so the admin preview and the
   * actual send pipeline produce byte-identical HTML.
   */
  static renderBroadcast(opts: BroadcastEmailOpts): string {
    return renderBroadcastEmail(opts);
  }

  /**
   * Sends a single broadcast email. Caller is responsible for iterating
   * over the recipients (so per-subscriber `listUnsubscribeUrl` and
   * `preferencesUrl` can be threaded through).
   */
  async sendBroadcastEmail(opts: {
    to: string;
    subject: string;
    from: { name: string; email: string };
    rendererOpts: BroadcastEmailOpts;
    listUnsubscribeUrl?: string;
    tags?: Record<string, string>;
  }): Promise<void> {
    if (!this.provider) {
      throw new Error('Email provider not configured');
    }
    const html = renderBroadcastEmail(opts.rendererOpts);
    await this.provider.send({
      to: opts.to,
      subject: opts.subject,
      html,
      from: opts.from,
      listUnsubscribeUrl: opts.listUnsubscribeUrl,
      tags: opts.tags,
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.provider) {
      throw new Error('Email provider not configured');
    }

    await this.provider.send(options);
  }

  /**
   * Substitutes `{{variable}}` placeholders in a string with values from `vars`.
   * Missing keys are replaced with an empty string. Whitespace inside the
   * mustache braces is tolerated (`{{ name }}` and `{{name}}` both match).
   */
  static renderTemplate(template: string, vars: Record<string, string | number | undefined | null>): string {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
      const value = vars[key];
      return value === undefined || value === null ? '' : String(value);
    });
  }

  /**
   * Sends an email using a stored template. The caller is responsible for
   * resolving the template (via `storage.resolveEmailTemplate`) and passing
   * provider headers (e.g. `listUnsubscribeUrl`) and tags as needed.
   */
  async sendFromTemplate(opts: {
    to: string;
    from: { name: string; email: string };
    subject: string;
    htmlBody: string;
    vars?: Record<string, string | number | undefined | null>;
    listUnsubscribeUrl?: string;
    tags?: Record<string, string>;
  }): Promise<void> {
    if (!this.provider) {
      throw new Error('Email provider not configured');
    }
    const vars = opts.vars ?? {};
    await this.provider.send({
      to: opts.to,
      from: opts.from,
      subject: EmailService.renderTemplate(opts.subject, vars),
      html: EmailService.renderTemplate(opts.htmlBody, vars),
      listUnsubscribeUrl: opts.listUnsubscribeUrl,
      tags: opts.tags,
    });
  }
}

export const emailService = new EmailService();
