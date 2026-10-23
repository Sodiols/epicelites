"use client";

import Image from "next/image";
import Link from "next/link";
import { TrashIcon } from "@phosphor-icons/react";
import { deletePartner, reorderPartners, savePartner } from "@/app/(admin)/EEAUTHOR/(console)/partners/actions";
import type { PartnerRow } from "@/lib/supabase/types";
import { PARTNER_TYPES } from "@/lib/labels";
import { ActionButton } from "./confirm";
import { FormError, FormSection, SelectField, TextField, Toggle } from "./fields";
import { ImageUpload } from "./image-upload";
import { SortableList } from "./sortable-list";
import { useActionForm } from "./use-action-form";
import { Badge } from "./ui";

export function PartnerForm({ partner }: { partner?: PartnerRow }) {
  const { formProps, pending, errors, formError } = useActionForm(savePartner, {
    redirectTo: (r) => (!partner && r.data ? `/EEAUTHOR/partners/${r.data.id}` : null),
  });
  return (
    <form {...formProps} className="grid gap-8">
      {partner && <input type="hidden" name="id" value={partner.id} />}
      <FormError message={formError} />
      <FormSection title="Partner" description="Only add real, confirmed partnerships.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Partner name" name="name" required maxLength={80} defaultValue={partner?.name} error={errors.name} />
          <SelectField label="Partner type" name="partner_type" defaultValue={partner?.partner_type ?? "partner"} options={Object.entries(PARTNER_TYPES).map(([value, label]) => ({ value, label }))} />
        </div>
        <TextField label="Website URL" name="website_url" type="url" inputMode="url" placeholder="https://" defaultValue={partner?.website_url ?? ""} error={errors.website_url} />
        <div className="max-w-xs">
          <ImageUpload name="logo" label="Logo" folder="partners" aspect="aspect-[2/1]" initial={partner?.logo_url ? { url: partner.logo_url, path: partner.logo_path, width: null, height: null } : null} help="A transparent PNG or WebP works best on the dark site." />
        </div>
        <Toggle name="is_active" label="Show on the website" help="Inactive partners are kept here but hidden from the About page." defaultChecked={partner?.is_active ?? false} />
      </FormSection>
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        {partner && (
          <ActionButton
            className="a-btn a-btn-danger"
            action={() => deletePartner(partner.id)}
            redirectTo="/EEAUTHOR/partners"
            confirm={{ title: `Remove ${partner.name}?`, body: "The partner and its uploaded logo are deleted permanently.", confirmLabel: "Remove", danger: true }}
          >
            <TrashIcon size={16} aria-hidden /> Remove
          </ActionButton>
        )}
        <button type="submit" className="a-btn a-btn-primary" disabled={pending}>
          {pending ? "Saving…" : partner ? "Save partner" : "Add partner"}
        </button>
      </div>
    </form>
  );
}

export function PartnerList({ partners }: { partners: Pick<PartnerRow, "id" | "name" | "logo_url" | "partner_type" | "is_active">[] }) {
  return (
    <SortableList
      items={partners}
      onSave={reorderPartners}
      label={(p) => p.name}
      render={(p) => (
        <div className="flex items-center gap-3">
          <span className="relative h-10 w-20 shrink-0 bg-carbon">{p.logo_url && <Image src={p.logo_url} alt="" fill sizes="80px" className="object-contain p-1" />}</span>
          <Link href={`/EEAUTHOR/partners/${p.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-violet">
            {p.name}
          </Link>
          <span className="hidden text-xs text-smoke sm:inline">{PARTNER_TYPES[p.partner_type]}</span>
          {p.is_active ? <Badge tone="green">Shown</Badge> : <Badge>Hidden</Badge>}
        </div>
      )}
    />
  );
}
