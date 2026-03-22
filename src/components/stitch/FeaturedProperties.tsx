import { db } from "@/lib/db";
import PropertyCard from "./PropertyCard";

export default async function FeaturedProperties() {
  const dbProperties = await db.property.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      title: true,
      slug: true,
      city: true,
      pricePerNight: true,
      images: {
        where: { isCover: true },
        select: { url: true, publicId: true, alt: true },
        take: 1,
      },
      reviews: {
        select: { rating: true },
      },
    },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  const properties = dbProperties.map((p) => {
    const avgRating =
      p.reviews.length > 0
        ? (
            p.reviews.reduce((acc, rev) => acc + rev.rating, 0) /
            p.reviews.length
          ).toFixed(1)
        : "4.9"; // Default placeholder if no reviews exist yet

    return {
      name: p.title,
      slug: p.slug,
      image: p.images[0]?.url || "/placeholder-property.jpg",
      publicId: p.images[0]?.publicId,
      alt: p.images[0]?.alt || p.title,
      rating: avgRating,
      location: `${p.city}, Portugal`,
      price: `Desde ${p.pricePerNight}€`,
    };
  });

  return (
    <section className="mt-10 container-main">
      <h2 className="font-display font-bold text-[24px] text-text-main mb-6 pt-6">
        O meu alojamentos - Tua comodidade
      </h2>
      <p className="font-display font-regular text-[16px] text-text-main mb-6 pt-6 pb-8">
        Escolhe entre as opções disponíveis para a tua estadia, alojamento enteiro ou os diferentes tipos de quarto.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
        {properties.map((property) => (
          <PropertyCard key={property.slug} {...property} />
        ))}
      </div>
      {/* button for future use 
      <button className="w-full mt-6 py-3 border border-text-main text-text-main font-display font-semibold text-[15px] rounded-[0.5rem] hover:bg-surface transition-colors">
        Ver todos os alojamentos
      </button>
      */}
    </section>
  );
}
