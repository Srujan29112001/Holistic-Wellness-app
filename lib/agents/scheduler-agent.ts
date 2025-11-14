/**
 * Scheduler Agent
 *
 * Specialized AI agent for daily schedule optimization using constraint satisfaction.
 * Implements a CSP (Constraint Satisfaction Problem) solver to create optimal
 * daily schedules that balance meals, activities, work, and rest.
 *
 * Capabilities:
 * - Constraint satisfaction scheduling
 * - Activity time allocation
 * - Conflict resolution
 * - Wellness score optimization
 * - Dynamic rescheduling
 */

import { callClaude } from '../utils/anthropic-client';

// ==================== Types ====================

export interface ScheduleActivity {
  id: string;
  type: 'meal' | 'exercise' | 'meditation' | 'work' | 'sleep' | 'personal' | 'social';
  name: string;
  duration: number;  // minutes
  priority: 'required' | 'high' | 'medium' | 'low';

  // Time preferences
  preferredTime?: string;  // HH:mm format
  timeWindow?: {
    start: string;  // HH:mm
    end: string;    // HH:mm
  };

  // Constraints
  mustBeBefore?: string;  // Activity ID
  mustBeAfter?: string;   // Activity ID
  cannotOverlapWith?: string[];  // Activity IDs

  // Flexibility
  flexible: boolean;

  // Metadata
  wellnessScore?: number;  // 0-100
  energyImpact?: 'high' | 'medium' | 'low';
  tags?: string[];
}

export interface TimeSlot {
  start: string;  // HH:mm
  end: string;    // HH:mm
  activity?: ScheduleActivity;
  available: boolean;
}

export interface DailySchedule {
  date: string;
  activities: ScheduledActivity[];
  slots: TimeSlot[];
  metrics: {
    totalScheduled: number;  // minutes
    totalFree: number;       // minutes
    wellnessScore: number;   // 0-100
    balance: {
      nutrition: number;     // minutes
      physical: number;      // minutes
      mental: number;        // minutes
      spiritual: number;     // minutes
      work: number;          // minutes
      rest: number;          // minutes
    };
  };
  conflicts: ScheduleConflict[];
}

export interface ScheduledActivity extends ScheduleActivity {
  scheduledStart: string;  // HH:mm
  scheduledEnd: string;    // HH:mm
  slot: number;            // Slot index
}

export interface ScheduleConflict {
  activity1: string;
  activity2: string;
  type: 'overlap' | 'constraint-violation' | 'preference-conflict';
  severity: 'critical' | 'warning' | 'minor';
  description: string;
}

export interface ScheduleConstraints {
  // Fixed commitments
  workHours?: {
    start: string;
    end: string;
    days: number[];  // 0=Sunday, 1=Monday, etc.
  };
  sleepSchedule?: {
    bedtime: string;
    wakeTime: string;
  };

  // Preferences
  preferredMealTimes?: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };

  // Limitations
  maxActivitiesPerDay?: number;
  minBreakBetweenActivities?: number;  // minutes

  // Energy patterns
  energyPeakHours?: string[];  // HH:mm times when user has most energy
  energyLowHours?: string[];   // HH:mm times when user has least energy
}

export interface SchedulerAgentContext {
  constraints: ScheduleConstraints;
  activities: ScheduleActivity[];
  date: string;
  existingCommitments?: ScheduledActivity[];
}

// ==================== Scheduler Agent ====================

export class SchedulerAgent {
  private readonly SLOT_DURATION = 15;  // minutes per slot
  private readonly SLOTS_PER_DAY = 96;   // 24 hours * 4 slots/hour

  constructor(private context: SchedulerAgentContext) {}

