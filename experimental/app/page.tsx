"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  // No longer need isChecking state since middleware handles auth

  useEffect(() => {
    // Let middleware handle authentication redirect
    // This page should only be reached by authenticated users
    // due to middleware, so redirect to dashboard
    const timer = setTimeout(() => {
      router.replace("/dashboard");
    }, 100); // Small delay to let middleware work
    
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-lg">Redirecting...</div>
    </div>
  );
}