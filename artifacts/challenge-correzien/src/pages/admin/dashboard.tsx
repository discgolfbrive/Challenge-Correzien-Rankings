import AdminLayout from "@/components/layout/admin-layout";
import { Link } from "wouter";
import { Trophy, Users, MapPin, Calendar, Settings } from "lucide-react";

export default function Dashboard() {
  const modules = [
    { href: "/admin/scores", label: "Saisir les Scores", icon: Trophy, desc: "Gérer les résultats des étapes" },
    { href: "/admin/players", label: "Joueurs", icon: Users, desc: "Ajouter ou modifier des participants" },
    { href: "/admin/stages", label: "Étapes", icon: MapPin, desc: "Configurer les parcours" },
    { href: "/admin/years", label: "Saisons", icon: Calendar, desc: "Gérer les années de compétition" },
    { href: "/admin/scoring-rules", label: "Barème", icon: Settings, desc: "Définir l'attribution des points" },
  ];

  return (
    <AdminLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <header className="mb-12 border-b-4 border-foreground pb-6">
          <h1 className="text-4xl font-bold uppercase tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground uppercase tracking-widest mt-2">Administration du Challenge</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.href} href={mod.href}>
                <div className="group border-2 border-border hover:border-foreground p-6 cursor-pointer transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-card h-full flex flex-col">
                  <Icon className="w-10 h-10 mb-4 text-foreground group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold uppercase tracking-wide">{mod.label}</h3>
                  <p className="text-muted-foreground mt-2">{mod.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
