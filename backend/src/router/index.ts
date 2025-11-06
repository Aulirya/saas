import { base } from "./base";
import { addTodo, listTodos } from "./todos";
import {
  createSchoolClass,
  getSchoolClass,
  listSchoolClasses,
  patchSchoolClass,
} from "./school_class";
import { getLesson, listLessons } from "./lesson";
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
    get: getSchoolClass,
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
  },
});

export type Router = typeof router;
