import { db } from "@/lib/db";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 mb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`material-symbols-outlined text-[16px] ${
            i < rating ? "text-accent" : "text-text-muted opacity-30"
          }`}
          style={{ fontVariationSettings: i < rating ? "'FILL' 1" : undefined }}
        >
          star
        </span>
      ))}
    </div>
  );
}

export default async function GuestReviews() {
  const dbReviews = await db.review.findMany({
    where: {
      isPublished: true,
    },
    include: {
      booking: {
        select: {
          checkIn: true,
        },
      },
    },
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
  });

  const reviews = dbReviews.map((r) => ({
    text: r.comment || "",
    author: r.guestName,
    initial: r.guestName.charAt(0).toUpperCase(),
    stay: `Estadia em ${format(r.booking.checkIn, "MMMM yyyy", { locale: ptBR })}`,
    rating: r.rating,
  }));

  if (reviews.length === 0) return null;

  return (
    <section className="mt-16 mb-16 container-main overflow-hidden">
      <h2 className="font-display font-bold text-[24px] text-text-main mb-6 pt-8">
        O que dizem os hóspedes
      </h2>
      <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 snap-x">
        {reviews.map((review, idx) => (
          <div
            key={`${review.author}-${idx}`}
            className="w-[280px] shrink-0 bg-white border border-surface rounded-[0.75rem] p-5 shadow-sm snap-center"
          >
            <StarRow rating={review.rating} />
            <p className="text-[14px] text-text-main font-medium italic mb-4 leading-relaxed line-clamp-4">
              {review.text}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-[12px] font-bold text-text-muted">
                {review.initial}
              </div>
              <div>
                <p className="text-[13px] font-bold text-text-main">
                  {review.author}
                </p>
                <p className="text-[11px] text-text-muted text-capitalize">
                  {review.stay}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
