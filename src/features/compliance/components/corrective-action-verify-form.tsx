"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { verifyCorrectiveActionAction } from "@/features/compliance/actions";

export function CorrectiveActionVerifyForm({ actionId }: { actionId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [checks, setChecks] = useState({
    evidenceReviewed: false,
    deficiencyCorrected: false,
    workersInformed: false,
    trainingCompleted: false,
    documentsUpdated: false,
    siteInspected: false,
  });

  function toggle(key: keyof typeof checks) {
    setChecks((c) => ({ ...c, [key]: !c[key] }));
  }

  function submit(approve: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await verifyCorrectiveActionAction({
        actionId,
        approve,
        ...checks,
        notes,
      });
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setMessage(approve ? "Verified and closed." : "Returned to In Progress.");
    });
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <h2 className="font-semibold">Verification</h2>
      <p className="text-sm text-muted-foreground">
        Confirm each item before closing. Rejecting returns the action to In
        Progress.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["evidenceReviewed", "Evidence reviewed"],
            ["deficiencyCorrected", "Deficiency corrected"],
            ["workersInformed", "Workers informed"],
            ["trainingCompleted", "Training completed"],
            ["documentsUpdated", "Documents updated"],
            ["siteInspected", "Site inspected (if required)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={checks[key]}
              onCheckedChange={() => toggle(key)}
            />
            {label}
          </label>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="vnotes">Verifier notes</Label>
        <Textarea
          id="vnotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() => submit(true)}
        >
          Verify & close
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => submit(false)}
        >
          Return to In Progress
        </Button>
        <Button asChild variant="ghost">
          <Link href="/compliance/corrective-actions">Back</Link>
        </Button>
      </div>
      {message ? (
        <p
          className={`text-sm ${
            message.includes("error") || message.includes("must")
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
