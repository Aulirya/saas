import { RecordId } from "surrealdb";

/**
 * Parse a SurrealDB record ID that might be full (table:record_id) or partial (record_id).
 * If partial, uses the provided default table name.
 *
 * @param id - The ID string, either full format (table:record_id) or partial (record_id)
 * @param defaultTable - The default table name to use if the ID is partial
 * @returns A RecordId instance
 *
 * @example
 * parseRecordId("subjects:subject_01", "subjects") // Returns RecordId("subjects", "subject_01")
 * parseRecordId("subject_01", "subjects") // Returns RecordId("subjects", "subject_01")
 * parseRecordId("lessons:lesson_01", "lessons") // Returns RecordId("lessons", "lesson_01")
 */
export function parseRecordId(id: string, defaultTable: string): RecordId {
    // If the ID already contains a colon, it's a full record ID
    if (id.includes(":")) {
        // Parse it: split by colon and create RecordId
        const [table, recordId] = id.split(":", 2);
        return new RecordId(table, recordId);
    }
    // Otherwise, it's just the ID part - use the default table
    return new RecordId(defaultTable, id);
}
