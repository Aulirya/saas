import { base } from "./base";
import { addTodo, listTodos } from "./todos";
import { listSchoolClasses } from "./school_class";

export const router = base.router({
  todo: {
    list: listTodos,
    add: addTodo,
  },
  schoolClass: {
    list: listSchoolClasses,
  },
});

export type Router = typeof router;