  /**
   * Generate an optimal daily schedule
   */
  async generateSchedule(): Promise<DailySchedule> {
    console.log('[SchedulerAgent] Generating optimal schedule...');

    // Step 1: Initialize time slots
    const slots = this.initializeSlots();

    // Step 2: Block out fixed commitments (work, sleep, existing events)
    this.blockFixedCommitments(slots);

    // Step 3: Sort activities by priority and constraints
    const sortedActivities = this.sortActivitiesByPriority();

    // Step 4: Use backtracking CSP solver to assign activities
    const scheduledActivities = this.solveCSP(sortedActivities, slots);

    // Step 5: Calculate metrics and detect conflicts
    const metrics = this.calculateMetrics(scheduledActivities, slots);
    const conflicts = this.detectConflicts(scheduledActivities);

    // Step 6: Use Claude to optimize and provide insights
    const optimizedSchedule = await this.optimizeWithAI(
      scheduledActivities,
      metrics,
      conflicts
    );

    console.log('[SchedulerAgent] Schedule generated:', {
      activities: scheduledActivities.length,
      wellnessScore: metrics.wellnessScore,
      conflicts: conflicts.length,
    });

    return {
      date: this.context.date,
      activities: optimizedSchedule || scheduledActivities,
      slots,
      metrics,
      conflicts,
    };
  }

