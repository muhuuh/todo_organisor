import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signOut } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, CheckSquare, ListTodo, FileText } from "lucide-react";

export function Navbar() {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const success = await signOut();
    if (success) {
      navigate("/sign-in");
    }
    setIsSigningOut(false);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <h1 className="text-lg font-medium">Task Manager</h1>
          <div className="flex items-center space-x-1">
            <Link
              to="/"
              className="px-3 py-2 rounded-md hover:bg-muted flex items-center"
            >
              <ListTodo className="h-4 w-4 mr-2" />
              Tasks
            </Link>
            <Link
              to="/completed"
              className="px-3 py-2 rounded-md hover:bg-muted flex items-center"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Completed
            </Link>
            <Link
              to="/notes"
              className="px-3 py-2 rounded-md hover:bg-muted flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Notes
            </Link>
          </div>
        </div>
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}
