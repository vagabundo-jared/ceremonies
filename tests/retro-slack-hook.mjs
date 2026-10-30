/**
 * The Slack hook is accepted or rejected on the party server, and the URL
 * never appears in the retro state that clients receive.
 *
 * Usage: node tests/retro-slack-hook.mjs
 * Requires the party server on 127.0.0.1:1999. Does not close the room,
 * so it does not post to Slack.
 */

const host = process.env.PARTY_HOST ?? "127.0.0.1:1999";
const room = `slack-${Date.now().toString(36)}`;
const good = "https://hooks.slack.com/services/T000/B000/local-preview-secret";
const failures = [];

function check(condition, message) {
  if (condition) console.log(`PASS: ${message}`);
  else {
    console.log(`FAIL: ${message}`);
    failures.push(message);
  }
}

const messages = [];
const ws = new WebSocket(
  `ws://${host}/parties/retro/${room}?${new URLSearchParams({ name: "Ada" })}`,
);
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("connect timeout")), 5000);
  ws.addEventListener("message", (event) => {
    messages.push(JSON.parse(String(event.data)));
    if (messages.some((message) => message.type === "sync")) {
      clearTimeout(timer);
      resolve(undefined);
    }
  });
  ws.addEventListener("error", () => {
    clearTimeout(timer);
    reject(new Error("socket error"));
  });
});

const sync = messages.find((message) => message.type === "sync");
ws.send(JSON.stringify({ type: "SET_SLACK_WEBHOOK", url: "https://example.com/hook" }));
ws.send(JSON.stringify({ type: "SET_SLACK_WEBHOOK", url: good }));

const deadline = Date.now() + 4000;
while (Date.now() < deadline) {
  const rejected = messages.some(
    (message) => message.type === "slack_hook" && message.rejected === true,
  );
  const saved = messages.some(
    (message) =>
      message.type === "slack_hook" &&
      message.configured === true &&
      message.rejected !== true,
  );
  if (rejected && saved) break;
  await new Promise((resolve) => setTimeout(resolve, 50));
}

check(
  messages.some((message) => message.type === "slack_hook" && message.rejected),
  "a non-Slack URL is rejected",
);
check(
  messages.some(
    (message) => message.type === "slack_hook" && message.configured === true,
  ),
  "a Slack incoming webhook is saved",
);

const stateRes = await fetch(`http://${host}/parties/retro/${room}`);
const body = await stateRes.text();
check(stateRes.ok, "the room state can be read");
check(!body.includes("hooks.slack.com"), "the webhook URL is not in the retro state");
check(!body.includes(good), "the saved secret is not in the retro state");
check(
  sync && !JSON.stringify(sync).includes("hooks.slack.com"),
  "the join sync does not carry a webhook URL",
);

ws.close();
// The socket can keep the event loop open after close, so exit explicitly.
process.exit(failures.length > 0 ? 1 : 0);
