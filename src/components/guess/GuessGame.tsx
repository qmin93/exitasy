'use client';

import { useState, useEffect } from 'react';
import { Gamepad2, CheckCircle, Trophy, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

type GuessRange = 'RANGE_0_1K' | 'RANGE_1K_5K' | 'RANGE_5K_10K' | 'RANGE_10K_20K' | 'RANGE_20K_50K' | 'RANGE_50K_PLUS';

interface GuessResult {
  range: GuessRange;
  count: number;
  percentage: number;
}

interface GuessGameProps {
  startupName: string;
  startupSlug: string;
  actualMRR: number;
  totalGuesses: number;
}

const GUESS_RANGES: { value: GuessRange; label: string }[] = [
  { value: 'RANGE_0_1K', label: '$0 - $1K' },
  { value: 'RANGE_1K_5K', label: '$1K - $5K' },
  { value: 'RANGE_5K_10K', label: '$5K - $10K' },
  { value: 'RANGE_10K_20K', label: '$10K - $20K' },
  { value: 'RANGE_20K_50K', label: '$20K - $50K' },
  { value: 'RANGE_50K_PLUS', label: '$50K+' },
];

const RANGE_LABELS: Record<GuessRange, string> = {
  RANGE_0_1K: '$0 - $1K',
  RANGE_1K_5K: '$1K - $5K',
  RANGE_5K_10K: '$5K - $10K',
  RANGE_10K_20K: '$10K - $20K',
  RANGE_20K_50K: '$20K - $50K',
  RANGE_50K_PLUS: '$50K+',
};

function getCorrectRange(mrr: number): GuessRange {
  if (mrr < 1000) return 'RANGE_0_1K';
  if (mrr < 5000) return 'RANGE_1K_5K';
  if (mrr < 10000) return 'RANGE_5K_10K';
  if (mrr < 20000) return 'RANGE_10K_20K';
  if (mrr < 50000) return 'RANGE_20K_50K';
  return 'RANGE_50K_PLUS';
}

export function GuessGame({
  startupName,
  startupSlug,
  actualMRR,
  totalGuesses: initialTotalGuesses,
}: GuessGameProps) {
  const { data: session } = useSession();
  const [selectedGuess, setSelectedGuess] = useState<GuessRange | null>(null);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalGuesses, setTotalGuesses] = useState(initialTotalGuesses);
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [guessResult, setGuessResult] = useState<{ isCorrect: boolean; actualMRR: number } | null>(null);

  const correctRange = getCorrectRange(actualMRR);

  // Fetch existing guess stats
  useEffect(() => {
    async function fetchGuessStats() {
      try {
        const res = await fetch(`/api/startups/${startupSlug}/guess`);
        if (res.ok) {
          const data = await res.json();
          setTotalGuesses(data.totalGuesses);
          setDistribution(data.distribution || {});
          if (data.userGuess) {
            setSelectedGuess(data.userGuess.range);
            setHasGuessed(true);
            setIsRevealed(data.userGuess.isCorrect !== null);
            if (data.userGuess.isCorrect !== null) {
              setGuessResult({
                isCorrect: data.userGuess.isCorrect,
                actualMRR: actualMRR,
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch guess stats:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (startupSlug) {
      fetchGuessStats();
    }
  }, [startupSlug, actualMRR]);

  // Calculate results from distribution
  const results: GuessResult[] = GUESS_RANGES.map((range) => {
    const count = distribution[range.value] || 0;
    const total = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;
    return {
      range: range.value,
      count,
      percentage: Math.round((count / total) * 100),
    };
  });

  const handleGuess = async () => {
    if (!selectedGuess) return;
    if (!session) {
      alert('Please sign in to guess');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/startups/${startupSlug}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ range: selectedGuess }),
      });

      if (res.ok) {
        const data = await res.json();
        setHasGuessed(true);
        setIsRevealed(true);
        setGuessResult({
          isCorrect: data.isCorrect,
          actualMRR: data.actualMRR,
        });
        setTotalGuesses((prev) => prev + 1);
      } else {
        const error = await res.json();
        if (error.message === 'You already guessed for this startup') {
          setHasGuessed(true);
        } else {
          alert(error.message || 'Failed to submit guess');
        }
      }
    } catch (err) {
      console.error('Failed to submit guess:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCorrect = guessResult?.isCorrect || selectedGuess === correctRange;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gamepad2 className="h-5 w-5 text-purple-500" />
          Guess the Revenue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasGuessed ? (
          <>
            <p className="text-muted-foreground">
              What&apos;s {startupName}&apos;s actual 30-day revenue?
            </p>

            {/* Guess Options */}
            <div className="grid grid-cols-2 gap-2">
              {GUESS_RANGES.map((range) => (
                <Button
                  key={range.value}
                  variant={selectedGuess === range.value ? 'default' : 'outline'}
                  className={cn(
                    'h-12',
                    selectedGuess === range.value &&
                      'bg-purple-500 hover:bg-purple-600'
                  )}
                  onClick={() => setSelectedGuess(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>

            {/* Submit Button */}
            <Button
              className="w-full bg-purple-500 hover:bg-purple-600"
              disabled={!selectedGuess || isSubmitting}
              onClick={handleGuess}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit My Guess'
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              <Users className="inline h-4 w-4 mr-1" />
              {totalGuesses} people have guessed
            </p>
          </>
        ) : !isRevealed ? (
          <>
            {/* Waiting for reveal */}
            <div className="text-center py-4">
              <Badge className="bg-purple-100 text-purple-700 mb-4">
                Your guess: {selectedGuess ? RANGE_LABELS[selectedGuess] : 'Unknown'}
              </Badge>
              <p className="text-muted-foreground mb-4">
                Results will be revealed when the founder approves or in 48 hours.
              </p>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              <Users className="inline h-4 w-4 mr-1" />
              {totalGuesses} people have guessed
            </p>
          </>
        ) : (
          <>
            {/* Results revealed */}
            <div className="space-y-3">
              {/* Result Header */}
              <div
                className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-lg',
                  isCorrect ? 'bg-green-100' : 'bg-orange-100'
                )}
              >
                {isCorrect ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-700">
                      Correct! You guessed {selectedGuess ? RANGE_LABELS[selectedGuess] : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <Trophy className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-700">
                      Close! The answer was {RANGE_LABELS[correctRange]}
                    </span>
                  </>
                )}
              </div>

              {/* Results Distribution */}
              <div className="space-y-2">
                {results.map((result) => (
                  <div key={result.range} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={cn(
                          result.range === correctRange && 'font-semibold text-green-600'
                        )}
                      >
                        {RANGE_LABELS[result.range]}
                        {result.range === correctRange && ' ✓'}
                      </span>
                      <span className="text-muted-foreground">
                        {result.percentage}%
                      </span>
                    </div>
                    <Progress
                      value={result.percentage}
                      className={cn(
                        'h-2',
                        result.range === correctRange && '[&>div]:bg-green-500'
                      )}
                    />
                  </div>
                ))}
              </div>

              {/* User Stats */}
              <div className="border-t pt-3 mt-3">
                <p className="text-sm text-center text-muted-foreground">
                  Your accuracy: <span className="font-semibold text-foreground">78%</span>
                  {' · '}
                  Rank: <span className="font-semibold text-foreground">#42</span>
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
