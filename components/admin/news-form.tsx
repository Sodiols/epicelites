"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArchiveIcon, EyeIcon, EyeSlashIcon, TrashIcon } from "@phosphor-icons/react";
import { deleteNews, saveNews, setNewsStatus } from "@/app/(admin)/EEAUTHOR/(console)/news/actions";
import type { NewsRow } from "@/lib/supabase/types";
import { NEWS_CATEGORIES } from "@/lib/labels";
import { DEFAULT_TIME_ZONE, formatMatchTime, timeZoneOptions, utcToZonedInput } from "@/lib/time";
import { slugify } from "@/lib/validations/common";
import { ActionButton } from "./confirm";
import { FormError, FormSection, SelectField, TextAreaField, TextField, Toggle } from "./fields";
import { ImageUpload } from "./image-upload";
import { MarkdownEditor } from "./markdown-editor";
import { useActionForm } from "./use-action-form";
import { newsState, NewsStatusBadge } from "./status";

export function NewsForm({ post }: { post?: NewsRow }) {
  const { formProps, pending, errors, formError, dirty } = useActionForm(saveNews, {
    redirectTo: (r) => (!post && r.data ? `/EEAUTHOR/news/${r.data.id}` : null),
  });
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [summary, setSummary] = useState(post?.summary ?? "");
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seo_description ?? "");
  const [zones, setZones] = useState([DEFAULT_TIME_ZONE]);
  useEffect(() => setZones(timeZoneOptions()), []);

  const state = post ? newsState(post.status, post.published_at) : "draft";
  const live = state === "published" || state === "scheduled";

  return (
    <form {...formProps} className="grid gap-8">
      {post && <input type="hidden" name="id" value={post.id} />}
      <FormError message={formError} />

      <FormSection title="Article">
        <TextField
          label="Headline"
          name="title"
          required
          maxLength={140}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          error={errors.title}
        />
        <TextField
          label="URL slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          help={<>Article address: /news/<span className="text-bone">{slug || "…"}</span>{post && state === "published" ? ". Changing it breaks links already shared." : ""}</>}
          error={errors.slug}
        />
        <TextAreaField
          label="Short summary"
          name="summary"
          rows={2}
          maxLength={300}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          help={`${summary.length}/300. Shown in listings and as the default search description.`}
          error={errors.summary}
        />
        <MarkdownEditor name="body" defaultValue={post?.body ?? ""} error={errors.body} />
      </FormSection>

      <FormSection title="Cover">
        <div className="grid gap-5 sm:grid-cols-[18rem_1fr]">
          <ImageUpload
            name="cover"
            label="Cover image"
            folder="news"
            aspect="aspect-[16/10]"
            fit="object-cover"
            initial={post?.cover_url ? { url: post.cover_url, path: post.cover_path, width: null, height: null } : null}
          />
          <TextAreaField
            label="Image alt text"
            name="cover_alt"
            rows={3}
            maxLength={200}
            defaultValue={post?.cover_alt ?? ""}
            help="Describe what the image shows. Required when there is a cover."
            error={errors.cover_alt}
          />
        </div>
      </FormSection>

      <FormSection title="Details">
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Category"
            name="category"
            defaultValue={post?.category ?? "team_news"}
            options={Object.entries(NEWS_CATEGORIES).map(([value, label]) => ({ value, label }))}
          />
          <TextField label="Author or byline" name="author_name" maxLength={80} defaultValue={post?.author_name ?? ""} error={errors.author_name} />
        </div>
        <Toggle name="is_featured" label="Featured story" help="Shown as the lead story on the News page while published." defaultChecked={post?.is_featured ?? false} />
      </FormSection>

      <FormSection title="Search and sharing" description="Optional. Falls back to the headline and summary.">
        <TextField label="SEO title" name="seo_title" maxLength={70} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} help={`${seoTitle.length}/70`} error={errors.seo_title} />
        <TextAreaField label="SEO description" name="seo_description" rows={2} maxLength={170} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} help={`${seoDescription.length}/170`} error={errors.seo_description} />
        <div className="border border-line bg-night p-4 text-sm">
          <p className="text-xs text-smoke">Search result preview</p>
          <p className="mt-1 truncate text-[#a993ff]">{seoTitle || title || "Headline"} | Epic Elites</p>
          <p className="line-clamp-2 text-smoke">{seoDescription || summary || "The summary appears here."}</p>
        </div>
      </FormSection>

      <FormSection title="Publishing" description="Scheduled articles go live by themselves at the chosen time; nobody needs to be signed in.">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-smoke">Current state:</span>
          {post ? <NewsStatusBadge status={post.status} publishedAt={post.published_at} /> : <span>New draft</span>}
          {post?.published_at && (
            <span className="text-smoke">
              {state === "scheduled" ? "goes live" : "published"} {formatMatchTime(post.published_at, DEFAULT_TIME_ZONE).full}
            </span>
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Schedule for"
            name="publish_local"
            type="datetime-local"
            defaultValue={post?.published_at && state === "scheduled" ? utcToZonedInput(post.published_at, DEFAULT_TIME_ZONE) : ""}
            help="Only used by Schedule."
            error={errors.publish_local}
          />
          <SelectField label="Time zone" name="publish_tz" defaultValue={DEFAULT_TIME_ZONE} options={zones.map((z) => ({ value: z, label: z.replace(/_/g, " ") }))} />
        </div>
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-night/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        {dirty && <span className="mr-auto text-xs text-smoke">Unsaved changes</span>}
        {post && (
          <Link href={`/EEAUTHOR/news/${post.id}/preview`} target="_blank" className="a-btn a-btn-ghost">
            <EyeIcon size={16} aria-hidden /> Preview
          </Link>
        )}
        {post && live && (
          <ActionButton className="a-btn a-btn-ghost" action={() => setNewsStatus(post.id, "draft")}>
            <EyeSlashIcon size={16} aria-hidden /> Unpublish
          </ActionButton>
        )}
        {post && post.status !== "archived" && (
          <ActionButton
            className="a-btn a-btn-ghost"
            action={() => setNewsStatus(post.id, "archived")}
            confirm={{ title: "Archive this article?", body: "It is removed from the website but kept here.", confirmLabel: "Archive" }}
          >
            <ArchiveIcon size={16} aria-hidden /> Archive
          </ActionButton>
        )}
        {post && (
          <ActionButton
            className="a-btn a-btn-danger"
            action={() => deleteNews(post.id)}
            redirectTo="/EEAUTHOR/news"
            confirm={{ title: "Delete this article?", body: "It is permanently removed, including its cover image. Archive it instead to keep a copy.", confirmLabel: "Delete permanently", danger: true }}
          >
            <TrashIcon size={16} aria-hidden /> Delete
          </ActionButton>
        )}
        {live ? (
          <button type="submit" name="intent" value="update" className="a-btn a-btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        ) : (
          <>
            <button type="submit" name="intent" value="draft" className="a-btn a-btn-secondary" disabled={pending}>
              Save Draft
            </button>
            <button type="submit" name="intent" value="schedule" className="a-btn a-btn-secondary" disabled={pending}>
              Schedule Publication
            </button>
            <button type="submit" name="intent" value="publish" className="a-btn a-btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Publish Now"}
            </button>
          </>
        )}
        {state === "scheduled" && (
          <button type="submit" name="intent" value="schedule" className="a-btn a-btn-secondary" disabled={pending}>
            Reschedule
          </button>
        )}
      </div>
    </form>
  );
}
