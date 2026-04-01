import { NextRequest } from "next/server";
import { forwardPatientSupportFeed } from "../support-feed-route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return forwardPatientSupportFeed(
    request,
    params,
    "consultations",
    "Unable to load patient consultations.",
    "patient consultations"
  );
}
