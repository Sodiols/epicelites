"use client";

import { grantAccess, revokeAccess, updateAdmin } from "@/app/(admin)/EEAUTHOR/(console)/administrators/actions";
import type { AdminUserRow } from "@/lib/supabase/types";
import { ActionButton } from "./confirm";
import { FormError, SelectField, TextField } from "./fields";
import { useActionForm } from "./use-action-form";
import { Badge } from "./ui";

export function GrantAccessForm() {
  const { formProps, pending, errors, formError } = useActionForm(grantAccess, { reset: true });
  return (
    <form {...formProps} className="grid gap-4">
      <FormError message={formError} />
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_10rem]">
        <TextField label="Email of an existing account" name="email" type="email" required error={errors.email} />
        <TextField label="Display name" name="display_name" maxLength={80} error={errors.display_name} />
        <SelectField
          label="Role"
          name="role"
          defaultValue="editor"
          options={[
            { value: "editor", label: "Editor" },
            { value: "owner", label: "Owner" },
          ]}
        />
      </div>
      <div className="flex justify-end">
        <button type="submit" className="a-btn a-btn-primary" disabled={pending}>
          {pending ? "Granting…" : "Grant access"}
        </button>
      </div>
    </form>
  );
}

export function AdminRow({ admin, isSelf }: { admin: AdminUserRow; isSelf: boolean }) {
  const name = admin.display_name ?? admin.email;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-3 py-3">
      <span className="min-w-0 flex-1 basis-56">
        <span className="block truncate font-medium">
          {name}
          {isSelf && <span className="text-smoke"> (you)</span>}
        </span>
        <span className="block truncate text-xs text-smoke">{admin.email}</span>
      </span>
      <span className="flex gap-1.5">
        <Badge tone={admin.role === "owner" ? "violet" : "neutral"}>{admin.role === "owner" ? "Owner" : "Editor"}</Badge>
        {admin.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Disabled</Badge>}
      </span>
      <span className="flex flex-wrap gap-1.5">
        <ActionButton
          className="a-btn a-btn-secondary a-btn-sm"
          action={() => updateAdmin(admin.user_id, { role: admin.role === "owner" ? "editor" : "owner" })}
          confirm={{
            title: admin.role === "owner" ? `Make ${name} an editor?` : `Make ${name} an owner?`,
            body: admin.role === "owner" ? "They will lose access to this page." : "Owners can add, change and remove every administrator, including you.",
            confirmLabel: "Change role",
          }}
        >
          {admin.role === "owner" ? "Make editor" : "Make owner"}
        </ActionButton>
        <ActionButton
          className="a-btn a-btn-secondary a-btn-sm"
          action={() => updateAdmin(admin.user_id, { is_active: !admin.is_active })}
          confirm={admin.is_active ? { title: `Disable ${name}?`, body: "Their next page load or save is refused. You can restore access later.", confirmLabel: "Disable", danger: true } : undefined}
        >
          {admin.is_active ? "Disable" : "Restore"}
        </ActionButton>
        <ActionButton
          className="a-btn a-btn-danger a-btn-sm"
          action={() => revokeAccess(admin.user_id)}
          confirm={{ title: `Revoke ${name}'s access?`, body: "They are removed from the dashboard. Their Supabase account remains; delete it in Supabase Authentication if needed.", confirmLabel: "Revoke access", danger: true }}
        >
          Revoke
        </ActionButton>
      </span>
    </li>
  );
}
