interface PropertyCardProps {
  image: string;
  alt: string;
  rating: string;
  name: string;
  location: string;
  price: string;
  slug: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

import Link from "next/link";

export default function PropertyCard({
  image,
  alt,
  rating,
  name,
  location,
  price,
  slug,
  checkIn,
  checkOut,
  guests,
}: PropertyCardProps) {
  // Build URL with optional query parameters
  const query = new URLSearchParams();
  if (checkIn) query.set("checkIn", checkIn);
  if (checkOut) query.set("checkOut", checkOut);
  if (guests) query.set("guests", guests.toString());

  const queryString = query.toString();
  const href = `/property/${slug}${queryString ? `?${queryString}` : ""}`;

  return (
    <Link href={href} className="block group">
      <article className="bg-white rounded-[0.75rem] shadow-soft overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300">
      <div className="relative h-[200px] overflow-hidden">
        <img
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={image}
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <span
            className="material-symbols-outlined text-[14px] text-accent"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
          <span className="text-[12px] font-bold text-text-main">{rating}</span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-display font-bold text-[18px] text-text-main leading-tight mb-1">
              {name}
            </h3>
            <p className="text-[14px] text-text-muted flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">
                location_on
              </span>
              {location}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-surface flex items-center justify-between">
          <div className="text-[16px]">
            <span className="font-display font-bold text-text-main">
              {price}
            </span>
            <span className="text-[14px] text-text-muted">/noite</span>
          </div>
          <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </div>
      </div>
    </article>
  </Link>
  );
}
