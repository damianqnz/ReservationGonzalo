import Footer from "@/components/layout/Footer";

const stats = [
  { value: "+1.5M", label: "huéspedes felices" },
  { value: "150", label: "nuevos alojamientos/mes" },
  { value: "+3000", label: "alojamientos en 43 ciudades" },
];

const reviews = [
  {
    text: '"Increíble atención desde el primer momento. El apartamento en Madrid superó mis expectativas, todo impecable y muy céntrico."',
    author: "Ana García",
    location: "Madrid, España",
  },
  {
    text: '"La gestión fue rapidísima. Me sentí seguro en todo momento gracias al soporte 24/7. Repetiré sin duda."',
    author: "Mark Thompson",
    location: "London, UK",
  },
  {
    text: '"Calidad de hotel con la calidez de un hogar. La limpieza y el detalle en la decoración son de otro nivel."',
    author: "Isabelle Roche",
    location: "Paris, France",
  },
];

const benefits = [
  "Alquileres personalizados",
  "Mejores precios",
  "Conserjería",
  "Desinfección",
  "Atención 24/7",
];


function StarRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center gap-1 text-green-600 mb-4">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function AboutUs() {
  return (
    <div className="bg-white text-text-main antialiased overflow-x-hidden">
      <main>
        {/* Hero Section */}
        <section className="py-5 overflow-hidden">
          <div className="container-main grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h1 className="font-display text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
                Quem somos
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 max-w-xl leading-relaxed">
                Redefiniendo el concepto de hospitalidad moderna. En
                ReservationGonzalo, conectamos a viajeros exigentes con espacios
                únicos que inspiran, transformando cada estancia en una
                experiencia inolvidable.
              </p>
            </div>
            <div className="relative grid grid-cols-2 gap-4 h-[500px]">
              <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden shadow-xl transform hover:scale-[1.02] transition-transform duration-500">
                <img
                  className="w-full h-full object-cover"
                  alt="Modern apartment interior"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoXdaAUAYRCRydVwDXyaY-8xehZKNZbHysDV2cumSp4mR2AGOsoYhRJQaKa6c3jYPgMf11xgfZSXgTvoDPTnzDMraePrwN0yRmsKqm6f_tynxKZOAlpbs4wCke92g1MuZrwiUfGk4P7D-MkodIkqKXZj6UpKOo91PpD9_KZUXcQKvC2euf3TkG7yqsqmmFqMJo1P6rHts9DAvlC1TEpgUJKtgJEUPWjqS5rRM51GW7UpOOqk9W19KvqFAWlfgxS9XS9TvPrJOCyrt6"
                />
              </div>
              <div className="col-span-1 h-[240px] rounded-2xl overflow-hidden shadow-lg transform translate-y-4 hover:translate-y-2 transition-all duration-500">
                <img
                  className="w-full h-full object-cover"
                  alt="Panoramic city view"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAA6WQJ_Kv4nBj-dmyXEo405icr50_zIY9t7Z1Ii93szisirAT-A_76xoclb5lL5hbtLO55AGqEZ5e0bXjJqLRW6cpAsgAh-JZsVgBRWmFZQqi_thGSDIIjntqz16Pg2vOocz5l4hcgHairqGwB29bc0mtExscM4G2ErnFbWxZ1OAEtC74I2N3loVhlvoO6Si24CXH0eNsvIF5ds3lSuFNX3lk54TjzfrK3N7au4d8I1TuLLtnTNMsNmOrXzlNWNr4GZjSsTrEQ4GS-"
                />
              </div>
              <div className="col-span-1 h-[240px] rounded-2xl overflow-hidden shadow-lg transform -translate-y-4 hover:-translate-y-6 transition-all duration-500">
                <img
                  className="w-full h-full object-cover"
                  alt="Luxury infinity pool"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtyr2RzaWhlyIdeDFWAFV0cGj3CW6xo11qcaVgSNbRfubBoynHUMNA6bXZOuu3MDo5UvR5WMI34q3eh0mRtmEMO8aGqToX68o6yMzdBIovB5BuFVh0sOsssAG0z1NItL-X4z6cA8Pb0N7268awtxv90rrKYX6McnEB0wCXNqVoXXw7HtOMuTmAaNE5n-d_aLp9Cs2BQVAuqWUQcpGcBvBLgjz6mXoWdPOfNA6zMJSiNU42W7eyM8WOHYhmOJeipRMv4xVpgQ1zqvy4"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Trajectory Section */}
        <section className="py-24 bg-gray-50">
          <div className="container-main grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                <img
                  className="w-full h-full object-cover"
                  alt="Traditional street view"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiWgJdBqcBPDFk4DMub7X9qcbS-QQfWtDGrE5R3ciznl1EX-CvuuqxAxVN9OKFjBEDVM_TbGuKIJjTMo-MBUojPrziGeWFsKlRQQSzPOw0cYDC4_nRB5DXhpgS_qKHtCUpZ3BxdQeXvpBpCTO82w74coiyI4v8G3I2rJnJDsgq2-aADxvTA8FnGpVOiymhe1NCi12oWeQcpb_nZKK6MkFH2LoaUt-EiQz08Kf_in5llyeL59niOx7Jk3hS2fHGoGuKIFhImTIcJOE7"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 bg-primary text-white p-12 rounded-2xl hidden xl:block">
                <span className="text-4xl font-bold">Est. 2018</span>
              </div>
            </div>
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="font-display text-4xl lg:text-5xl font-bold">
                  Nuestra trayectoria
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Nuestra historia comenzó en el corazón de Londres, donde
                  identificamos una necesidad de servicios de alojamiento de
                  alta calidad que combinaran el confort de un hogar con los
                  estándares de un hotel de lujo.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                {stats.map((stat, i) => (
                  <div
                    key={stat.label}
                    className={`space-y-2 ${i > 0 ? "border-l border-gray-200 pl-8" : ""}`}
                  >
                    <p className="text-3xl font-extrabold text-primary">
                      {stat.value}
                    </p>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trustpilot Section */}
        <section className="py-24 bg-[#f4f7f4]">
          <div className="container-main">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div className="space-y-4">
                <h2 className="font-display text-4xl font-bold">
                  Déjanos hacerlo bien
                </h2>
                <p className="text-gray-600">
                  Lo que dicen nuestros huéspedes sobre sus experiencias con
                  nosotros.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <span className="text-green-600 font-bold">Trustpilot</span>
                <StarRow />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.map((review) => (
                <div
                  key={review.author}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <StarRow />
                  <p className="text-gray-700 italic mb-6">{review.text}</p>
                  <p className="font-bold">{review.author}</p>
                  <p className="text-sm text-gray-500">{review.location}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stay With Us Section */}
        <section className="py-24">
          <div className="container-main grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="aspect-square rounded-full overflow-hidden border-[16px] border-gray-50 shadow-2xl">
                <img
                  className="w-full h-full object-cover"
                  alt="Guest relaxing in luxury rental"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlfonV99pDs1540biHy4C3aI7avBinpx8_AHmQhLrUjHm_ZU13ppJvfQ0xRr0rWAZ3DeM6fwo6ZZn3fKwGeuE5a7O5-Aj4k6IiDaNphnbxOX8J-ohVu_N4aLrhsUdimhHhRLdP7RmhhWJTk6kZxcjX-fVvuzNghs8nSXDwSDbQDnTj6IUg8Kw3L1EGrqSHEEaEkM_jQAL7IGMbA7vOgq2qU_xRKiB0a8jPi5uzEtbLwGydZHdzg6ftiRCW21e5yCGoxT7E8-Q10Ksg"
                />
              </div>
              <div className="absolute top-10 right-0 bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full text-green-600">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <div>
                  <p className="font-bold">Calidad Premium</p>
                  <p className="text-xs text-gray-500">
                    Garantizada por Gonzalo
                  </p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-10">
              <h2 className="font-display text-4xl lg:text-5xl font-bold">
                Hospédate con nosotros
              </h2>
              <p className="text-lg text-gray-600">
                Disfruta de una estancia sin preocupaciones con beneficios
                diseñados exclusivamente para tu confort.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-4">
                    <div className="bg-primary/10 p-1 rounded-full text-primary">
                      <span className="material-symbols-outlined text-xl">
                        check
                      </span>
                    </div>
                    <span className="font-medium text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
              <button className="bg-primary text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-red-900 transition-all shadow-lg hover:shadow-primary/20">
                Reservar con nosotros
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
