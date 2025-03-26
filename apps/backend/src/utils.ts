import { verifySession } from "./auth";
import { checkEnrollment } from "./verify-enrollment";

export async function verifyRoomAccess(
  userId: string,
  roomId: string,
): Promise<boolean> {
  if (!verifySession(userId)) {
    return false;
  }

  try {
    const isEnrolled = await checkEnrollment(userId, Number(roomId));
    return isEnrolled;
    return true;
  } catch (error) {
    console.error("Error checking enrollment:", error);
    return false;
  }
}
