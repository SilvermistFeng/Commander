import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DESTINATIONS } from "./destinations";

const prisma = new PrismaClient();

const daysFromNow = (days: number, hour = 9) => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};

async function main() {
  console.log("Seeding WanderCraft…");

  // ---------------------------------------------------------------- catalogue
  for (const d of DESTINATIONS) {
    await prisma.destination.upsert({
      where: { slug: d.slug },
      update: {
        name: d.name,
        country: d.country,
        continent: d.continent,
        bestSeason: d.bestSeason,
        avgDailyBudget: new Prisma.Decimal(d.avgDailyBudget),
        avgDailyBudgetLocal: new Prisma.Decimal(d.avgDailyBudgetLocal),
        currency: d.currency,
        heroImage: d.heroGradient,
        summary: d.summary,
        latitude: d.latitude,
        longitude: d.longitude,
        tags: d.tags,
        blueprintData: d.blueprint as unknown as Prisma.InputJsonValue,
      },
      create: {
        slug: d.slug,
        name: d.name,
        country: d.country,
        continent: d.continent,
        bestSeason: d.bestSeason,
        avgDailyBudget: new Prisma.Decimal(d.avgDailyBudget),
        avgDailyBudgetLocal: new Prisma.Decimal(d.avgDailyBudgetLocal),
        currency: d.currency,
        heroImage: d.heroGradient,
        summary: d.summary,
        latitude: d.latitude,
        longitude: d.longitude,
        tags: d.tags,
        blueprintData: d.blueprint as unknown as Prisma.InputJsonValue,
      },
    });
  }
  console.log(`  ${DESTINATIONS.length} destinations`);

  // ---------------------------------------------------------------- demo users
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const demo = await prisma.user.upsert({
    where: { email: "demo@wandercraft.app" },
    update: {},
    create: {
      email: "demo@wandercraft.app",
      passwordHash,
      name: "Alex Rivera",
      username: "alex",
      bio: "Slow traveller. Collects train tickets and market receipts.",
      homeCity: "Manchester",
      homeAirport: "MAN",
      preferredCurrency: "EUR",
    },
  });

  const friend = await prisma.user.upsert({
    where: { email: "sam@wandercraft.app" },
    update: {},
    create: {
      email: "sam@wandercraft.app",
      passwordHash,
      name: "Sam Okonkwo",
      username: "sam",
      bio: "Will find the best coffee within ten minutes of landing.",
      homeCity: "Bristol",
      homeAirport: "BRS",
      preferredCurrency: "EUR",
    },
  });
  console.log("  2 demo users (demo@wandercraft.app / sam@wandercraft.app — password demo1234)");

  // ---------------------------------------------------------------- demo trip
  const lisbon = await prisma.destination.findUnique({ where: { slug: "lisbon-portugal" } });
  if (!lisbon) throw new Error("Lisbon destination missing — catalogue seed failed.");

  // Start the trip inside the 16-day weather horizon so the packing tab has a
  // real forecast to work from the moment you open it.
  const startDate = daysFromNow(8, 0);
  const endDate = daysFromNow(12, 0);

  await prisma.trip.deleteMany({ where: { ownerId: demo.id, title: "Lisbon with Sam" } });

  const trip = await prisma.trip.create({
    data: {
      title: "Lisbon with Sam",
      destinationId: lisbon.id,
      destinationName: lisbon.name,
      country: lisbon.country,
      latitude: lisbon.latitude,
      longitude: lisbon.longitude,
      startDate,
      endDate,
      coverImage: lisbon.heroImage,
      travelStyle: "Slow and food-led",
      totalBudget: new Prisma.Decimal(1600),
      currency: "EUR",
      visibility: "SHARED",
      ownerId: demo.id,
    },
  });

  const blueprint = lisbon.blueprintData as unknown as {
    activities: {
      day: number; startTime: string; endTime: string; category: string;
      name: string; locationName: string; latitude: number; longitude: number;
      cost: number; notes?: string;
    }[];
    packingHints: string[];
  };

  const perDayCounter = new Map<number, number>();
  const activities = [];
  for (const a of blueprint.activities) {
    const order = perDayCounter.get(a.day) ?? 0;
    perDayCounter.set(a.day, order + 1);
    activities.push(
      await prisma.itineraryActivity.create({
        data: {
          tripId: trip.id,
          dayNumber: a.day,
          startTime: a.startTime,
          endTime: a.endTime,
          category: a.category as never,
          name: a.name,
          locationName: a.locationName,
          latitude: a.latitude,
          longitude: a.longitude,
          cost: new Prisma.Decimal(a.cost),
          currency: "EUR",
          notes: a.notes ?? null,
          bookingStatus: order === 0 ? "CONFIRMED" : "PLANNED",
          sortOrder: order,
        },
      })
    );
  }
  console.log(`  ${activities.length} itinerary activities`);

  const penaPalace = activities.find((a) => a.name.includes("Pena Palace"));
  const sintraTrain = activities.find((a) => a.name.includes("Train to Sintra"));
  const fado = activities.find((a) => a.name.includes("Fado"));

  // ------------------------------------------------------------ locker
  await prisma.documentVoucher.createMany({
    data: [
      {
        tripId: trip.id,
        category: "FLIGHT",
        title: "Manchester → Lisbon, TP1235",
        provider: "TAP Air Portugal",
        confirmationCode: "TP-8842QK",
        fileName: "tap-boarding-pass.pdf",
        fileSize: 214_530,
        startDate: startDate,
        details: "Seat 14A · Gate opens 06:20 · Terminal 1",
        cost: new Prisma.Decimal(186),
        currency: "EUR",
        cancellationDeadline: daysFromNow(1, 18), // urgent: inside 24 hours
        notes: "Hold luggage included. Check in online 24h before.",
      },
      {
        tripId: trip.id,
        category: "HOTEL",
        title: "Casa Alfama, 4 nights",
        provider: "Booking.com",
        confirmationCode: "BK-99213847",
        fileName: "casa-alfama-voucher.pdf",
        fileSize: 98_120,
        startDate,
        endDate,
        details: "Double room with terrace · Late check-in arranged",
        cost: new Prisma.Decimal(520),
        currency: "EUR",
        cancellationDeadline: daysFromNow(3, 12), // soon: inside 72 hours
        notes: "Free cancellation until three days before arrival.",
      },
      {
        tripId: trip.id,
        activityId: penaPalace?.id ?? null,
        category: "ACTIVITY",
        title: "Pena Palace timed entry",
        provider: "Parques de Sintra",
        confirmationCode: "PT-4471SN",
        fileName: "pena-palace-ticket.pdf",
        fileSize: 61_004,
        startDate: new Date(startDate.getTime() + 2 * 86_400_000),
        details: "Park + Palace · 10:00 entry slot · 2 adults",
        cost: new Prisma.Decimal(40),
        currency: "EUR",
        cancellationDeadline: daysFromNow(6, 10),
        notes: "Show the QR code at the palace gate, not the park gate.",
      },
      {
        tripId: trip.id,
        activityId: sintraTrain?.id ?? null,
        category: "TRANSIT",
        title: "Rossio → Sintra return",
        provider: "CP Comboios",
        confirmationCode: "CP-207734",
        details: "Off-peak return · Zone 4 · Valid all day",
        cost: new Prisma.Decimal(10),
        currency: "EUR",
      },
      {
        tripId: trip.id,
        activityId: fado?.id ?? null,
        category: "ACTIVITY",
        title: "Fado dinner reservation",
        provider: "Clube de Fado",
        confirmationCode: "CF-5518",
        startDate,
        details: "Table for 2 · 19:00 · Minimum spend €45pp",
        cost: new Prisma.Decimal(90),
        currency: "EUR",
        cancellationDeadline: daysFromNow(20, 12),
      },
    ],
  });
  console.log("  5 documents in the locker");

  // ------------------------------------------------------------ collaboration
  await prisma.tripCollaborator.createMany({
    data: [
      {
        tripId: trip.id,
        userId: demo.id,
        email: demo.email,
        role: "OWNER",
        inviteToken: `tok_${trip.id.slice(0, 10)}_owner`,
        status: "ACCEPTED",
      },
      {
        tripId: trip.id,
        userId: friend.id,
        email: friend.email,
        role: "EDITOR",
        inviteToken: `tok_${trip.id.slice(0, 10)}_editor`,
        status: "ACCEPTED",
      },
      {
        tripId: trip.id,
        email: "jo@example.com",
        role: "VIEWER",
        inviteToken: `tok_${trip.id.slice(0, 10)}_viewer`,
        status: "PENDING",
      },
    ],
  });

  // ------------------------------------------------------------ expenses
  const expenses: {
    title: string; amount: number; category: string; payer: { id: string; name: string };
    day: number; splitWith: string[]; activityId?: string | null;
  }[] = [
    { title: "Flights, both of us", amount: 372, category: "TRANSPORT", payer: demo, day: 0, splitWith: [demo.name, friend.name] },
    { title: "Casa Alfama, 4 nights", amount: 520, category: "LODGING", payer: friend, day: 0, splitWith: [demo.name, friend.name] },
    { title: "Fado dinner", amount: 96, category: "FOOD", payer: demo, day: 0, splitWith: [demo.name, friend.name], activityId: fado?.id },
    { title: "Sintra train tickets", amount: 10, category: "TRANSPORT", payer: friend, day: 2, splitWith: [demo.name, friend.name], activityId: sintraTrain?.id },
    { title: "Pena Palace tickets", amount: 40, category: "ACTIVITIES", payer: demo, day: 2, splitWith: [demo.name, friend.name], activityId: penaPalace?.id },
    { title: "Time Out Market lunch", amount: 46, category: "FOOD", payer: friend, day: 3, splitWith: [demo.name, friend.name] },
    { title: "Tile shop in Alfama", amount: 68, category: "SHOPPING", payer: demo, day: 1, splitWith: [demo.name] },
  ];

  for (const e of expenses) {
    const created = await prisma.expense.create({
      data: {
        tripId: trip.id,
        activityId: e.activityId ?? null,
        title: e.title,
        amount: new Prisma.Decimal(e.amount),
        currency: "EUR",
        category: e.category as never,
        date: new Date(startDate.getTime() + e.day * 86_400_000),
        paidById: e.payer.id,
        paidByName: e.payer.name,
      },
    });

    // Even split, with the odd cent handed to the first person.
    const cents = Math.round(e.amount * 100);
    const base = Math.floor(cents / e.splitWith.length);
    let remainder = cents - base * e.splitWith.length;

    for (const person of e.splitWith) {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      await prisma.expenseSplit.create({
        data: {
          expenseId: created.id,
          userId: person === demo.name ? demo.id : person === friend.name ? friend.id : null,
          participantName: person,
          splitAmount: new Prisma.Decimal((base + extra) / 100),
        },
      });
    }
  }
  console.log(`  ${expenses.length} expenses with splits`);

  // ------------------------------------------------------------ packing
  const packing: { category: string; title: string; isEssential: boolean; isPacked: boolean }[] = [
    { category: "DOCUMENTS", title: "Passport", isEssential: true, isPacked: true },
    { category: "DOCUMENTS", title: "Travel insurance details", isEssential: true, isPacked: true },
    { category: "DOCUMENTS", title: "Payment cards + a backup card", isEssential: true, isPacked: false },
    { category: "CLOTHES", title: "Comfortable walking shoes", isEssential: true, isPacked: true },
    { category: "CLOTHES", title: "Grippy soles for the cobbles", isEssential: false, isPacked: false },
    { category: "CLOTHES", title: "Light rain shell for spring", isEssential: false, isPacked: false },
    { category: "CLOTHES", title: "Swimwear", isEssential: false, isPacked: false },
    { category: "ELECTRONICS", title: "Phone + charger", isEssential: true, isPacked: true },
    { category: "ELECTRONICS", title: "Travel plug adapter", isEssential: true, isPacked: false },
    { category: "ELECTRONICS", title: "Power bank", isEssential: false, isPacked: false },
    { category: "TOILETRIES", title: "Toothbrush and toothpaste", isEssential: true, isPacked: false },
    { category: "TOILETRIES", title: "High-SPF sunscreen", isEssential: true, isPacked: false },
    { category: "TOILETRIES", title: "Any prescription medication", isEssential: true, isPacked: true },
  ];

  await prisma.packingItem.createMany({
    data: packing.map((p, i) => ({
      tripId: trip.id,
      category: p.category as never,
      title: p.title,
      isEssential: p.isEssential,
      isPacked: p.isPacked,
      sortOrder: i,
    })),
  });
  console.log(`  ${packing.length} packing items`);

  console.log("\nDone. Sign in with demo@wandercraft.app / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
