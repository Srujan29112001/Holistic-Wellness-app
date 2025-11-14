/**
 * Scheduler Agent
 *
 * Specializes in daily schedule optimization, activity planning, and time management.
 * Uses constraint satisfaction to create balanced, feasible schedules.
 */

import { Agent, AgentContext, AgentResponse, AgentRole } from '@/types/agents/base';
import { A2AAgentCard, A2AMessage } from '@/types/protocols/a2a';
import { MCPTool, MCPToolResult } from '@/types/protocols/mcp';
import { createAnthropicClient } from '@/lib/utils/anthropic-client';

interface ScheduleActivity {
  id: string;
  category: 'nutrition' | 'mental' | 'spiritual' | 'physical' | 'work' | 'personal';
  title: string;
  description?: string;
  duration: number; // minutes
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  flexibility: 'fixed' | 'preferred' | 'flexible';
  priority: 'high' | 'medium' | 'low';
  constraints?: {
    earliestStart?: string;
    latestEnd?: string;
    mustBeAfter?: string[];
    mustBeBefore?: string[];
  };
}

interface ScheduleConstraints {
  wakeTime: string;
  sleepTime: string;
  workHours?: { start: string; end: string };
  mealTimes?: { breakfast?: string; lunch?: string; dinner?: string };
  breakDuration?: number; // minutes between activities
  preferredWorkoutTime?: 'morning' | 'afternoon' | 'evening';
}

interface DailySchedule {
  date: string;
  activities: Array<ScheduleActivity & { startTime: string; endTime: string }>;
  totalScheduledTime: number;
  freeTime: number;
  conflicts: string[];
  suggestions: string[];
}

export class SchedulerAgent implements Agent {
  id = 'scheduler-agent';
  role: AgentRole = 'scheduler';
  name = 'Schedule Optimizer';
  description = 'Expert in daily schedule optimization and activity planning using constraint satisfaction';

  private claudeClient = createAnthropicClient();

