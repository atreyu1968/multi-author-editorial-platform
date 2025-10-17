import { useLocale } from '@/contexts/locale-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, Check } from 'lucide-react';

export function LanguageSelector() {
  const { locale, setLocale, availableLocales } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2"
          data-testid="button-language-selector"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">
            {availableLocales.find(l => l.code === locale)?.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLocales.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className="gap-2 cursor-pointer"
            data-testid={`menuitem-locale-${lang.code}`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
            {locale === lang.code && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
