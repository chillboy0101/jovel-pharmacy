export type Testimonial = {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Sarah Mitchell",
    role: "Verified Customer",
    content:
      "The pharmacists here actually take time to explain my medications. I switched from a big-chain pharmacy and the difference is night and day.",
    rating: 5,
    avatar: "SM",
  },
  {
    id: "t2",
    name: "James Okonkwo",
    role: "Verified Customer",
    content:
      "Prescription delivery is a game-changer. Fast, discreet, and they always include clear dosage reminders. Highly recommend.",
    rating: 5,
    avatar: "JO",
  },
  {
    id: "t3",
    name: "Maria Chen",
    role: "Verified Customer",
    content:
      "I booked an online consultation for my daughter's allergies. The pharmacist was thorough and kind — we had a treatment plan within 20 minutes.",
    rating: 5,
    avatar: "MC",
  },
  {
    id: "t4",
    name: "David Reeves",
    role: "Verified Customer",
    content:
      "Best skincare advice I've received outside of a dermatologist. Their product range is curated, not overwhelming.",
    rating: 4,
    avatar: "DR",
  },
];
