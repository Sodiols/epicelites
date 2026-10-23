"use client";

import { useState } from "react";
import { EyeSlashIcon, ArrowCounterClockwiseIcon, TrashIcon } from "@phosphor-icons/react";
import { deletePlayer, savePlayer, setPlayerActive } from "@/app/(admin)/EEAUTHOR/(console)/players/actions";
import { PlayerCard } from "@/components/roster/player-card";
import type { Player } from "@/lib/data/public";
import type { PlayerRow } from "@/lib/supabase/types";
import { slugify } from "@/lib/validations/common";
import { PLAYER_SOCIALS } from "@/lib/validations/player";
import { ActionButton } from "./confirm";
import { FormError, FormSection, TextAreaField, TextField, Toggle } from "./fields";
import { ImageUpload, type UploadedImage } from "./image-upload";
import { useActionForm } from "./use-action-form";

/**
 * Player editor with a live preview built from the real public roster card, so what you
 * see here is exactly what visitors will see.
 */
export function PlayerForm({ player }: { player?: PlayerRow }) {
  const { formProps, pending, errors, formError, dirty } = useActionForm(savePlayer, {
    redirectTo: (r) => (!player && r.data ? `/EEAUTHOR/players/${r.data.id}` : null),
  });
  const [name, setName] = useState(player?.display_name ?? "");
  const [role, setRole] = useState(player?.role ?? "Role to be confirmed");
  const [number, setNumber] = useState(player?.jersey_number ?? "");
  const [slug, setSlug] = useState(player?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(player));
  const [onBlack, setOnBlack] = useState(player?.photo_on_black ?? false);
  const [photo, setPhoto] = useState<UploadedImage | null>(
    player?.photo_url ? { url: player.photo_url, path: player.photo_path, width: player.photo_width, height: player.photo_height } : null,
  );

  const preview: Player = {
    id: player?.id ?? "preview",
    slug: slug || "preview",
    legacyKey: null,
    name: name || "Player name",
    inGameName: null,
    role: role || "Role",
    number: number || null,
    bio: null,
    image: photo ? { src: photo.url, width: photo.width ?? 800, height: photo.height ?? 1000, onBlack } : null,
    region: null,
    socials: [],
    isFeatured: false,
  };

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_20rem]">
      <form {...formProps} className="grid gap-8">
        {player && <input type="hidden" name="id" value={player.id} />}
        <FormError message={formError} />

        <FormSection title="Identity">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Display name"
              name="display_name"
              required
              maxLength={60}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              error={errors.display_name}
            />
            <TextField label="In-game name" name="in_game_name" maxLength={40} defaultValue={player?.in_game_name ?? ""} error={errors.in_game_name} />
            <TextField label="Role" name="role" required maxLength={60} value={role} onChange={(e) => setRole(e.target.value)} help="IGL, Rusher, Sniper, Support…" error={errors.role} />
            <TextField
              label="Jersey number"
              name="jersey_number"
              inputMode="numeric"
              pattern="[0-9]{1,3}"
              maxLength={3}
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
              error={errors.jersey_number}
            />
          </div>
          <TextField
            label="Profile link name"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            help={
              <>
                Profile address: /roster?player=<span className="text-bone">{slug || "…"}</span>. Not tied to the jersey number, so renumbering never breaks it.
                {player?.legacy_key && ` Old links using ?player=${player.legacy_key} keep working.`}
              </>
            }
            error={errors.slug}
          />
        </FormSection>

        <FormSection title="Photo" description="Cut-out portraits on a transparent background look best. Images are converted to WebP.">
          <div className="max-w-xs">
            <ImageUpload name="photo" label="Profile photograph" folder="players" aspect="aspect-[4/5]" initial={photo} onChange={setPhoto} />
          </div>
          <Toggle
            name="photo_on_black"
            label="Photo was shot on a black background"
            help="Blends the black backdrop into the card so it does not show as a box."
            checked={onBlack}
            onChange={setOnBlack}
          />
        </FormSection>

        <FormSection title="Profile">
          <TextAreaField label="Biography" name="bio" rows={5} maxLength={1200} defaultValue={player?.bio ?? ""} error={errors.bio} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Country or region" name="region" maxLength={60} defaultValue={player?.region ?? ""} error={errors.region} />
            <TextField label="Joined the team" name="joined_on" type="date" defaultValue={player?.joined_on ?? ""} error={errors.joined_on} />
          </div>
        </FormSection>

        <FormSection title="Social links" description="Full https:// links. Empty ones are hidden.">
          <div className="grid gap-5 sm:grid-cols-2">
            {PLAYER_SOCIALS.map((s) => (
              <TextField
                key={s}
                label={s === "x" ? "X" : s[0].toUpperCase() + s.slice(1)}
                name={`social_${s}`}
                type="url"
                inputMode="url"
                placeholder="https://"
                defaultValue={player?.socials?.[s] ?? ""}
                error={errors[`social_${s}`]}
              />
            ))}
          </div>
        </FormSection>

        <FormSection title="Visibility">
          <Toggle name="is_active" label="Active on the roster" help="Inactive players are hidden from the website but kept here." defaultChecked={player?.is_active ?? true} />
          <Toggle name="is_featured" label="Featured in the homepage lineup" help="If any players are featured, the homepage shows only them." defaultChecked={player?.is_featured ?? false} />
        </FormSection>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-night/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
          {dirty && <span className="mr-auto text-xs text-smoke">Unsaved changes</span>}
          {player &&
            (player.is_active ? (
              <ActionButton className="a-btn a-btn-ghost" action={() => setPlayerActive(player.id, false)}>
                <EyeSlashIcon size={16} aria-hidden /> Mark inactive
              </ActionButton>
            ) : (
              <ActionButton className="a-btn a-btn-ghost" action={() => setPlayerActive(player.id, true)}>
                <ArrowCounterClockwiseIcon size={16} aria-hidden /> Restore
              </ActionButton>
            ))}
          {player && (
            <ActionButton
              className="a-btn a-btn-danger"
              action={() => deletePlayer(player.id)}
              redirectTo="/EEAUTHOR/players"
              confirm={{
                title: `Remove ${player.display_name}?`,
                body: "The profile and its uploaded photo are deleted permanently. To hide the player but keep the record, mark them inactive instead.",
                confirmLabel: "Remove player",
                danger: true,
              }}
            >
              <TrashIcon size={16} aria-hidden /> Remove
            </ActionButton>
          )}
          <button type="submit" className="a-btn a-btn-primary" disabled={pending}>
            {pending ? "Saving…" : player ? "Save player" : "Add player"}
          </button>
        </div>
      </form>

      <aside aria-label="Live preview" className="xl:sticky xl:top-8 xl:self-start">
        <p className="a-label mb-2">Live preview</p>
        <div className="pointer-events-none">
          <PlayerCard player={preview} index={0} onOpen={() => {}} sizes="20rem" />
        </div>
        <p className="a-help mt-2">The card as it appears on the roster page.</p>
      </aside>
    </div>
  );
}
