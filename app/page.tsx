import type { Metadata } from "next";
import { OfferGuardApp } from "./components/OfferGuardApp";

export const metadata: Metadata = {
  title: "Check an offer",
  description:
    "Scan job offers and recruiter messages for pressure tactics, payment requests, impersonation, and other scam signals.",
};

export default function Home() {
  return <OfferGuardApp />;
}
