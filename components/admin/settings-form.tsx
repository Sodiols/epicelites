"use client";

import { saveSettings } from "@/app/(admin)/EEAUTHOR/(console)/settings/actions";
import type { SettingsRow } from "@/lib/supabase/types";
import { FormError, FormSection, SelectField, TextAreaField, TextField } from "./fields";
import { ImageUpload } from "./image-upload";
import { useActionForm } from "./use-action-form";

type Option = { value: string; label: string };

const img = (url: string) => ({ url, path: null, width: null, height: null });

export function SettingsForm({ settings, matches, news }: { settings: SettingsRow; matches: Option[]; news: Option[] }) {
  const { formProps, pending, errors, formError, dirty } = useActionForm(saveSettings);
  const s = settings;

  return (
    <form {...formProps} className="grid gap-10">
      <FormError message={formError} />

      <FormSection title="General" description="Team identity used across the site, page titles and search results.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Team name" name="team_name" required maxLength={80} defaultValue={s.team_name} error={errors.team_name} />
          <TextField label="Game" name="game" required maxLength={60} defaultValue={s.game} error={errors.game} />
          <TextField label="Tagline" name="tagline" maxLength={80} defaultValue={s.tagline ?? ""} error={errors.tagline} />
          <TextField label="Location" name="location" maxLength={80} defaultValue={s.location ?? ""} help="Optional. Shown in the footer and on Contact only if set." error={errors.location} />
        </div>
        <TextAreaField label="Description" name="description" rows={2} maxLength={400} defaultValue={s.description ?? ""} help="Default description for search engines." error={errors.description} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Contact email" name="contact_email" type="email" defaultValue={s.contact_email ?? ""} help="Shown on the Contact page. Form messages still arrive in Messages." error={errors.contact_email} />
          <TextField label="Website domain" name="site_url" type="url" placeholder="https://epicelites.gg" defaultValue={s.site_url ?? ""} help="Used for canonical links, the sitemap and sharing." error={errors.site_url} />
        </div>
      </FormSection>

      <FormSection title="Social accounts" description="Full https:// links to official profiles. Empty ones are hidden everywhere.">
        <div className="grid gap-5 sm:grid-cols-2">
          {(["facebook", "instagram", "youtube", "tiktok", "discord"] as const).map((n) => (
            <TextField
              key={n}
              label={n === "tiktok" ? "TikTok" : n === "youtube" ? "YouTube" : n[0].toUpperCase() + n.slice(1)}
              name={`${n}_url`}
              type="url"
              inputMode="url"
              placeholder="https://"
              defaultValue={s[`${n}_url`] ?? ""}
              error={errors[`${n}_url`]}
            />
          ))}
        </div>
      </FormSection>

      <FormSection title="Brand assets" description="Removing an image restores the original artwork.">
        <div className="grid gap-6 sm:grid-cols-3">
          <ImageUpload name="logo" label="Team logo" folder="brand" aspect="aspect-[4/3]" initial={img(s.logo_url)} />
          <ImageUpload name="favicon" label="Favicon" folder="brand" aspect="aspect-square" initial={img(s.favicon_url)} help="Square, at least 192 px." />
          <ImageUpload name="og_image" label="Social sharing image" folder="brand" aspect="aspect-[1200/630]" fit="object-cover" initial={img(s.og_image_url)} help="1200 × 630 px works best." />
        </div>
      </FormSection>

      <FormSection title="Jersey" description="Drives the scroll-turning jersey on the homepage and the 3D viewer on Media.">
        <div className="grid gap-6 sm:grid-cols-3">
          <ImageUpload name="jersey_front" label="Jersey front" folder="brand" aspect="aspect-[711/1106]" fit="object-cover" initial={img(s.jersey_front_url)} />
          <ImageUpload name="jersey_back" label="Jersey back" folder="brand" aspect="aspect-[711/1106]" fit="object-cover" initial={img(s.jersey_back_url)} />
          <ImageUpload name="kit_image" label="Kit presentation image" folder="brand" aspect="aspect-[1422/1106]" fit="object-cover" initial={img(s.kit_image_url)} />
        </div>
        <TextField label="Edition or season label" name="jersey_edition_label" maxLength={60} defaultValue={s.jersey_edition_label ?? ""} placeholder="2026 home kit" error={errors.jersey_edition_label} />
      </FormSection>

      <FormSection title="Homepage" description="Text inside the existing homepage sections. The layout itself is fixed.">
        <TextField label="Hero subtitle" name="hero_subtitle" maxLength={140} defaultValue={s.hero_subtitle ?? ""} help="Under the EPIC ELITES headline. Keep it to one sentence." error={errors.hero_subtitle} />
        <TextAreaField label="Team statement" name="statement" rows={3} maxLength={400} defaultValue={s.statement ?? ""} help="The paragraph that lights up word by word as visitors scroll." error={errors.statement} />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Featured match" name="featured_match_id" defaultValue={s.featured_match_id ?? ""} options={[{ value: "", label: "Automatic: the next match" }, ...matches]} help="Only published upcoming matches." />
          <SelectField label="Featured news" name="featured_news_id" defaultValue={s.featured_news_id ?? ""} options={[{ value: "", label: "Automatic: latest featured article" }, ...news]} help="Lead story on the News page." />
        </div>
        <p className="a-help">Featured players are chosen on each player&apos;s page; featured media on each media item.</p>
        <TextAreaField label="Footer description" name="footer_description" rows={2} maxLength={200} defaultValue={s.footer_description ?? ""} error={errors.footer_description} />
      </FormSection>

      <FormSection title="About page">
        <TextAreaField label="Lead sentence" name="about_lead" rows={2} maxLength={200} defaultValue={s.about_lead ?? ""} error={errors.about_lead} />
        <TextAreaField label="Team description" name="about_body" rows={5} maxLength={1200} defaultValue={s.about_body ?? ""} help="Separate paragraphs with a blank line." error={errors.about_body} />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-night/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        {dirty && <span className="mr-auto text-xs text-smoke">Unsaved changes</span>}
        <button type="submit" className="a-btn a-btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
