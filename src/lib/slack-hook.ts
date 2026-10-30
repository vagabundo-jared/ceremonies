import type { RetroState } from "./state-machines/retro";

/**
 * A Slack incoming webhook. The URL is a secret: callers keep it off the
 * broadcast state and out of the saved retro record.
 */
export function isSlackIncomingWebhook(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "hooks.slack.com" &&
      parsed.pathname.startsWith("/services/")
    );
  } catch {
    return false;
  }
}

export type SlackHookUpdate =
  | { kind: "clear" }
  | { kind: "reject" }
  | { kind: "save"; url: string };

/**
 * Decide what a facilitator paste does.
 * "reject" carries no URL, so the caller leaves the saved hook alone.
 */
export function nextSlackWebhook(raw: string): SlackHookUpdate {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "clear" };
  if (!isSlackIncomingWebhook(trimmed)) return { kind: "reject" };
  return { kind: "save", url: trimmed };
}

/**
 * Escape the three characters Slack treats as control text. Without this a
 * card reading "<!channel>" would ping the whole channel.
 */
export function escapeSlackText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Text Slack will show when a retro closes. One block, no webhook URL. */
export function buildSlackRetroMessage(state: RetroState): string {
  const lines = ["Retro closed"];
  if (state.groups.length === 0) {
    lines.push("No themes.");
  }
  for (const group of state.groups) {
    lines.push("");
    lines.push(`${escapeSlackText(group.label)} (${group.voteCount} votes)`);
    const cards = group.cardIds
      .map((id) => state.cards.find((card) => card.id === id))
      .filter((card) => card !== undefined);
    for (const card of cards) {
      lines.push(`- ${escapeSlackText(card.text)}`);
    }
    const actions = state.actionItems.filter((item) => item.groupId === group.id);
    for (const item of actions) {
      const who =
        item.assignees.length > 0
          ? ` (${escapeSlackText(item.assignees.join(", "))})`
          : "";
      lines.push(`- Action: ${escapeSlackText(item.text)}${who}`);
    }
  }
  const general = state.actionItems.filter((item) => !item.groupId);
  if (general.length > 0) {
    lines.push("");
    lines.push("Other actions");
    for (const item of general) {
      lines.push(`- ${escapeSlackText(item.text)}`);
    }
  }
  return lines.join("\n");
}
