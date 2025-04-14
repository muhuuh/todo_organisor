import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { signOut } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  LogOut,
  CheckSquare,
  ListTodo,
  FileText,
  Menu,
  X,
  User,
  KeyRound,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const success = await signOut();
    if (success) {
      navigate("/sign-in");
    }
    setIsSigningOut(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2 md:space-x-6">
          <h1 className="text-lg font-medium">Task Manager</h1>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md hover:bg-muted flex items-center ${
                isActive("/") ? "bg-muted font-medium" : ""
              }`}
            >
              <ListTodo className="h-4 w-4 mr-2" />
              Tasks
            </Link>
            <Link
              to="/completed"
              className={`px-3 py-2 rounded-md hover:bg-muted flex items-center ${
                isActive("/completed") ? "bg-muted font-medium" : ""
              }`}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Completed
            </Link>
            <Link
              to="/notes"
              className={`px-3 py-2 rounded-md hover:bg-muted flex items-center ${
                isActive("/notes") ? "bg-muted font-medium" : ""
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Notes
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* User Dropdown Menu (Desktop) */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to="/api-keys"
                    className="cursor-pointer w-full flex items-center"
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    <span>API Keys</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="cursor-pointer"
                >
                  {isSigningOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col h-full">
                <div className="flex-1 py-6">
                  <h2 className="text-lg font-semibold mb-6">Navigation</h2>
                  <div className="flex flex-col space-y-2">
                    <Link
                      to="/"
                      className={`px-3 py-2 rounded-md hover:bg-muted flex items-center ${
                        isActive("/") ? "bg-muted font-medium" : ""
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ListTodo className="h-5 w-5 mr-3" />
                      Tasks
                    </Link>
                    <Link
                      to="/completed"
                      className={`px-3 py-2 rounded-md hover:bg-muted flex items-center ${
                        isActive("/completed") ? "bg-muted font-medium" : ""
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <CheckSquare className="h-5 w-5 mr-3" />
                      Completed Tasks
                    </Link>
                    <Link
                      to="/notes"
                      className={`px-3 py-2 rounded-md hover:bg-muted flex items-center ${
                        isActive("/notes") ? "bg-muted font-medium" : ""
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FileText className="h-5 w-5 mr-3" />
                      Notes
                    </Link>
                    <Link
                      to="/api-keys"
                      className={`px-3 py-2 rounded-md hover:bg-muted flex items-center ${
                        isActive("/api-keys") ? "bg-muted font-medium" : ""
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <KeyRound className="h-5 w-5 mr-3" />
                      API Keys
                    </Link>
                  </div>
                </div>
                <div className="py-4 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    disabled={isSigningOut}
                  >
                    {isSigningOut ? (
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    ) : (
                      <LogOut className="h-5 w-5 mr-3" />
                    )}
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