  /**
   * Initialize all time slots for the day
   */
  private initializeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];

    for (let i = 0; i < this.SLOTS_PER_DAY; i++) {
      const minutes = i * this.SLOT_DURATION;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      const start = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      const endMinutes = (i + 1) * this.SLOT_DURATION;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const end = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      slots.push({
        start,
        end,
        available: true,
      });
    }

    return slots;
  }

  /**
   * Block out fixed commitments (work, sleep)
   */
  private blockFixedCommitments(slots: TimeSlot[]): void {
    const { constraints, existingCommitments } = this.context;

    // Block work hours
    if (constraints.workHours) {
      const workStart = this.timeToSlot(constraints.workHours.start);
      const workEnd = this.timeToSlot(constraints.workHours.end);

      for (let i = workStart; i < workEnd; i++) {
        slots[i].available = false;
        slots[i].activity = {
          id: 'work',
          type: 'work',
          name: 'Work',
          duration: this.SLOT_DURATION,
          priority: 'required',
          flexible: false,
        };
      }
    }

    // Block sleep time
    if (constraints.sleepSchedule) {
      const bedtime = this.timeToSlot(constraints.sleepSchedule.bedtime);
      const wakeTime = this.timeToSlot(constraints.sleepSchedule.wakeTime);

      // Handle overnight sleep (bedtime > wakeTime)
      if (bedtime > wakeTime) {
        // Block from bedtime to midnight
        for (let i = bedtime; i < this.SLOTS_PER_DAY; i++) {
          slots[i].available = false;
          slots[i].activity = {
            id: 'sleep',
            type: 'sleep',
            name: 'Sleep',
            duration: this.SLOT_DURATION,
            priority: 'required',
            flexible: false,
          };
        }
        // Block from midnight to wake time
        for (let i = 0; i < wakeTime; i++) {
          slots[i].available = false;
          slots[i].activity = {
            id: 'sleep',
            type: 'sleep',
            name: 'Sleep',
            duration: this.SLOT_DURATION,
            priority: 'required',
            flexible: false,
          };
        }
      } else {
        // Normal sleep within same day
        for (let i = bedtime; i < wakeTime; i++) {
          slots[i].available = false;
          slots[i].activity = {
            id: 'sleep',
            type: 'sleep',
            name: 'Sleep',
            duration: this.SLOT_DURATION,
            priority: 'required',
            flexible: false,
          };
        }
      }
    }

    // Block existing commitments
    if (existingCommitments) {
      for (const commitment of existingCommitments) {
        const startSlot = this.timeToSlot(commitment.scheduledStart);
        const slotsNeeded = Math.ceil(commitment.duration / this.SLOT_DURATION);

        for (let i = startSlot; i < startSlot + slotsNeeded; i++) {
          if (i < this.SLOTS_PER_DAY) {
            slots[i].available = false;
            slots[i].activity = commitment;
          }
        }
      }
    }
  }

  /**
   * Sort activities by priority and dependencies
   */
  private sortActivitiesByPriority(): ScheduleActivity[] {
    const activities = [...this.context.activities];

    return activities.sort((a, b) => {
      // Required activities first
      const priorityOrder = { required: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Activities with time windows next
      if (a.timeWindow && !b.timeWindow) return -1;
      if (!a.timeWindow && b.timeWindow) return 1;

      // Activities with dependencies next
      if (a.mustBeAfter && !b.mustBeAfter) return -1;
      if (!a.mustBeAfter && b.mustBeAfter) return 1;

      // Higher wellness score first
      return (b.wellnessScore || 0) - (a.wellnessScore || 0);
    });
  }

  /**
   * Constraint Satisfaction Problem solver using backtracking
   */
  private solveCSP(
    activities: ScheduleActivity[],
    slots: TimeSlot[]
  ): ScheduledActivity[] {
    const scheduled: ScheduledActivity[] = [];

    for (const activity of activities) {
      const assignment = this.findBestSlot(activity, slots, scheduled);

      if (assignment) {
        scheduled.push(assignment);

        // Mark slots as occupied
        const startSlot = this.timeToSlot(assignment.scheduledStart);
        const slotsNeeded = Math.ceil(activity.duration / this.SLOT_DURATION);

        for (let i = startSlot; i < startSlot + slotsNeeded && i < this.SLOTS_PER_DAY; i++) {
          slots[i].available = false;
          slots[i].activity = assignment;
        }
      } else {
        console.warn(`[SchedulerAgent] Could not schedule activity: ${activity.name}`);
      }
    }

    return scheduled;
  }

  /**
   * Find the best time slot for an activity
   */
  private findBestSlot(
    activity: ScheduleActivity,
    slots: TimeSlot[],
    scheduled: ScheduledActivity[]
  ): ScheduledActivity | null {
    const slotsNeeded = Math.ceil(activity.duration / this.SLOT_DURATION);
    let bestSlot: number | null = null;
    let bestScore = -1;

    // If there's a preferred time, try that first
    if (activity.preferredTime) {
      const preferredSlot = this.timeToSlot(activity.preferredTime);
      if (this.canScheduleAt(preferredSlot, slotsNeeded, slots, activity, scheduled)) {
        return this.createScheduledActivity(activity, preferredSlot, slots);
      }
    }

    // Define search range
    let searchStart = 0;
    let searchEnd = this.SLOTS_PER_DAY - slotsNeeded;

    if (activity.timeWindow) {
      searchStart = this.timeToSlot(activity.timeWindow.start);
      searchEnd = Math.min(
        this.timeToSlot(activity.timeWindow.end) - slotsNeeded,
        this.SLOTS_PER_DAY - slotsNeeded
      );
    }

    // Search for best slot
    for (let slot = searchStart; slot <= searchEnd; slot++) {
      if (this.canScheduleAt(slot, slotsNeeded, slots, activity, scheduled)) {
        const score = this.scoreSlot(slot, activity, slots);

        if (score > bestScore) {
          bestScore = score;
          bestSlot = slot;
        }
      }
    }

    if (bestSlot !== null) {
      return this.createScheduledActivity(activity, bestSlot, slots);
    }

    return null;
  }

  /**
   * Check if activity can be scheduled at a given slot
   */
  private canScheduleAt(
    startSlot: number,
    slotsNeeded: number,
    slots: TimeSlot[],
    activity: ScheduleActivity,
    scheduled: ScheduledActivity[]
  ): boolean {
    // Check if slots are available
    for (let i = startSlot; i < startSlot + slotsNeeded; i++) {
      if (i >= this.SLOTS_PER_DAY || !slots[i].available) {
        return false;
      }
    }

    // Check "must be after" constraint
    if (activity.mustBeAfter) {
      const dependency = scheduled.find(a => a.id === activity.mustBeAfter);
      if (dependency) {
        const depEndSlot = this.timeToSlot(dependency.scheduledEnd);
        if (startSlot < depEndSlot) {
          return false;
        }
      } else {
        // Dependency not scheduled yet - can't schedule this
        return false;
      }
    }

    // Check "must be before" constraint
    if (activity.mustBeBefore) {
      const dependent = scheduled.find(a => a.id === activity.mustBeBefore);
      if (dependent) {
        const depStartSlot = this.timeToSlot(dependent.scheduledStart);
        if (startSlot + slotsNeeded > depStartSlot) {
          return false;
        }
      }
    }

    // Check minimum break between activities
    const minBreak = this.context.constraints.minBreakBetweenActivities || 0;
    const minBreakSlots = Math.ceil(minBreak / this.SLOT_DURATION);

    for (const other of scheduled) {
      const otherStart = this.timeToSlot(other.scheduledStart);
      const otherEnd = this.timeToSlot(other.scheduledEnd);

      // Check if too close before
      if (startSlot < otherStart && startSlot + slotsNeeded + minBreakSlots > otherStart) {
        return false;
      }

      // Check if too close after
      if (startSlot > otherEnd && startSlot - minBreakSlots < otherEnd) {
        return false;
      }
    }

    return true;
  }

  /**
   * Score a time slot for an activity (higher is better)
   */
  private scoreSlot(
    slot: number,
    activity: ScheduleActivity,
    slots: TimeSlot[]
  ): number {
    let score = 100;

    const timeStr = slots[slot].start;
    const { constraints } = this.context;

    // Match with preferred meal times
    if (activity.type === 'meal' && constraints.preferredMealTimes) {
      const mealName = activity.name.toLowerCase();

      if (mealName.includes('breakfast') && constraints.preferredMealTimes.breakfast) {
        const diff = this.timeDifferenceMinutes(timeStr, constraints.preferredMealTimes.breakfast);
        score -= Math.abs(diff) / 2;  // Penalty for deviation
      } else if (mealName.includes('lunch') && constraints.preferredMealTimes.lunch) {
        const diff = this.timeDifferenceMinutes(timeStr, constraints.preferredMealTimes.lunch);
        score -= Math.abs(diff) / 2;
      } else if (mealName.includes('dinner') && constraints.preferredMealTimes.dinner) {
        const diff = this.timeDifferenceMinutes(timeStr, constraints.preferredMealTimes.dinner);
        score -= Math.abs(diff) / 2;
      }
    }

    // Match exercise with energy peaks
    if (activity.type === 'exercise' && constraints.energyPeakHours) {
      const isEnergyPeak = constraints.energyPeakHours.some(peak => {
        const diff = Math.abs(this.timeDifferenceMinutes(timeStr, peak));
        return diff < 60;  // Within 1 hour of peak
      });

      if (isEnergyPeak) {
        score += 20;
      }
    }

    // Avoid scheduling during energy low hours
    if (constraints.energyLowHours) {
      const isEnergyLow = constraints.energyLowHours.some(low => {
        const diff = Math.abs(this.timeDifferenceMinutes(timeStr, low));
        return diff < 60;
      });

      if (isEnergyLow && activity.energyImpact === 'high') {
        score -= 30;
      }
    }

    // Bonus for scheduling meditation in morning or evening
    if (activity.type === 'meditation') {
      const hour = parseInt(timeStr.split(':')[0]);
      if (hour >= 6 && hour <= 8) {
        score += 15;  // Morning meditation bonus
      } else if (hour >= 19 && hour <= 21) {
        score += 10;  // Evening meditation bonus
      }
    }

    // Wellness score contribution
    if (activity.wellnessScore) {
      score += activity.wellnessScore * 0.2;
    }

    return score;
  }

  /**
   * Create a scheduled activity with assigned time
   */
  private createScheduledActivity(
    activity: ScheduleActivity,
    slot: number,
    slots: TimeSlot[]
  ): ScheduledActivity {
    const slotsNeeded = Math.ceil(activity.duration / this.SLOT_DURATION);
    const endSlot = Math.min(slot + slotsNeeded, this.SLOTS_PER_DAY - 1);

    return {
      ...activity,
      scheduledStart: slots[slot].start,
      scheduledEnd: slots[endSlot].end,
      slot,
    };
  }

  /**
   * Calculate schedule metrics
   */
  private calculateMetrics(
    activities: ScheduledActivity[],
    slots: TimeSlot[]
  ): DailySchedule['metrics'] {
    let totalScheduled = 0;
    let totalFree = 0;

    const balance = {
      nutrition: 0,
      physical: 0,
      mental: 0,
      spiritual: 0,
      work: 0,
      rest: 0,
    };

    // Calculate totals
    for (const slot of slots) {
      if (slot.activity) {
        totalScheduled += this.SLOT_DURATION;
      } else if (slot.available) {
        totalFree += this.SLOT_DURATION;
      }
    }

    // Calculate balance
    for (const activity of activities) {
      const duration = activity.duration;

      switch (activity.type) {
        case 'meal':
          balance.nutrition += duration;
          break;
        case 'exercise':
          balance.physical += duration;
          break;
        case 'meditation':
          balance.mental += duration;
          balance.spiritual += duration;
          break;
        case 'work':
          balance.work += duration;
          break;
        case 'sleep':
          balance.rest += duration;
          break;
        case 'personal':
          balance.mental += duration;
          break;
      }
    }

    // Calculate wellness score (0-100)
    let wellnessScore = 0;

    // Balanced schedule gets higher score
    const hasNutrition = balance.nutrition > 0;
    const hasPhysical = balance.physical >= 30;  // At least 30 min exercise
    const hasMental = balance.mental >= 15;      // At least 15 min mental wellness
    const hasSpiritual = balance.spiritual >= 10; // At least 10 min spiritual

    if (hasNutrition) wellnessScore += 25;
    if (hasPhysical) wellnessScore += 25;
    if (hasMental) wellnessScore += 25;
    if (hasSpiritual) wellnessScore += 25;

    // Bonus for good work-life balance
    const workLifeRatio = balance.work / (balance.nutrition + balance.physical + balance.mental + balance.rest || 1);
    if (workLifeRatio < 2) {
      wellnessScore = Math.min(100, wellnessScore + 10);
    }

    return {
      totalScheduled,
      totalFree,
      wellnessScore,
      balance,
    };
  }

  /**
   * Detect scheduling conflicts
   */
  private detectConflicts(activities: ScheduledActivity[]): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    for (let i = 0; i < activities.length; i++) {
      for (let j = i + 1; j < activities.length; j++) {
        const a1 = activities[i];
        const a2 = activities[j];

        // Check for overlaps
        const overlap = this.doActivitiesOverlap(a1, a2);
        if (overlap) {
          conflicts.push({
            activity1: a1.id,
            activity2: a2.id,
            type: 'overlap',
            severity: 'critical',
            description: `${a1.name} and ${a2.name} overlap`,
          });
        }

        // Check constraint violations
        if (a1.mustBeBefore === a2.id) {
          const a1End = this.timeToMinutes(a1.scheduledEnd);
          const a2Start = this.timeToMinutes(a2.scheduledStart);

          if (a1End > a2Start) {
            conflicts.push({
              activity1: a1.id,
              activity2: a2.id,
              type: 'constraint-violation',
              severity: 'critical',
              description: `${a1.name} must be before ${a2.name}`,
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Use Claude AI to optimize and provide insights
   */
  private async optimizeWithAI(
    activities: ScheduledActivity[],
    metrics: DailySchedule['metrics'],
    conflicts: ScheduleConflict[]
  ): Promise<ScheduledActivity[] | null> {
    // If no conflicts and good wellness score, no need to optimize
    if (conflicts.length === 0 && metrics.wellnessScore >= 80) {
      return null;
    }

    try {
      const prompt = `You are a wellness scheduling expert. Analyze this daily schedule:

Activities: ${JSON.stringify(activities, null, 2)}
Metrics: ${JSON.stringify(metrics, null, 2)}
Conflicts: ${JSON.stringify(conflicts, null, 2)}

${conflicts.length > 0 ? 'Resolve conflicts and suggest improvements.' : 'Suggest optimizations to improve wellness score.'}

Return a JSON array of optimized activities with adjusted times, or null if no changes needed.`;

      const response = await callClaude(prompt, {
        model: 'haiku',
        maxTokens: 1500,
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('[SchedulerAgent] AI optimization failed:', error);
    }

    return null;
  }

  // ==================== Helper Methods ====================

  /**
   * Convert HH:mm time to slot index
   */
  private timeToSlot(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    return Math.floor(totalMinutes / this.SLOT_DURATION);
  }

  /**
   * Convert HH:mm time to total minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Calculate time difference in minutes
   */
  private timeDifferenceMinutes(time1: string, time2: string): number {
    return this.timeToMinutes(time1) - this.timeToMinutes(time2);
  }

  /**
   * Check if two activities overlap
   */
  private doActivitiesOverlap(a1: ScheduledActivity, a2: ScheduledActivity): boolean {
    const a1Start = this.timeToMinutes(a1.scheduledStart);
    const a1End = this.timeToMinutes(a1.scheduledEnd);
    const a2Start = this.timeToMinutes(a2.scheduledStart);
    const a2End = this.timeToMinutes(a2.scheduledEnd);

    return !(a1End <= a2Start || a2End <= a1Start);
  }
}

// ==================== Helper Functions ====================

/**
 * Create default schedule constraints from user profile
 */
export function createDefaultConstraints(profile: {
  wakeTime?: string;
  sleepTime?: string;
  workStart?: string;
  workEnd?: string;
}): ScheduleConstraints {
  return {
    sleepSchedule: {
      bedtime: profile.sleepTime || '23:00',
      wakeTime: profile.wakeTime || '07:00',
    },
    workHours: profile.workStart && profile.workEnd ? {
      start: profile.workStart,
      end: profile.workEnd,
      days: [1, 2, 3, 4, 5],  // Monday-Friday
    } : undefined,
    preferredMealTimes: {
      breakfast: '08:00',
      lunch: '12:30',
      dinner: '19:00',
    },
    maxActivitiesPerDay: 12,
    minBreakBetweenActivities: 15,
    energyPeakHours: ['10:00', '16:00'],
    energyLowHours: ['14:00'],  // Post-lunch dip
  };
}

/**
 * Convert meals to schedule activities
 */
export function mealsToActivities(meals: any[]): ScheduleActivity[] {
  return meals.map((meal, index) => ({
    id: `meal-${index}`,
    type: 'meal' as const,
    name: meal.name,
    duration: meal.prepTime ? meal.prepTime + 30 : 30,  // Prep + eating time
    priority: 'required' as const,
    flexible: true,
    wellnessScore: 80,
    energyImpact: 'medium' as const,
  }));
}

/**
 * Convert wellness activities to schedule activities
 */
export function wellnessToActivities(activities: any[]): ScheduleActivity[] {
  return activities.map((activity, index) => ({
    id: `wellness-${index}`,
    type: activity.category as any,
    name: activity.name,
    duration: activity.duration,
    priority: 'high' as const,
    flexible: true,
    preferredTime: activity.when,
    wellnessScore: 90,
    energyImpact: activity.category === 'meditation' ? 'low' : 'medium',
  }));
}
