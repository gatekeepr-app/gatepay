import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin/api-docs")({
  loader: () => {
    throw redirect({ to: "/docs/payments-api" });
  },
  component: () => null,
});
