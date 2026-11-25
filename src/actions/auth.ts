"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const barcodeSchema = z
  .string()
  .trim()
  .min(1, "Barcode darf nicht leer sein.")
  .max(128, "Barcode ist zu lang.");

export type BarcodeStatusResult =
  | { status: "EXISTING_USER"; username: string | null; email: string }
  | { status: "NEW_CARD" };

export async function checkBarcodeStatus(
  barcode: string
): Promise<BarcodeStatusResult> {
  const parsed = barcodeSchema.safeParse(barcode);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Ungültiger Barcode.");
  }

  const cardBarcode = parsed.data;
  const user = await prisma.user.findUnique({
    where: { cardBarcode },
    select: { username: true, email: true },
  });

  if (user) {
    return {
      status: "EXISTING_USER",
      username: user.username,
      email: user.email,
    };
  }

  return { status: "NEW_CARD" };
}
