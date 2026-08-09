"use client";

import { useEffect, useMemo, useState } from "react";

const YOUR_NAME = "Rama";
const HER_NAME = "love";
const WHATSAPP_NUMBER = "919999999999";
const SMS_NUMBER = "+919999999999";
const EMAIL_ADDRESS = "your.email@example.com";

const plans = [
  {
    id: "coffee",
    title: "Coffee Date",
    time: "This evening, 6:30 PM",
    place: "That cozy cafe you like",
    detail: "Coffee, something sweet, and a slow walk after.",
    accent: "bg-[#f5c16c]",
  },
  {
    id: "dinner",
    title: "Simple Dinner",
    time: "Tomorrow, 8:00 PM",
    place: "A calm place with good food",
    detail: "No big plan. Just us, dinner, and a little extra effort.",
    accent: "bg-[#ef7d7d]",
  },
  {
    id: "outing",
    title: "Tiny Outing",
    time: "Sunday afternoon",
    place: "Bookstore, ice cream, or a sunset spot",
    detail: "You choose the mood, I will handle the rest.",
    accent: "bg-[#71b7a5]",
  },
];

const moods = ["Yes, obviously", "Maybe... impress me", "Pick me up first"];

function encode(value: string) {
  return encodeURIComponent(value);
}

export default function Home() {
  const [selectedPlan, setSelectedPlan] = useState(plans[0]);
  const [reply, setReply] = useState(moods[0]);
  const [note, setNote] = useState("I am saying yes because this is cute.");
  const [contact, setContact] = useState({
    whatsapp: WHATSAPP_NUMBER,
    sms: SMS_NUMBER,
    email: EMAIL_ADDRESS,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setContact({
      whatsapp: params.get("wa") || WHATSAPP_NUMBER,
      sms: params.get("sms") || SMS_NUMBER,
      email: params.get("email") || EMAIL_ADDRESS,
    });
  }, []);

  const message = useMemo(() => {
    return [
      `Hey ${YOUR_NAME},`,
      `${reply} ❤️`,
      `Plan: ${selectedPlan.title}`,
      `When: ${selectedPlan.time}`,
      `Where: ${selectedPlan.place}`,
      note ? `My note: ${note}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, [note, reply, selectedPlan]);

  const whatsappHref = `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}?text=${encode(message)}`;
  const smsHref = `sms:${contact.sms}?&body=${encode(message)}`;
  const mailHref = `mailto:${contact.email}?subject=${encode(
    "My answer to your invite",
  )}&body=${encode(message)}`;

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff8f0] text-[#2d2421]">
      <section className="relative isolate flex min-h-screen items-center px-5 py-8 sm:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[-80px] top-[-70px] h-64 w-64 rounded-full bg-[#f5c16c]/55 blur-3xl" />
          <div className="absolute bottom-[-80px] right-[-70px] h-72 w-72 rounded-full bg-[#71b7a5]/35 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/45 blur-2xl" />
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2d2421]/10 bg-white/65 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#ef7d7d]" />
              A very important invitation
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-normal text-[#2d2421] sm:text-6xl lg:text-7xl">
                Hey {HER_NAME}, coffee with me?
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[#5f514d]">
                I made this tiny page because a normal text felt too ordinary.
                Pick a plan, add your verdict, and send it back to me.
              </p>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`min-h-24 rounded-[8px] border p-3 text-left transition ${
                    selectedPlan.id === plan.id
                      ? "border-[#2d2421] bg-white shadow-[0_14px_40px_rgba(45,36,33,0.12)]"
                      : "border-[#2d2421]/10 bg-white/55 hover:bg-white"
                  }`}
                >
                  <span className={`mb-3 block h-2 w-10 rounded-full ${plan.accent}`} />
                  <span className="block text-sm font-extrabold">{plan.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-[#2d2421]/10 bg-white p-4 shadow-[0_24px_80px_rgba(45,36,33,0.16)] sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="relative min-h-[360px] overflow-hidden rounded-[8px] bg-[#2d2421] p-5 text-white">
                <div className="absolute inset-x-8 top-8 h-24 rounded-b-full bg-[#7b4f3a]" />
                <div className="absolute left-1/2 top-20 h-36 w-36 -translate-x-1/2 rounded-full border-[14px] border-[#f5c16c] bg-[#7b4f3a] shadow-inner" />
                <div className="absolute left-[58%] top-28 h-20 w-20 rounded-full border-[12px] border-[#f5c16c]" />
                <div className="absolute bottom-8 left-8 right-8 h-28 rounded-[8px] bg-[#f7e2c2]" />
                <div className="absolute bottom-16 left-14 h-3 w-28 rounded-full bg-[#ef7d7d]" />
                <div className="absolute bottom-24 right-14 h-9 w-9 rotate-45 rounded-[4px] bg-[#71b7a5]" />
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                    selected plan
                  </p>
                  <div>
                    <h2 className="text-4xl font-black leading-none">
                      {selectedPlan.title}
                    </h2>
                    <p className="mt-3 max-w-56 text-sm leading-6 text-white/78">
                      {selectedPlan.detail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[8px] bg-[#fff8f0] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8b746c]">
                    When
                  </p>
                  <p className="mt-1 text-xl font-black">{selectedPlan.time}</p>
                </div>

                <div className="rounded-[8px] bg-[#fff8f0] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8b746c]">
                    Where
                  </p>
                  <p className="mt-1 text-xl font-black">{selectedPlan.place}</p>
                </div>

                <div>
                  <label htmlFor="reply" className="text-sm font-extrabold">
                    Her answer
                  </label>
                  <select
                    id="reply"
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    className="mt-2 w-full rounded-[8px] border border-[#2d2421]/15 bg-white px-4 py-3 font-semibold outline-none focus:border-[#2d2421]"
                  >
                    {moods.map((mood) => (
                      <option key={mood}>{mood}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="note" className="text-sm font-extrabold">
                    Tiny note
                  </label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    className="mt-2 w-full resize-none rounded-[8px] border border-[#2d2421]/15 bg-white px-4 py-3 outline-none focus:border-[#2d2421]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <a
                    href={whatsappHref}
                    className="rounded-[8px] bg-[#25d366] px-3 py-3 text-center text-sm font-black text-[#102418] shadow-sm transition hover:brightness-95"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={smsHref}
                    className="rounded-[8px] bg-[#2d2421] px-3 py-3 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#493d39]"
                  >
                    SMS
                  </a>
                  <a
                    href={mailHref}
                    className="rounded-[8px] bg-[#f5c16c] px-3 py-3 text-center text-sm font-black text-[#2d2421] shadow-sm transition hover:brightness-95"
                  >
                    Email
                  </a>
                </div>

                <p className="text-xs leading-5 text-[#7c6a64]">
                  These buttons open her WhatsApp, messages, or email with the
                  response already written. No backend or paid service needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
