import { PrismaClient, Role, PropertyType, PropertyStatus, CancellationPolicy, AmenityCategory, BookingStatus, PaymentStatus, BookingSource, NotificationType, RoomType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ─── Clean existing data (order matters for FK constraints) ─────────────────
  await prisma.searchEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.guestAccess.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.coupon.deleteMany();
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
      name: 'Developer',
      email: 'developer@reservationgonzalo.com',
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
      source: BookingSource.WEBSITE,
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
      source: BookingSource.BOOKING,
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
      source: BookingSource.WEBSITE,
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
      source: BookingSource.WEBSITE,
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
      source: BookingSource.AIRBNB,
    },
  });

  console.log("📅 5 bookings created");

  // ─── 20 additional bookings for analytics dashboard ──────────────────────────
  // Distributed across: years (2025–2026), months, sources, rooms, countries
  await prisma.booking.createMany({
    data: [
      // ── 2025 bookings (5) — all COMPLETED ────────────────────────────────────
      {
        // B06 — room1 (DOUBLE), AIRBNB, DE, Jul 2025, 3 nights, 45-day lead
        propertyId: property1.id, roomId: room1.id,
        confirmationCode: 'CONF-2025-006',
        guestName: 'Hans Schmidt', guestEmail: 'hans.schmidt@email.de',
        guestPhone: '+49 176 123 4567', guestCount: 2, guestCountry: 'DE',
        checkIn: new Date('2025-07-10'), checkOut: new Date('2025-07-13'), nights: 3,
        pricePerNight: 80, cleaningFee: 35, securityDeposit: 200, totalPrice: 475,
        currency: 'EUR', status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_006', source: BookingSource.AIRBNB,
        createdAt: new Date('2025-05-26'),
      },
      {
        // B07 — room4 (ENTIRE_PLACE), BOOKING, GB, Aug 2025, 7 nights, 60-day lead
        propertyId: property1.id, roomId: room4.id,
        confirmationCode: 'CONF-2025-007',
        guestName: 'James Wilson', guestEmail: 'james.wilson@email.co.uk',
        guestPhone: '+44 7700 900 123', guestCount: 4, guestCountry: 'GB',
        checkIn: new Date('2025-08-01'), checkOut: new Date('2025-08-08'), nights: 7,
        pricePerNight: 250, cleaningFee: 35, securityDeposit: 200, totalPrice: 1985,
        currency: 'EUR', status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_007', source: BookingSource.BOOKING,
        createdAt: new Date('2025-06-02'),
      },
      {
        // B08 — property2 WEBSITE, AIRBNB, FR, Sep 2025, 10 nights, 30-day lead
        propertyId: property2.id,
        confirmationCode: 'CONF-2025-008',
        guestName: 'Claire Dubois', guestEmail: 'claire.dubois@email.fr',
        guestPhone: '+33 6 12 34 56 78', guestCount: 5, guestCountry: 'FR',
        checkIn: new Date('2025-09-12'), checkOut: new Date('2025-09-22'), nights: 10,
        pricePerNight: 350, cleaningFee: 80, securityDeposit: 500, totalPrice: 4080,
        currency: 'EUR', status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_008', source: BookingSource.AIRBNB,
        createdAt: new Date('2025-08-13'),
      },
      {
        // B09 — room2 (SUITE), MANUAL, PT, Oct 2025, 2 nights, 7-day lead
        propertyId: property1.id, roomId: room2.id,
        confirmationCode: 'CONF-2025-009',
        guestName: 'Ana Rodrigues', guestEmail: 'ana.rodrigues@email.pt',
        guestPhone: '+351 912 345 678', guestCount: 2, guestCountry: 'PT',
        checkIn: new Date('2025-10-05'), checkOut: new Date('2025-10-07'), nights: 2,
        pricePerNight: 120, cleaningFee: 35, securityDeposit: 200, totalPrice: 475,
        currency: 'EUR', status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_009', source: BookingSource.MANUAL,
        createdAt: new Date('2025-09-28'),
      },
      {
        // B10 — property3 WEBSITE, WEBSITE, ES, Nov 2025, 4 nights, 20-day lead
        propertyId: property3.id,
        confirmationCode: 'CONF-2025-010',
        guestName: 'Pablo Sánchez', guestEmail: 'pablo.sanchez@email.es',
        guestPhone: '+34 655 432 109', guestCount: 2, guestCountry: 'ES',
        checkIn: new Date('2025-11-15'), checkOut: new Date('2025-11-19'), nights: 4,
        pricePerNight: 75, cleaningFee: 25, securityDeposit: 100, totalPrice: 425,
        currency: 'EUR', status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_010', source: BookingSource.WEBSITE,
        createdAt: new Date('2025-10-26'),
      },

      // ── 2026 bookings (15) ────────────────────────────────────────────────────
      {
        // B11 — room3 (SINGLE), AIRBNB, BR, Jan 2026, 2 nights, 30-day lead
        propertyId: property1.id, roomId: room3.id,
        confirmationCode: 'CONF-2026-011',
        guestName: 'Beatriz Costa', guestEmail: 'beatriz.costa@email.com.br',
        guestPhone: '+55 11 9 8765 4321', guestCount: 1, guestCountry: 'BR',
        checkIn: new Date('2026-01-08'), checkOut: new Date('2026-01-10'), nights: 2,
        pricePerNight: 60, cleaningFee: 35, securityDeposit: 200, totalPrice: 355,
        currency: 'EUR', status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_011', source: BookingSource.AIRBNB,
        createdAt: new Date('2025-12-09'),
      },
      {
        // B12 — room4 (ENTIRE_PLACE), BOOKING, DE, Feb 2026, 5 nights, 14-day lead
        propertyId: property1.id, roomId: room4.id,
        confirmationCode: 'CONF-2026-012',
        guestName: 'Lukas Weber', guestEmail: 'lukas.weber@email.de',
        guestPhone: '+49 151 987 6543', guestCount: 4, guestCountry: 'DE',
        checkIn: new Date('2026-02-14'), checkOut: new Date('2026-02-19'), nights: 5,
        pricePerNight: 250, cleaningFee: 35, securityDeposit: 200, totalPrice: 1485,
        currency: 'EUR', status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_012', source: BookingSource.BOOKING,
        createdAt: new Date('2026-01-31'),
      },
      {
        // B13 — property2 WEBSITE, BOOKING, NL, Mar 2026, 7 nights, 30-day lead (upcoming)
        propertyId: property2.id,
        confirmationCode: 'CONF-2026-013',
        guestName: 'Marta van der Berg', guestEmail: 'm.vanderberg@email.nl',
        guestPhone: '+31 6 12 34 56 78', guestCount: 6, guestCountry: 'NL',
        checkIn: new Date('2026-03-25'), checkOut: new Date('2026-04-01'), nights: 7,
        pricePerNight: 350, cleaningFee: 80, securityDeposit: 500, totalPrice: 3030,
        currency: 'EUR', status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_013', source: BookingSource.BOOKING,
        createdAt: new Date('2026-02-23'),
      },
      {
        // B14 — room1 (DOUBLE), WEBSITE, IT, Feb 2026, 3 nights, 21-day lead
        propertyId: property1.id, roomId: room1.id,
        confirmationCode: 'CONF-2026-014',
        guestName: 'Francesca Romano', guestEmail: 'f.romano@email.it',
        guestPhone: '+39 347 123 4567', guestCount: 2, guestCountry: 'IT',
        checkIn: new Date('2026-02-22'), checkOut: new Date('2026-02-25'), nights: 3,
        pricePerNight: 80, cleaningFee: 35, securityDeposit: 200, totalPrice: 475,
        currency: 'EUR', status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_014', source: BookingSource.WEBSITE,
        createdAt: new Date('2026-02-01'),
      },
      {
        // B15 — room4 (ENTIRE_PLACE), AIRBNB, PT, Apr 2026, 5 nights — CANCELLED
        propertyId: property1.id, roomId: room4.id,
        confirmationCode: 'CONF-2026-015',
        guestName: 'Miguel Ferreira', guestEmail: 'm.ferreira@email.pt',
        guestPhone: '+351 926 543 210', guestCount: 3, guestCountry: 'PT',
        checkIn: new Date('2026-04-10'), checkOut: new Date('2026-04-15'), nights: 5,
        pricePerNight: 250, cleaningFee: 35, securityDeposit: 200, totalPrice: 1485,
        currency: 'EUR', status: BookingStatus.CANCELLED, paymentStatus: PaymentStatus.REFUNDED,
        paymentIntentId: 'pi_test_015', source: BookingSource.AIRBNB,
        createdAt: new Date('2026-03-11'),
      },
      {
        // B16 — property2 WEBSITE, WEBSITE, ES, May 2026, 8 nights, 50-day lead
        propertyId: property2.id,
        confirmationCode: 'CONF-2026-016',
        guestName: 'Javier López', guestEmail: 'j.lopez@email.es',
        guestPhone: '+34 679 876 543', guestCount: 7, guestCountry: 'ES',
        checkIn: new Date('2026-05-03'), checkOut: new Date('2026-05-11'), nights: 8,
        pricePerNight: 350, cleaningFee: 80, securityDeposit: 500, totalPrice: 3380,
        currency: 'EUR', status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_016', source: BookingSource.WEBSITE,
        createdAt: new Date('2026-03-14'),
      },
      {
        // B17 — room4 (ENTIRE_PLACE), BOOKING, GB, Jun 2026, 7 nights, 60-day lead
        propertyId: property1.id, roomId: room4.id,
        confirmationCode: 'CONF-2026-017',
        guestName: 'Charlotte Brown', guestEmail: 'c.brown@email.co.uk',
        guestPhone: '+44 7911 234 567', guestCount: 4, guestCountry: 'GB',
        checkIn: new Date('2026-06-20'), checkOut: new Date('2026-06-27'), nights: 7,
        pricePerNight: 250, cleaningFee: 35, securityDeposit: 200, totalPrice: 1985,
        currency: 'EUR', status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_017', source: BookingSource.BOOKING,
        createdAt: new Date('2026-04-21'),
      },
      {
        // B18 — room2 (SUITE), AIRBNB, FR, Jul 2026, 3 nights, 45-day lead
        propertyId: property1.id, roomId: room2.id,
        confirmationCode: 'CONF-2026-018',
        guestName: 'Emma Leroy', guestEmail: 'e.leroy@email.fr',
        guestPhone: '+33 7 98 76 54 32', guestCount: 2, guestCountry: 'FR',
        checkIn: new Date('2026-07-05'), checkOut: new Date('2026-07-08'), nights: 3,
        pricePerNight: 120, cleaningFee: 35, securityDeposit: 200, totalPrice: 595,
        currency: 'EUR', status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_018', source: BookingSource.AIRBNB,
        createdAt: new Date('2026-05-21'),
      },
      {
        // B19 — room3 (SINGLE), AIRBNB, DE, Jul 2026, 2 nights, 15-day lead
        propertyId: property1.id, roomId: room3.id,
        confirmationCode: 'CONF-2026-019',
        guestName: 'Stefan Bauer', guestEmail: 's.bauer@email.de',
        guestCount: 1, guestCountry: 'DE',
        checkIn: new Date('2026-07-15'), checkOut: new Date('2026-07-17'), nights: 2,
        pricePerNight: 60, cleaningFee: 35, securityDeposit: 200, totalPrice: 355,
        currency: 'EUR', status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_019', source: BookingSource.AIRBNB,
        createdAt: new Date('2026-06-30'),
      },
      {
        // B20 — property2 WEBSITE, BOOKING, BR, Aug 2026, 14 nights, 90-day lead
        propertyId: property2.id,
        confirmationCode: 'CONF-2026-020',
        guestName: 'Rafael Oliveira', guestEmail: 'r.oliveira@email.com.br',
        guestPhone: '+55 21 9 8888 7777', guestCount: 8, guestCountry: 'BR',
        checkIn: new Date('2026-08-01'), checkOut: new Date('2026-08-15'), nights: 14,
        pricePerNight: 350, cleaningFee: 80, securityDeposit: 500, totalPrice: 5480,
        currency: 'EUR', status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_020', source: BookingSource.BOOKING,
        createdAt: new Date('2026-05-03'),
      },
      {
        // B21 — room1 (DOUBLE), MANUAL, ES, Sep 2026, 4 nights — CANCELLED
        propertyId: property1.id, roomId: room1.id,
        confirmationCode: 'CONF-2026-021',
        guestName: 'Alejandro Torres', guestEmail: 'a.torres@email.es',
        guestPhone: '+34 633 111 222', guestCount: 2, guestCountry: 'ES',
        checkIn: new Date('2026-09-10'), checkOut: new Date('2026-09-14'), nights: 4,
        pricePerNight: 80, cleaningFee: 35, securityDeposit: 200, totalPrice: 555,
        currency: 'EUR', status: BookingStatus.CANCELLED, paymentStatus: PaymentStatus.REFUNDED,
        paymentIntentId: 'pi_test_021', source: BookingSource.MANUAL,
        createdAt: new Date('2026-08-11'),
      },
      {
        // B22 — room4 (ENTIRE_PLACE), WEBSITE, NL, Aug 2026, 6 nights, 60-day lead
        propertyId: property1.id, roomId: room4.id,
        confirmationCode: 'CONF-2026-022',
        guestName: 'Lars Jansen', guestEmail: 'l.jansen@email.nl',
        guestPhone: '+31 6 98 76 54 32', guestCount: 4, guestCountry: 'NL',
        checkIn: new Date('2026-08-20'), checkOut: new Date('2026-08-26'), nights: 6,
        pricePerNight: 250, cleaningFee: 35, securityDeposit: 200, totalPrice: 1735,
        currency: 'EUR', status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_022', source: BookingSource.WEBSITE,
        createdAt: new Date('2026-06-21'),
      },
      {
        // B23 — property3 WEBSITE, BOOKING, IT, Jun 2026, 3 nights — CANCELLED (unpaid)
        propertyId: property3.id,
        confirmationCode: 'CONF-2026-023',
        guestName: 'Giulia Conti', guestEmail: 'g.conti@email.it',
        guestCount: 2, guestCountry: 'IT',
        checkIn: new Date('2026-06-05'), checkOut: new Date('2026-06-08'), nights: 3,
        pricePerNight: 75, cleaningFee: 25, securityDeposit: 100, totalPrice: 350,
        currency: 'EUR', status: BookingStatus.CANCELLED, paymentStatus: PaymentStatus.UNPAID,
        source: BookingSource.BOOKING,
        createdAt: new Date('2026-05-16'),
      },
      {
        // B24 — room2 (SUITE), MANUAL, PT, Oct 2026, 2 nights, 30-day lead
        propertyId: property1.id, roomId: room2.id,
        confirmationCode: 'CONF-2026-024',
        guestName: 'Mariana Silva', guestEmail: 'm.silva@email.pt',
        guestPhone: '+351 934 567 890', guestCount: 2, guestCountry: 'PT',
        checkIn: new Date('2026-10-10'), checkOut: new Date('2026-10-12'), nights: 2,
        pricePerNight: 120, cleaningFee: 35, securityDeposit: 200, totalPrice: 475,
        currency: 'EUR', status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_024', source: BookingSource.MANUAL,
        createdAt: new Date('2026-09-10'),
      },
      {
        // B25 — property3 WEBSITE, WEBSITE, GB, Dec 2026, 5 nights, 60-day lead
        propertyId: property3.id,
        confirmationCode: 'CONF-2026-025',
        guestName: 'William Taylor', guestEmail: 'w.taylor@email.co.uk',
        guestPhone: '+44 7800 555 123', guestCount: 2, guestCountry: 'GB',
        checkIn: new Date('2026-12-23'), checkOut: new Date('2026-12-28'), nights: 5,
        pricePerNight: 75, cleaningFee: 25, securityDeposit: 100, totalPrice: 500,
        currency: 'EUR', status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID,
        paymentIntentId: 'pi_test_025', source: BookingSource.WEBSITE,
        createdAt: new Date('2026-10-24'),
      },
    ],
  });

  // RoomBlockedDate entries: rooms 1-3 blocked during room4 (ENTIRE_PLACE) booking B12
  // This populates the "Dias Bloqueados por Casa Completa" analytics metric
  await prisma.roomBlockedDate.createMany({
    data: [
      { roomId: room1.id, date: new Date('2026-02-14'), reason: 'Reserva de Alojamento Completo (ENTIRE_PLACE)' },
      { roomId: room1.id, date: new Date('2026-02-15'), reason: 'Reserva de Alojamento Completo (ENTIRE_PLACE)' },
      { roomId: room1.id, date: new Date('2026-02-16'), reason: 'Reserva de Alojamento Completo (ENTIRE_PLACE)' },
      { roomId: room2.id, date: new Date('2026-02-14'), reason: 'Reserva de Alojamento Completo (ENTIRE_PLACE)' },
      { roomId: room2.id, date: new Date('2026-02-15'), reason: 'Reserva de Alojamento Completo (ENTIRE_PLACE)' },
      { roomId: room3.id, date: new Date('2026-02-14'), reason: 'Reserva de Alojamento Completo (ENTIRE_PLACE)' },
    ],
    skipDuplicates: true,
  });

  console.log("📅 +20 analytics bookings added (total: 25)");
  console.log("🔒 6 room blocked dates created (ENTIRE_PLACE)");

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

  // ─── Search Events (Look-to-Book tracking) ────────────────────────────────────
  await prisma.searchEvent.createMany({
    data: [
      // 10 unconverted searches — various months in 2026
      { propertyId: property1.id, checkIn: new Date('2026-01-10'), checkOut: new Date('2026-01-14'), guests: 2, sessionId: 'sess-001', ipAddress: '192.168.1.10', convertedToBooking: false, createdAt: new Date('2025-12-20') },
      { propertyId: property1.id, roomId: room1.id, checkIn: new Date('2026-02-20'), checkOut: new Date('2026-02-23'), guests: 2, sessionId: 'sess-002', ipAddress: '192.168.1.11', convertedToBooking: false, createdAt: new Date('2026-01-15') },
      { propertyId: property2.id, checkIn: new Date('2026-03-10'), checkOut: new Date('2026-03-17'), guests: 6, sessionId: 'sess-003', ipAddress: '192.168.1.12', convertedToBooking: false, createdAt: new Date('2026-02-01') },
      { propertyId: property1.id, roomId: room2.id, checkIn: new Date('2026-04-01'), checkOut: new Date('2026-04-05'), guests: 2, sessionId: 'sess-004', ipAddress: '192.168.1.13', convertedToBooking: false, createdAt: new Date('2026-03-01') },
      { propertyId: property3.id, checkIn: new Date('2026-04-20'), checkOut: new Date('2026-04-25'), guests: 2, sessionId: 'sess-005', ipAddress: '192.168.1.14', convertedToBooking: false, createdAt: new Date('2026-03-15') },
      { propertyId: property1.id, roomId: room3.id, checkIn: new Date('2026-05-10'), checkOut: new Date('2026-05-13'), guests: 1, sessionId: 'sess-006', ipAddress: '192.168.1.15', convertedToBooking: false, createdAt: new Date('2026-04-10') },
      { propertyId: property2.id, checkIn: new Date('2026-06-01'), checkOut: new Date('2026-06-08'), guests: 4, sessionId: 'sess-007', ipAddress: '192.168.1.16', convertedToBooking: false, createdAt: new Date('2026-04-25') },
      { propertyId: property1.id, checkIn: new Date('2026-07-15'), checkOut: new Date('2026-07-20'), guests: 3, sessionId: 'sess-008', ipAddress: '192.168.1.17', convertedToBooking: false, createdAt: new Date('2026-05-10') },
      { propertyId: property3.id, checkIn: new Date('2026-08-05'), checkOut: new Date('2026-08-10'), guests: 2, sessionId: 'sess-009', ipAddress: '192.168.1.18', convertedToBooking: false, createdAt: new Date('2026-06-05') },
      { propertyId: property2.id, checkIn: new Date('2026-09-12'), checkOut: new Date('2026-09-19'), guests: 5, sessionId: 'sess-010', ipAddress: '192.168.1.19', convertedToBooking: false, createdAt: new Date('2026-07-01') },
      // 3 converted searches — linked to booking1, booking3, booking4
      { propertyId: property1.id, checkIn: new Date('2026-01-20'), checkOut: new Date('2026-01-25'), guests: 2, sessionId: 'sess-011', ipAddress: '192.168.1.20', convertedToBooking: true, bookingId: booking1.id, createdAt: new Date('2026-01-05') },
      { propertyId: property1.id, roomId: room1.id, checkIn: new Date('2026-03-20'), checkOut: new Date('2026-03-25'), guests: 2, sessionId: 'sess-012', ipAddress: '192.168.1.21', convertedToBooking: true, bookingId: booking3.id, createdAt: new Date('2026-03-10') },
      { propertyId: property3.id, checkIn: new Date('2026-03-28'), checkOut: new Date('2026-03-31'), guests: 2, sessionId: 'sess-013', ipAddress: '192.168.1.22', convertedToBooking: true, bookingId: booking4.id, createdAt: new Date('2026-03-20') },
      // 2 future searches — no booking yet
      { propertyId: property1.id, roomId: room4.id, checkIn: new Date('2026-11-01'), checkOut: new Date('2026-11-07'), guests: 4, sessionId: 'sess-014', ipAddress: '192.168.1.23', convertedToBooking: false, createdAt: new Date('2026-08-01') },
      { propertyId: property2.id, checkIn: new Date('2026-12-20'), checkOut: new Date('2027-01-03'), guests: 8, sessionId: 'sess-015', ipAddress: '192.168.1.24', convertedToBooking: false, createdAt: new Date('2026-09-01') },
    ],
  });

  console.log("🔍 15 search events created (10 unconverted + 3 converted + 2 future)");

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n✅ Seed completed successfully!");
  console.log("─────────────────────────────────────────");
  console.log(`👤 Users:         3 (2 admin, 1 owner)`);
  console.log(`🛎️  Amenities:     ${amenities.length}`);
  console.log(`🏠 Properties:    3 (Chiado, Algarve, Oporto)`);
  console.log(`🏨 Rooms:         4 (Chiado)`);
  console.log(`📅 Bookings:      25 (5 original + 20 analytics)`);
  console.log(`⭐ Reviews:       2`);
  console.log(`🔔 Notifications: 5`);
  console.log(`🔍 Search events: 15 (look-to-book tracking)`);
  console.log("─────────────────────────────────────────");
  console.log("\n🔑 Credentials: see prisma/seed.ts");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
