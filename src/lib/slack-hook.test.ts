import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createInitialState } from "./state-machines/retro.ts";
import {
  buildSlackRetroMessage,
  isSlackIncomingWebhook,
  nextSlackWebhook,
} from "./slack-hook.ts";

describe("slack incoming webhook", () => {
  it("accepts a hooks.slack.com services URL and rejects anything else", () => {
    assert.equal(
      isSlackIncomingWebhook(
        "https://hooks.slack.com/services/T000/B000/secret",
      ),
      true,
    );
    assert.equal(
      isSlackIncomingWebhook("https://example.com/services/T000/B000/secret"),
      false,
    );
    assert.equal(
      isSlackIncomingWebhook("http://hooks.slack.com/services/T000/B000/secret"),
      false,
    );
    assert.equal(isSlackIncomingWebhook("not a url"), false);
  });

  it("names each theme, its votes, and its action items", () => {
    const state = {
      ...createInitialState("fac"),
      cards: [
        {
          id: "c1",
          category: "happy" as const,
          text: "shipping got faster",
          anonymousId: "a",
          createdAt: 1,
        },
      ],
      groups: [
        {
          id: "g1",
          label: "Release pace",
          cardIds: ["c1"],
          voteCount: 4,
        },
      ],
      actionItems: [
        {
          id: "a1",
          text: "Keep the Friday freeze",
          assignees: ["Sam"],
          groupId: "g1",
          createdAt: 2,
        },
      ],
    };
    const text = buildSlackRetroMessage(state);
    assert.match(text, /Release pace \(4 votes\)/);
    assert.match(text, /shipping got faster/);
    assert.match(text, /Action: Keep the Friday freeze \(Sam\)/);
    assert.equal(text.includes("hooks.slack.com"), false);
  });

  it("escapes card text so it cannot ping the channel", () => {
    const state = {
      ...createInitialState("fac"),
      cards: [
        {
          id: "c1",
          category: "sad" as const,
          text: "<!channel> builds & deploys",
          anonymousId: "a",
          createdAt: 1,
        },
      ],
      groups: [
        { id: "g1", label: "<@U123>", cardIds: ["c1"], voteCount: 1 },
      ],
    };
    const text = buildSlackRetroMessage(state);
    assert.equal(text.includes("<!channel>"), false);
    assert.equal(text.includes("<@U123>"), false);
    assert.match(text, /- &lt;!channel&gt; builds &amp; deploys/);
  });

  it("rejects a bad URL without offering a replacement hook", () => {
    assert.deepEqual(nextSlackWebhook("https://example.com/hook"), {
      kind: "reject",
    });
    assert.deepEqual(nextSlackWebhook("   "), { kind: "clear" });
    assert.deepEqual(
      nextSlackWebhook("https://hooks.slack.com/services/T1/B1/x"),
      {
        kind: "save",
        url: "https://hooks.slack.com/services/T1/B1/x",
      },
    );
  });
});
