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
import { createLesson, getLesson, listLessons, patchLesson } from "./lesson";
import {
    createSubject,
    getSubject,
    listSubjects,
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
        list: listSubjects,
        get: getSubject,
        create: createSubject,
        patch: patchSubject,
    },
    lesson: {
        list: listLessons,
        get: getLesson,
        create: createLesson,
        patch: patchLesson,
    },
});

export type Router = typeof router;
