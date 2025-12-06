import type { Subject } from "@saas/shared";
import type { SubjectModel } from "../model/subjects";

// Type for models that may have nested subject_id (from SurrealDB queries with subject_id.*)
type SubjectModelWithNestedId = SubjectModel & {
    subject_id?: SubjectModel;
};

type SubjectType = "core" | "option" | "support";
type SubjectCategory = SubjectCategory;

export namespace SubjectMapper {
    /**
     * Helper to extract a value from either subject_id.* (nested) or direct property
     * Handles SurrealDB queries that spread subject_id.* properties
     */
    function getValue<T>(
        model: SubjectModelWithNestedId,
        key: keyof SubjectModel
    ): T | undefined {
        return (model.subject_id?.[key] ?? model[key]) as T | undefined;
    }

    export function fromModel(
        model: SubjectModel | SubjectModelWithNestedId
    ): Subject {
        const modelWithNested = model as SubjectModelWithNestedId;

        return {
            id:
                getValue(modelWithNested, "id")?.toString() ??
                model.id.toString(),
            name: getValue(modelWithNested, "name") ?? model.name,
            description:
                getValue(modelWithNested, "description") ??
                model.description ??
                "",
            type:
                (getValue(modelWithNested, "type") as SubjectType) ??
                model.type,
            category:
                (getValue(modelWithNested, "category") as SubjectCategory) ??
                model.category,
        };
    }
}
