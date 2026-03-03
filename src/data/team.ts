export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  imageUrl?: string; // drop a real photo path here e.g. "/team/elena.jpg"
};

export const team: TeamMember[] = [
  {
    id: "tm1",
    name: "Dr. Elena Jovel",
    role: "Founder & Head Pharmacist",
    bio: "20+ years in clinical pharmacy. Passionate about patient-centred care and preventive health.",
    avatar: "EJ",
    imageUrl: undefined,
  },
  {
    id: "tm2",
    name: "Marcus Thompson",
    role: "Senior Pharmacist",
    bio: "Specialist in medication therapy management and chronic disease support.",
    avatar: "MT",
    imageUrl: undefined,
  },
  {
    id: "tm3",
    name: "Priya Sharma",
    role: "Clinical Pharmacist",
    bio: "Expert in immunizations, health screenings, and wellness consultations.",
    avatar: "PS",
    imageUrl: undefined,
  },
  {
    id: "tm4",
    name: "Alex Nguyen",
    role: "Pharmacy Technician",
    bio: "Ensures accurate dispensing and seamless prescription management for every patient.",
    avatar: "AN",
    imageUrl: undefined,
  },
];
