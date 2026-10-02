import { PrismaClient } from "@prisma/client";
import type { Stage, EventType, TransactionType, CallOutcome } from "../lib/constants";

const prisma = new PrismaClient();

const Stage = {
  NEW_LEAD: "NEW_LEAD" as Stage,
  CONTACTED: "CONTACTED" as Stage,
  QUALIFIED: "QUALIFIED" as Stage,
  PROPOSAL_SENT: "PROPOSAL_SENT" as Stage,
  WON: "WON" as Stage,
  LOST: "LOST" as Stage,
};

const EventType = {
  FOLLOW_UP: "FOLLOW_UP" as EventType,
  CALL: "CALL" as EventType,
  MEETING: "MEETING" as EventType,
  OTHER: "OTHER" as EventType,
};

const TransactionType = {
  INCOME: "INCOME" as TransactionType,
  EXPENSE: "EXPENSE" as TransactionType,
};

const CallOutcome = {
  NO_ANSWER: "NO_ANSWER" as CallOutcome,
  NOT_INTERESTED: "NOT_INTERESTED" as CallOutcome,
  CALLBACK_REQUESTED: "CALLBACK_REQUESTED" as CallOutcome,
  BOOKED_MEETING: "BOOKED_MEETING" as CallOutcome,
  CLOSED: "CLOSED" as CallOutcome,
};

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  await prisma.coldCall.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.client.deleteMany();
  await prisma.businessConfig.deleteMany();

  await prisma.businessConfig.create({
    data: {
      businessName: "Riverside Consulting",
      primaryColor: "#2563eb",
      logoUrl: "",
      bookingLink: "https://cal.com/riverside-consulting",
      supportEmail: "hello@riversideconsulting.com",
    },
  });

  const clientsData = [
    { name: "Avery Thompson", company: "Thompson & Co", phone: "555-0101", email: "avery@thompsonco.com", status: Stage.NEW_LEAD, dealValue: 4500, source: "Referral", notes: "Interested in quarterly retainer." },
    { name: "Priya Natarajan", company: "Nata Designs", phone: "555-0102", email: "priya@natadesigns.com", status: Stage.CONTACTED, dealValue: 8200, source: "Website", notes: "Follow up after initial call went well." },
    { name: "Marcus Lee", company: "Lee Logistics", phone: "555-0103", email: "marcus@leelogistics.com", status: Stage.QUALIFIED, dealValue: 12500, source: "Cold Call", notes: "Budget confirmed, needs proposal." },
    { name: "Sofia Alvarez", company: "Alvarez Interiors", phone: "555-0104", email: "sofia@alvarezinteriors.com", status: Stage.PROPOSAL_SENT, dealValue: 6700, source: "LinkedIn", notes: "Proposal sent, awaiting signature." },
    { name: "Daniel Kim", company: "Kim Analytics", phone: "555-0105", email: "daniel@kimanalytics.com", status: Stage.WON, dealValue: 15800, source: "Referral", notes: "Signed, onboarding scheduled." },
    { name: "Hannah Whitfield", company: "Whitfield Realty", phone: "555-0106", email: "hannah@whitfieldrealty.com", status: Stage.LOST, dealValue: 3200, source: "Website", notes: "Went with a competitor." },
    { name: "Omar Haddad", company: "Haddad Freight", phone: "555-0107", email: "omar@haddadfreight.com", status: Stage.NEW_LEAD, dealValue: 5400, source: "Cold Call", notes: "" },
    { name: "Grace Donovan", company: "Donovan Dental", phone: "555-0108", email: "grace@donovandental.com", status: Stage.CONTACTED, dealValue: 9100, source: "Referral", notes: "" },
    { name: "Liam Osei", company: "Osei Builders", phone: "555-0109", email: "liam@oseibuilders.com", status: Stage.QUALIFIED, dealValue: 21000, source: "Website", notes: "Big project, multiple stakeholders." },
    { name: "Nina Petrova", company: "Petrova Studio", phone: "555-0110", email: "nina@petrovastudio.com", status: Stage.WON, dealValue: 7300, source: "LinkedIn", notes: "" },
  ];

  const clients = [];
  for (const c of clientsData) {
    const client = await prisma.client.create({ data: c });
    clients.push(client);
    await prisma.pipelineStage.create({
      data: { clientId: client.id, stage: c.status, updatedAt: daysAgo(Math.floor(Math.random() * 20)) },
    });
  }

  const eventTypes = [EventType.FOLLOW_UP, EventType.CALL, EventType.MEETING, EventType.OTHER];
  for (let i = 0; i < 12; i++) {
    const client = clients[i % clients.length];
    await prisma.calendarEvent.create({
      data: {
        title: `${eventTypes[i % eventTypes.length] === EventType.CALL ? "Call with" : eventTypes[i % eventTypes.length] === EventType.MEETING ? "Meeting with" : "Follow up with"} ${client.name}`,
        type: eventTypes[i % eventTypes.length],
        date: i % 2 === 0 ? daysFromNow(i) : daysAgo(i),
        clientId: client.id,
        notes: "",
      },
    });
  }

  const categories = {
    [TransactionType.INCOME]: ["Consulting Fees", "Retainer", "Project Payment"],
    [TransactionType.EXPENSE]: ["Software", "Marketing", "Office Supplies", "Travel"],
  };

  for (let m = 0; m < 6; m++) {
    const base = new Date();
    base.setMonth(base.getMonth() - m);
    for (let i = 0; i < 4; i++) {
      const isIncome = i % 3 !== 0;
      const type = isIncome ? TransactionType.INCOME : TransactionType.EXPENSE;
      const cats = categories[type];
      const date = new Date(base.getFullYear(), base.getMonth(), 5 + i * 5);
      await prisma.transaction.create({
        data: {
          date,
          description: isIncome ? "Client payment" : "Business expense",
          category: cats[i % cats.length],
          amount: isIncome ? 1500 + Math.random() * 4000 : 150 + Math.random() * 600,
          type,
        },
      });
    }
  }

  const outcomes = [
    CallOutcome.NO_ANSWER,
    CallOutcome.NOT_INTERESTED,
    CallOutcome.CALLBACK_REQUESTED,
    CallOutcome.BOOKED_MEETING,
    CallOutcome.CLOSED,
  ];
  for (let i = 0; i < 20; i++) {
    const client = clients[i % clients.length];
    const outcome = outcomes[i % outcomes.length];
    await prisma.coldCall.create({
      data: {
        clientId: Math.random() > 0.3 ? client.id : null,
        prospectName: Math.random() > 0.3 ? client.name : `Prospect ${i}`,
        date: daysAgo(i),
        outcome,
        notes: "",
        followUpDate: outcome === CallOutcome.CALLBACK_REQUESTED ? daysFromNow(3 + i) : null,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
