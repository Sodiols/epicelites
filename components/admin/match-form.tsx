"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { saveMatch } from "@/app/(admin)/EEAUTHOR/(console)/matches/actions";
import { MATCH_FORMATS } from "@/lib/labels";
import { DEFAULT_TIME_ZONE, formatMatchTime, timeZoneOptions, utcToZonedInput, zonedInputToUtc } from "@/lib/time";
import type { MatchRow } from "@/lib/supabase/types";
import { FormError, FormSection, SelectField, TextAreaField, TextField, Toggle } from "./fields";
import { ImageUpload } from "./image-upload";
import { useActionForm } from "./use-action-form";
import { easeOutExpo } from "@/lib/motion";

type Format = MatchRow["format"];

export function MatchForm({ match }: { match?: MatchRow }) {
  const { formProps, pending, errors, formError, dirty } = useActionForm(saveMatch, {
    redirectTo: (r) => (!match && r.data ? `/EEAUTHOR/matches/${r.data.id}` : null),
  });
  const [format, setFormat] = useState<Format>(match?.format ?? "battle_royale");
  const [scoring, setScoring] = useState(match?.scoring ?? "placement");
  const [tz, setTz] = useState(match?.time_zone ?? DEFAULT_TIME_ZONE);
  const [local, setLocal] = useState(match ? utcToZonedInput(match.starts_at, match.time_zone) : "");
  // Zone lists and the viewer's own zone differ between server and browser, so they are
  // filled in after hydration.
  const [zones, setZones] = useState<string[]>([tz]);
  const [viewerTz, setViewerTz] = useState<string | null>(null);
  useEffect(() => {
    setZones(timeZoneOptions());
    setViewerTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const effectiveScoring = format === "battle_royale" ? "placement" : format === "clash_squad" ? "head_to_head" : scoring;
  const preview = local ? zonedInputToUtc(local, tz) : null;
  const statusOptions = [
    { value: "upcoming", label: "Upcoming" },
    { value: "live", label: "Live" },
    { value: "postponed", label: "Postponed" },
    { value: "cancelled", label: "Cancelled" },
    ...(match?.status === "completed" ? [{ value: "completed", label: "Completed" }] : []),
  ];

  return (
    <form {...formProps} className="grid gap-8">
      {match && <input type="hidden" name="id" value={match.id} />}
      <FormError message={formError} />

      <FormSection title="Event" description="Battle Royale lobbies are listed by tournament and stage, not as a one-on-one.">
        <TextField label="Tournament or event name" name="event_name" required defaultValue={match?.event_name} error={errors.event_name} maxLength={120} />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Match format"
            name="format"
            value={format}
            onChange={(e) => setFormat(e.target.value as Format)}
            options={Object.entries(MATCH_FORMATS).map(([value, label]) => ({ value, label }))}
            error={errors.format}
          />
          <TextField label="Stage or round" name="stage" defaultValue={match?.stage ?? ""} placeholder="Group B, Week 2 finals…" error={errors.stage} maxLength={80} />
        </div>
        <AnimatePresence initial={false}>
          {(format === "scrim" || format === "other") && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: easeOutExpo }} className="overflow-hidden">
              <SelectField
                label="How is this scored?"
                name="scoring"
                value={scoring}
                onChange={(e) => setScoring(e.target.value as typeof scoring)}
                options={[
                  { value: "placement", label: "Placement table (lobby)" },
                  { value: "head_to_head", label: "Head-to-head score" },
                ]}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {effectiveScoring === "head_to_head" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: easeOutExpo }} className="overflow-hidden">
              <TextField label="Opponent" name="opponent" defaultValue={match?.opponent ?? ""} help="Leave empty if not announced yet; it shows as Opponent TBA." error={errors.opponent} maxLength={80} />
            </motion.div>
          )}
        </AnimatePresence>
        <TextField label="Organizer" name="organizer" defaultValue={match?.organizer ?? ""} error={errors.organizer} maxLength={80} />
      </FormSection>

      <FormSection title="Schedule" description="Stored as an exact moment in time. Visitors see it in the event's own time zone.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Date and start time"
            name="starts_local"
            type="datetime-local"
            required
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            error={errors.starts_local ?? errors.starts_at}
          />
          <SelectField
            label="Time zone"
            name="time_zone"
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            options={zones.map((z) => ({ value: z, label: z.replace(/_/g, " ") }))}
            error={errors.time_zone}
          />
        </div>
        {preview && (
          <p className="a-help">
            Shows on the website as <span className="text-bone">{formatMatchTime(preview.toISOString(), tz).full}</span>
            {viewerTz && viewerTz !== tz && <> (your time: {formatMatchTime(preview.toISOString(), viewerTz).time})</>}
          </p>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Match status" name="status" defaultValue={match?.status ?? "upcoming"} options={statusOptions} help="Completed is set from the result form." error={errors.status} />
        </div>
      </FormSection>

      <FormSection title="Details">
        <TextAreaField label="Description" name="description" rows={4} defaultValue={match?.description ?? ""} error={errors.description} maxLength={2000} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Livestream URL" name="stream_url" type="url" inputMode="url" placeholder="https://" defaultValue={match?.stream_url ?? ""} error={errors.stream_url} />
          <TextField label="Tournament information URL" name="info_url" type="url" inputMode="url" placeholder="https://" defaultValue={match?.info_url ?? ""} error={errors.info_url} />
        </div>
        <div className="max-w-sm">
          <ImageUpload
            name="cover"
            label="Tournament logo or cover"
            folder="matches"
            aspect="aspect-[16/9]"
            initial={match?.cover_url ? { url: match.cover_url, path: match.cover_path, width: null, height: null } : null}
          />
        </div>
      </FormSection>

      <FormSection title="Visibility" description="Drafts are never shown to visitors, whatever their status.">
        <Toggle name="is_published" label="Published on the website" defaultChecked={match?.is_published ?? false} />
        <Toggle name="is_featured" label="Feature on the homepage" help="The homepage shows the featured upcoming match, otherwise the soonest one." defaultChecked={match?.is_featured ?? false} />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-night/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        {dirty && <span className="mr-auto text-xs text-smoke">Unsaved changes</span>}
        <button type="submit" className="a-btn a-btn-primary" disabled={pending}>
          {pending ? "Saving…" : match ? "Save match" : "Create match"}
        </button>
      </div>
    </form>
  );
}
