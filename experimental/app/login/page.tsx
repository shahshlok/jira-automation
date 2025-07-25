"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { checkAuth } from "@/lib/apiHelpers";

export default function Login() {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await checkAuth();
        router.push('/');
        return;
      } catch (error) {
        console.error('Authentication check error:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthentication();
  }, [router]);

  const handleLogin = () => {
    window.location.href = '/api/auth/atlassian';
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            DX Test Hub
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Connect your Atlassian account to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
            size="lg"
          >
            Login with Atlassian
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}