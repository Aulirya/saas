import { base } from "./base";
import { addTodo, listTodos } from "./todos";
import { listSchoolClasses } from "./school_class";
import { listLessons } from "./lesson";
import { listSubjects } from "./subject";

export const router = base.router({
  todo: {
    list: listTodos,
    add: addTodo,
  },
  schoolClass: {
    list: listSchoolClasses,
  },
  subject: {
    list: listSubjects,
  },
  lesson: {
    list: listLessons,
  },
});

export type Router = typeof router;
