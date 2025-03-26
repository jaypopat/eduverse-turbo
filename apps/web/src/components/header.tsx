import { useContract } from "@/providers/ContractProvider";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Loader2, Menu, X, User, GraduationCap, FileText } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Courses", href: "/courses" },
  { name: "Certificates", href: "/certificates" },
  { name: "Teach", href: "/teach" },
];

export default function Header() {
  const {
    connectWallet,
    selectedAccount,
    setSelectedAccount,
    accounts,
    isConnecting,
  } = useContract();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = useRouter().state.location.pathname;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // Handle account switching via the select element
  const handleAccountSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const account = accounts.find((acc) => acc.address === e.target.value);
    if (account) {
      setSelectedAccount(account);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        scrolled
          ? "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          : "bg-background",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Eduverse
            </span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {item.name}
              </Link>
            ))}
            {selectedAccount && (
              <Link
                to="/" // TODO: Change to /dashboard
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/dashboard"
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {selectedAccount ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 px-3 flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                    {selectedAccount?.meta.name?.charAt(0) ||
                      selectedAccount.address.charAt(0)}
                  </div>
                  <span className="max-w-[100px] truncate">
                    {selectedAccount?.meta?.name ||
                      selectedAccount?.address.substring(0, 6) +
                        "..." +
                        selectedAccount?.address.substring(
                          selectedAccount?.address.length - 4,
                        )}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard Overview
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/" // TODO: Change to /dashboard?tab=courses
                    className="flex items-center"
                  >
                    <GraduationCap className="mr-2 h-4 w-4" />
                    My Courses
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/" // TODO: Change to /dashboard?tab=certificates
                    className="flex items-center"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    My Certificates
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Improved Account Switcher */}
                <div className="px-2 py-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Switch Account
                  </label>
                  <div className="mt-2 space-y-1">
                    {accounts.map((account) => (
                      <Button
                        key={account.address}
                        variant={
                          selectedAccount?.address === account.address
                            ? "secondary"
                            : "ghost"
                        }
                        className="w-full justify-start text-sm h-auto py-1.5"
                        onClick={() => setSelectedAccount(account)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                            {selectedAccount?.meta?.name?.charAt(0) ||
                              selectedAccount?.address?.charAt(0)}
                          </div>
                          <span className="truncate">
                            {account.meta.name ||
                              account.address.substring(0, 10) + "..."}
                          </span>
                          {selectedAccount?.address === account.address && (
                            <div className="ml-auto w-2 h-2 rounded-full bg-primary"></div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedAccount(null)}>
                  Disconnect Wallet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              size="sm"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting
                </>
              ) : (
                "Connect Wallet"
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="container md:hidden py-4 border-t">
          <nav className="flex flex-col gap-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {selectedAccount && (
              <Link
                to="/"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/dashboard"
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
