"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import {
  archivePlatformCompany,
  createPlatformCompany,
  findAvailableCompanySlug,
  updatePlatformCompany,
} from "@/services/admin.service";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function emptyToNull(value?: string | null) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

const optionalUrl = z.string().url().optional().or(z.literal(""));
const optionalHex = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Must be a hex color")
  .optional()
  .or(z.literal(""));

export const createCompanySchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().max(40).optional().or(z.literal("")),
  website: optionalUrl,
  address: z.string().max(240).optional().or(z.literal("")),
  logoUrl: optionalUrl,
  primaryColor: optionalHex,
  secondaryColor: optionalHex,
  isActive: z.boolean().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = createCompanySchema.extend({
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
    .optional(),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

export async function createCompanyAction(input: unknown) {
  const profile = await requireRole("SUPER_ADMIN");
  const parsed = createCompanySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const baseSlug = slugify(data.name);
  const slug = await findAvailableCompanySlug(baseSlug);

  const result = await createPlatformCompany({
    name: data.name,
    slug,
    phone: emptyToNull(data.phone),
    website: emptyToNull(data.website),
    address: emptyToNull(data.address),
    logoUrl: emptyToNull(data.logoUrl),
    primaryColor: emptyToNull(data.primaryColor),
    secondaryColor: emptyToNull(data.secondaryColor),
    isActive: data.isActive ?? true,
    createdById: profile.id,
  });

  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to create company." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/companies");
  redirect(`/admin/companies/${result.data.id}`);
}

export async function updateCompanyAction(companyId: string, input: unknown) {
  const profile = await requireRole("SUPER_ADMIN");
  const parsed = updateCompanySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const slug = data.slug?.trim()
    ? data.slug.trim()
    : data.name
      ? slugify(data.name)
      : undefined;

  const result = await updatePlatformCompany(
    companyId,
    {
      name: data.name,
      slug,
      phone: emptyToNull(data.phone),
      website: emptyToNull(data.website),
      address: emptyToNull(data.address),
      logoUrl: emptyToNull(data.logoUrl),
      primaryColor: emptyToNull(data.primaryColor),
      secondaryColor: emptyToNull(data.secondaryColor),
      isActive: data.isActive,
    },
    profile.id,
  );

  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to update company." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath(`/admin/companies/${companyId}/edit`);
  return { data: result.data };
}

export async function archiveCompanyAction(companyId: string) {
  const profile = await requireRole("SUPER_ADMIN");
  const result = await archivePlatformCompany(companyId, profile.id);

  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to archive company." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/companies");
  redirect("/admin/companies");
}

export async function deactivateCompanyAction(companyId: string) {
  const profile = await requireRole("SUPER_ADMIN");
  const result = await updatePlatformCompany(
    companyId,
    { isActive: false },
    profile.id,
  );

  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to deactivate company." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  return { data: result.data };
}
