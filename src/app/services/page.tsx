import Link from "next/link";
import {
  FileText,
  Stethoscope,
  Truck,
  HeartPulse,
  Syringe,
  FlaskConical,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { services } from "@/data/services";

const iconMap: Record<string, React.ReactNode> = {
  FileText: <FileText className="h-7 w-7" />,
  Stethoscope: <Stethoscope className="h-7 w-7" />,
  Truck: <Truck className="h-7 w-7" />,
  HeartPulse: <HeartPulse className="h-7 w-7" />,
  Syringe: <Syringe className="h-7 w-7" />,
  FlaskConical: <FlaskConical className="h-7 w-7" />,
};

export default function ServicesPage() {
  return (
    <div>
      {/* Header */}
      <section className="gradient-hero py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
            Our Services
          </h1>
          <p className="text-lg text-white/80">
            Comprehensive pharmacy services designed around your health and
            convenience.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              id={service.id}
              className="flex flex-col rounded-2xl border border-border bg-white p-8 transition-all hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-light text-primary">
                {iconMap[service.icon]}
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">
                {service.title}
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-muted">
                {service.description}
              </p>
              <ul className="mb-6 space-y-2">
                {service.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={
                  service.id === "prescriptions"
                    ? "/prescriptions"
                    : service.id === "consultations"
                      ? "/consult"
                      : "/contact"
                }
                className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Learn More <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-primary py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white">
            Not Sure What You Need?
          </h2>
          <p className="mb-6 text-white/80">
            Our pharmacists are here to help. Book a free consultation and
            we&apos;ll guide you to the right solution.
          </p>
          <Link
            href="/consult"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-white/90"
          >
            Book Free Consultation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
