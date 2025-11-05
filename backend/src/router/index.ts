import { base } from "./base";
import { addTodo, listTodos } from "./todos";
import {
  createSchoolClass,
  getSchoolClass,
  listSchoolClasses,
  patchSchoolClass,
} from "./school_class";
import { getLesson, listLessons } from "./lesson";
import { getSubject, listSubjects } from "./subject";

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
  },
  lesson: {
    list: listLessons,
    get: getLesson,
  },
});

export type Router = typeof router;
