"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminRole } from "@/lib/auth/permissions";
import { requireAuth, requireCompanyId, requirePermission } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "@/lib/validations/employee";
import {
  createEmployeeRecord,
  findUserByEmail,
  softDeleteEmployee,
  updateEmployeePhoto,
  updateEmployeeRecord,
} from "@/services/people.service";

function parseHireDate(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createEmployeeAction(input: unknown) {
  await requirePermission("people");
  const profile = await requireAuth();

  if (!isAdminRole(profile.role)) {
    return { error: "Only company admins can create employees." };
  }

  const { companyId } = await requireCompanyId();
  const parsed = createEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  let authUserId: string;

  try {
    const existingUser = await findUserByEmail(data.email);
    if (existingUser) {
      authUserId = existingUser.authUserId;
    } else {
      const admin = createAdminClient();
      const { data: invited, error: inviteError } =
        await admin.auth.admin.inviteUserByEmail(data.email, {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role,
            company_id: companyId,
          },
        });

      if (inviteError || !invited.user) {
        return {
          error: inviteError?.message ?? "Unable to invite employee.",
        };
      }

      authUserId = invited.user.id;
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to provision employee account.",
    };
  }

  const result = await createEmployeeRecord(companyId, {
    ...data,
    phone: data.phone || null,
    employeeNumber: data.employeeNumber || null,
    title: data.title || null,
    trade: data.trade || null,
    department: data.department || null,
    notes: data.notes || null,
    emergencyContactName: data.emergencyContactName || null,
    emergencyContactPhone: data.emergencyContactPhone || null,
    emergencyContactRelation: data.emergencyContactRelation || null,
    supervisorId: data.supervisorId || null,
    hireDate: parseHireDate(data.hireDate),
    authUserId,
    createdById: profile.id,
  });

  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to create employee." };
  }

  revalidatePath("/people");
  redirect(`/people/${result.data.id}`);
}

export async function updateEmployeeAction(employeeId: string, input: unknown) {
  await requirePermission("people");
  const profile = await requireAuth();

  if (!isAdminRole(profile.role)) {
    return { error: "Only company admins can update employees." };
  }

  const { companyId } = await requireCompanyId();
  const parsed = updateEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const result = await updateEmployeeRecord(
    companyId,
    employeeId,
    {
      ...data,
      phone: data.phone || null,
      employeeNumber: data.employeeNumber || null,
      title: data.title || null,
      trade: data.trade || null,
      department: data.department || null,
      notes: data.notes || null,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
      emergencyContactRelation: data.emergencyContactRelation || null,
      supervisorId: data.supervisorId || null,
      hireDate: parseHireDate(data.hireDate),
    },
    profile.id,
  );

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/people");
  revalidatePath(`/people/${employeeId}`);
  revalidatePath(`/people/${employeeId}/edit`);
  redirect(`/people/${employeeId}`);
}

export async function deleteEmployeeAction(employeeId: string) {
  await requirePermission("people");
  const profile = await requireAuth();

  if (!isAdminRole(profile.role)) {
    return { error: "Only company admins can remove employees." };
  }

  if (profile.employeeId === employeeId) {
    return { error: "You cannot remove your own employee record." };
  }

  const { companyId } = await requireCompanyId();
  const result = await softDeleteEmployee(companyId, employeeId, profile.id);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/people");
  redirect("/people");
}

export async function updateEmployeePhotoAction(
  employeeId: string,
  formData: FormData,
) {
  await requirePermission("people");
  const profile = await requireAuth();

  if (!isAdminRole(profile.role)) {
    return { error: "Only company admins can update employee photos." };
  }

  const { companyId } = await requireCompanyId();
  const file = formData.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Photo must be an image file." };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: "Photo must be 2MB or smaller." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${companyId}/${employeeId}/photo.${extension}`;

  let publicUrl: string;

  try {
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("employee-photos")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      // Fallback to avatars bucket if employee-photos is not provisioned yet.
      const supabase = await createClient();
      const fallbackPath = `employees/${companyId}/${employeeId}.${extension}`;
      const { error: fallbackError } = await supabase.storage
        .from("avatars")
        .upload(fallbackPath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (fallbackError) {
        return { error: uploadError.message };
      }

      const {
        data: { publicUrl: url },
      } = supabase.storage.from("avatars").getPublicUrl(fallbackPath);
      publicUrl = `${url}?v=${Date.now()}`;
    } else {
      const {
        data: { publicUrl: url },
      } = admin.storage.from("employee-photos").getPublicUrl(path);
      publicUrl = `${url}?v=${Date.now()}`;
    }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to upload photo.",
    };
  }

  const result = await updateEmployeePhoto(
    companyId,
    employeeId,
    publicUrl,
    profile.id,
  );

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/people");
  revalidatePath(`/people/${employeeId}`);
  revalidatePath(`/people/${employeeId}/edit`);
  return { error: null, photoUrl: publicUrl };
}

export async function removeEmployeePhotoAction(employeeId: string) {
  await requirePermission("people");
  const profile = await requireAuth();

  if (!isAdminRole(profile.role)) {
    return { error: "Only company admins can update employee photos." };
  }

  const { companyId } = await requireCompanyId();

  try {
    const admin = createAdminClient();
    const { data: files } = await admin.storage
      .from("employee-photos")
      .list(`${companyId}/${employeeId}`);

    if (files?.length) {
      await admin.storage
        .from("employee-photos")
        .remove(
          files.map((file) => `${companyId}/${employeeId}/${file.name}`),
        );
    }
  } catch {
    // Bucket may not exist yet; still clear the DB field.
  }

  const result = await updateEmployeePhoto(
    companyId,
    employeeId,
    null,
    profile.id,
  );

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/people");
  revalidatePath(`/people/${employeeId}`);
  revalidatePath(`/people/${employeeId}/edit`);
  return { error: null };
}
