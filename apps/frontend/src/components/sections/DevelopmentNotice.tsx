import { Layers } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const DevelopmentNotice = () => {
  const { t } = useTranslation();
  const noticeT = (t as any).developmentNotice || {};

  return (
    <section
      className="py-12 spacing-medieval bg-muted/50"
      role="region"
      aria-labelledby="development-notice-title"
    >
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="medieval-banner p-6 bg-background border border-border rounded-lg flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-royal">
                <Layers className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1">
              <h3
                id="development-notice-title"
                className="font-cinzel text-xl font-bold mb-2 text-foreground"
              >
                {noticeT.title || 'Platform in Development'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {noticeT.message || 'The features described on this page are currently in development and may change before the final product launch. Some features may not be available at the initial release, and we reserve the right to modify or remove features based on user feedback and technical considerations.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DevelopmentNotice;
