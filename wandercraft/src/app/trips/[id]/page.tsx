import { Suspense } from "react";
import { TripWorkspace } from "@/components/trip/TripWorkspace";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // A guest trip only exists in the browser, so the workspace loads its own
  // data on the client and this page stays a thin shell either way.
  return (
    <Suspense fallback={null}>
      <TripWorkspace key={id} tripId={id} />
    </Suspense>
  );
}
