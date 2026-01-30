import { SupportedLanguage, UI_TRANSLATIONS } from '@/lib/types';

interface FooterProps {
  language?: SupportedLanguage;
}

export function Footer({ language = 'en' }: FooterProps) {
  const t = UI_TRANSLATIONS[language];

  return (
    <footer className="border-t bg-muted/50">
      <div className="container px-4 py-3">
        <p className="text-xs text-muted-foreground text-center">
          ⚠️ {t.disclaimer}
        </p>
      </div>
    </footer>
  );
}
