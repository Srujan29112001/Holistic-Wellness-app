'use client';

/**
 * Mood Page - Mood Tracking
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createBrowserClient } from '@/lib/supabase/client';

export default function MoodPage() {
  const supabase = createBrowserClient();
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [sleepHours, setSleepHours] = useState(7);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('mood_entries').insert({
        user_id: user.id,
        mood,
        energy,
        stress,
        sleep_hours: sleepHours,
        notes,
        date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      setSuccess(true);
      setNotes('');
    } catch (error) {
      console.error('Failed to log mood:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mood Tracking</h1>
        <p className="text-gray-600">Track your daily mood and wellness</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Check-in</CardTitle>
          <CardDescription>How are you feeling today?</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mood */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mood (1-5): {['😞', '😕', '😐', '🙂', '😊'][mood - 1]}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Very Low</span>
                <span>Very High</span>
              </div>
            </div>

            {/* Energy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Energy Level (1-5): {['🔋', '🔋🔋', '🔋🔋🔋', '🔋🔋🔋🔋', '⚡'][energy - 1]}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Exhausted</span>
                <span>Energized</span>
              </div>
            </div>

            {/* Stress */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stress Level (1-5): {stress <= 2 ? '😌' : stress <= 3 ? '😐' : '😰'}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={stress}
                onChange={(e) => setStress(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Very Calm</span>
                <span>Very Stressed</span>
              </div>
            </div>

            {/* Sleep */}
            <Input
              type="number"
              label="Hours of Sleep"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              min="0"
              max="24"
              step="0.5"
            />

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How are you feeling? Any thoughts to record?"
              />
            </div>

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                Mood logged successfully! 🎉
              </div>
            )}

            <Button type="submit" fullWidth isLoading={isLoading}>
              Save Mood Entry
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
