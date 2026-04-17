import { useState } from "wouter";
import { Link } from "wouter";
import { useListYears, useGetRankings, getGetRankingsQueryKey } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Trophy } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Home() {
  const { data: years } = useListYears();
  // We need to use React.useState, let's assume it's imported
  return <HomeContent years={years} />;
}

import React from 'react';

function HomeContent({ years }: { years: any }) {
  const [selectedYearId, setSelectedYearId] = React.useState<string>(years?.[0]?.id?.toString() || "");

  React.useEffect(() => {
    if (!selectedYearId && years && years.length > 0) {
      setSelectedYearId(years[0].id.toString());
    }
  }, [years, selectedYearId]);

  const { data: rankings, isLoading } = useGetRankings(Number(selectedYearId), {
    query: {
      enabled: !!selectedYearId,
      queryKey: getGetRankingsQueryKey(Number(selectedYearId))
    }
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b-4 border-foreground py-12 px-6 lg:px-12 bg-card">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tight">Challenge Corrézien</h1>
            <p className="text-xl md:text-2xl mt-4 font-medium uppercase tracking-widest text-muted-foreground">Association du Disc-Golf Briviste</p>
          </div>
          <Link href="/admin/login">
            <Button variant="outline" className="border-2 rounded-none font-bold uppercase">Administration</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-12 px-6 lg:px-12 space-y-16">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b-2 border-border pb-8">
          <div className="flex items-center gap-4">
            <label className="text-lg font-bold uppercase tracking-wide">Saison :</label>
            <Select value={selectedYearId} onValueChange={setSelectedYearId}>
              <SelectTrigger className="w-[200px] border-2 rounded-none font-bold">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-2">
                {years?.map((y: any) => (
                  <SelectItem key={y.id} value={y.id.toString()} className="font-medium">
                    {y.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedYearId && rankings && (
             <Button 
                variant="default" 
                className="rounded-none font-bold uppercase tracking-wide gap-2 border-2 border-transparent"
                onClick={() => window.open(`/api/rankings/${selectedYearId}/export`, '_blank')}
             >
                <Download className="w-4 h-4" />
                Exporter CSV
             </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-20 font-bold uppercase tracking-widest text-xl">Chargement...</div>
        ) : !rankings || !rankings.stages.length ? (
          <div className="text-center py-20 border-2 border-dashed border-border p-12">
            <Trophy className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
            <h3 className="text-2xl font-bold uppercase tracking-wide">Aucune donnée disponible</h3>
            <p className="text-muted-foreground mt-2">Sélectionnez une autre saison ou revenez plus tard.</p>
          </div>
        ) : (
          <div className="space-y-16">
            <section>
              <div className="bg-foreground text-background py-3 px-6 mb-6 inline-block">
                <h2 className="text-2xl font-bold uppercase tracking-wider">Classement par étapes</h2>
              </div>
              <div className="border-2 border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-border hover:bg-transparent">
                      <TableHead className="w-[80px] font-bold text-foreground">Pos</TableHead>
                      <TableHead className="font-bold text-foreground">Joueur</TableHead>
                      {rankings.stages.map((stage) => (
                        <TableHead key={stage.id} className="text-center font-bold text-foreground border-l border-border whitespace-nowrap">
                          {stage.name}
                        </TableHead>
                      ))}
                      <TableHead className="text-right font-bold text-foreground border-l-2 border-border bg-muted/30">Total Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankings.playerRankings.map((row) => (
                      <TableRow key={row.playerId} className="border-b border-border">
                        <TableCell className="font-bold text-lg">{row.position}</TableCell>
                        <TableCell className="font-bold uppercase tracking-wide">{row.playerName}</TableCell>
                        {rankings.stages.map((stage) => {
                          const score = row.stageScores.find(s => s.stageId === stage.id);
                          return (
                            <TableCell key={stage.id} className="text-center border-l border-border p-0">
                              {score ? (
                                <div className="flex flex-col justify-center h-full min-h-[4rem]">
                                  <div className="flex items-center justify-center gap-2 mb-1">
                                    <span className="font-bold text-lg">{score.score}</span>
                                    <span className="text-xs px-1.5 py-0.5 bg-muted font-mono">
                                      {score.diffToPar > 0 ? '+' : ''}{score.diffToPar}
                                    </span>
                                  </div>
                                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    {score.points} pts
                                  </div>
                                </div>
                              ) : (
                                <div className="text-muted-foreground/30">-</div>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right font-bold text-xl border-l-2 border-border bg-muted/30">
                          {row.totalPoints}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            <section>
              <div className="bg-foreground text-background py-3 px-6 mb-6 inline-block">
                <h2 className="text-2xl font-bold uppercase tracking-wider">Classement Cumulé</h2>
              </div>
              <div className="border-2 border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-border hover:bg-transparent">
                      <TableHead className="w-[80px] font-bold text-foreground">Pos</TableHead>
                      <TableHead className="font-bold text-foreground">Joueur</TableHead>
                      <TableHead className="text-center font-bold text-foreground">Score Total</TableHead>
                      <TableHead className="text-center font-bold text-foreground">Par Total</TableHead>
                      <TableHead className="text-center font-bold text-foreground">Différence</TableHead>
                      <TableHead className="text-right font-bold text-foreground border-l-2 border-border bg-muted/30">Points Totaux</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankings.cumulatedRankings.map((row) => (
                      <TableRow key={row.playerId} className="border-b border-border">
                        <TableCell className="font-bold text-lg">{row.position}</TableCell>
                        <TableCell className="font-bold uppercase tracking-wide">{row.playerName}</TableCell>
                        <TableCell className="text-center font-medium">{row.totalScore}</TableCell>
                        <TableCell className="text-center font-medium text-muted-foreground">{row.totalPar}</TableCell>
                        <TableCell className="text-center font-mono">
                          {row.totalDiffToPar > 0 ? '+' : ''}{row.totalDiffToPar}
                        </TableCell>
                        <TableCell className="text-right font-bold text-xl border-l-2 border-border bg-muted/30">
                          {row.totalPoints}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>
        )}
      </main>
      
      <footer className="border-t-4 border-foreground py-12 px-6 mt-20 text-center">
        <p className="font-bold uppercase tracking-widest text-sm">© {new Date().getFullYear()} Association du Disc-Golf Briviste</p>
      </footer>
    </div>
  );
}
