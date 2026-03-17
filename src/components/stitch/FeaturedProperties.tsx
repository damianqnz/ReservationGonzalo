import PropertyCard from "./PropertyCard";

const properties = [
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAjS-WItm7IFp2krig4aJKs3oB1rv0YYZKR28UwccvIX2swERjqpDJMpcWMTG6ECIw3heFZc9PszG3wD9nOTCliHplKRXllt7v6beQPyG4tWzEn5HrfL8k5PeIYs7k7E442QbyEZgCsg-DV5dmnuMP0ifUihJbwegzl61VkvgcH1sLD9WI60dP2RkMKlxoSmwe-CSO8e_M2aOorifdyJrLLmR_pk98GVhDN2TawGoV42kh6LTH9xm7KXTp7Jsdn3EfGQFW20Q-6ST6E",
    alt: "Modern villa exterior",
    rating: "4.9",
    name: "Villa Mar e Sol",
    location: "Algarve, Portugal",
    price: "Desde 180€",
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDSHYtlwH8XELD4u4MzH9Xs0J7tDgOLcP7M1DX2N3DblpClvoIh6HwVUL4idDxDOsSaDMlxjf1eXHoXUZZMEzxSBO323prV7TfLmesKjZqFEJNRv7M3NPOCxToCqiF5-qrefiWBf3zDbAVCk7A6Fnr1jNVXDWOaRPh34jj9a5f8LVl8R-63wWQjg008cz3fRefnsvNkfwsQyQLsQUwt8FsE1Dkhe9K-cQfDU6hiNku0M9had3DM_I-gHN9-HNZVUtgL2TOtN4_Uxlz4",
    alt: "Minimalist apartment interior",
    rating: "4.8",
    name: "Chiado Design Loft",
    location: "Lisboa, Portugal",
    price: "Desde 120€",
  },
];

export default function FeaturedProperties() {
  return (
    <section className="mt-10 px-6">
      <h2 className="font-display font-bold text-[24px] text-text-main mb-6">
        Os nossos alojamentos
      </h2>
      <div className="grid grid-cols-1 gap-8">
        {properties.map((property) => (
          <PropertyCard key={property.name} {...property} />
        ))}
      </div>
      <button className="w-full mt-6 py-3 border border-text-main text-text-main font-display font-semibold text-[15px] rounded-[0.5rem] hover:bg-surface transition-colors">
        Ver todos os alojamentos
      </button>
    </section>
  );
}
