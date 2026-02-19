import React from "react";
import { useHistory } from "react-router-dom";
import { User, ChevronDown, LogOut, Settings } from "lucide-react";
import { useAuth } from "context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "components/ui/dropdown-menu";

export default function HeaderLinks() {
  const history = useHistory();
  const { user, userProfile, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      history.push("/auth/login-page");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/80 transition-all duration-150 outline-none">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-foreground text-background text-xs font-bold">
            {(userProfile?.full_name || "U")[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground">{userProfile?.full_name || "User"}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {user && (
            <>
              <DropdownMenuLabel className="font-normal">
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => history.push("/admin/settings")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => history.push("/admin/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
