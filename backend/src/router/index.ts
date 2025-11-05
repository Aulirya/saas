import { base } from "./base";
import { addTodo, listTodos } from "./todos";
import { getSchoolClass, listSchoolClasses } from "./school_class";
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
