"use client";

import Image from "next/image";
import { useState } from "react";
import { saveMedia } from "@/app/(admin)/EEAUTHOR/(console)/media/actions";
import type { MediaRow } from "@/lib/supabase/types";
import { MEDIA_CATEGORIES } from "@/lib/labels";
import { youTubeId } from "@/lib/video";
import { FormError, FormSection, SelectField, TextAreaField, TextField, Toggle } from "./fields";
import { ImageUpload } from "./image-upload";
import { useActionForm } from "./use-action-form";

export function MediaForm({ item, players, kind: initialKind }: { item?: MediaRow; players: { id: string; display_name: string }[]; kind?: "image" | "video" }) {
  const { formProps, pending, errors, formError, dirty } = useActionForm(saveMedia, {
    redirectTo: (r) => (!item && r.data ? `/EEAUTHOR/media/${r.data.id}` : null),
  });
  const kind = item?.kind ?? initialKind ?? "image";
  const [video, setVideo] = useState(item?.video_url ?? "");
  const vid = youTubeId(video);

  return (
    <form {...formProps} className="grid gap-8">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="kind" value={kind} />
      <FormError message={formError} />

      <FormSection title={kind === "video" ? "Video" : "File"} description={kind === "video" ? "YouTube links are supported. An optional poster image replaces YouTube's thumbnail." : "Replacing the file keeps this item's details and position."}>
        {kind === "video" && (
          <>
            <TextField label="YouTube link" name="video_url" type="url" inputMode="url" required placeholder="https://www.youtube.com/watch?v=…" value={video} onChange={(e) => setVideo(e.target.value)} error={errors.video_url} />
            {vid && (
              <div className="relative aspect-video max-w-md overflow-hidden bg-carbon">
                <Image src={`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`} alt="" fill sizes="28rem" className="object-cover" />
              </div>
            )}
          </>
        )}
        <div className="max-w-sm">
          <ImageUpload
            name="file"
            label={kind === "video" ? "Poster image (optional)" : "Image"}
            folder="media"
            initial={item?.url ? { url: item.url, path: item.storage_path, width: item.width, height: item.height } : null}
            allowClear={kind === "video"}
          />
          {errors.file_url && <p className="mt-1 text-xs text-[#ff9aa6]">{errors.file_url}</p>}
        </div>
        {kind === "image" && <Toggle name="on_black" label="Photo was shot on a black background" defaultChecked={item?.on_black ?? false} help="Blends black into the dark gallery tiles." />}
      </FormSection>

      <FormSection title="Description">
        <TextField label="Title" name="title" maxLength={120} defaultValue={item?.title ?? ""} error={errors.title} />
        <TextAreaField label="Caption" name="caption" rows={2} maxLength={300} defaultValue={item?.caption ?? ""} help="Shown under the image. For a player photo, leave empty to use the player's current name." error={errors.caption} />
        <TextAreaField label="Alt text" name="alt_text" rows={2} maxLength={300} defaultValue={item?.alt_text ?? ""} help="What the image shows, for screen readers and search. Required to publish an image." error={errors.alt_text} />
      </FormSection>

      <FormSection title="Organize">
        <div className="grid gap-5 sm:grid-cols-3">
          <SelectField label="Category" name="category" defaultValue={item?.category ?? "team"} options={Object.entries(MEDIA_CATEGORIES).map(([value, label]) => ({ value, label }))} />
          <TextField label="Collection" name="collection" maxLength={60} defaultValue={item?.collection ?? ""} help="Optional grouping, e.g. a tournament name." />
          <SelectField
            label="Related player"
            name="player_id"
            defaultValue={item?.player_id ?? ""}
            options={[{ value: "", label: "None" }, ...players.map((p) => ({ value: p.id, label: p.display_name }))]}
            error={errors.player_id}
          />
        </div>
      </FormSection>

      <FormSection title="Visibility">
        <Toggle name="is_published" label="Published in the gallery" defaultChecked={item?.is_published ?? false} />
        <Toggle name="is_featured" label="Featured" help="Featured items are shown first in the gallery." defaultChecked={item?.is_featured ?? false} />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-line bg-night/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        {dirty && <span className="mr-auto text-xs text-smoke">Unsaved changes</span>}
        <button type="submit" className="a-btn a-btn-primary" disabled={pending}>
          {pending ? "Saving…" : item ? "Save" : kind === "video" ? "Add video" : "Add media"}
        </button>
      </div>
    </form>
  );
}