  getAgentCard(): A2AAgentCard {
    return {
      agentId: this.id,
      name: this.name,
      description: this.description,
      capabilities: [
        'schedule_optimization',
        'activity_planning',
        'conflict_resolution',
        'time_management',
        'constraint_satisfaction'
      ],
      endpoints: [
        {
          path: '/api/agents/scheduler',
          method: 'POST',
          description: 'Optimize daily schedule with multiple activities and constraints'
        }
      ],
      version: '1.0.0'
    };
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'create_schedule',
        description: 'Create optimized daily schedule from activities and constraints',
        inputSchema: {
          type: 'object',
          properties: {
            activities: {
              type: 'array',
              description: 'List of activities to schedule'
            },
            constraints: {
              type: 'object',
              description: 'Scheduling constraints (work hours, meal times, etc.)'
            },
            date: {
              type: 'string',
              description: 'Date for the schedule'
            }
          },
          required: ['activities', 'constraints']
        }
      },
      {
        name: 'check_conflicts',
        description: 'Check for scheduling conflicts in proposed schedule',
        inputSchema: {
          type: 'object',
          properties: {
            activities: { type: 'array' }
          },
          required: ['activities']
        }
      },
      {
        name: 'suggest_optimal_time',
        description: 'Suggest optimal time for an activity based on schedule and constraints',
        inputSchema: {
          type: 'object',
          properties: {
            activity: { type: 'object' },
            existingSchedule: { type: 'array' },
            constraints: { type: 'object' }
          },
          required: ['activity']
        }
      }
    ];
  }

  async process(request: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Parse scheduling request
      const { activities, constraints } = this.parseSchedulingRequest(request, context);

      // Create optimized schedule
      const schedule = await this.createOptimizedSchedule(activities, constraints, context);

      return {
        agentId: this.id,
        success: true,
        data: {
          schedule,
          summary: this.generateScheduleSummary(schedule),
          tips: this.generateSchedulingTips(schedule, constraints)
        },
        message: 'Daily schedule optimized successfully',
        confidence: 0.9,
        reasoning: 'Schedule created using constraint satisfaction and priority optimization'
      };
    } catch (error) {
      console.error('Scheduler agent error:', error);
      return {
        agentId: this.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create optimized schedule'
      };
    }
  }

  async handleA2AMessage(message: A2AMessage, context: AgentContext): Promise<AgentResponse> {
    const { task, parameters } = message.content;

    switch (task) {
      case 'create_schedule':
        return this.process(JSON.stringify(parameters), context);

      case 'add_activity':
        return this.addActivityToSchedule(parameters, context);

      case 'resolve_conflicts':
        return this.resolveConflicts(parameters, context);

      default:
        return {
          agentId: this.id,
          success: false,
          error: `Unknown task: ${task}`,
          message: 'Task not supported by Scheduler Agent'
        };
    }
  }

  async executeTool(toolCall: { name: string; parameters: any }, context: AgentContext): Promise<MCPToolResult> {
    switch (toolCall.name) {
      case 'create_schedule':
        return this.createScheduleTool(toolCall.parameters);

      case 'check_conflicts':
        return this.checkConflicts(toolCall.parameters);

      case 'suggest_optimal_time':
        return this.suggestOptimalTime(toolCall.parameters);

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolCall.name}`
        };
    }
  }

  // Private helper methods

  private parseSchedulingRequest(request: string, context: AgentContext): {
    activities: ScheduleActivity[];
    constraints: ScheduleConstraints;
  } {
    const userProfile = context.userProfile;

    // Build constraints from user profile
    const constraints: ScheduleConstraints = {
      wakeTime: userProfile?.wakeTime || '07:00',
      sleepTime: userProfile?.sleepTime || '23:00',
      workHours: userProfile?.workHours || { start: '09:00', end: '17:00' },
      breakDuration: 15
    };

    // Extract activities from context (from other agents)
    const activities: ScheduleActivity[] = [];

    // Add work as fixed activity
    if (constraints.workHours) {
      activities.push({
        id: 'work',
        category: 'work',
        title: 'Work',
        duration: this.calculateDuration(constraints.workHours.start, constraints.workHours.end),
        startTime: constraints.workHours.start,
        endTime: constraints.workHours.end,
        flexibility: 'fixed',
        priority: 'high'
      });
    }

    // Activities will be added from other agents via A2A

    return { activities, constraints };
  }

  private async createOptimizedSchedule(
    activities: ScheduleActivity[],
    constraints: ScheduleConstraints,
    context: AgentContext
  ): Promise<DailySchedule> {
    // Sort activities by priority and flexibility
    const sortedActivities = this.sortActivitiesByPriority(activities);

    // Schedule fixed activities first
    const scheduledActivities: Array<ScheduleActivity & { startTime: string; endTime: string }> = [];
    const fixedActivities = sortedActivities.filter(a => a.flexibility === 'fixed' && a.startTime && a.endTime);

    fixedActivities.forEach(activity => {
      scheduledActivities.push({
        ...activity,
        startTime: activity.startTime!,
        endTime: activity.endTime!
      });
    });

    // Add meals at standard times
    const mealActivities = this.createMealActivities(constraints);
    scheduledActivities.push(...mealActivities);

    // Schedule flexible activities in remaining time slots
    const flexibleActivities = sortedActivities.filter(a => a.flexibility !== 'fixed');

    for (const activity of flexibleActivities) {
      const timeSlot = this.findOptimalTimeSlot(activity, scheduledActivities, constraints);

      if (timeSlot) {
        scheduledActivities.push({
          ...activity,
          startTime: timeSlot.start,
          endTime: timeSlot.end
        });
      }
    }

    // Sort by start time
    scheduledActivities.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Check for conflicts
    const conflicts = this.detectConflicts(scheduledActivities);

    // Calculate statistics
    const totalScheduledTime = scheduledActivities.reduce((sum, a) => sum + a.duration, 0);
    const availableTime = this.calculateDuration(constraints.wakeTime, constraints.sleepTime);
    const freeTime = availableTime - totalScheduledTime;

    return {
      date: new Date().toISOString().split('T')[0],
      activities: scheduledActivities,
      totalScheduledTime,
      freeTime,
      conflicts,
      suggestions: this.generateSuggestions(scheduledActivities, constraints, freeTime)
    };
  }

  private sortActivitiesByPriority(activities: ScheduleActivity[]): ScheduleActivity[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const flexibilityOrder = { fixed: 0, preferred: 1, flexible: 2 };

    return [...activities].sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by flexibility (less flexible first)
      return flexibilityOrder[a.flexibility] - flexibilityOrder[b.flexibility];
    });
  }

  private createMealActivities(constraints: ScheduleConstraints): Array<ScheduleActivity & { startTime: string; endTime: string }> {
    return [
      {
        id: 'breakfast',
        category: 'nutrition',
        title: 'Breakfast',
        duration: 30,
        startTime: constraints.mealTimes?.breakfast || '08:00',
        endTime: this.addMinutes(constraints.mealTimes?.breakfast || '08:00', 30),
        flexibility: 'preferred',
        priority: 'high'
      },
      {
        id: 'lunch',
        category: 'nutrition',
        title: 'Lunch',
        duration: 45,
        startTime: constraints.mealTimes?.lunch || '12:30',
        endTime: this.addMinutes(constraints.mealTimes?.lunch || '12:30', 45),
        flexibility: 'preferred',
        priority: 'high'
      },
      {
        id: 'dinner',
        category: 'nutrition',
        title: 'Dinner',
        duration: 45,
        startTime: constraints.mealTimes?.dinner || '19:00',
        endTime: this.addMinutes(constraints.mealTimes?.dinner || '19:00', 45),
        flexibility: 'preferred',
        priority: 'high'
      }
    ];
  }

  private findOptimalTimeSlot(
    activity: ScheduleActivity,
    scheduledActivities: Array<ScheduleActivity & { startTime: string; endTime: string }>,
    constraints: ScheduleConstraints
  ): { start: string; end: string } | null {
    // Find gaps in the schedule
    const gaps = this.findTimeGaps(scheduledActivities, constraints);

    // Find suitable gap for this activity
    for (const gap of gaps) {
      const gapDuration = this.calculateDuration(gap.start, gap.end);

      if (gapDuration >= activity.duration + (constraints.breakDuration || 0)) {
        // Check if this time respects activity constraints
        if (this.respectsActivityConstraints(activity, gap.start, scheduledActivities)) {
          return {
            start: gap.start,
            end: this.addMinutes(gap.start, activity.duration)
          };
        }
      }
    }

    return null;
  }

  private findTimeGaps(
    scheduledActivities: Array<{ startTime: string; endTime: string }>,
    constraints: ScheduleConstraints
  ): Array<{ start: string; end: string }> {
    const gaps: Array<{ start: string; end: string }> = [];
    const sorted = [...scheduledActivities].sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Gap from wake time to first activity
    if (sorted.length > 0) {
      const firstActivity = sorted[0];
      if (constraints.wakeTime < firstActivity.startTime) {
        gaps.push({
          start: constraints.wakeTime,
          end: firstActivity.startTime
        });
      }
    }

    // Gaps between activities
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      if (current.endTime < next.startTime) {
        gaps.push({
          start: current.endTime,
          end: next.startTime
        });
      }
    }

    // Gap from last activity to sleep time
    if (sorted.length > 0) {
      const lastActivity = sorted[sorted.length - 1];
      if (lastActivity.endTime < constraints.sleepTime) {
        gaps.push({
          start: lastActivity.endTime,
          end: constraints.sleepTime
        });
      }
    }

    return gaps;
  }

  private respectsActivityConstraints(
    activity: ScheduleActivity,
    proposedStart: string,
    scheduledActivities: Array<ScheduleActivity & { startTime: string; endTime: string }>
  ): boolean {
    if (!activity.constraints) return true;

    // Check earliest start
    if (activity.constraints.earliestStart && proposedStart < activity.constraints.earliestStart) {
      return false;
    }

    // Check latest end
    if (activity.constraints.latestEnd) {
      const proposedEnd = this.addMinutes(proposedStart, activity.duration);
      if (proposedEnd > activity.constraints.latestEnd) {
        return false;
      }
    }

    // Check must be after constraints
    if (activity.constraints.mustBeAfter) {
      for (const afterId of activity.constraints.mustBeAfter) {
        const afterActivity = scheduledActivities.find(a => a.id === afterId);
        if (afterActivity && proposedStart < afterActivity.endTime) {
          return false;
        }
      }
    }

    // Check must be before constraints
    if (activity.constraints.mustBeBefore) {
      const proposedEnd = this.addMinutes(proposedStart, activity.duration);
      for (const beforeId of activity.constraints.mustBeBefore) {
        const beforeActivity = scheduledActivities.find(a => a.id === beforeId);
        if (beforeActivity && proposedEnd > beforeActivity.startTime) {
          return false;
        }
      }
    }

    return true;
  }

  private detectConflicts(activities: Array<{ startTime: string; endTime: string; title: string }>): string[] {
    const conflicts: string[] = [];

    for (let i = 0; i < activities.length - 1; i++) {
      for (let j = i + 1; j < activities.length; j++) {
        const a1 = activities[i];
        const a2 = activities[j];

        // Check for overlap
        if (
          (a1.startTime >= a2.startTime && a1.startTime < a2.endTime) ||
          (a2.startTime >= a1.startTime && a2.startTime < a1.endTime)
        ) {
          conflicts.push(`Time conflict: ${a1.title} overlaps with ${a2.title}`);
        }
      }
    }

    return conflicts;
  }

  private generateScheduleSummary(schedule: DailySchedule): string {
    const activityCount = schedule.activities.length;
    const hoursScheduled = Math.round(schedule.totalScheduledTime / 60 * 10) / 10;
    const hoursFree = Math.round(schedule.freeTime / 60 * 10) / 10;

    return `Your day includes ${activityCount} activities (${hoursScheduled} hours scheduled, ${hoursFree} hours free). ${schedule.conflicts.length > 0 ? `⚠️ ${schedule.conflicts.length} conflicts detected.` : '✓ No conflicts detected.'}`;
  }

  private generateSuggestions(
    activities: Array<ScheduleActivity & { startTime: string; endTime: string }>,
    constraints: ScheduleConstraints,
    freeTime: number
  ): string[] {
    const suggestions: string[] = [];

    // Check for exercise
    const hasExercise = activities.some(a => a.category === 'physical');
    if (!hasExercise) {
      suggestions.push('💪 Consider adding 30 minutes of exercise to your day');
    }

    // Check for meditation
    const hasMeditation = activities.some(a => a.category === 'mental' || a.category === 'spiritual');
    if (!hasMeditation) {
      suggestions.push('🧘 Add a 15-minute meditation or mindfulness practice');
    }

    // Check for breaks
    if (freeTime < 60) {
      suggestions.push('⚠️ Your schedule is very packed. Ensure you take short breaks between activities');
    } else if (freeTime > 240) {
      suggestions.push('💡 You have extra free time. Consider adding self-development activities');
    }

    // Check meal spacing
    const meals = activities.filter(a => a.category === 'nutrition');
    if (meals.length >= 2) {
      const breakfast = meals.find(m => m.id === 'breakfast');
      const lunch = meals.find(m => m.id === 'lunch');

      if (breakfast && lunch) {
        const spacing = this.calculateDuration(breakfast.endTime, lunch.startTime);
        if (spacing < 180) {
          suggestions.push('🍎 Consider spacing meals at least 3 hours apart for better digestion');
        }
      }
    }

    return suggestions;
  }

  private generateSchedulingTips(schedule: DailySchedule, constraints: ScheduleConstraints): string[] {
    return [
      'Set reminders for important activities to stay on track',
      'Build in buffer time between activities for transitions',
      'Review and adjust your schedule the night before',
      'Be flexible - adjust as needed throughout the day',
      'Track adherence to improve future scheduling'
    ];
  }

  // Utility methods

  private calculateDuration(start: string, end: string): number {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return endMinutes - startMinutes;
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;

    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;

    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  // A2A message handlers

  private async addActivityToSchedule(parameters: any, context: AgentContext): Promise<AgentResponse> {
    const { activity, existingSchedule } = parameters;

    const timeSlot = this.findOptimalTimeSlot(
      activity,
      existingSchedule,
      { wakeTime: '07:00', sleepTime: '23:00' }
    );

    return {
      agentId: this.id,
      success: !!timeSlot,
      data: timeSlot ? { ...activity, ...timeSlot } : null,
      message: timeSlot ? 'Activity scheduled successfully' : 'Could not find suitable time slot'
    };
  }

  private async resolveConflicts(parameters: any, context: AgentContext): Promise<AgentResponse> {
    const { activities } = parameters;
    const conflicts = this.detectConflicts(activities);

    return {
      agentId: this.id,
      success: true,
      data: { conflicts, resolutionSuggestions: [] },
      message: `Found ${conflicts.length} conflicts`
    };
  }

  // Tool implementations

  private async createScheduleTool(params: {
    activities: ScheduleActivity[];
    constraints: ScheduleConstraints;
    date?: string;
  }): Promise<MCPToolResult> {
    try {
      const schedule = await this.createOptimizedSchedule(
        params.activities,
        params.constraints,
        {} as AgentContext
      );

      return {
        success: true,
        data: schedule
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Schedule creation failed'
      };
    }
  }

  private async checkConflicts(params: { activities: any[] }): Promise<MCPToolResult> {
    const conflicts = this.detectConflicts(params.activities);

    return {
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts
      }
    };
  }

  private async suggestOptimalTime(params: {
    activity: ScheduleActivity;
    existingSchedule?: any[];
    constraints?: ScheduleConstraints;
  }): Promise<MCPToolResult> {
    const { activity, existingSchedule = [], constraints = { wakeTime: '07:00', sleepTime: '23:00' } } = params;

    const timeSlot = this.findOptimalTimeSlot(activity, existingSchedule, constraints);

    return {
      success: !!timeSlot,
      data: timeSlot
    };
  }
}

// Export singleton instance
export const schedulerAgent = new SchedulerAgent();
