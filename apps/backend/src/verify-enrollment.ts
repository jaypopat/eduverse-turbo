import { contractInstance, ContractResult } from "contract-instance";
export async function checkEnrollment(
  userId: string,
  courseId: number,
): Promise<boolean> {
  const enrolledResult = (await contractInstance.query("verify_enrollment", {
    data: {
      student: userId,
      course_id: courseId,
    },
    origin: userId,
  })) as ContractResult<boolean>;

  if (enrolledResult.success) {
    return true;
  } else {
    return false;
  }
}
