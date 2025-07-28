import { Search, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Project } from "@/lib/apiHelpers";

interface HeaderBarProps {
    selectedProject: Project | null;
    user: any;
    currentTime: Date;
    onSearchOpen: () => void;
    onLogout: () => void;
}

export const HeaderBar = ({
    selectedProject,
    user,
    currentTime,
    onSearchOpen,
    onLogout,
}: HeaderBarProps) => {
    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold text-gray-900">
                        DX Test Hub
                    </h1>
                    {selectedProject && (
                        <Badge
                            variant="outline"
                            className="border-emerald-200 text-slate-50 border bg-green-500"
                        >
                            {selectedProject.name}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onSearchOpen}
                        className="text-gray-600 font-medium"
                    >
                        <Search className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Search</span>
                        <kbd className="ml-2 px-0.5 py-0.5 bg-gray-100 rounded text-xs tracking-[0.2em] tracking-widest">
                            ⌘K
                        </kbd>
                    </Button>

                    <div className="text-sm text-gray-500">
                        Last updated: {currentTime.toLocaleTimeString()}
                    </div>

                    {user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-8 w-8 rounded-full"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={
                                                user.picture ||
                                                "/placeholder.svg"
                                            }
                                            alt={user.name}
                                        />
                                        <AvatarFallback>
                                            {user.name
                                                .split(" ")
                                                .map(
                                                    (n: string) => n[0],
                                                )
                                                .join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-56"
                                align="end"
                                forceMount
                            >
                                <div className="flex items-center justify-start gap-2 p-2">
                                    <div className="flex flex-col space-y-1 leading-none">
                                        <p className="font-medium">
                                            {user.name}
                                        </p>
                                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={onLogout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    );
};