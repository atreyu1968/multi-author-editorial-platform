const asdLogoPath = "/images/asd-logo.png";

export default function SharedFooter() {
  return (
    <footer className="bg-muted py-8" data-testid="shared-footer">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-border pt-6 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <img src={asdLogoPath} alt="ASD" className="h-6 w-auto" data-testid="footer-asd-logo" />
            <p>&copy; 2026 Atreyu Servicios Digitales. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
