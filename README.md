# Multi-Author Editorial Management Platform

A comprehensive full-stack web application designed to manage up to 30 authors within a single editorial platform. Each author gets customizable landing pages with personalized themes, blogs, book catalogs, and integrated e-commerce capabilities.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-20.x-green.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-14%2B-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🌟 Features

### Multi-Author Management
- **Centralized Admin Panel** - Manage all authors, books, series, and content from one place
- **Custom Author Landing Pages** - Each author gets `/autor/[slug]` with personalized branding
- **Individual Themes** - Customizable colors, logos, and favicons per author
- **Multi-Author Series** - Support for book series with multiple contributing authors

### E-Commerce
- **Full Shopping Cart** - Session-based cart system
- **PayPal Integration** - Secure payment processing
- **Digital Products** - Automated delivery of EPUB, PDF, MOBI, AZW3 files
- **Physical Products** - Inventory management and shipping
- **Gift Books** - Automated gift book delivery system
- **QR Codes** - Automatic QR code generation for promotions

### Content Management
- **Books** - Comprehensive book management with metadata, covers, and promotional materials
- **Series** - Organize books into multi-author series/collections
- **Blog System** - Individual blog for each author
- **Testimonials** - Customer reviews and endorsements
- **Newsletter** - Built-in newsletter subscription system

### Internationalization (i18n)
- **7 Languages** - Full support for:
  - Spanish (es-ES)
  - English (en-US)
  - Catalan (ca-ES)
  - French (fr-FR)
  - Italian (it-IT)
  - German (de-DE)
  - Portuguese (pt-PT)
- **10,205 UI Texts** - Complete interface translation
- **Localized URLs** - Language-specific routes (e.g., `/libro`, `/book`, `/livre`)
- **Content Translation** - Support for translating books, authors, series, and blog posts
- **Multi-Currency** - Support for 23+ currencies with automatic conversion

### Search & Discovery
- **Universal Search** - Search across authors, books, and series
- **Localized Search Results** - Search pages in all 7 languages
- **Keyboard Navigation** - Accessible search interface

### Analytics
- **Proprietary Analytics** - Built-in analytics dashboard
- **Pageview Tracking** - Monitor visitor behavior
- **Conversion Metrics** - Track newsletter signups, downloads, and purchases
- **Top Content** - See most popular books and authors

### Security
- **Secure Authentication** - Session-based auth with httpOnly cookies
- **Password Hashing** - Scrypt with salt
- **Rate Limiting** - Prevent brute force attacks
- **CSP Headers** - Content Security Policy via Helmet.js
- **Secure Downloads** - Token-based digital file delivery with expiration

## 🚀 Quick Start

### Prerequisites

- Ubuntu 20.04 LTS or higher
- Root or sudo access
- Internet connection

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/editorial-platform.git
   cd editorial-platform
   ```

2. **Run the installer:**
   ```bash
   sudo bash install.sh
   ```

3. **Follow the prompts** to configure:
   - Installation language
   - Database credentials
   - Administrator account
   - PayPal settings (optional)
   - Domain and SSL (optional)

4. **Access your platform:**
   - Open your browser to `http://your-server-ip:5000`
   - Login with your admin credentials

For detailed installation instructions, see [INSTALLATION.md](INSTALLATION.md).

## 📖 Documentation

- [Installation Guide](INSTALLATION.md) - Complete installation instructions
- [API Documentation](#) - API endpoints reference (coming soon)
- [User Guide](#) - End-user documentation (coming soon)

## 🛠️ Technology Stack

### Backend
- **Node.js 20** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **PostgreSQL** - Relational database
- **Drizzle ORM** - Type-safe database queries

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **TanStack Query** - Server state management
- **Wouter** - Lightweight routing

### External Services
- **PayPal** - Payment processing
- **Neon Database** - Serverless PostgreSQL (optional)
- **Object Storage** - File storage (optional)

## 📋 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/editorial_platform

# Session
SESSION_SECRET=your-random-secret

# PayPal
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
PAYPAL_MODE=sandbox

# Locale
DEFAULT_LOCALE=es-ES
```

See [.env.example](.env.example) for all available options.

## 🔧 Management

### Service Commands

```bash
# Start the service
sudo systemctl start editorial-platform

# Stop the service
sudo systemctl stop editorial-platform

# Restart the service
sudo systemctl restart editorial-platform

# View logs
sudo journalctl -u editorial-platform -f

# Check status
sudo systemctl status editorial-platform
```

### Database Management

```bash
# Backup database
pg_dump -U editorial_user editorial_platform > backup.sql

# Restore database
psql -U editorial_user editorial_platform < backup.sql

# Access database console
psql -U editorial_user -d editorial_platform
```

### Updates

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install --production

# Run migrations
npm run db:push

# Restart service
sudo systemctl restart editorial-platform
```

## 🏗️ Project Structure

```
editorial-platform/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Storage interface
│   ├── auth.ts            # Authentication logic
│   └── paypal.ts          # PayPal integration
├── shared/                # Shared code
│   └── schema.ts          # Database schema (Drizzle)
├── scripts/               # Installation scripts
│   ├── setup-database.sh
│   ├── setup-environment.sh
│   ├── init-database.sh
│   └── setup-admin.sh
├── install.sh             # Main installer
├── .env.example           # Environment variables template
└── INSTALLATION.md        # Installation guide
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Application won't start
- Check logs: `sudo journalctl -u editorial-platform -n 50`
- Verify `.env` configuration
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`

### Database connection errors
- Verify `DATABASE_URL` in `.env`
- Test connection: `psql -U editorial_user -d editorial_platform`
- Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*-main.log`

### PayPal payment failures
- Verify credentials in `.env`
- Check `PAYPAL_MODE` matches your credentials (sandbox/production)
- Review PayPal dashboard for errors

For more troubleshooting tips, see [INSTALLATION.md](INSTALLATION.md#troubleshooting).

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/editorial-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/editorial-platform/discussions)
- **Email**: support@yourcompany.com

## 🎯 Roadmap

- [ ] Email notifications for orders
- [ ] Advanced analytics dashboard
- [ ] Merchandise product management UI
- [ ] Author dashboard for self-service
- [ ] Social media integrations
- [ ] Advanced SEO tools
- [ ] Mobile app

## ⭐ Acknowledgments

- Built with [Replit](https://replit.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

Made with ❤️ for publishers and literary agencies

**Star** this repository if you find it useful!
