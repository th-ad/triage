import type { NextRequest } from "next/server";
import { getChatsByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { requireSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get("limit") || "10", 10);
  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      "bad_request:api",
      "Only one of starting_after or ending_before can be provided."
    ).toResponse();
  }

  const session = await requireSession();
  const userId = session.user.id;

  const chats = await getChatsByUserId({
    id: userId,
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(chats);
}
