"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentProfile, requireAuth } from "@/lib/auth/session";
import type { UserRole } from "@/types/roles";
import { hasDatabaseConfig } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  profileUpdateSchema,
  signupSchema,
  userSettingsSchema,
  type ProfileUpdateInput,
  type SignupInput,
  type UserSettingsInput,
} from "@/lib/validations";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signupCompanyAction(input: SignupInput) {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (!hasDatabaseConfig()) {
    return { error: "Database is not configured." };
  }

  const data = parsed.data;
  const supabase = await createClient();
  const admin = createAdminClient();

  const baseSlug = slugify(data.companyName);
  let slug = baseSlug || "company";
  let attempt = 0;

  while (await prisma.company.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const company = await prisma.company.create({
    data: {
      name: data.companyName,
      slug,
    },
  });

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      first_name: data.firstName,
      last_name: data.lastName,
      role: "COMPANY_ADMIN" satisfies UserRole,
      company_id: company.id,
    },
    app_metadata: {
      role: "COMPANY_ADMIN" satisfies UserRole,
      company_id: company.id,
    },
  });

  if (authError || !authData.user) {
    await prisma.company.delete({ where: { id: company.id } });
    return { error: authError?.message ?? "Unable to create account" };
  }

  // Ensure profile is linked to the company (trigger may race)
  await prisma.profile.upsert({
    where: { authUserId: authData.user.id },
    create: {
      authUserId: authData.user.id,
      companyId: company.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: "COMPANY_ADMIN",
      settings: { create: {} },
    },
    update: {
      companyId: company.id,
      firstName: data.firstName,
      lastName: data.lastName,
      role: "COMPANY_ADMIN",
      isActive: true,
    },
  });

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (signInError) {
    return {
      error:
        "Account created, but automatic sign-in failed. Please sign in manually.",
    };
  }

  redirect("/");
}

export async function updateProfileAction(input: ProfileUpdateInput) {
  const profile = await requireAuth();
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone || null,
      title: parsed.data.title || null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/settings");
  return { error: null };
}

export async function updateUserSettingsAction(input: UserSettingsInput) {
  const profile = await requireAuth();
  const parsed = userSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.userSettings.upsert({
    where: { profileId: profile.id },
    create: {
      profileId: profile.id,
      ...parsed.data,
    },
    update: parsed.data,
  });

  revalidatePath("/settings");
  return { error: null };
}

export async function updateAvatarAction(formData: FormData) {
  const profile = await requireAuth();
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Avatar must be an image file." };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: "Avatar must be 2MB or smaller." };
  }

  const supabase = await createClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${profile.authUserId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const avatarUrl = `${publicUrl}?v=${Date.now()}`;

  await prisma.profile.update({
    where: { id: profile.id },
    data: { avatarUrl },
  });

  revalidatePath("/profile");
  revalidatePath("/");
  return { error: null, avatarUrl };
}

export async function removeAvatarAction() {
  const profile = await requireAuth();
  const supabase = await createClient();

  if (profile.avatarUrl) {
    const { data: files } = await supabase.storage
      .from("avatars")
      .list(profile.authUserId);

    if (files?.length) {
      await supabase.storage
        .from("avatars")
        .remove(files.map((file) => `${profile.authUserId}/${file.name}`));
    }
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: { avatarUrl: null },
  });

  revalidatePath("/profile");
  return { error: null };
}

export async function updateCompanyAction(input: {
  name: string;
  phone?: string;
  website?: string;
  address?: string;
}) {
  const profile = await requireAuth();

  if (profile.role !== "SUPER_ADMIN" && profile.role !== "COMPANY_ADMIN") {
    return { error: "Only company admins can update company settings." };
  }

  if (!profile.companyId) {
    return { error: "No company associated with this account." };
  }

  await prisma.company.update({
    where: { id: profile.companyId },
    data: {
      name: input.name,
      phone: input.phone || null,
      website: input.website || null,
      address: input.address || null,
    },
  });

  revalidatePath("/settings");
  return { error: null };
}

export async function touchLastLoginAction() {
  const profile = await getCurrentProfile();
  if (!profile) return;
  await prisma.profile.update({
    where: { id: profile.id },
    data: { lastLoginAt: new Date() },
  });
}
