import { RecordId, surql, Surreal } from "surrealdb";
import { ORPCError } from "@orpc/server";
import type { CourseProgressModel } from "../repository/model/course_progress";

export const getUserRecordId = (userId: string): RecordId =>
    new RecordId("users", userId);

export async function verifyCourseProgressOwnership(
    db: Surreal,
    courseProgressId: RecordId,
    userId: RecordId
): Promise<CourseProgressModel> {
    const query = surql`
        SELECT * FROM course_progress 
        WHERE id = ${courseProgressId} 
        AND user_id = ${userId}
    `;
    const result = await db.query<[CourseProgressModel[]]>(query).collect();
    const courseProgress = result[0]?.[0];

    if (!courseProgress) {
        throw new ORPCError("NOT_FOUND", {
            message:
                "Progression de cours non trouvée ou vous n'avez pas l'autorisation d'y accéder",
        });
    }

    return courseProgress;
}
