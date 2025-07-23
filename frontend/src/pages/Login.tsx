import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:5000/auth/me', {
          credentials: 'include'
        });

        if (response.ok) {
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Authentication check error:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/atlassian';
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
            JIRA Automation
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
};

export default Login;