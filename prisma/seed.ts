import { PrismaClient, Role, PropertyType, PropertyStatus, CancellationPolicy, AmenityCategory, BookingStatus, PaymentStatus, BookingSource, NotificationType, RoomType, RoomStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ─── Clean existing data (order matters for FK constraints) ─────────────────
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.roomImage.deleteMany();
  await prisma.room.deleteMany();
  await prisma.property.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Cleaned existing data");

  // ─── Users ───────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin1234!", 12);
  const ownerPassword = await bcrypt.hash("Owner1234!", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Admin González",
      email: "admin@reservationgonzalo.com",
      hashedPassword: adminPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });

  const owner = await prisma.user.create({
    data: {
      name: "Gonzalo Rodríguez",
      email: "gonzalo@reservationgonzalo.com",
      hashedPassword: ownerPassword,
      role: Role.OWNER,
      emailVerified: new Date(),
    },
  });

  const developer = await prisma.user.create({
    data: {
      name: 'Nelson Damian Quiñonez',
      email: 'ing.damianqnz@gmail.com',
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log("👤 Users created:", admin.email, owner.email, developer.email);

  // ─── Amenities ───────────────────────────────────────────────────────────────
  const amenitiesData = [
    // General
    { name: "WiFi", icon: "wifi", category: AmenityCategory.GENERAL },
    { name: "Air conditioning", icon: "wind", category: AmenityCategory.GENERAL },
    { name: "Heating", icon: "thermometer", category: AmenityCategory.GENERAL },
    { name: "Washing machine", icon: "washing-machine", category: AmenityCategory.GENERAL },
    { name: "Free parking", icon: "car", category: AmenityCategory.GENERAL },
    // Kitchen
    { name: "Full kitchen", icon: "chef-hat", category: AmenityCategory.KITCHEN },
    { name: "Refrigerator", icon: "refrigerator", category: AmenityCategory.KITCHEN },
    { name: "Microwave", icon: "microwave", category: AmenityCategory.KITCHEN },
    { name: "Coffee maker", icon: "coffee", category: AmenityCategory.KITCHEN },
    { name: "Dishwasher", icon: "dishwasher", category: AmenityCategory.KITCHEN },
    // Bathroom
    { name: "Hair dryer", icon: "wind", category: AmenityCategory.BATHROOM },
    { name: "Bathtub", icon: "bath", category: AmenityCategory.BATHROOM },
    { name: "Hot water", icon: "droplets", category: AmenityCategory.BATHROOM },
    // Bedroom
    { name: "Linens provided", icon: "bed", category: AmenityCategory.BEDROOM },
    { name: "Wardrobe", icon: "shirt", category: AmenityCategory.BEDROOM },
    { name: "Iron", icon: "iron", category: AmenityCategory.BEDROOM },
    // Outdoor
    { name: "Private pool", icon: "waves", category: AmenityCategory.OUTDOOR },
    { name: "Garden", icon: "tree", category: AmenityCategory.OUTDOOR },
    { name: "Terrace", icon: "home", category: AmenityCategory.OUTDOOR },
    { name: "BBQ grill", icon: "flame", category: AmenityCategory.OUTDOOR },
    // Entertainment
    { name: "Smart TV", icon: "tv", category: AmenityCategory.ENTERTAINMENT },
    { name: "Netflix", icon: "play", category: AmenityCategory.ENTERTAINMENT },
    // Safety
    { name: "Smoke detector", icon: "alert-circle", category: AmenityCategory.SAFETY },
    { name: "First aid kit", icon: "heart-pulse", category: AmenityCategory.SAFETY },
    { name: "Fire extinguisher", icon: "flame", category: AmenityCategory.SAFETY },
  ];

  const amenities = await Promise.all(
    amenitiesData.map((a) => prisma.amenity.create({ data: a }))
  );

  const amenityMap = Object.fromEntries(amenities.map((a) => [a.name, a.id]));
  console.log(`🛎️  ${amenities.length} amenities created`);

  // ─── Properties ──────────────────────────────────────────────────────────────
  const property1 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      title: "Apartamento moderno en Lisboa - Chiado",
      slug: "apartamento-moderno-lisboa-chiado",
      description:
        "Luminoso apartamento de 2 habitaciones en el corazón del Chiado. A pasos del Mercado da Ribeira, con vistas al Tajo. Totalmente equipado y reformado en 2023.",
      type: PropertyType.APARTMENT,
      status: PropertyStatus.ACTIVE,
      address: "Rua do Carmo 45, 3º Dto",
      city: "Lisboa",
      country: "PT",
      latitude: 38.7118,
      longitude: -9.1399,
      zipCode: "1200-094",
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      beds: 3,
      area: 75,
      pricePerNight: 120,
      cleaningFee: 35,
      securityDeposit: 200,
      currency: "EUR",
      checkInTime: "15:00",
      checkOutTime: "11:00",
      minNights: 2,
      maxNights: 30,
      cancellationPolicy: CancellationPolicy.MODERATE,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
            publicId: "property1_cover",
            alt: "Salón principal con vistas",
            order: 0,
            isCover: true,
          },
          {
            url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
            publicId: "property1_bedroom",
            alt: "Habitación principal",
            order: 1,
            isCover: false,
          },
          {
            url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
            publicId: "property1_bathroom",
            alt: "Baño renovado",
            order: 2,
            isCover: false,
          },
        ],
      },
      amenities: {
        create: [
          { amenityId: amenityMap["WiFi"] },
          { amenityId: amenityMap["Air conditioning"] },
          { amenityId: amenityMap["Heating"] },
          { amenityId: amenityMap["Full kitchen"] },
          { amenityId: amenityMap["Washing machine"] },
          { amenityId: amenityMap["Smart TV"] },
          { amenityId: amenityMap["Netflix"] },
          { amenityId: amenityMap["Linens provided"] },
          { amenityId: amenityMap["Hair dryer"] },
          { amenityId: amenityMap["Smoke detector"] },
        ],
      },
    },
  });

  const property2 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      title: "Villa con piscina privada - Algarve",
      slug: "villa-piscina-privada-algarve",
      description:
        "Espectacular villa de 4 habitaciones en el Algarve con piscina privada y jardín. A 10 minutos de la Praia da Marinha. Ideal para familias y grupos.",
      type: PropertyType.VILLA,
      status: PropertyStatus.ACTIVE,
      address: "Estrada da Praia 12",
      city: "Lagoa",
      country: "PT",
      latitude: 37.1087,
      longitude: -8.4518,
      zipCode: "8400-450",
      maxGuests: 8,
      bedrooms: 4,
      bathrooms: 3,
      beds: 5,
      area: 200,
      pricePerNight: 350,
      cleaningFee: 80,
      securityDeposit: 500,
      currency: "EUR",
      checkInTime: "16:00",
      checkOutTime: "10:00",
      minNights: 5,
      maxNights: 60,
      cancellationPolicy: CancellationPolicy.STRICT,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
            publicId: "property2_cover",
            alt: "Villa con piscina",
            order: 0,
            isCover: true,
          },
          {
            url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
            publicId: "property2_pool",
            alt: "Piscina privada y jardín",
            order: 1,
            isCover: false,
          },
          {
            url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800",
            publicId: "property2_living",
            alt: "Salón amplio",
            order: 2,
            isCover: false,
          },
          {
            url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
            publicId: "property2_kitchen",
            alt: "Cocina equipada",
            order: 3,
            isCover: false,
          },
        ],
      },
      amenities: {
        create: [
          { amenityId: amenityMap["WiFi"] },
          { amenityId: amenityMap["Private pool"] },
          { amenityId: amenityMap["Garden"] },
          { amenityId: amenityMap["BBQ grill"] },
          { amenityId: amenityMap["Terrace"] },
          { amenityId: amenityMap["Air conditioning"] },
          { amenityId: amenityMap["Full kitchen"] },
          { amenityId: amenityMap["Dishwasher"] },
          { amenityId: amenityMap["Washing machine"] },
          { amenityId: amenityMap["Free parking"] },
          { amenityId: amenityMap["Smart TV"] },
          { amenityId: amenityMap["Linens provided"] },
          { amenityId: amenityMap["Smoke detector"] },
          { amenityId: amenityMap["First aid kit"] },
          { amenityId: amenityMap["Fire extinguisher"] },
        ],
      },
    },
  });

  const property3 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      title: "Estudio acogedor - Oporto Centro",
      slug: "estudio-acogedor-oporto-centro",
      description:
        "Estudio bien distribuido a 5 minutos a pie de la Ribeira. Perfecto para parejas o viajeros en solitario. Ambiente tranquilo y decoración portuguesa tradicional.",
      type: PropertyType.STUDIO,
      status: PropertyStatus.ACTIVE,
      address: "Rua das Flores 89, 2º Esq",
      city: "Oporto",
      country: "PT",
      latitude: 41.1471,
      longitude: -8.6107,
      zipCode: "4050-262",
      maxGuests: 2,
      bedrooms: 0,
      bathrooms: 1,
      beds: 1,
      area: 35,
      pricePerNight: 75,
      cleaningFee: 25,
      securityDeposit: 100,
      currency: "EUR",
      checkInTime: "14:00",
      checkOutTime: "11:00",
      minNights: 1,
      maxNights: 14,
      cancellationPolicy: CancellationPolicy.FLEXIBLE,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
            publicId: "property3_cover",
            alt: "Estudio moderno",
            order: 0,
            isCover: true,
          },
          {
            url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
            publicId: "property3_bed",
            alt: "Zona de dormir",
            order: 1,
            isCover: false,
          },
        ],
      },
      amenities: {
        create: [
          { amenityId: amenityMap["WiFi"] },
          { amenityId: amenityMap["Air conditioning"] },
          { amenityId: amenityMap["Heating"] },
          { amenityId: amenityMap["Full kitchen"] },
          { amenityId: amenityMap["Coffee maker"] },
          { amenityId: amenityMap["Smart TV"] },
          { amenityId: amenityMap["Linens provided"] },
          { amenityId: amenityMap["Hair dryer"] },
          { amenityId: amenityMap["Hot water"] },
        ],
      },
    },
  });

  console.log(`🏠 3 properties created`);

  // ─── HABITACIONES (Chiado) ──────────────────────────────────────────────────
  await prisma.property.update({
    where: { id: property1.id },
    data: { hasRooms: true },
  });

  const room1 = await prisma.room.create({
    data: {
      propertyId: property1.id,
      name: "Quarto Duplo",
      type: RoomType.DOUBLE,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      beds: 1,
      pricePerNight: 80,
      order: 1,
      images: {
        create: {
          url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
          publicId: "room1_cover",
          isCover: true,
          order: 0,
        },
      },
    },
  });

  const room2 = await prisma.room.create({
    data: {
      propertyId: property1.id,
      name: "Suite Junior",
      type: RoomType.JUNIOR_SUITE,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      beds: 1,
      pricePerNight: 120,
      order: 2,
      images: {
        create: {
          url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
          publicId: "room2_cover",
          isCover: true,
          order: 0,
        },
      },
    },
  });

  const room3 = await prisma.room.create({
    data: {
      propertyId: property1.id,
      name: "Quarto Individual",
      type: RoomType.SINGLE,
      maxGuests: 1,
      bedrooms: 1,
      bathrooms: 1,
      beds: 1,
      pricePerNight: 60,
      order: 3,
      images: {
        create: {
          url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
          publicId: "room3_cover",
          isCover: true,
          order: 0,
        },
      },
    },
  });

  const room4 = await prisma.room.create({
    data: {
      propertyId: property1.id,
      name: "Alojamento Completo",
      description: "Reserve o apartamento inteiro para total privacidad. Inclui todos os quartos.",
      type: RoomType.ENTIRE_PLACE,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      beds: 3,
      pricePerNight: 250,
      order: 4,
      images: {
        create: {
          url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
          publicId: "room4_cover",
          isCover: true,
          order: 0,
        },
      },
    },
  });

  console.log(`🏨 4 rooms created for property Chiado`);

  // ─── Bookings ─────────────────────────────────────────────────────────────────
  // Past confirmed booking with review
  const booking1 = await prisma.booking.create({
    data: {
      propertyId: property1.id,
      confirmationCode: "CONF-2026-001",
      guestName: "María García",
      guestEmail: "maria.garcia@email.com",
      guestPhone: "+34 612 345 678",
      guestCount: 2,
      checkIn: new Date("2026-01-15"),
      checkOut: new Date("2026-01-20"),
      nights: 5,
      pricePerNight: 120,
      cleaningFee: 35,
      securityDeposit: 200,
      totalPrice: 835,
      currency: "EUR",
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      paymentIntentId: "pi_test_001",
      guestMessage: "Venimos a Lisboa por vacaciones, somos una pareja.",
      source: BookingSource.DIRECT,
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      propertyId: property2.id,
      confirmationCode: "CONF-2026-002",
      guestName: "Carlos Fernández",
      guestEmail: "carlos.fernandez@email.com",
      guestPhone: "+34 698 765 432",
      guestCount: 6,
      checkIn: new Date("2026-02-01"),
      checkOut: new Date("2026-02-10"),
      nights: 9,
      pricePerNight: 350,
      cleaningFee: 80,
      securityDeposit: 500,
      totalPrice: 3730,
      currency: "EUR",
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      paymentIntentId: "pi_test_002",
      guestMessage: "Celebración familiar, somos 6 adultos.",
      source: BookingSource.DIRECT,
    },
  });

  // Upcoming confirmed booking
  const booking3 = await prisma.booking.create({
    data: {
      propertyId: property1.id,
      confirmationCode: "CONF-2026-003",
      guestName: "Sophie Müller",
      guestEmail: "sophie.muller@email.de",
      guestPhone: "+49 151 234 5678",
      guestCount: 2,
      checkIn: new Date("2026-03-20"),
      checkOut: new Date("2026-03-25"),
      nights: 5,
      pricePerNight: 120,
      cleaningFee: 35,
      securityDeposit: 200,
      totalPrice: 835,
      currency: "EUR",
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      paymentIntentId: "pi_test_003",
      guestMessage: "Visitamos Lisboa por primera vez. ¿Hay aparcamiento cerca?",
      source: BookingSource.DIRECT,
    },
  });

  // Pending booking
  const booking4 = await prisma.booking.create({
    data: {
      propertyId: property3.id,
      confirmationCode: "CONF-2026-004",
      guestName: "Luca Rossi",
      guestEmail: "luca.rossi@email.it",
      guestCount: 1,
      checkIn: new Date("2026-03-28"),
      checkOut: new Date("2026-03-31"),
      nights: 3,
      pricePerNight: 75,
      cleaningFee: 25,
      securityDeposit: 100,
      totalPrice: 350,
      currency: "EUR",
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      source: BookingSource.DIRECT,
    },
  });

  // Cancelled booking
  await prisma.booking.create({
    data: {
      propertyId: property2.id,
      confirmationCode: "CONF-2026-005",
      guestName: "Ana Martínez",
      guestEmail: "ana.martinez@email.com",
      guestPhone: "+34 677 123 456",
      guestCount: 4,
      checkIn: new Date("2026-04-05"),
      checkOut: new Date("2026-04-12"),
      nights: 7,
      pricePerNight: 350,
      cleaningFee: 80,
      securityDeposit: 500,
      totalPrice: 3030,
      currency: "EUR",
      status: BookingStatus.CANCELLED,
      paymentStatus: PaymentStatus.REFUNDED,
      paymentIntentId: "pi_test_005",
      source: BookingSource.DIRECT,
    },
  });

  console.log("📅 5 bookings created");

  // ─── Reviews ──────────────────────────────────────────────────────────────────
  await prisma.review.create({
    data: {
      propertyId: property1.id,
      bookingId: booking1.id,
      guestName: "María García",
      rating: 5,
      comment:
        "Apartamento increíble, exactamente como en las fotos. Ubicación perfecta, a pocos pasos de los mejores restaurantes. Gonzalo fue muy atento y respondió rápido. 100% recomendado.",
      ownerReply:
        "¡Gracias María! Fue un placer teneros. Esperamos veros pronto de vuelta en Lisboa.",
      isPublished: true,
    },
  });

  await prisma.review.create({
    data: {
      propertyId: property2.id,
      bookingId: booking2.id,
      guestName: "Carlos Fernández",
      rating: 5,
      comment:
        "La villa superó todas las expectativas. La piscina es genial y el jardín enorme. Perfecto para nuestra reunión familiar. La cocina estaba equipada con todo lo necesario.",
      ownerReply:
        "¡Qué alegría que disfrutasteis tanto! La villa es especial para grupos grandes. Volved cuando queráis.",
      isPublished: true,
    },
  });

  console.log("⭐ 2 reviews created");

  // ─── Blocked dates ────────────────────────────────────────────────────────────
  const blockedDatesProperty2 = [
    new Date("2026-04-14"),
    new Date("2026-04-15"),
    new Date("2026-04-16"),
    new Date("2026-04-17"),
    new Date("2026-04-18"),
  ];

  await prisma.blockedDate.createMany({
    data: blockedDatesProperty2.map((date) => ({
      propertyId: property2.id,
      date,
      reason: "Mantenimiento anual piscina",
    })),
  });

  console.log("🚫 Blocked dates created");

  // ─── Notifications ────────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: owner.id,
        type: NotificationType.NEW_BOOKING,
        title: "Nueva reserva confirmada",
        message: `Sophie Müller ha reservado el Apartamento Chiado del 20 al 25 de marzo.`,
        data: { bookingId: booking3.id, propertyId: property1.id },
        isRead: false,
      },
      {
        userId: owner.id,
        type: NotificationType.PAYMENT_RECEIVED,
        title: "Pago recibido",
        message: "Has recibido €835 por la reserva CONF-2026-003.",
        data: { bookingId: booking3.id, amount: 835 },
        isRead: false,
      },
      {
        userId: owner.id,
        type: NotificationType.NEW_BOOKING,
        title: "Reserva pendiente de pago",
        message: `Luca Rossi ha iniciado una reserva para el Estudio Oporto del 28 al 31 de marzo.`,
        data: { bookingId: booking4.id, propertyId: property3.id },
        isRead: false,
      },
      {
        userId: owner.id,
        type: NotificationType.NEW_REVIEW,
        title: "Nueva valoración recibida",
        message: "María García ha dejado una valoración de 5 estrellas en el Apartamento Chiado.",
        data: { propertyId: property1.id },
        isRead: true,
      },
      {
        userId: owner.id,
        type: NotificationType.CHECK_IN_REMINDER,
        title: "Check-in mañana",
        message: "Sophie Müller hace check-in mañana en el Apartamento Chiado a las 15:00.",
        data: { bookingId: booking3.id },
        isRead: false,
      },
    ],
  });

  console.log("🔔 5 notifications created");

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n✅ Seed completed successfully!");
  console.log("─────────────────────────────────────────");
  console.log(`👤 Users:         3 (2 admin, 1 owner)`);
  console.log(`🛎️  Amenities:     ${amenities.length}`);
  console.log(`🏠 Properties:    3 (Chiado, Algarve, Oporto)`);
  console.log(`🏨 Rooms:         4 (Chiado)`);
  console.log(`📅 Bookings:      5`);
  console.log(`⭐ Reviews:       2`);
  console.log(`🔔 Notifications: 5`);
  console.log("─────────────────────────────────────────");
  console.log("\n🔑 Credentials:");
  console.log("   Admin → admin@reservationgonzalo.com / Admin1234!");
  console.log("   Owner → gonzalo@reservationgonzalo.com / Owner1234!");
  console.log("   Developer → ing.damianqnz@gmail.com (ADMIN, no password — Google login)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
