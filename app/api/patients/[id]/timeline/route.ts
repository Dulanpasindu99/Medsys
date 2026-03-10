import { NextRequest } from "next/server";
import { forwardPatientSupportFeed } from "../support-feed-route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return forwardPatientSupportFeed(
    request,
    params,
    "timeline",
    "Unable to load patient timeline.",
    "patient timeline"
  );
}
