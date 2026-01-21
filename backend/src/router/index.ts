import { base } from "./base";
import { addTodo, listTodos } from "./todos";
import { uploadFile, getLastFile } from "./file";
import {
    createSchoolClass,
    getSchoolClass,
    getSchoolClassWithSubjects,
    listLevels,
    listSchoolClasses,
    listSchools,
    patchSchoolClass,
} from "./school_class";
import {
    createLesson,
    deleteLesson,
    getLesson,
    listLessons,
    patchLesson,
    reorderLesson,
} from "./lesson";
import {
    checkSubjectNameExists,
    createSubject,
    getSubjectWithLessons,
    getAllSubjects,
    patchSubject,
} from "./subject";
import {
    createCourseProgress,
    listCourseProgress,
    deleteCourseProgress,
    getCourseProgress,
    getCourseProgressWithLessons,
    patchCourseProgress,
    generateLessonProgressSchedule,
    checkScheduleConflictsOnly,
    getAllLessonsForCalendar,
} from "./course_progress";
import {
    createLessonProgress,
    deleteLessonProgress,
    getLessonProgress,
    patchLessonProgress,
} from "./lesson_progress";
import { getCurrentUser } from "./user";

export const router = base.router({
    user: {
        getCurrent: getCurrentUser,
    },
    todo: {
        list: listTodos,
        add: addTodo,
    },
    schoolClass: {
        list: listSchoolClasses,
        listSchools: listSchools,
        listLevels: listLevels,
        get: getSchoolClass,
        getWithSubjects: getSchoolClassWithSubjects,
        patch: patchSchoolClass,
        create: createSchoolClass,
    },
    subject: {
        list: getAllSubjects,
        getWithLessons: getSubjectWithLessons,
        checkNameExists: checkSubjectNameExists,
        create: createSubject,
        patch: patchSubject,
    },
    lesson: {
        list: listLessons,
        get: getLesson,
        create: createLesson,
        reorder: reorderLesson,
        patch: patchLesson,
        delete: deleteLesson,
    },
    courseProgress: {
        list: listCourseProgress,
        get: getCourseProgress,
        getWithLessons: getCourseProgressWithLessons,
        create: createCourseProgress,
        patch: patchCourseProgress,
        delete: deleteCourseProgress,
        generateSchedule: generateLessonProgressSchedule,
        checkScheduleConflictsOnly: checkScheduleConflictsOnly,
        getAllLessonsForCalendar: getAllLessonsForCalendar,
    },
    lessonProgress: {
        get: getLessonProgress,
        create: createLessonProgress,
        patch: patchLessonProgress,
        delete: deleteLessonProgress,
    },
    file: {
        upload: uploadFile,
        getLastFile: getLastFile,
    },
});

export type Router = typeof router;
