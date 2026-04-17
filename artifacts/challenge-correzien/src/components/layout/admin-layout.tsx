import { Link, useLocation } from "wouter";
import { useLogout, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, LayoutDashboard, Users, MapPin, Trophy, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: me, isLoading, isError } = useGetMe({ query: { retry: false } });
  const logout = useLogout();
  const isLoggingOut = useRef(false);

  useEffect(() => {
    if (!isLoading && (isError || !me?.isAuthenticated)) {
      setLocation("/admin/login");
    }
  }, [isLoading, isError, me, setLocation]);

  const handleLogout = () => {
    if (isLoggingOut.current || logout.isPending) return;
    isLoggingOut.current = true;
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/admin/login");
      },
      onSettled: () => {
        isLoggingOut.current = false;
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground font-bold uppercase tracking-widest">Chargement...</div>
      </div>
    );
  }

  if (isError || !me?.isAuthenticated) {
    return null;
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/admin/years", label: "Saisons", icon: Calendar },
    { href: "/admin/stages", label: "Étapes", icon: MapPin },
    { href: "/admin/players", label: "Joueurs", icon: Users },
    { href: "/admin/scores", label: "Scores", icon: Trophy },
    { href: "/admin/scoring-rules", label: "Barème", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/">
            <h2 className="text-xl font-bold uppercase tracking-wider cursor-pointer">Admin DGB</h2>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">Challenge Corrézien</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border ${
                    isActive
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent hover:bg-muted border-transparent hover:border-border"
                  } transition-colors`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium uppercase tracking-wide text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="w-4 h-4" />
            {logout.isPending ? "DÉCONNEXION..." : "DÉCONNEXION"}
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
