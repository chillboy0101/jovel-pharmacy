"use client";

import { useState } from "react";
import { Briefcase, MapPin, Clock, DollarSign, CheckCircle2, Upload, X } from "lucide-react";

type JobPosting = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
};

const jobs: JobPosting[] = [
  {
    id: "1",
    title: "Pharmacist",
    department: "Pharmacy",
    location: "Accra, Ghana",
    type: "Full-time",
    salary: "$60,000 - $80,000",
    description: "We're seeking a licensed pharmacist to join our team and provide exceptional patient care.",
    requirements: [
      "PharmD or equivalent degree",
      "Active pharmacy license in Ghana",
      "2+ years of retail pharmacy experience",
      "Strong communication and counseling skills",
      "Knowledge of pharmacy software systems",
    ],
    responsibilities: [
      "Dispense medications and provide patient counseling",
      "Review prescriptions for accuracy and safety",
      "Manage inventory and ordering",
      "Collaborate with healthcare providers",
      "Train and supervise pharmacy technicians",
    ],
  },
  {
    id: "2",
    title: "Pharmacy Technician",
    department: "Pharmacy",
    location: "Accra, Ghana",
    type: "Full-time",
    salary: "$35,000 - $45,000",
    description: "Join our team as a certified pharmacy technician and help us deliver excellent service to our customers.",
    requirements: [
      "Pharmacy Technician certification",
      "1+ years of experience preferred",
      "Strong attention to detail",
      "Customer service skills",
      "Basic computer proficiency",
    ],
    responsibilities: [
      "Assist pharmacists with prescription processing",
      "Manage inventory and stock shelves",
      "Process insurance claims",
      "Provide customer service",
      "Maintain clean and organized workspace",
    ],
  },
  {
    id: "3",
    title: "Customer Service Representative",
    department: "Customer Care",
    location: "Accra, Ghana",
    type: "Full-time",
    salary: "$28,000 - $35,000",
    description: "We're looking for a friendly and knowledgeable customer service representative to join our front-line team.",
    requirements: [
      "High school diploma or equivalent",
      "Excellent communication skills",
      "Customer service experience preferred",
      "Ability to multitask",
      "Proficiency in Microsoft Office",
    ],
    responsibilities: [
      "Greet and assist customers",
      "Process transactions and handle payments",
      "Answer phone calls and emails",
      "Resolve customer inquiries and complaints",
      "Maintain store appearance",
    ],
  },
  {
    id: "4",
    title: "Digital Marketing Manager",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    salary: "$55,000 - $70,000",
    description: "Lead our digital marketing efforts and help grow our online presence and e-commerce platform.",
    requirements: [
      "Bachelor's degree in Marketing or related field",
      "3+ years of digital marketing experience",
      "SEO/SEM and social media expertise",
      "Analytics and data-driven mindset",
      "E-commerce experience preferred",
    ],
    responsibilities: [
      "Develop and execute digital marketing strategies",
      "Manage social media channels and campaigns",
      "Optimize website for search engines",
      "Analyze performance metrics and ROI",
      "Collaborate with design and content teams",
    ],
  },
];

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [applying, setApplying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resume, setResume] = useState<File | null>(null);

  const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApplying(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmitted(true);
    setApplying(false);
  };

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-32 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-primary" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Application Submitted!
        </h1>
        <p className="mb-6 text-muted">
          Thank you for your interest in joining Jovel Pharmacy. We'll review your application and get back to you within 5 business days.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setSelectedJob(null);
            setResume(null);
          }}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Back to Careers
        </button>
      </div>
    );
  }

  if (selectedJob) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <button
          onClick={() => setSelectedJob(null)}
          className="mb-6 text-sm font-medium text-primary hover:underline"
        >
          ← Back to all jobs
        </button>

        <div className="mb-8 rounded-2xl border border-border bg-white p-6 md:p-8">
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            {selectedJob.title}
          </h1>
          <div className="mb-6 flex flex-wrap gap-3 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" /> {selectedJob.department}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {selectedJob.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {selectedJob.type}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" /> {selectedJob.salary}
            </span>
          </div>

          <p className="mb-6 text-foreground">{selectedJob.description}</p>

          <div className="mb-6">
            <h2 className="mb-3 text-lg font-bold text-foreground">Requirements</h2>
            <ul className="space-y-2">
              {selectedJob.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold text-foreground">Responsibilities</h2>
            <ul className="space-y-2">
              {selectedJob.responsibilities.map((resp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {resp}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 md:p-8">
          <h2 className="mb-6 text-xl font-bold text-foreground">Apply for this position</h2>
          <form onSubmit={handleApply} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                name="firstName"
                placeholder="First name"
                required
                className="rounded-xl border border-border px-4 py-3 outline-none focus:border-primary"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                required
                className="rounded-xl border border-border px-4 py-3 outline-none focus:border-primary"
              />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              className="w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-primary"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone number"
              required
              className="w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-primary"
            />
            <input
              type="url"
              name="linkedin"
              placeholder="LinkedIn profile (optional)"
              className="w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-primary"
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Resume / CV *
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  required
                  onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                  className="sr-only"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
                    resume
                      ? "border-primary bg-primary-light/10"
                      : "border-border bg-muted-light hover:border-primary/50"
                  }`}
                >
                  {resume ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">{resume.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setResume(null);
                        }}
                        className="ml-2 text-muted hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto mb-2 h-8 w-8 text-muted" />
                      <p className="text-sm font-medium text-foreground">
                        Click to upload resume
                      </p>
                      <p className="text-xs text-muted">PDF, DOC, or DOCX (max 5 MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <textarea
              name="coverLetter"
              placeholder="Cover letter or additional information (optional)"
              rows={5}
              className="w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-primary"
            />

            <button
              type="submit"
              disabled={applying}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {applying ? "Submitting…" : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <section className="gradient-hero py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
            Join Our Team
          </h1>
          <p className="text-lg text-white/80">
            Build your career at Jovel Pharmacy and help us deliver exceptional healthcare to our community.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16 md:px-6">
        {/* Why work with us */}
        <div className="mb-12 rounded-2xl border border-primary/20 bg-primary-light p-6 md:p-8">
          <h2 className="mb-4 text-2xl font-bold text-foreground">Why Work With Us?</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Competitive Benefits",
                desc: "Health insurance, retirement plans, and paid time off",
              },
              {
                title: "Career Growth",
                desc: "Training programs and advancement opportunities",
              },
              {
                title: "Work-Life Balance",
                desc: "Flexible schedules and supportive team environment",
              },
            ].map((benefit, i) => (
              <div key={i} className="rounded-xl bg-white p-4">
                <h3 className="mb-1 text-sm font-bold text-foreground">{benefit.title}</h3>
                <p className="text-xs text-muted">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Job listings */}
        <h2 className="mb-6 text-2xl font-bold text-foreground">Open Positions</h2>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-border bg-white p-6 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="mb-1 text-lg font-bold text-foreground">{job.title}</h3>
                  <p className="text-sm text-muted">{job.department}</p>
                </div>
                <button
                  onClick={() => setSelectedJob(job)}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  View & Apply
                </button>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {job.type}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" /> {job.salary}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Equal opportunity statement */}
        <div className="mt-12 rounded-xl border border-border bg-muted-light p-6 text-center">
          <p className="text-sm text-muted">
            Jovel Pharmacy is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees.
          </p>
        </div>
      </div>
    </div>
  );
}
