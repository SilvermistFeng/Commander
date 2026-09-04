import { fetchForecast } from "@/lib/openMeteo";
import { fail, ok } from "@/lib/apiHelpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return fail("This trip has no location set, so there's nothing to forecast.");
  }
  if (!start || !end) return fail("Missing trip dates.");

  return ok(await fetchForecast(lat, lon, start, end));
}
