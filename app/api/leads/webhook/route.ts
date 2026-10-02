import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.LEADS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const budget = typeof body.budget === "string" ? body.budget.trim() : "";
  const challenge = typeof body.challenge === "string" ? body.challenge.trim() : "";
  const source = typeof body.source === "string" ? body.source.trim() : "";
  const submittedAtRaw = typeof body.submittedAt === "string" ? body.submittedAt : "";

  if (!name || !phone) {
    return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
  }

  // "Under R10,000" -> Nurture; "R10,000 - R30,000" / "R30,000+" (or anything else) -> Hot Lead.
  const status = /under/i.test(budget) ? "Nurture" : "Hot Lead - Call Now";

  const submittedAt =
    submittedAtRaw && !Number.isNaN(Date.parse(submittedAtRaw)) ? new Date(submittedAtRaw) : new Date();

  const existing = await prisma.client.findFirst({ where: { phone } });

  const client = existing
    ? await prisma.client.update({
        where: { id: existing.id },
        data: {
          name,
          email: email || existing.email,
          status,
          notes: challenge || existing.notes,
          source: source || existing.source,
        },
      })
    : await prisma.client.create({
        data: {
          name,
          phone,
          email: email || null,
          status,
          notes: challenge || null,
          source: source || null,
          dealValue: 0,
        },
      });

  await prisma.coldCall.create({
    data: {
      clientId: client.id,
      prospectName: name,
      date: submittedAt,
      outcome: "Not Yet Called",
      notes: challenge || null,
      followUpDate: startOfDay(new Date()),
    },
  });

  revalidatePath("/clients");
  revalidatePath("/cold-calls");
  revalidatePath("/");

  return NextResponse.json({ id: client.id }, { status: 200 });
}
