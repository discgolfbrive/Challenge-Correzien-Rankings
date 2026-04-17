import AdminLayout from "@/components/layout/admin-layout";
import { useListYears, useListStages, useCreateStage, useDeleteStage, getListStagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminStages() {
  const { data: years } = useListYears();
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const queryClient = useQueryClient();
  const createStage = useCreateStage();
  const deleteStage = useDeleteStage();

  useEffect(() => {
    if (!selectedYearId && years && years.length > 0) {
      setSelectedYearId(years[0].id.toString());
    }
  }, [years, selectedYearId]);

  const { data: stages } = useListStages(
    { yearId: selectedYearId ? parseInt(selectedYearId) : undefined },
    { query: { enabled: !!selectedYearId } }
  );

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", location: "", date: "", par: "54", order: "1"
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYearId) return;
    
    createStage.mutate({
      data: {
        yearId: parseInt(selectedYearId),
        name: formData.name,
        location: formData.location,
        date: formData.date || undefined,
        par: parseInt(formData.par) || 54,
        order: parseInt(formData.order) || 1
      }
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setFormData({ name: "", location: "", date: "", par: "54", order: (parseInt(formData.order) + 1).toString() });
        queryClient.invalidateQueries({ queryKey: getListStagesQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Supprimer cette étape ?")) {
      deleteStage.mutate({ stageId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStagesQueryKey() });
        }
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-foreground pb-6">
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-tight">Étapes</h1>
            <p className="text-muted-foreground uppercase tracking-widest mt-2">Parcours de la compétition</p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="font-bold uppercase tracking-wide">Saison:</span>
            <Select value={selectedYearId} onValueChange={setSelectedYearId}>
              <SelectTrigger className="w-[180px] rounded-none border-2 font-bold">
                <SelectValue placeholder="Saison" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-2">
                {years?.map(y => (
                  <SelectItem key={y.id} value={y.id.toString()}>{y.year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {selectedYearId && (
          <div className="mb-8 flex justify-end">
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-none font-bold uppercase tracking-wider gap-2 h-12 px-8">
                  <Plus className="w-5 h-5" /> Ajouter une étape
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-none border-4 border-foreground">
                <DialogHeader className="border-b-2 border-border pb-4 mb-4">
                  <DialogTitle className="text-2xl font-bold uppercase tracking-tight">Nouvelle Étape</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="grid gap-2">
                    <label className="font-bold uppercase text-sm tracking-wide">Nom de l'étape *</label>
                    <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-none border-2" />
                  </div>
                  <div className="grid gap-2">
                    <label className="font-bold uppercase text-sm tracking-wide">Lieu</label>
                    <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="rounded-none border-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <label className="font-bold uppercase text-sm tracking-wide">Date</label>
                      <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="rounded-none border-2" />
                    </div>
                    <div className="grid gap-2">
                      <label className="font-bold uppercase text-sm tracking-wide">Par *</label>
                      <Input required type="number" value={formData.par} onChange={e => setFormData({...formData, par: e.target.value})} className="rounded-none border-2" />
                    </div>
                    <div className="grid gap-2">
                      <label className="font-bold uppercase text-sm tracking-wide">Ordre *</label>
                      <Input required type="number" value={formData.order} onChange={e => setFormData({...formData, order: e.target.value})} className="rounded-none border-2" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full mt-6 rounded-none font-bold uppercase h-12" disabled={createStage.isPending}>
                    Enregistrer
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <div className="border-2 border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-border">
                <TableHead className="w-[80px] font-bold text-foreground">Ordre</TableHead>
                <TableHead className="font-bold text-foreground">Nom / Lieu</TableHead>
                <TableHead className="font-bold text-foreground">Date</TableHead>
                <TableHead className="font-bold text-foreground text-center">Par</TableHead>
                <TableHead className="text-right font-bold text-foreground w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages?.map((s) => (
                <TableRow key={s.id} className="border-b border-border">
                  <TableCell className="font-bold text-xl">{s.order}</TableCell>
                  <TableCell>
                    <div className="font-bold uppercase tracking-wide text-lg">{s.name}</div>
                    <div className="text-muted-foreground text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {s.location || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{s.date ? new Date(s.date).toLocaleDateString('fr-FR') : "-"}</TableCell>
                  <TableCell className="text-center font-bold text-xl bg-muted/30">{s.par}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-none">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!stages || stages.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground uppercase tracking-widest font-bold">
                    Aucune étape pour cette saison
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
