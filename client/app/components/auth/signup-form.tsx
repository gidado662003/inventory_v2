"use client";

import { useState } from "react";
import { useSignup } from "@/lib/api/auth/queries";
import { signupSchema } from "@/lib/api/auth/schema";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card } from "@/app/components/ui/card";
import Link from "next/link";

export function SignupForm() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const signup = useSignup();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = signupSchema.safeParse({ name, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    signup.mutate(result.data);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <p className="text-sm text-muted">Get started</p>
          <h1 className="text-2xl font-semibold">Create account</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
          {signup.isError && (
            <p className="text-sm text-danger">{signup.error.message}</p>
          )}
          <Button type="submit" className="w-full" disabled={signup.isPending}>
            {signup.isPending ? "Creating..." : "Sign up"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
