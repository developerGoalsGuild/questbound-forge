/**
 * Job Application Page
 * 
 * Form for submitting job applications.
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, CheckCircle2 } from 'lucide-react';
import { jobs } from '@/data/careers/jobs';
import { useToast } from '@/hooks/use-toast';

const JobApplication: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    resume: null as File | null,
    coverLetter: '',
    portfolio: ''
  });

  const careersTranslations = (t as any)?.careers || {};
  const commonTranslations = (t as any)?.common || {};

  const job = jobs.find(j => j.id === jobId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSubmitting(false);
    setSubmitted(true);
    
    toast({
      title: careersTranslations?.applicationSubmitted || 'Application Submitted',
      description: careersTranslations?.applicationSubmittedDescription || 'Thank you for your interest! We\'ll review your application and get back to you soon.',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, resume: file }));
    }
  };

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold mb-4">
                {careersTranslations?.jobNotFound || 'Job Not Found'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {careersTranslations?.jobNotFoundDescription || 'The job posting you\'re looking for doesn\'t exist.'}
              </p>
              <Button onClick={() => navigate('/careers')}>
                {careersTranslations?.backToCareers || 'Back to Careers'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">
                {careersTranslations?.applicationSuccess || 'Application Submitted!'}
              </h2>
              <p className="text-muted-foreground">
                {careersTranslations?.applicationSuccessDescription || 
                 'Thank you for your interest in joining GoalsGuild. We\'ve received your application and will review it shortly.'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/careers')}>
                  {careersTranslations?.viewOtherJobs || 'View Other Jobs'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  {commonTranslations?.backToHome || 'Back to Home'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/careers')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {commonTranslations?.back || 'Back'}
          </Button>
          <div className="space-y-1 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {careersTranslations?.applyFor || 'Apply for'}: {job.title}
            </h1>
            <p className="text-muted-foreground">
              {job.department} • {job.location} • {job.type}
            </p>
          </div>
        </div>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle>{careersTranslations?.jobDescription || 'Job Description'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                {careersTranslations?.responsibilities || 'Responsibilities'}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {job.responsibilities.map((resp, index) => (
                  <li key={index}>{resp}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {careersTranslations?.requirements || 'Requirements'}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {job.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>{careersTranslations?.applicationForm || 'Application Form'}</CardTitle>
            <CardDescription>
              {careersTranslations?.applicationFormDescription || 'Please fill out the form below to apply for this position'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {careersTranslations?.fullName || 'Full Name'} *
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  {careersTranslations?.email || 'Email'} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  {careersTranslations?.phone || 'Phone'}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume">
                  {careersTranslations?.resume || 'Resume'} *
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    required
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('resume')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {formData.resume ? formData.resume.name : careersTranslations?.uploadResume || 'Upload Resume'}
                  </Button>
                  {formData.resume && (
                    <span className="text-sm text-muted-foreground">{formData.resume.name}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverLetter">
                  {careersTranslations?.coverLetter || 'Cover Letter'}
                </Label>
                <Textarea
                  id="coverLetter"
                  rows={6}
                  value={formData.coverLetter}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                  placeholder={careersTranslations?.coverLetterPlaceholder || 'Tell us why you\'re interested in this position...'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio">
                  {careersTranslations?.portfolio || 'Portfolio / GitHub'}
                </Label>
                <Input
                  id="portfolio"
                  type="url"
                  value={formData.portfolio}
                  onChange={(e) => setFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting 
                    ? (careersTranslations?.submitting || 'Submitting...')
                    : (careersTranslations?.submitApplication || 'Submit Application')
                  }
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/careers')}
                >
                  {commonTranslations?.cancel || 'Cancel'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobApplication;

