'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Rocket, User, Globe, Twitter, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [location, setLocation] = useState('');

  // Check username availability
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    if (!session) return;

    // Pre-fill username from email
    if (!username && session.user?.email) {
      setUsername(session.user.email.split('@')[0].replace(/[^a-z0-9_]/gi, ''));
    }
  }, [session, username]);

  useEffect(() => {
    if (username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch('/api/users/check-username?username=' + username);
        const data = await res.json();
        setIsUsernameAvailable(data.available);
      } catch {
        setIsUsernameAvailable(null);
      }
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/users/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          bio,
          website,
          twitter,
          location,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to complete onboarding');
      }

      // Update session with new username
      await update({ username });

      // Redirect to home
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Rocket className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-transparent bg-clip-text">
              Exitasy
            </span>
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-orange-500 font-medium">
                Step {step} of 2
              </span>
            </div>
            <CardTitle className="text-2xl">
              {step === 1 ? 'Choose your username' : 'Complete your profile'}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Pick a unique username for your Exitasy profile'
                : 'Add more details to help others find and connect with you'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 1 && (
              <>
                {/* Preview */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={session.user?.image || undefined} />
                    <AvatarFallback className="text-lg">
                      {username.slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">
                      {session.user?.name || 'Your Name'}
                    </p>
                    <p className="text-muted-foreground">
                      @{username || 'username'}
                    </p>
                  </div>
                </div>

                {/* Username Input */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground">
                      @
                    </span>
                    <Input
                      id="username"
                      placeholder="username"
                      className="pl-7"
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                        )
                      }
                      maxLength={20}
                    />
                  </div>
                  {username.length >= 3 && (
                    <p
                      className={`text-sm ${
                        checkingUsername
                          ? 'text-muted-foreground'
                          : isUsernameAvailable
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {checkingUsername
                        ? 'Checking availability...'
                        : isUsernameAvailable
                        ? 'Username is available!'
                        : 'Username is already taken'}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    3-20 characters, letters, numbers, and underscores only
                  </p>
                </div>

                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 gap-2"
                  disabled={
                    !username ||
                    username.length < 3 ||
                    !isUsernameAvailable ||
                    checkingUsername
                  }
                  onClick={() => setStep(2)}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself and your projects..."
                      className="pl-9 min-h-[100px]"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={160}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {bio.length}/160
                  </p>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://yoursite.com"
                      className="pl-9"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>

                {/* Twitter */}
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter (optional)</Label>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="twitter"
                      placeholder="@username"
                      className="pl-9"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location (optional)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="San Francisco, CA"
                      className="pl-9"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-orange-500 hover:bg-orange-600 gap-2"
                    disabled={isLoading}
                    onClick={handleSubmit}
                  >
                    {isLoading ? 'Saving...' : 'Complete Setup'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {/* Skip option */}
            {step === 2 && (
              <p className="text-center text-sm text-muted-foreground">
                <button
                  className="text-orange-500 hover:text-orange-600"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  Skip for now
                </button>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
