"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getBusinessConfig } from "@/lib/business-config";

export async function updateBusinessConfig(formData: FormData) {
  const config = await getBusinessConfig();

  const businessName = String(formData.get("businessName") ?? "").trim() || "Your Business";
  const primaryColor = String(formData.get("primaryColor") ?? "").trim() || "#2563eb";
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const bookingLink = String(formData.get("bookingLink") ?? "").trim();
  const supportEmail = String(formData.get("supportEmail") ?? "").trim();

  await prisma.businessConfig.update({
    where: { id: config.id },
    data: {
      businessName,
      primaryColor,
      logoUrl: logoUrl || null,
      bookingLink: bookingLink || null,
      supportEmail: supportEmail || null,
    },
  });

  revalidatePath("/", "layout");
}
