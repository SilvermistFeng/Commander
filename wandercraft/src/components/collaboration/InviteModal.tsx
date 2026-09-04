"use client";

import { useState } from "react";
import { Check, Copy, Link2, Mail, Trash2, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Misc";
import { Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useAuthModal } from "@/components/providers/AuthProvider";
import type { TripOp } from "@/lib/tripClient";
import type { CollaboratorRole, TripDTO } from "@/types";

const ROLE_LABEL: Record<CollaboratorRole, string> = {
  OWNER: "Owner",
  EDITOR: "Can edit",
  VIEWER: "Can view",
};

export function InviteModal({
  trip,
  open,
  onClose,
  onUpdate,
}: {
  trip: TripDTO;
  open: boolean;
  onClose: () => void;
  onUpdate: (op: TripOp) => Promise<TripDTO | undefined>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("EDITOR");
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { push } = useToast();
  const { open: openAuth } = useAuthModal();

  // Collaboration is the one thing a guest genuinely can't do — there's no
  // server-side trip for anyone else to open.
  if (trip.isGuest) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        size="sm"
        title="Invite friends"
        subtitle="Sharing needs an account, so the trip lives somewhere your friends can reach it."
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>Not now</Button>
            <Button
              onClick={() => {
                onClose();
                openAuth({
                  mode: "signup",
                  reason: "Create an account and this trip comes with you — then you can invite whoever you like.",
                });
              }}
            >
              <UserPlus className="h-4 w-4" />
              Create an account
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-2">
          Right now this trip is saved in this browser only. Creating an account moves it to your account
          exactly as it is — every activity, document and expense — and unlocks shared editing.
        </p>
      </Modal>
    );
  }

  const inviteBase = typeof window !== "undefined" ? window.location.origin : "";

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setError("That email address doesn't look right.");
      return;
    }
    setBusy(true);
    const result = await onUpdate({ kind: "addCollaborator", email: trimmed, name: trimmed.split("@")[0], role });
    setBusy(false);
    if (result) {
      setEmail("");
      push(`Invited ${trimmed}`, "success", "Copy their link below to send it to them.");
    }
  }

  async function copyLink(token: string, linkRole: CollaboratorRole) {
    const url = `${inviteBase}/trips/${trip.id}?invite=${token}&role=${linkRole.toLowerCase()}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 1800);
    } catch {
      push("Couldn't copy automatically — select the link and copy it.", "error");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite friends"
      subtitle="Editors can change the plan. Viewers can only read it."
      footer={<Button variant="secondary" onClick={onClose}>Done</Button>}
    >
      <div className="space-y-5">
        <form onSubmit={invite} className="flex flex-wrap gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@example.com"
            className="min-w-[180px] flex-1"
          />
          <Select value={role} onChange={(e) => setRole(e.target.value as CollaboratorRole)} className="w-auto">
            <option value="EDITOR">Can edit</option>
            <option value="VIEWER">Can view</option>
          </Select>
          <Button type="submit" disabled={busy}>
            <Mail className="h-4 w-4" />
            Invite
          </Button>
        </form>

        {error ? (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger-wash px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            On this trip ({trip.collaborators.length})
          </p>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {trip.collaborators.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 bg-surface px-3.5 py-3">
                <Avatar name={c.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted">{c.email}</p>
                </div>

                {c.status === "PENDING" ? <Badge tone="amber">Invited</Badge> : null}

                {c.role === "OWNER" ? (
                  <Badge tone="accent">Owner</Badge>
                ) : (
                  <Select
                    value={c.role}
                    onChange={(e) =>
                      onUpdate({ kind: "updateCollaborator", id: c.id, role: e.target.value as CollaboratorRole })
                    }
                    className="h-8 w-auto text-xs"
                    aria-label={`Role for ${c.name}`}
                  >
                    <option value="EDITOR">{ROLE_LABEL.EDITOR}</option>
                    <option value="VIEWER">{ROLE_LABEL.VIEWER}</option>
                  </Select>
                )}

                <button
                  onClick={() => copyLink(c.inviteToken, c.role)}
                  title="Copy invite link"
                  aria-label={`Copy invite link for ${c.name}`}
                  className="rounded-md p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
                >
                  {copiedToken === c.inviteToken ? (
                    <Check className="h-4 w-4 text-sage" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </button>

                {c.role !== "OWNER" ? (
                  <button
                    onClick={() => onUpdate({ kind: "removeCollaborator", id: c.id })}
                    title="Remove from trip"
                    aria-label={`Remove ${c.name}`}
                    className="rounded-md p-1.5 text-muted transition hover:bg-danger-wash hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-line bg-surface-2 p-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            <Copy className="h-3 w-3" />
            How invites work
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
            Each person gets their own link. Opening it signs them in or prompts them to create an account,
            then adds them to this trip with the role you chose.
          </p>
        </div>
      </div>
    </Modal>
  );
}
