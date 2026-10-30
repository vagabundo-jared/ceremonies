"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Facilitator-only. The URL is sent to the room server and is not kept in this component after save. */
export function SlackHookField({
  configured,
  notice,
  onSave,
}: {
  configured: boolean;
  notice: "saved" | "cleared" | "rejected" | null;
  onSave: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const save = () => {
    onSave(url.trim());
    setUrl("");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
      >
        Slack {configured ? "on" : "off"}
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-2 w-72 rounded-md border-2 border-border bg-card p-3 text-left shadow-hard">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Incoming webhook
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste a Slack incoming webhook. The room posts the themes, votes, and
            actions when the retro closes. Other people do not see the URL.
          </p>
          <Input
            type="password"
            value={url}
            autoComplete="off"
            placeholder="https://hooks.slack.com/services/..."
            aria-label="Slack incoming webhook"
            onChange={(event) => setUrl(event.target.value)}
            className="mt-2 h-8 text-xs"
          />
          <div className="mt-2 flex gap-2">
            <Button type="button" size="sm" className="h-8" onClick={save}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => onSave("")}
            >
              Clear
            </Button>
          </div>
          {notice === "saved" && (
            <p className="mt-2 text-xs text-muted-foreground">
              Saved on this room. The URL is not shown here.
            </p>
          )}
          {notice === "cleared" && (
            <p className="mt-2 text-xs text-muted-foreground">Hook cleared.</p>
          )}
          {notice === "rejected" && (
            <p className="mt-2 text-xs text-destructive">
              That URL was rejected. The saved hook was not changed.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
