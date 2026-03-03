export type Service = {
  id: string;
  title: string;
  description: string;
  features: string[];
  icon: string;
};

export const services: Service[] = [
  {
    id: "prescriptions",
    title: "Prescription Services",
    description:
      "Transfer, refill, and manage your prescriptions with ease. We handle insurance and offer auto-refill reminders.",
    features: [
      "Easy prescription transfers",
      "Auto-refill reminders",
      "Insurance billing assistance",
      "Generic substitution guidance",
    ],
    icon: "FileText",
  },
  {
    id: "consultations",
    title: "Pharmacist Consultations",
    description:
      "Book a private consultation with our licensed pharmacists — in-store or via secure video call.",
    features: [
      "Medication therapy reviews",
      "Drug interaction checks",
      "Health goal planning",
      "15 or 30-minute sessions",
    ],
    icon: "Stethoscope",
  },
  {
    id: "delivery",
    title: "Home Delivery",
    description:
      "Free same-day delivery within 10 km. Discreet packaging with temperature-controlled options.",
    features: [
      "Free same-day local delivery",
      "Temperature-controlled packaging",
      "Real-time tracking",
      "Contactless drop-off available",
    ],
    icon: "Truck",
  },
  {
    id: "screenings",
    title: "Health Screenings",
    description:
      "Walk-in screenings for blood pressure, blood glucose, cholesterol, and BMI — no appointment needed.",
    features: [
      "Blood pressure checks",
      "Blood glucose testing",
      "Cholesterol screening",
      "BMI & wellness assessments",
    ],
    icon: "HeartPulse",
  },
  {
    id: "immunizations",
    title: "Immunizations",
    description:
      "Stay protected with flu, COVID-19, shingles, and travel vaccines administered by certified pharmacists.",
    features: [
      "Flu & COVID-19 vaccines",
      "Travel immunizations",
      "Shingles & pneumonia shots",
      "Walk-ins welcome",
    ],
    icon: "Syringe",
  },
  {
    id: "compounding",
    title: "Custom Compounding",
    description:
      "Personalised medication formulations when standard options don't meet your needs.",
    features: [
      "Flavoured paediatric meds",
      "Allergy-free formulations",
      "Custom dosage strengths",
      "Topical preparations",
    ],
    icon: "FlaskConical",
  },
];
