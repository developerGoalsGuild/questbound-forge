/**
 * GuildJoinRequestForm Component
 *
 * A form component for requesting to join a guild that requires approval.
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Send, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { guildAPI } from '@/lib/api/guild';
import { getGuildTranslations } from '@/i18n/guild';
import { useTranslation } from '@/hooks/useTranslation';

interface GuildJoinRequestFormProps {
  guildId: string;
  guildName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const GuildJoinRequestForm: React.FC<GuildJoinRequestFormProps> = ({
  guildId,
  guildName,
  onSuccess,
  onCancel,
  className,
}) => {
  const { t } = useTranslation();
  const translations = getGuildTranslations(t('lang'));
  
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      await guildAPI.requestToJoinGuild(guildId, message.trim() || undefined);
      
      toast.success(translations.joinRequests.requestToJoin.success || 'Join request sent successfully!');
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.message || translations.joinRequests.requestToJoin.error || 'Failed to send join request';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [guildId, message, isSubmitting, onSuccess]);

  const handleCancel = useCallback(() => {
    if (!isSubmitting) {
      onCancel?.();
    }
  }, [isSubmitting, onCancel]);

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          {translations.joinRequests.requestToJoin.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>
              <strong>{guildName}</strong> {translations.joinRequests.requestToJoin.description || 'requires approval to join. Send a request with a message explaining why you\'d like to join.'}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">
              {translations.joinRequests.requestToJoin.message}
            </Label>
            <Textarea
              id="message"
              placeholder={translations.joinRequests.requestToJoin.placeholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <div className="text-xs text-gray-500 text-right">
              {message.length}/500 characters
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              {translations.joinRequests.requestToJoin.cancel || 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {translations.joinRequests.requestToJoin.submitting}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {translations.joinRequests.requestToJoin.submit}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
