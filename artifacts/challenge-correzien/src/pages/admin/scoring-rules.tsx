import AdminLayout from "@/components/layout/admin-layout";
import { useListScoringRules, useCreateScoringRule, useDeleteScoringRule, getListScoringRulesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

export default function AdminScoringRules() {
  const { data: rules } = useListScoringRules();
  const queryClient = useQueryClient();
  const createRule = useCreateScoringRule();
  const deleteRule = useDeleteScoringRule();
  
  const [position, setPosition] = useState("");
  const [points, setPoints] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const pos = parseInt(position);
    const pts = parseInt(points);
    if (isNaN(pos) || isNaN(pts)) return;
    
    createRule.mutate({ data: { position: pos, points: pts } }, {
      onSuccess: () => {
        setPosition((pos + 1).toString());
        setPoints("");
        queryClient.invalidateQueries({ queryKey: getListScoringRulesQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Supprimer cette règle ?")) {
      deleteRule.mutate({ ruleId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListScoringRulesQueryKey() });
        }
      });
    }
  };

  const sortedRules = rules?.slice().sort((a, b) => a.position - b.position);

  return (
    <AdminLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <header className="mb-10 border-b-4 border-foreground pb-6">
          <h1 className="text-4xl font-bold uppercase tracking-tight">Barème</h1>
          <p className="text-muted-foreground uppercase tracking-widest mt-2">Attribution des points par position</p>
        </header>

        <div className="bg-muted/30 border-2 border-border p-6 mb-10">
          <h2 className="text-xl font-bold uppercase tracking-wide mb-4">Ajouter une règle</h2>
          <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="font-bold uppercase text-xs tracking-wider">Position</label>
              <Input 
                type="number"
                value={position} 
                onChange={e => setPosition(e.target.value)} 
                className="w-[120px] rounded-none border-2 h-12 font-bold"
                placeholder="Ex: 1"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold uppercase text-xs tracking-wider">Points</label>
              <Input 
                type="number"
                value={points} 
                onChange={e => setPoints(e.target.value)} 
                className="w-[120px] rounded-none border-2 h-12 font-bold"
                placeholder="Ex: 100"
              />
            </div>
            <Button type="submit" className="rounded-none font-bold uppercase tracking-wider h-12 px-8 gap-2" disabled={createRule.isPending}>
              <Plus className="w-5 h-5" />
              Ajouter
            </Button>
          </form>
        </div>

        <div className="border-2 border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-border">
                <TableHead className="w-[120px] font-bold text-foreground">Position</TableHead>
                <TableHead className="font-bold text-foreground">Points Attribués</TableHead>
                <TableHead className="text-right font-bold text-foreground w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRules?.map((r) => (
                <TableRow key={r.id} className="border-b border-border">
                  <TableCell className="font-bold text-xl">
                    {r.position}
                    {r.position === 1 && "er"}
                    {r.position !== 1 && "ème"}
                  </TableCell>
                  <TableCell className="font-bold text-xl text-muted-foreground">{r.points} pts</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-none">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!sortedRules || sortedRules.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground uppercase tracking-widest font-bold">
                    Aucun barème défini
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
