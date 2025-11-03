import { os } from "@orpc/server";
import { addTodo, listTodos } from "./todos";

export const router = os.router({
  todo: {
    list: listTodos,
    add: addTodo,
  },
});

export type Router = typeof router;
