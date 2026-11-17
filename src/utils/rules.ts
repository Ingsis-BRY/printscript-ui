import {Rule} from "../types/Rule.ts";

export const RULES_SAVED_MESSAGE = "Rules saved. Your snippets are being re-checked in the background."

/** Value a rule gets when it is activated: its current value, else the lower bound / first option. */
export const defaultValueFor = (rule: Rule): string | number | null => {
  if (rule.value !== null && rule.value !== undefined) return rule.value
  if (rule.type === 'integer') return rule.min ?? 0
  if (rule.type === 'enum') return rule.options?.[0] ?? null
  return null
}
