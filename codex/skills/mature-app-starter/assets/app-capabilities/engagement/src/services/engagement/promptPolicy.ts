export type PromptHistory = {
  lastPromptAt: number | null;
  lastRequestAt: number | null;
  activitiesAtLastRequest: number;
};
export type PromptPolicy = {
  minimumActivities: number;
  activitiesBetweenRequests: number;
  promptGapMs: number;
  requestGapMs: number;
};
export type PromptDecision = 'eligible' | 'disabled' | 'busy' | 'invalid-history' | 'insufficient-activity' | 'prompt-cooldown' | 'request-cooldown';
const count = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

/** Activity/cooldown policy, deliberately independent of scores, ratings or feedback sentiment. */
export function createPromptPolicy(policy: PromptPolicy) {
  const rules = { ...policy };
  if (![rules.minimumActivities, rules.activitiesBetweenRequests, rules.promptGapMs, rules.requestGapMs].every(count) || rules.activitiesBetweenRequests < 1)
    throw new Error('Invalid prompt policy');
  return (input: { enabled: boolean; workflowBusy: boolean; completedActivities: number; now: number; history: PromptHistory }): PromptDecision => {
    if (input.enabled !== true) return 'disabled';
    if (input.workflowBusy !== false) return 'busy';
    const { history, now, completedActivities } = input;
    const timestamp = (value: unknown) => value === null || (count(value) && value <= now);
    if (!count(now) || !count(completedActivities) || !history ||
      !timestamp(history.lastPromptAt) || !timestamp(history.lastRequestAt) ||
      !count(history.activitiesAtLastRequest) || history.activitiesAtLastRequest > completedActivities ||
      (history.lastRequestAt === null && history.activitiesAtLastRequest !== 0)) return 'invalid-history';
    if (completedActivities < rules.minimumActivities ||
      (history.lastRequestAt !== null && completedActivities - history.activitiesAtLastRequest < rules.activitiesBetweenRequests))
      return 'insufficient-activity';
    if (history.lastPromptAt !== null && now - history.lastPromptAt < rules.promptGapMs) return 'prompt-cooldown';
    if (history.lastRequestAt !== null && now - history.lastRequestAt < rules.requestGapMs) return 'request-cooldown';
    return 'eligible';
  };
}
