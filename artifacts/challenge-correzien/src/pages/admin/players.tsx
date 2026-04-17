import AdminLayout from "@/components/layout/admin-layout";
import { useListPlayers, useCreatePlayer, useUpdatePlayer, useDeletePlayer, getListPlayersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminPlayers() {
  const { data: players } = useListPlayers();
  const queryClient = useQueryClient();
  const createPlayer = useCreatePlayer();
  const deletePlayer = useDeletePlayer();
  
  const [newName, setNewName] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createPlayer.mutate({ data: { name: newName } }, {
      onSuccess: () => {
        setNewName("");
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Supprimer ce joueur ?")) {
      deletePlayer.mutate({ playerId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey() });
        }
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-foreground pb-6">
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-tight">Joueurs</h1>
            <p className="text-muted-foreground uppercase tracking-widest mt-2">Gestion des participants</p>
          </div>
        </header>

        <div className="bg-muted/30 border-2 border-border p-6 mb-10">
          <h2 className="text-xl font-bold uppercase tracking-wide mb-4">Ajouter un joueur</h2>
          <form onSubmit={handleAdd} className="flex gap-4">
            <Input 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              placeholder="Nom du joueur" 
              className="max-w-md rounded-none border-2 h-12"
            />
            <Button type="submit" className="rounded-none font-bold uppercase tracking-wider h-12 px-8 gap-2" disabled={createPlayer.isPending}>
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
                <TableHead className="font-bold text-foreground">Nom</TableHead>
                <TableHead className="text-right font-bold text-foreground w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players?.map((p) => (
                <TableRow key={p.id} className="border-b border-border">
                  <TableCell className="font-mono text-muted-foreground">{p.id}</TableCell>
                  <TableCell className="font-bold uppercase tracking-wide">{p.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-none">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!players || players.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground uppercase tracking-widest font-bold">
                    Aucun joueur
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
