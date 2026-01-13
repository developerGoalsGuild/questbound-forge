import { useState, useCallback } from 'react';
import { Mail, MessageSquare, HelpCircle, Send, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/useTranslation';
import { Link } from 'react-router-dom';
import ARIALiveRegion, { FormAnnouncements } from '@/components/ui/ARIALiveRegion';
import { submitContact, ContactResponse } from '@/lib/api';

const Contact = () => {
  const { t } = useTranslation();
  const contactT = (t as any).contact || {};

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '', // Honeypot field for bot detection (hidden from users)
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'polite' | 'assertive'>('polite');

  const validateEmail = useCallback((emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  }, []);

  const handleFieldChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (error) {
      setError(null);
    }
    if (hasValidationErrors) {
      setHasValidationErrors(false);
    }
    if (success) {
      setSuccess(false);
    }
  }, [error, hasValidationErrors, success]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    setSuccess(false);
    setHasValidationErrors(false);
    setAnnouncement('');

    // Validate form
    if (!formData.name.trim()) {
      const errorMsg = contactT.form?.fields?.name?.required || 'Name is required';
      setError(errorMsg);
      setHasValidationErrors(true);
      setAnnouncement(FormAnnouncements.fieldRequired('Name'));
      setAnnouncementPriority('assertive');
      return;
    }

    if (!formData.email.trim()) {
      const errorMsg = contactT.form?.fields?.email?.required || 'Email is required';
      setError(errorMsg);
      setHasValidationErrors(true);
      setAnnouncement(FormAnnouncements.fieldRequired('Email'));
      setAnnouncementPriority('assertive');
      return;
    }

    if (!validateEmail(formData.email)) {
      const errorMsg = contactT.form?.fields?.email?.invalid || 'Please enter a valid email address';
      setError(errorMsg);
      setHasValidationErrors(true);
      setAnnouncement(FormAnnouncements.validationError('Email'));
      setAnnouncementPriority('assertive');
      return;
    }

    if (!formData.subject.trim()) {
      const errorMsg = contactT.form?.fields?.subject?.required || 'Subject is required';
      setError(errorMsg);
      setHasValidationErrors(true);
      setAnnouncement(FormAnnouncements.fieldRequired('Subject'));
      setAnnouncementPriority('assertive');
      return;
    }

    if (!formData.message.trim()) {
      const errorMsg = contactT.form?.fields?.message?.required || 'Message is required';
      setError(errorMsg);
      setHasValidationErrors(true);
      setAnnouncement(FormAnnouncements.fieldRequired('Message'));
      setAnnouncementPriority('assertive');
      return;
    }

    setSubmitting(true);
    setAnnouncement(contactT.form?.submit?.sending || 'Sending message...');
    setAnnouncementPriority('polite');

    try {
      const response: ContactResponse = await submitContact({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        honeypot: formData.honeypot.trim(), // Include honeypot field
      });
      
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '', honeypot: '' });
      setError(null);
      setAnnouncement(response.message || contactT.form?.success || 'Message sent successfully! We\'ll get back to you soon.');
      setAnnouncementPriority('polite');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
        setAnnouncement('');
      }, 5000);
    } catch (err: any) {
      const errorMessage = err?.message || contactT.form?.error || 'Something went wrong. Please try again later.';
      setError(errorMessage);
      setHasValidationErrors(true);
      setAnnouncement(FormAnnouncements.formError(errorMessage));
      setAnnouncementPriority('assertive');
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateEmail, contactT]);

  const contactMethods = [
    {
      icon: Mail,
      title: contactT.methods?.emailUs?.title || 'Email Us',
      description: contactT.methods?.emailUs?.description || 'Send us an email anytime',
      link: 'mailto:hello@goalsguild.com',
      linkText: contactT.methods?.emailUs?.linkText || 'hello@goalsguild.com',
    },
    {
      icon: MessageSquare,
      title: contactT.methods?.helpCenter?.title || 'Help Center',
      description: contactT.methods?.helpCenter?.description || 'Find answers to common questions',
      link: '/help',
      linkText: contactT.methods?.helpCenter?.linkText || 'Visit Help Center',
    },
    {
      icon: HelpCircle,
      title: contactT.methods?.support?.title || 'Support',
      description: contactT.methods?.support?.description || 'Get help from our support team',
      link: '/help',
      linkText: contactT.methods?.support?.linkText || 'Get Support',
    },
  ];

  return (
    <section id="contact" data-testid="contact-section" className="py-24 spacing-medieval bg-background" role="region" style={{ scrollMarginTop: '80px' }}>
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-cinzel text-4xl md:text-5xl font-bold mb-6 text-gradient-royal">
            {contactT.title || 'Get in Touch'}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {contactT.subtitle || 'Have questions? We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="lg:col-span-1 space-y-6">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <Card
                  key={index}
                  className="guild-card animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-royal flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-cinzel text-lg font-bold mb-2 text-foreground">
                          {method.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {method.description}
                        </p>
                        {method.link.startsWith('mailto:') ? (
                          <a
                            href={method.link}
                            className="text-sm text-primary hover:underline"
                          >
                            {method.linkText}
                          </a>
                        ) : (
                          <Link
                            to={method.link}
                            className="text-sm text-primary hover:underline"
                          >
                            {method.linkText}
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="guild-card">
              <CardHeader>
                <CardTitle>{contactT.form?.title || 'Send us a Message'}</CardTitle>
                <CardDescription>
                  {contactT.form?.description || 'Fill out the form below and we\'ll get back to you within 24 hours.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <ARIALiveRegion 
                    message={announcement} 
                    priority={announcementPriority} 
                    className="sr-only"
                  />
                  
                  {/* Honeypot field - hidden from users, bots will fill it */}
                  <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                    <label htmlFor="contact-honeypot">Leave this field empty</label>
                    <input
                      id="contact-honeypot"
                      type="text"
                      name="honeypot"
                      value={formData.honeypot}
                      onChange={handleFieldChange('honeypot')}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">{contactT.form?.fields?.name?.label || 'Name'} *</Label>
                      <Input
                        id="contact-name"
                        type="text"
                        value={formData.name}
                        onChange={handleFieldChange('name')}
                        placeholder={contactT.form?.fields?.name?.placeholder || 'Your name'}
                        aria-invalid={hasValidationErrors && !formData.name.trim()}
                        aria-describedby={hasValidationErrors && !formData.name.trim() ? 'error-name' : undefined}
                        className={hasValidationErrors && !formData.name.trim() ? 'border-red-500' : ''}
                      />
                      {hasValidationErrors && !formData.name.trim() && (
                        <p id="error-name" className="text-xs text-red-600" role="alert">
                          {contactT.form?.fields?.name?.required || 'Name is required'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-email">{contactT.form?.fields?.email?.label || 'Email'} *</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={formData.email}
                        onChange={handleFieldChange('email')}
                        placeholder={contactT.form?.fields?.email?.placeholder || 'your.email@example.com'}
                        aria-invalid={hasValidationErrors && (!formData.email.trim() || !validateEmail(formData.email))}
                        aria-describedby={hasValidationErrors && (!formData.email.trim() || !validateEmail(formData.email)) ? 'error-email' : undefined}
                        className={hasValidationErrors && (!formData.email.trim() || !validateEmail(formData.email)) ? 'border-red-500' : ''}
                      />
                      {hasValidationErrors && (!formData.email.trim() || !validateEmail(formData.email)) && (
                        <p id="error-email" className="text-xs text-red-600" role="alert">
                          {!formData.email.trim() ? (contactT.form?.fields?.email?.required || 'Email is required') : (contactT.form?.fields?.email?.invalid || 'Please enter a valid email address')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-subject">{contactT.form?.fields?.subject?.label || 'Subject'} *</Label>
                    <Input
                      id="contact-subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleFieldChange('subject')}
                      placeholder={contactT.form?.fields?.subject?.placeholder || 'What\'s this about?'}
                      aria-invalid={hasValidationErrors && !formData.subject.trim()}
                      aria-describedby={hasValidationErrors && !formData.subject.trim() ? 'error-subject' : undefined}
                      className={hasValidationErrors && !formData.subject.trim() ? 'border-red-500' : ''}
                    />
                    {hasValidationErrors && !formData.subject.trim() && (
                      <p id="error-subject" className="text-xs text-red-600" role="alert">
                        {contactT.form?.fields?.subject?.required || 'Subject is required'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-message">{contactT.form?.fields?.message?.label || 'Message'} *</Label>
                    <Textarea
                      id="contact-message"
                      value={formData.message}
                      onChange={handleFieldChange('message')}
                      placeholder={contactT.form?.fields?.message?.placeholder || 'Tell us more about your question or inquiry...'}
                      rows={6}
                      aria-invalid={hasValidationErrors && !formData.message.trim()}
                      aria-describedby={hasValidationErrors && !formData.message.trim() ? 'error-message' : undefined}
                      className={hasValidationErrors && !formData.message.trim() ? 'border-red-500' : ''}
                    />
                    {hasValidationErrors && !formData.message.trim() && (
                      <p id="error-message" className="text-xs text-red-600" role="alert">
                        {contactT.form?.fields?.message?.required || 'Message is required'}
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600" role="alert">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <p className="text-sm text-green-600">{contactT.form?.success || 'Message sent successfully! We\'ll get back to you soon.'}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting || hasValidationErrors}
                    className="w-full btn-heraldic text-primary-foreground"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {contactT.form?.submit?.sending || 'Sending...'}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {contactT.form?.submit?.send || 'Send Message'}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
