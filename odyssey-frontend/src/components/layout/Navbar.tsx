import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [customCursor, setCustomCursor] = useState(false);
  const toggleCursor = () => {
    setCustomCursor(prev => !prev);
    document.body.style.cursor = customCursor
      ? 'auto'
      : "url('/pointer.png'), auto"; // ✅ Change to your actual image path
  };
  

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    console.log("user :",user?.avatar);
  };

  const navigate = useNavigate();

  const handleMapClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (isAuthenticated) {
      navigate('/map');
    } else {
      // Redirect unauthenticated users to login
      navigate('/login', { state: { from: '/map' } });
    }
  };

  return (
    <nav className="bg-background border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Sun className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-foreground">Odyssey</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link to="/explore" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Explore
            </Link>
            <button onClick={handleMapClick} className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Map
            </button>
            <Link to="/timeline" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Timeline
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/journals" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  My Journals
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Sign up</Link>
                </Button>
              </div>
            )}

            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-2 space-y-1 sm:px-3 border-t">
            <Link
              to="/explore"
              className="block text-foreground hover:text-primary px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Explore
            </Link>
            <button
              onClick={(e) => { handleMapClick(e); setIsOpen(false); }}
              className="block text-foreground hover:text-primary px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Map
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/timeline"
                  className="block text-foreground hover:text-primary px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Timeline
                </Link>
                <Link
                  to="/journals"
                  className="block text-foreground hover:text-primary px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  My Journals
                </Link>
                <Link
                  to="/profile"
                  className="block text-foreground hover:text-primary px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left text-foreground hover:text-primary px-3 py-2 rounded-md text-base font-medium"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="space-y-1 px-3 py-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/login" onClick={() => setIsOpen(false)}>Log in</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link to="/register" onClick={() => setIsOpen(false)}>Sign up</Link>
                </Button>
              </div>
            )}

            <div className="px-3 py-2">
              <Button
                variant="ghost"
                size="icon"
                className="w-full justify-center"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <span className="ml-2">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </Button>
              
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
