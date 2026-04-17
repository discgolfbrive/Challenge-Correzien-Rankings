import AdminLayout from "@/components/layout/admin-layout";
import { useListYears, useCreateYear, useDeleteYear, getListYearsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

export default function AdminYears() {
  const { data: years } = useListYears();
  const queryClient = useQueryClient();
  const createYear = useCreateYear();
  const deleteYear = useDeleteYear();
  
  const [newYear, setNewYear] = useState<string>(new Date().getFullYear().toString());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const y = parseInt(newYear);
    if (!y || isNaN(y)) return;
    createYear.mutate({ data: { year: y } }, {
      onSuccess: () => {
        setNewYear((y + 1).toString());
        queryClient.invalidateQueries({ queryKey: getListYearsQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Supprimer cette saison ? Attention, cela supprimera les étapes associées.")) {
      deleteYear.mutate({ yearId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListYearsQueryKey() });
        }
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <header className="mb-10 border-b-4 border-foreground pb-6">
          <h1 className="text-4xl font-bold uppercase tracking-tight">Saisons</h1>
          <p className="text-muted-foreground uppercase tracking-widest mt-2">Gestion des années de compétition</p>
        </header>

        <div className="bg-muted/30 border-2 border-border p-6 mb-10">
          <h2 className="text-xl font-bold uppercase tracking-wide mb-4">Ajouter une saison</h2>
          <form onSubmit={handleAdd} className="flex gap-4">
            <Input 
              type="number"
              value={newYear} 
              onChange={e => setNewYear(e.target.value)} 
              className="max-w-[200px] rounded-none border-2 h-12 text-lg font-bold"
            />
            <Button type="submit" className="rounded-none font-bold uppercase tracking-wider h-12 px-8 gap-2" disabled={createYear.isPending}>
              <Plus className="w-5 h-5" />
              Ajouter
            </Button>
          </form>
        </div>

        <div className="border-2 border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-border">
                <TableHead className="w-[80px] font-bold text-foreground">ID</TableHead>
                <TableHead className="font-bold text-foreground">Année</TableHead>
                <TableHead className="text-right font-bold text-foreground w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years?.map((y) => (
                <TableRow key={y.id} className="border-b border-border">
                  <TableCell className="font-mono text-muted-foreground">{y.id}</TableCell>
                  <TableCell className="font-bold text-xl">{y.year}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(y.id)} className="text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-none">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!years || years.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground uppercase tracking-widest font-bold">
                    Aucune saison
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
