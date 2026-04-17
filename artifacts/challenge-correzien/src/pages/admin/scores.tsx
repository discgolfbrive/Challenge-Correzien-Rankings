import AdminLayout from "@/components/layout/admin-layout";
import { useListYears, useListStages, useListPlayers, useListScores, useCreateOrUpdateScore, getListScoresQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function AdminScores() {
  const { data: years } = useListYears();
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedYearId && years && years.length > 0) {
      setSelectedYearId(years[0].id.toString());
    }
  }, [years, selectedYearId]);

  const { data: stages } = useListStages(
    { yearId: selectedYearId ? parseInt(selectedYearId) : undefined },
    { query: { enabled: !!selectedYearId } }
  );

  useEffect(() => {
    if (stages && stages.length > 0 && !stages.find(s => s.id.toString() === selectedStageId)) {
      setSelectedStageId(stages[0].id.toString());
    } else if (stages && stages.length === 0) {
      setSelectedStageId("");
    }
  }, [stages, selectedStageId]);

  const { data: players } = useListPlayers();
  const { data: scores } = useListScores(
    { stageId: selectedStageId ? parseInt(selectedStageId) : undefined },
    { query: { enabled: !!selectedStageId } }
  );

  const createOrUpdateScore = useCreateOrUpdateScore();
  const [localScores, setLocalScores] = useState<Record<number, string>>({});
  
  // Sync local scores with server
  useEffect(() => {
    if (scores && players) {
      const newLocalScores: Record<number, string> = {};
      players.forEach(p => {
        const s = scores.find(sc => sc.playerId === p.id);
        newLocalScores[p.id] = s ? s.score.toString() : "";
      });
      setLocalScores(newLocalScores);
    }
  }, [scores, players]);

  const handleScoreChange = (playerId: number, value: string) => {
    setLocalScores(prev => ({ ...prev, [playerId]: value }));
  };

  const handleScoreBlur = (playerId: number) => {
    if (!selectedStageId) return;
    const val = parseInt(localScores[playerId]);
    const currentScore = scores?.find(s => s.playerId === playerId);
    
    // Si vide et pas de score, on ne fait rien
    if (isNaN(val) && !currentScore) return;
    
    // Si la valeur n'a pas changé, on ne fait rien
    if (currentScore && currentScore.score === val) return;

    // Si on vide un champ existant, on met 0 (API accepte) ou on pourrait appeler deleteScore
    const finalScore = isNaN(val) ? 0 : val;

    createOrUpdateScore.mutate({
      data: {
        playerId,
        stageId: parseInt(selectedStageId),
        score: finalScore
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListScoresQueryKey() });
        toast({ title: "Score enregistré", description: "Sauvegardé avec succès" });
      }
    });
  };

  const currentStage = stages?.find(s => s.id.toString() === selectedStageId);

  return (
    <AdminLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <header className="mb-10 border-b-4 border-foreground pb-6">
          <h1 className="text-4xl font-bold uppercase tracking-tight">Scores</h1>
          <p className="text-muted-foreground uppercase tracking-widest mt-2">Saisie des résultats</p>
        </header>

        <div className="bg-card border-2 border-border p-6 mb-10 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <label className="font-bold uppercase text-sm tracking-wide">Saison</label>
            <Select value={selectedYearId} onValueChange={setSelectedYearId}>
              <SelectTrigger className="rounded-none border-2 h-12 font-bold">
                <SelectValue placeholder="Saison" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-2">
                {years?.map(y => (
                  <SelectItem key={y.id} value={y.id.toString()}>{y.year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 space-y-2">
            <label className="font-bold uppercase text-sm tracking-wide">Étape</label>
            <Select value={selectedStageId} onValueChange={setSelectedStageId} disabled={!stages?.length}>
              <SelectTrigger className="rounded-none border-2 h-12 font-bold">
                <SelectValue placeholder={stages?.length ? "Sélectionner une étape" : "Aucune étape"} />
              </SelectTrigger>
              <SelectContent className="rounded-none border-2">
                {stages?.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentStage && (
             <div className="flex-1 flex flex-col justify-center items-end text-right">
                <span className="text-muted-foreground uppercase tracking-widest text-sm">Par de l'étape</span>
                <span className="text-4xl font-black">{currentStage.par}</span>
             </div>
          )}
        </div>

        {selectedStageId ? (
          <div className="border-2 border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border">
                  <TableHead className="font-bold text-foreground">Joueur</TableHead>
                  <TableHead className="font-bold text-foreground w-[200px]">Coups</TableHead>
                  <TableHead className="font-bold text-foreground text-center w-[150px]">Diff</TableHead>
                  <TableHead className="text-right font-bold text-foreground w-[150px]">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players?.map((p) => {
                  const s = scores?.find(sc => sc.playerId === p.id);
                  const diff = s && currentStage ? s.score - currentStage.par : null;
                  
                  return (
                    <TableRow key={p.id} className="border-b border-border">
                      <TableCell className="font-bold uppercase tracking-wide text-lg">{p.name}</TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          value={localScores[p.id] ?? ""}
                          onChange={(e) => handleScoreChange(p.id, e.target.value)}
                          onBlur={() => handleScoreBlur(p.id)}
                          className="rounded-none border-2 h-14 text-xl font-bold text-center bg-background"
                          placeholder="-"
                        />
                      </TableCell>
                      <TableCell className="text-center font-mono text-lg">
                        {diff !== null ? (diff > 0 ? `+${diff}` : diff) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-xl font-bold text-muted-foreground">
                        {s ? `${s.points} pts` : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center border-2 border-dashed border-border text-muted-foreground font-bold uppercase tracking-widest">
            Sélectionnez une étape
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
