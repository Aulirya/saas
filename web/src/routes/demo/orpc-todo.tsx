import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/demo/orpc-todo")({
  component: ORPCTodos,
});

function ORPCTodos() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-purple-100 to-blue-100 p-4 text-white">
      <p className="text-2xl mb-4">
        Outedated you need to login to see this page
      </p>
      <p> /todos</p>
    </div>
  );
}
