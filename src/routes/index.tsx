import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => {
    navigate({ to: user ? "/app/dashboard" : "/login", replace: true });
  }, [user, navigate]);
  return null;
}
