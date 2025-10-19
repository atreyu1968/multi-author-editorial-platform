interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: {
    name: string;
    email: string;
  };
}

interface EmailProvider {
  send(options: EmailOptions): Promise<void>;
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

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
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
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: options.to }],
        }],
        from: {
          email: options.from?.email || 'noreply@example.com',
          name: options.from?.name || 'Newsletter',
        },
        subject: options.subject,
        content: [{
          type: 'text/html',
          value: options.html,
        }],
      }),
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
    const response = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: this.apiKey,
        message: {
          html: options.html,
          subject: options.subject,
          from_email: options.from?.email || 'noreply@example.com',
          from_name: options.from?.name || 'Newsletter',
          to: [{ email: options.to, type: 'to' }],
        },
      }),
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
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          email: options.from?.email || 'noreply@example.com',
          name: options.from?.name || 'Newsletter',
        },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
      }),
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
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        From: options.from 
          ? `${options.from.name} <${options.from.email}>`
          : 'noreply@example.com',
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.html,
      }),
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

interface EmailConfig {
  provider: string;
  apiKey: string;
  fromName: string;
  fromEmail: string;
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
      default:
        throw new Error(`Unsupported email provider: ${provider}`);
    }
  }

  configureFromSettings(type: 'newsletter' | 'digital' | 'invoice', settings: any) {
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
    from: { name: string; email: string }
  ): Promise<void> {
    if (!this.provider) {
      throw new Error('Email provider not configured');
    }

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Bienvenido a nuestra comunidad!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">¡Bienvenido/a ${recipientName}!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Gracias por suscribirte a nuestro newsletter</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #667eea; margin-top: 0;">Tu Libro de Regalo Está Listo</h2>
          
          <p>Como agradecimiento por unirte a nuestra comunidad, queremos regalarte:</p>
          
          <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #333;">${bookTitle}</h3>
            <p style="color: #666; margin: 10px 0;">${bookDescription}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${bookDownloadUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
              📚 Descargar Mi Libro Gratis
            </a>
          </div>
          
          <div style="background: #fffbea; border: 1px solid #ffd966; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #7a5f00;">
              <strong>💡 Consejo:</strong> Guarda este email para tener siempre acceso al libro, o descárgalo ahora mismo.
            </p>
          </div>
          
          <h3 style="color: #667eea; margin-top: 30px;">¿Qué más recibirás?</h3>
          <ul style="color: #666; line-height: 2;">
            <li>Acceso anticipado a nuevos lanzamientos</li>
            <li>Ofertas y descuentos exclusivos</li>
            <li>Contenido especial y extras de las historias</li>
            <li>Noticias y actualizaciones directamente de la autora</li>
          </ul>
          
          <p style="margin-top: 30px; color: #666;">
            ¡Nos vemos pronto en tu bandeja de entrada!
          </p>
          
          <p style="color: #666;">
            Con cariño,<br>
            <strong style="color: #667eea;">${from.name}</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
          <p>Este email fue enviado porque te suscribiste a nuestro newsletter.</p>
          <p>© ${new Date().getFullYear()} ${from.name}. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;

    await this.provider.send({
      to: recipientEmail,
      subject: `¡Bienvenido/a! Aquí está tu libro de regalo: ${bookTitle}`,
      html,
      from,
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.provider) {
      throw new Error('Email provider not configured');
    }

    await this.provider.send(options);
  }
}

export const emailService = new EmailService();
