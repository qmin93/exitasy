'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  CreditCard,
  FileText,
  Rocket,
  Loader2,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { STAGE_CONFIG, StartupStage } from '@/types';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, title: 'Basic Info', icon: FileText },
  { id: 2, title: 'Revenue', icon: CreditCard },
];

const CATEGORIES = [
  'AI',
  'SaaS',
  'NoCode',
  'DevTools',
  'Analytics',
  'Productivity',
  'Finance',
  'E-commerce',
  'Marketing',
  'Design',
];

const INCLUDES_OPTIONS = [
  'Source Code',
  'Domain',
  'Customer Base',
  'Social Accounts',
  'Support/Transition',
  'Documentation',
];

interface FormData {
  // Step 1
  name: string;
  tagline: string;
  description: string;
  website: string;
  logo: string | null;
  categories: string[];

  // Step 2
  verificationMethod: 'stripe' | 'paddle' | 'manual' | 'skip' | null;
  proofFile: string | null;

  // Step 3
  stage: StartupStage | null;
  askingPrice: string;
  includes: string[];
  sellReason: string;
  targetUsers: string;
  monetizationModel: string;
  founderNote: {
    originStory: string;
    currentOperations: string;
    growthLevers: string;
    whySelling: string;
    idealBuyer: string;
    transitionPlan: string;
  };

  // Step 4
  screenshots: string[];
  videoUrl: string;
  sellabilityReasons: string[];
  launchDate: 'now' | 'scheduled';
}

// Founder Note section templates
const FOUNDER_NOTE_SECTIONS = [
  {
    key: 'originStory' as const,
    title: 'Origin Story',
    emoji: '🌱',
    placeholder: 'How did this idea come to life? What problem did you see?',
    hint: 'E.g., "I was frustrated with existing form builders that were either too complex or too limited..."',
  },
  {
    key: 'currentOperations' as const,
    title: 'Current Operations',
    emoji: '⚙️',
    placeholder: 'How do you run this day-to-day? What tools do you use?',
    hint: 'E.g., "I spend ~5hrs/week on customer support and ~3hrs on maintenance..."',
  },
  {
    key: 'growthLevers' as const,
    title: 'Growth Levers',
    emoji: '📈',
    placeholder: 'What growth opportunities have you identified but not pursued?',
    hint: 'E.g., "SEO is untapped - currently 0 content marketing. Enterprise tier could 2x ARPU..."',
  },
  {
    key: 'whySelling' as const,
    title: 'Why Selling',
    emoji: '🤔',
    placeholder: 'Why are you considering selling this business?',
    hint: 'E.g., "I want to focus on my new SaaS project and can\'t give this the attention it deserves..."',
  },
  {
    key: 'idealBuyer' as const,
    title: 'Ideal Buyer',
    emoji: '🎯',
    placeholder: 'What kind of person or team would be perfect for this product?',
    hint: 'E.g., "Someone who loves building for developers, has experience with B2B SaaS..."',
  },
  {
    key: 'transitionPlan' as const,
    title: 'Transition Plan',
    emoji: '🤝',
    placeholder: 'How would you help the new owner get up to speed?',
    hint: 'E.g., "30-day email support, video walkthrough of codebase, intro to key customers..."',
  },
];

function SubmitStartupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnecting, setIsConnecting] = useState<'stripe' | 'paddle' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaddleModal, setShowPaddleModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [paddleApiKey, setPaddleApiKey] = useState('');
  const [stripeApiKey, setStripeApiKey] = useState('');
  const [draftStartupId, setDraftStartupId] = useState<string | null>(null);

  // Verification state
  const [verificationStatus, setVerificationStatus] = useState<{
    verified: boolean;
    provider: 'stripe' | 'paddle' | 'manual' | null;
    mrr: number | null;
    growthMoM: number | null;
  }>({
    verified: false,
    provider: null,
    mrr: null,
    growthMoM: null,
  });

  // Check for OAuth callback results
  useEffect(() => {
    const success = searchParams.get('success');
    const mrr = searchParams.get('mrr');
    const growth = searchParams.get('growth');
    const errorParam = searchParams.get('error');

    if (success === 'verified' && mrr) {
      setVerificationStatus({
        verified: true,
        provider: 'stripe',
        mrr: parseInt(mrr),
        growthMoM: growth ? parseFloat(growth) : null,
      });
      setCurrentStep(2); // Stay on step 2 to show success
      // Clear URL params
      router.replace('/submit', { scroll: false });
    }

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        stripe_not_configured: 'Stripe is not configured. Please try manual verification.',
        stripe_auth_failed: 'Stripe authorization failed. Please try again.',
        missing_params: 'Missing parameters. Please try again.',
        invalid_state: 'Invalid state. Please try again.',
        no_stripe_user: 'Could not retrieve Stripe account. Please try again.',
        verification_failed: 'Verification failed. Please try again.',
      };
      setError(errorMessages[errorParam] || 'An error occurred. Please try again.');
      router.replace('/submit', { scroll: false });
    }
  }, [searchParams, router]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    tagline: '',
    description: '',
    website: '',
    logo: null,
    categories: [],
    verificationMethod: null,
    proofFile: null,
    stage: null,
    askingPrice: '',
    includes: [],
    sellReason: '',
    targetUsers: '',
    monetizationModel: '',
    founderNote: {
      originStory: '',
      currentOperations: '',
      growthLevers: '',
      whySelling: '',
      idealBuyer: '',
      transitionPlan: '',
    },
    screenshots: [],
    videoUrl: '',
    sellabilityReasons: ['', '', ''],
    launchDate: 'now',
  });

  const progress = (currentStep / STEPS.length) * 100;

  // Redirect to login if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to submit your startup.
          </p>
          <Link href="/api/auth/signin">
            <Button className="bg-orange-500 hover:bg-orange-600">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const toggleCategory = (category: string) => {
    if (formData.categories.includes(category)) {
      updateFormData({
        categories: formData.categories.filter((c) => c !== category),
      });
    } else if (formData.categories.length < 3) {
      updateFormData({
        categories: [...formData.categories, category],
      });
    }
  };

  const toggleIncludes = (item: string) => {
    if (formData.includes.includes(item)) {
      updateFormData({
        includes: formData.includes.filter((i) => i !== item),
      });
    } else {
      updateFormData({
        includes: [...formData.includes, item],
      });
    }
  };

  // Handle Stripe Connect - opens modal for API key
  const handleStripeConnect = async () => {
    setError(null);

    // First create draft startup if needed
    if (!draftStartupId) {
      try {
        const draftRes = await fetch('/api/startups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name || 'Draft Startup',
            tagline: formData.tagline || 'Draft',
            description: formData.description || 'Draft startup for verification',
            website: formData.website || 'https://example.com',
            categories: formData.categories.length > 0 ? formData.categories : ['SaaS'],
            stage: 'MAKING_MONEY',
            isDraft: true,
          }),
        });

        if (!draftRes.ok) {
          const data = await draftRes.json();
          throw new Error(data.message || 'Failed to create draft startup');
        }

        const draftStartup = await draftRes.json();
        setDraftStartupId(draftStartup.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to prepare for verification');
        return;
      }
    }

    setShowStripeModal(true);
  };

  // Submit Stripe API Key for verification
  const handleStripeSubmit = async () => {
    if (!stripeApiKey.trim()) {
      setError('Please enter your Stripe API key');
      return;
    }

    setIsConnecting('stripe');
    setError(null);

    try {
      // Create draft startup if not already created
      let startupId = draftStartupId;

      if (!startupId) {
        const draftRes = await fetch('/api/startups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name || 'Draft Startup',
            tagline: formData.tagline || 'Draft',
            description: formData.description || 'Draft startup for verification',
            website: formData.website || 'https://example.com',
            categories: formData.categories.length > 0 ? formData.categories : ['SaaS'],
            stage: 'MAKING_MONEY',
            isDraft: true,
          }),
        });

        if (!draftRes.ok) {
          const data = await draftRes.json();
          throw new Error(data.message || 'Failed to create draft startup');
        }

        const draftStartup = await draftRes.json();
        startupId = draftStartup.id;
        setDraftStartupId(startupId);
      }

      // Call Stripe verification API
      const res = await fetch('/api/verify/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId,
          apiKey: stripeApiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to verify Stripe account');
      }

      // Success!
      setVerificationStatus({
        verified: true,
        provider: 'stripe',
        mrr: data.mrr,
        growthMoM: data.growthMoM,
      });
      setShowStripeModal(false);
      setStripeApiKey('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Stripe');
    } finally {
      setIsConnecting(null);
    }
  };

  // Handle Paddle Connect - opens modal for API key
  const handlePaddleConnect = async () => {
    setError(null);

    // First create draft startup if needed
    if (!draftStartupId) {
      try {
        const draftRes = await fetch('/api/startups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name || 'Draft Startup',
            tagline: formData.tagline || 'Draft',
            description: formData.description || 'Draft startup for verification',
            website: formData.website || 'https://example.com',
            categories: formData.categories.length > 0 ? formData.categories : ['SaaS'],
            stage: 'MAKING_MONEY',
            isDraft: true,
          }),
        });

        if (!draftRes.ok) {
          const data = await draftRes.json();
          throw new Error(data.message || 'Failed to create draft startup');
        }

        const draftStartup = await draftRes.json();
        setDraftStartupId(draftStartup.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to prepare for verification');
        return;
      }
    }

    setShowPaddleModal(true);
  };

  // Submit Paddle API Key for verification
  const handlePaddleSubmit = async () => {
    if (!paddleApiKey.trim()) {
      setError('Please enter your Paddle API key');
      return;
    }

    setIsConnecting('paddle');
    setError(null);

    try {
      // Create draft startup if not already created
      let startupId = draftStartupId;

      if (!startupId) {
        const draftRes = await fetch('/api/startups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name || 'Draft Startup',
            tagline: formData.tagline || 'Draft',
            description: formData.description || 'Draft startup for verification',
            website: formData.website || 'https://example.com',
            categories: formData.categories.length > 0 ? formData.categories : ['SaaS'],
            stage: 'MAKING_MONEY',
            isDraft: true,
          }),
        });

        if (!draftRes.ok) {
          const data = await draftRes.json();
          throw new Error(data.message || 'Failed to create draft startup');
        }

        const draftStartup = await draftRes.json();
        startupId = draftStartup.id;
        setDraftStartupId(startupId);
      }

      // Call Paddle verification API
      const res = await fetch('/api/verify/paddle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId,
          apiKey: paddleApiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to verify Paddle account');
      }

      // Success!
      setVerificationStatus({
        verified: true,
        provider: 'paddle',
        mrr: data.mrr,
        growthMoM: data.growthMoM,
      });
      setShowPaddleModal(false);
      setPaddleApiKey('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Paddle');
    } finally {
      setIsConnecting(null);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.name.length > 0 &&
          formData.website.length > 0 &&
          formData.categories.length > 0
        );
      case 2:
        return verificationStatus.verified || formData.verificationMethod === 'manual' || formData.verificationMethod === 'skip';
      
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        tagline: formData.name,
        description: formData.name + ' - submitted via quick form',
        website: formData.website,
        categories: formData.categories,
        stage: 'MAKING_MONEY',
      };

      const res = await fetch('/api/startups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to submit startup');
      }

      const startup = await res.json();

      // Redirect to the new startup page
      router.push(`/startup/${startup.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Add Your Startup</h1>
          <p className="text-muted-foreground">Quick setup - add more details later in your dashboard</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-2',
                  currentStep >= step.id
                    ? 'text-orange-500'
                    : 'text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    currentStep > step.id
                      ? 'bg-orange-500 text-white'
                      : currentStep === step.id
                      ? 'bg-orange-100 text-orange-600 border-2 border-orange-500'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'hidden sm:block w-16 h-0.5 ml-2',
                      currentStep > step.id ? 'bg-orange-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Form Steps */}
        <Card>
          <CardHeader>
            <CardTitle>
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Startup Name *</label>
                  <Input
                    placeholder="e.g., FormFlow"
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Tagline * (60 characters max)
                  </label>
                  <Input
                    placeholder="e.g., No-code form builder for indie hackers"
                    value={formData.tagline}
                    onChange={(e) =>
                      updateFormData({ tagline: e.target.value.slice(0, 60) })
                    }
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.tagline.length}/60
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Description * (500 characters max)
                  </label>
                  <Textarea
                    placeholder="Describe what your product does..."
                    value={formData.description}
                    onChange={(e) =>
                      updateFormData({
                        description: e.target.value.slice(0, 500),
                      })
                    }
                    maxLength={500}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.description.length}/500
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Website URL *</label>
                  <Input
                    placeholder="https://yourproduct.com"
                    value={formData.website}
                    onChange={(e) => updateFormData({ website: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Logo (400x400 recommended)
                  </label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag and drop or click to upload
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Categories * (select up to 3)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <Badge
                        key={cat}
                        variant={
                          formData.categories.includes(cat)
                            ? 'default'
                            : 'outline'
                        }
                        className={cn(
                          'cursor-pointer',
                          formData.categories.includes(cat) &&
                            'bg-orange-500 hover:bg-orange-600'
                        )}
                        onClick={() => toggleCategory(cat)}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Revenue Verification */}
            {currentStep === 2 && (
              <>
                {/* Success Banner */}
                {verificationStatus.verified && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800">
                          Revenue Verified via {verificationStatus.provider === 'stripe' ? 'Stripe' : 'Paddle'}!
                        </p>
                        <p className="text-sm text-green-700">
                          MRR: ${verificationStatus.mrr?.toLocaleString()}
                          {verificationStatus.growthMoM !== null && (
                            <span className="ml-2">
                              Growth: {verificationStatus.growthMoM > 0 ? '+' : ''}{verificationStatus.growthMoM}% MoM
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!verificationStatus.verified && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Exitasy only lists startups with
                      verified revenue. Unverified submissions stay in a private
                      queue until verified.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Stripe */}
                  <div
                    className={cn(
                      'border-2 rounded-lg p-4 transition-colors',
                      verificationStatus.verified && verificationStatus.provider === 'stripe'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center',
                        verificationStatus.provider === 'stripe' ? 'bg-green-100' : 'bg-purple-100'
                      )}>
                        {verificationStatus.provider === 'stripe' ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <CreditCard className="h-6 w-6 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          Connect Stripe{' '}
                          <Badge variant="secondary" className="ml-2">
                            Recommended
                          </Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          We&apos;ll automatically pull your MRR and growth
                          metrics. Read-only access.
                        </p>
                      </div>
                      {verificationStatus.provider === 'stripe' ? (
                        <Badge className="bg-green-600">Connected</Badge>
                      ) : (
                        <Button
                          onClick={handleStripeConnect}
                          disabled={isConnecting !== null || verificationStatus.verified}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isConnecting === 'stripe' ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Connect
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Paddle */}
                  <div
                    className={cn(
                      'border-2 rounded-lg p-4 transition-colors',
                      verificationStatus.verified && verificationStatus.provider === 'paddle'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center',
                        verificationStatus.provider === 'paddle' ? 'bg-green-100' : 'bg-blue-100'
                      )}>
                        {verificationStatus.provider === 'paddle' ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <CreditCard className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Connect Paddle</h3>
                        <p className="text-sm text-muted-foreground">
                          Connect your Paddle account for automatic verification.
                        </p>
                      </div>
                      {verificationStatus.provider === 'paddle' ? (
                        <Badge className="bg-green-600">Connected</Badge>
                      ) : (
                        <Button
                          onClick={handlePaddleConnect}
                          disabled={isConnecting !== null || verificationStatus.verified}
                          variant="outline"
                        >
                          {isConnecting === 'paddle' ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Connect
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  {/* Manual */}
                  <div
                    className={cn(
                      'border-2 rounded-lg p-4 cursor-pointer transition-colors',
                      formData.verificationMethod === 'manual' && !verificationStatus.verified
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300',
                      verificationStatus.verified && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => {
                      if (!verificationStatus.verified) {
                        updateFormData({ verificationMethod: 'manual' });
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Manual Verification</h3>
                        <p className="text-sm text-muted-foreground">
                          Upload screenshots or documents. Reviewed within 48 hours.
                        </p>
                      </div>
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2',
                          formData.verificationMethod === 'manual' && !verificationStatus.verified
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-300'
                        )}
                      >
                        {formData.verificationMethod === 'manual' && !verificationStatus.verified && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>

                  {formData.verificationMethod === 'manual' && !verificationStatus.verified && (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Upload revenue screenshots (dashboard, bank statements,
                        etc.)
                      </p>
                    </div>
                  )}
                  {/* Skip */}
                  <div
                    className={cn(
                      'border-2 rounded-lg p-4 cursor-pointer transition-colors',
                      formData.verificationMethod === 'skip' && !verificationStatus.verified
                        ? 'border-gray-500 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300',
                      verificationStatus.verified && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => {
                      if (!verificationStatus.verified) {
                        updateFormData({ verificationMethod: 'skip' });
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ArrowRight className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-500">Skip for now</h3>
                        <p className="text-sm text-muted-foreground">
                          Add revenue verification later in your dashboard.
                        </p>
                      </div>
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2',
                          formData.verificationMethod === 'skip' && !verificationStatus.verified
                            ? 'border-gray-500 bg-gray-500'
                            : 'border-gray-300'
                        )}
                      >
                        {formData.verificationMethod === 'skip' && !verificationStatus.verified && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Paddle API Key Modal */}
                {showPaddleModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          Connect Paddle
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            Enter your Paddle API key to verify your revenue. We only need read access.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Paddle API Key</label>
                          <Input
                            type="password"
                            placeholder="pdl_..."
                            value={paddleApiKey}
                            onChange={(e) => setPaddleApiKey(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Find it in Paddle Dashboard → Developer Tools → Authentication
                          </p>
                        </div>

                        {error && (
                          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-800">{error}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setShowPaddleModal(false);
                              setPaddleApiKey('');
                              setError(null);
                            }}
                            disabled={isConnecting === 'paddle'}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={handlePaddleSubmit}
                            disabled={isConnecting === 'paddle' || !paddleApiKey.trim()}
                          >
                            {isConnecting === 'paddle' ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              'Verify Revenue'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Stripe API Key Modal */}
                {showStripeModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-purple-600" />
                          Connect Stripe
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <p className="text-sm text-purple-800">
                            Enter your Stripe Secret Key or Restricted Key to verify your revenue. We only need read access to balance transactions.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Stripe API Key</label>
                          <Input
                            type="password"
                            placeholder="sk_live_... or rk_live_..."
                            value={stripeApiKey}
                            onChange={(e) => setStripeApiKey(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Find it in Stripe Dashboard → Developers → API keys
                          </p>
                        </div>

                        {error && (
                          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-800">{error}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setShowStripeModal(false);
                              setStripeApiKey('');
                              setError(null);
                            }}
                            disabled={isConnecting === 'stripe'}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                            onClick={handleStripeSubmit}
                            disabled={isConnecting === 'stripe' || !stripeApiKey.trim()}
                          >
                            {isConnecting === 'stripe' ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              'Verify Revenue'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}

            {/* Step 3: Stage & Sale */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2 mb-6">
                  <label className="text-sm font-medium">Current Stage *</label>
                  <div className="space-y-3">
                    {(
                      Object.entries(STAGE_CONFIG) as [
                        StartupStage,
                        { label: string; color: string; emoji: string }
                      ][]
                    ).map(([stage, config]) => (
                      <div
                        key={stage}
                        className={cn(
                          'border-2 rounded-lg p-4 cursor-pointer transition-colors',
                          formData.stage === stage
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                        onClick={() => updateFormData({ stage })}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-5 h-5 rounded-full border-2',
                              formData.stage === stage
                                ? 'border-orange-500 bg-orange-500'
                                : 'border-gray-300'
                            )}
                          >
                            {formData.stage === stage && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <span className="text-xl">{config.emoji}</span>
                          <div>
                            <div className="font-medium">{config.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {stage === 'making_money' &&
                                'Generating revenue, focused on growth'}
                              {stage === 'exit_ready' &&
                                'Open to acquisition offers if the price is right'}
                              {stage === 'acquisition_interest' &&
                                'Actively received acquisition interest'}
                              {stage === 'for_sale' &&
                                'Actively looking for a buyer'}
                              {stage === 'sold' && 'Successfully exited'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {(formData.stage === 'for_sale' ||
                  formData.stage === 'exit_ready') && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Asking Price</label>
                      <Input
                        placeholder="$50,000"
                        value={formData.askingPrice}
                        onChange={(e) =>
                          updateFormData({ askingPrice: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Includes</label>
                      <div className="flex flex-wrap gap-2">
                        {INCLUDES_OPTIONS.map((item) => (
                          <Badge
                            key={item}
                            variant={
                              formData.includes.includes(item)
                                ? 'default'
                                : 'outline'
                            }
                            className={cn(
                              'cursor-pointer',
                              formData.includes.includes(item) &&
                                'bg-orange-500 hover:bg-orange-600'
                            )}
                            onClick={() => toggleIncludes(item)}
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Users</label>
                      <Input
                        placeholder="e.g., Indie hackers, Small SaaS teams, Developers"
                        value={formData.targetUsers}
                        onChange={(e) =>
                          updateFormData({ targetUsers: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Monetization Model</label>
                      <Input
                        placeholder="e.g., Monthly SaaS subscription, One-time license"
                        value={formData.monetizationModel}
                        onChange={(e) =>
                          updateFormData({ monetizationModel: e.target.value })
                        }
                      />
                    </div>

                    {/* Founder Note Template */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-500" />
                        <label className="text-sm font-medium">Founder Note</label>
                        <Badge variant="secondary" className="text-xs">
                          Buyers love this
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Share your story with potential buyers. This helps them understand the business better.
                      </p>

                      {FOUNDER_NOTE_SECTIONS.map((section) => (
                        <div key={section.key} className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <span>{section.emoji}</span>
                            {section.title}
                          </label>
                          <Textarea
                            placeholder={section.placeholder}
                            value={formData.founderNote[section.key]}
                            onChange={(e) =>
                              updateFormData({
                                founderNote: {
                                  ...formData.founderNote,
                                  [section.key]: e.target.value,
                                },
                              })
                            }
                            rows={2}
                            className="resize-none"
                          />
                          <p className="text-xs text-muted-foreground italic">
                            {section.hint}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Why are you selling? (optional)
                      </label>
                      <Textarea
                        placeholder="Moving on to a new project..."
                        value={formData.sellReason}
                        onChange={(e) =>
                          updateFormData({ sellReason: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Step 4: Media & Launch */}
            {currentStep === 4 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Screenshots (up to 5)
                  </label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag and drop up to 5 screenshots
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Demo Video (optional)
                  </label>
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.videoUrl}
                    onChange={(e) =>
                      updateFormData({ videoUrl: e.target.value })
                    }
                  />
                </div>

                {(formData.stage === 'for_sale' ||
                  formData.stage === 'exit_ready') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      3 Reasons Why This Is Sellable
                    </label>
                    {formData.sellabilityReasons.map((reason, index) => (
                      <Input
                        key={index}
                        placeholder={`Reason ${index + 1}...`}
                        value={reason}
                        onChange={(e) => {
                          const newReasons = [...formData.sellabilityReasons];
                          newReasons[index] = e.target.value;
                          updateFormData({ sellabilityReasons: newReasons });
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Launch Date</label>
                  <div className="space-y-2">
                    <div
                      className={cn(
                        'border rounded-lg p-3 cursor-pointer',
                        formData.launchDate === 'now'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200'
                      )}
                      onClick={() => updateFormData({ launchDate: 'now' })}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border-2',
                            formData.launchDate === 'now'
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300'
                          )}
                        />
                        <span>Launch immediately</span>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'border rounded-lg p-3 cursor-pointer',
                        formData.launchDate === 'scheduled'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200'
                      )}
                      onClick={() => updateFormData({ launchDate: 'scheduled' })}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border-2',
                            formData.launchDate === 'scheduled'
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300'
                          )}
                        />
                        <span>Schedule for later</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="border-t pt-6 mt-6">
                  <label className="text-sm font-medium mb-4 block">
                    Preview:
                  </label>
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <Button variant="outline" size="sm" className="h-12 w-10">
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                        </div>
                        <Avatar className="h-12 w-12 rounded-lg">
                          <AvatarFallback className="rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 text-white">
                            {formData.name.slice(0, 2).toUpperCase() || 'ST'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {formData.name || 'Your Startup'}
                            </span>
                            {formData.stage && (
                              <Badge
                                className={cn(
                                  'text-white text-xs',
                                  STAGE_CONFIG[formData.stage].color
                                )}
                              >
                                {STAGE_CONFIG[formData.stage].emoji}{' '}
                                {STAGE_CONFIG[formData.stage].label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formData.tagline || 'Your tagline here'}
                          </p>
                          <div className="flex gap-2 mt-2">
                            {formData.categories.map((cat) => (
                              <span
                                key={cat}
                                className="text-xs text-muted-foreground"
                              >
                                #{cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={currentStep === 1 || isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  onClick={() =>
                    setCurrentStep((prev) => Math.min(STEPS.length, prev + 1))
                  }
                  disabled={!isStepValid()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      
        <p className="text-center text-sm text-muted-foreground mt-6">
          You can add logo, description, screenshots and more in your dashboard after submitting.
        </p>
      </main>
    </div>
  );
}

function ChevronUp({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

// Wrap in Suspense for useSearchParams
export default function SubmitStartupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SubmitStartupContent />
    </Suspense>
  );
}
