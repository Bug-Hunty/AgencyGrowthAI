'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, GraduationCap, Calendar, Loader2 } from 'lucide-react';
import { PublicShell } from '@/components/public/public-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { scoreLead, generateHealthSnapshot } from '@/lib/scoring';
import { repo } from '@/lib/repo';
import { AGENCY_CONFIG } from '@/lib/constants';
import type { CheckupResponses, FinancialHealthSnapshot, Lead } from '@/lib/types';

export default function FinancialCheckupPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ lead: Lead; snapshot: FinancialHealthSnapshot } | null>(null);

  const [form, setForm] = useState<CheckupResponses>({
    age_range: '',
    employment_status: '',
    household_income_range: '',
    dependents: '',
    retirement_savings_range: '',
    emergency_savings_range: '',
    life_insurance_status: '',
    primary_goal: '',
    preferred_contact_method: '',
    consent_to_contact: false,
  });

  const [contact, setContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });

  const updateForm = (key: keyof CheckupResponses, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canProceedStep1 = contact.first_name && contact.last_name && contact.email && contact.phone;
  const canProceedStep2 =
    form.age_range && form.employment_status && form.household_income_range && form.dependents;
  const canProceedStep3 =
    form.retirement_savings_range && form.emergency_savings_range && form.life_insurance_status;
  const canSubmit = form.primary_goal && form.preferred_contact_method && form.consent_to_contact;

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error('Please complete all fields and provide consent');
      return;
    }
    setSubmitting(true);
    try {
      const { score, tier } = scoreLead(form);
      const snapshot = generateHealthSnapshot(form);

      const lead = await repo.createLead({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        source: 'direct',
        score,
        score_tier: tier,
        interest: form.primary_goal.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        consent: true,
        consent_method: 'checkup_form',
        preferred_contact: form.preferred_contact_method,
        checkup_responses: form,
        ai_summary: `${contact.first_name} ${contact.last_name} completed the financial checkup. Score: ${score}/100. Primary goal: ${form.primary_goal.replace(/_/g, ' ')}.`,
      });

      setResult({ lead, snapshot });
      setStep(4);
      toast.success('Your Financial Health Snapshot is ready!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  const handleScheduleAppointment = async () => {
    if (!result) return;
    setSubmitting(true);
    try {
      await repo.createAppointment({
        lead_id: result.lead.id,
        date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        time: '10:00',
        meeting_type: 'Educational Consultation',
        notes: 'Lead requested appointment after completing financial checkup.',
      });
      toast.success('Appointment requested! An agent will contact you shortly.');
      setStep(5);
    } catch {
      toast.error('Could not schedule appointment. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            <GraduationCap className="mr-1 h-3 w-3" /> Educational Tool
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Get Your Financial Health Snapshot</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Answer a few questions to receive an educational overview of your financial wellness.
          </p>
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
            <p className="text-sm text-amber-800 dark:text-amber-400">
              {AGENCY_CONFIG.financial_education_disclaimer}
            </p>
          </div>
        </div>

        {/* Progress */}
        {step < 4 && (
          <div className="mt-8 mb-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Step {step} of 3</span>
              <span>{Math.round((step / 3) * 100)}% complete</span>
            </div>
            <Progress value={(step / 3) * 100} className="mt-2" />
          </div>
        )}

        {/* Step 1: Contact Info */}
        {step === 1 && (
          <Card className="animate-fade-in border-border/60">
            <CardHeader>
              <CardTitle>Your Contact Information</CardTitle>
              <CardDescription>We'll use this to send your results and schedule a conversation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name *</Label>
                  <Input id="first_name" value={contact.first_name} onChange={(e) => setContact({ ...contact, first_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name *</Label>
                  <Input id="last_name" value={contact.last_name} onChange={(e) => setContact({ ...contact, last_name: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" type="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Demographics */}
        {step === 2 && (
          <Card className="animate-fade-in border-border/60">
            <CardHeader>
              <CardTitle>About You</CardTitle>
              <CardDescription>This information helps us understand your general financial picture.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Age range *</Label>
                <Select value={form.age_range} onValueChange={(v) => updateForm('age_range', v)}>
                  <SelectTrigger><SelectValue placeholder="Select age range" /></SelectTrigger>
                  <SelectContent>
                    {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Employment status *</Label>
                <Select value={form.employment_status} onValueChange={(v) => updateForm('employment_status', v)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {['full_time', 'part_time', 'self_employed', 'retired', 'unemployed', 'student'].map((v) => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Household income range *</Label>
                <Select value={form.household_income_range} onValueChange={(v) => updateForm('household_income_range', v)}>
                  <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>
                    {['under_50k', '50k-75k', '75k-100k', '100k-150k', '150k+'].map((v) => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dependents *</Label>
                <Select value={form.dependents} onValueChange={(v) => updateForm('dependents', v)}>
                  <SelectTrigger><SelectValue placeholder="Select dependents" /></SelectTrigger>
                  <SelectContent>
                    {['0', '1', '2', '3_or_more'].map((v) => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Financial Picture */}
        {step === 3 && (
          <Card className="animate-fade-in border-border/60">
            <CardHeader>
              <CardTitle>Your Financial Picture</CardTitle>
              <CardDescription>There are no right or wrong answers — this is for educational purposes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current retirement savings range *</Label>
                <Select value={form.retirement_savings_range} onValueChange={(v) => updateForm('retirement_savings_range', v)}>
                  <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>
                    {['none', 'under_25k', '25k-100k', '100k-500k', '500k+'].map((v) => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Emergency savings range *</Label>
                <Select value={form.emergency_savings_range} onValueChange={(v) => updateForm('emergency_savings_range', v)}>
                  <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>
                    {['none', 'under_3_months', '3-6_months', '6+_months'].map((v) => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Life insurance status *</Label>
                <Select value={form.life_insurance_status} onValueChange={(v) => updateForm('life_insurance_status', v)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {['none', 'unsure', 'employer_only', 'individual_policy'].map((v) => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Primary financial goal *</Label>
                <Select value={form.primary_goal} onValueChange={(v) => updateForm('primary_goal', v)}>
                  <SelectTrigger><SelectValue placeholder="Select goal" /></SelectTrigger>
                  <SelectContent>
                    {['retirement_planning', 'family_protection', 'wealth_building', 'debt_management', 'college_funding', 'estate_planning'].map((v) => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preferred contact method *</Label>
                <Select value={form.preferred_contact_method} onValueChange={(v) => updateForm('preferred_contact_method', v)}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    {['phone', 'email', 'text', 'video'].map((v) => <SelectItem key={v} value={v}>{v.replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border border-border/60 p-4">
                <Checkbox
                  id="consent"
                  checked={form.consent_to_contact}
                  onCheckedChange={(checked) => updateForm('consent_to_contact', checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="consent" className="cursor-pointer">
                    I consent to be contacted about my results *
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    I understand this is educational information and not individualized financial advice.
                  </p>
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Get My Snapshot <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Results */}
        {step === 4 && result && (
          <div className="animate-fade-in space-y-6">
            <Card className="border-border/60">
              <CardHeader className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4 text-2xl">Your Financial Health Snapshot</CardTitle>
                <CardDescription>Educational overview — not individualized financial advice</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Overall Score */}
                <div className="mb-6 text-center">
                  <div className="inline-flex flex-col items-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary/20">
                      <span className="text-3xl font-bold text-primary">{result.snapshot.overall.score}</span>
                    </div>
                    <Badge variant="secondary" className="mt-3">{result.snapshot.overall.label}</Badge>
                  </div>
                </div>

                {/* Category Scores */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { title: 'Retirement Preparedness', data: result.snapshot.retirement_preparedness },
                    { title: 'Emergency Savings', data: result.snapshot.emergency_savings },
                    { title: 'Family Protection', data: result.snapshot.family_protection },
                    { title: 'Financial Education', data: result.snapshot.financial_education },
                    { title: 'Long-term Planning', data: result.snapshot.long_term_planning },
                  ].map((cat) => (
                    <div key={cat.title} className="rounded-lg border border-border/60 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{cat.title}</span>
                        <Badge variant="outline">{cat.data.label}</Badge>
                      </div>
                      <Progress value={cat.data.score} className="mt-2" />
                      <p className="mt-2 text-xs text-muted-foreground">{cat.data.description}</p>
                    </div>
                  ))}
                </div>

                {/* Disclaimer */}
                <div className="mt-6 rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">{result.snapshot.summary}</p>
                </div>

                {/* CTA */}
                <div className="mt-6 rounded-lg border-2 border-primary/20 bg-primary/5 p-6 text-center">
                  <h3 className="text-lg font-semibold">Would you like to discuss your results with a financial professional?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Schedule a no-obligation educational consultation to review your snapshot.
                  </p>
                  <Button onClick={handleScheduleAppointment} size="lg" className="mt-4" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Schedule a Conversation <Calendar className="ml-2 h-4 w-4" /></>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Appointment Confirmed */}
        {step === 5 && result && (
          <Card className="animate-fade-in border-border/60 text-center">
            <CardHeader>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <CardTitle className="mt-4 text-2xl">Appointment Requested!</CardTitle>
              <CardDescription>Thank you, {contact.first_name}. An agent from {AGENCY_CONFIG.name} will contact you shortly.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your educational consultation has been requested. You'll receive a confirmation at {contact.email}.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild variant="outline">
                  <Link href="/">Back to Home</Link>
                </Button>
                <Button asChild>
                  <Link href="/career">Explore Career Opportunities</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trust Signal */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          <span>Your information is protected and will not be shared with third parties.</span>
        </div>
      </div>
    </PublicShell>
  );
}
