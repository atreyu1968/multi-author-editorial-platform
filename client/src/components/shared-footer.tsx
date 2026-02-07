import { useQuery } from "@tanstack/react-query";
import type { EditorialSettings } from "@shared/schema";

export default function SharedFooter() {
  const { data: editorialSettings } = useQuery<EditorialSettings>({
    queryKey: ["/api/editorial-settings"]
  });

  const footerLogoUrl = editorialSettings?.footerLogoUrl;
  const footerCopyright = editorialSettings?.footerCopyright || "\u00a9 2026 Atreyu Servicios Digitales. Todos los derechos reservados.";

  return (
    <footer className="bg-muted py-8" data-testid="shared-footer">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-border pt-6 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            {footerLogoUrl && (
              <img src={footerLogoUrl} alt="Logo" className="h-6 w-auto" data-testid="footer-asd-logo" />
            )}
            <p>{footerCopyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
