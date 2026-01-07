import { base } from "./base";
import { addTodo, listTodos } from "./todos";
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
} from "./lesson";
import {
    checkSubjectNameExists,
    createSubject,
    getSubjectWithLessons,
    getAllSubjects,
    patchSubject,
} from "./subject";

export const router = base.router({
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
        patch: patchLesson,
        delete: deleteLesson,
    },
});

export type Router = typeof router;
