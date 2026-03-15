"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { 
  IconClipboardText, 
  IconHistory, 
  IconDownload, 
  IconAlertCircle, 
  IconCheck, 
  IconLoader2,
  IconRefresh,
  IconSearch
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { Progress } from "@/shared/ui/progress";
import { Input } from "@/shared/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";

type BackupLog = {
  id: string;
  status: "running" | "completed" | "error";
  started_at: string;
  completed_at: string | null;
  file_name: string | null;
  file_size: number | null;
  storage_url: string | null;
  error_message: string | null;
  progress: number;
  logs: string[] | null;
};

export default function AdminBackupPage() {
  const { data: session, status } = useSession();
  const canAccess = (session?.user?.roleLevel ?? "member") !== "member";

  const [activeJob, setActiveJob] = useState<BackupLog | null>(null);
  const [history, setHistory] = useState<BackupLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Filtros
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredHistory = history.filter(log => {
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    const matchesSearch = !filterSearch || 
      log.id.toLowerCase().includes(filterSearch.toLowerCase()) ||
      (log.file_name && log.file_name.toLowerCase().includes(filterSearch.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeJob?.logs]);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch("/api/configuracion/backup/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error("Failed to fetch history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [setHistory, setIsLoadingHistory]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const pollActiveJob = useCallback(async (jobId: string) => {
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/configuracion/backup/status?jobId=${jobId}`);
        if (!res.ok) throw new Error("Status check failed");
        
        const data = await res.json();
        setActiveJob(data);

        if (data.status === "completed" || data.status === "error") {
          clearInterval(t);
          fetchHistory();
        }
      } catch (e: any) {
        console.error("Polling error:", e);
        clearInterval(t);
      }
    }, 2000);
    return () => clearInterval(t);
  }, [fetchHistory, setActiveJob]);

  const startBackup = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/configuracion/backup`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo iniciar el backup");
      }
      const data = await res.json();
      if (data.jobId) {
        // Query initial job state
        const statusRes = await fetch(`/api/configuracion/backup/status?jobId=${data.jobId}`);
        const jobData = await statusRes.json();
        setActiveJob(jobData);
        pollActiveJob(data.jobId);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }, [pollActiveJob, setActiveJob, setError]);

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (status === "loading") return <div>Loading...</div>;
  if (status === "authenticated" && !canAccess) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm text-muted-foreground">Acceso denegado.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 lg:px-8 gap-8 animate-in fade-in duration-500 relative z-10 w-full">
      <AdminPageHeader
        title="Copias de Seguridad"
        description="Gestión robusta de backups de la base de datos con persistencia en Supabase."
        backHref="/dashboard/configuracion"
        action={
          <Button
            onClick={startBackup}
            disabled={activeJob?.status === "running"}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold h-11 px-6 gap-2 shadow-lg shadow-amber-600/20 active:scale-95 transition-all w-full md:w-auto"
          >
            {activeJob?.status === "running" ? (
              <><IconLoader2 className="animate-spin size-4" /> Ejecutando...</>
            ) : (
              <><IconClipboardText className="size-4" /> Crear Copia de Seguridad</>
            )}
          </Button>
        }
      />

      {/* Trabajo Activo (Solo se muestra cuando hay algo pasando) */}
      {activeJob && (
        <Card className="bg-[#0a0a0f] border-amber-500/20 p-6 rounded-xl overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-600" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <IconClipboardText className="size-5 text-amber-500" />
              </div>
              <div>
                <div className="font-bold text-white uppercase tracking-wider text-xs italic font-heading">Proceso en curso</div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">{activeJob.id.split('-')[0]}</p>
              </div>
            </div>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-tighter",
              activeJob.status === "completed" ? "bg-green-500/20 text-green-400" :
              activeJob.status === "error" ? "bg-red-500/20 text-red-400" :
              "bg-amber-500/20 text-amber-500 animate-pulse"
            )}>
              {activeJob.status}
            </span>
          </div>
          
          <Progress value={activeJob.progress} className="h-2 mb-6 bg-white/5" />
          
          {/* Console / Terminal Log */}
          <div className="bg-[#050505] border border-white/5 rounded-lg p-3 font-mono text-[11px] leading-relaxed overflow-hidden shadow-2xl group transition-all duration-300">
            <div className="flex items-center justify-between mb-2 text-zinc-600 border-b border-white/5 pb-2">
              <span className="flex items-center gap-2">
                <div className={cn(
                  "size-1.5 rounded-full",
                  activeJob.status === "running" ? "bg-amber-500 animate-pulse" : 
                  activeJob.status === "completed" ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="text-[9px] font-bold tracking-[0.2em]">BACKUP_SESSION_LOG</span>
              </span>
              <span className="group-hover:text-zinc-400 transition-colors uppercase select-none text-[9px] font-bold">{activeJob.status}</span>
            </div>
            <div ref={scrollRef} className="h-40 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-2">
              {activeJob.logs && activeJob.logs.length > 0 ? (
                activeJob.logs.map((log, i) => (
                  <div key={i} className="text-zinc-400 font-medium">
                    <span className="text-amber-500/50 mr-2 select-none">$</span>
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-zinc-700 italic flex items-center gap-2">
                  <IconLoader2 className="animate-spin size-3" />
                  Inicializando exportación...
                </div>
              )}
              {activeJob.status === "running" && (
                <div className="text-amber-500 animate-pulse inline-block ml-1">█</div>
              )}
            </div>
          </div>
          
          {activeJob.error_message && (
            <div className="flex items-start gap-2 text-red-400 text-sm mt-4 bg-red-500/10 p-3 rounded border border-red-500/20">
              <IconAlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{activeJob.error_message}</span>
            </div>
          )}
        </Card>
      )}

      {error && !activeJob && (
        <Card className="bg-red-500/5 border-red-500/20 p-4 rounded-xl flex items-center gap-3">
          <IconAlertCircle className="text-red-500 size-5" />
          <span className="text-red-400 text-sm font-medium">{error}</span>
        </Card>
      )}

      {/* Historial */}
      <Card className="bg-[#0a0a0f] border-white/5 p-6 rounded-xl shadow-2xl overflow-hidden group/history mt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 group-hover/history:border-amber-500/30 transition-colors" title="Ver historial">
              <IconHistory className="size-5 text-white/40 group-hover/history:text-amber-500 transition-colors" />
            </div>
            <div>
              <h3 className="font-extrabold text-white uppercase tracking-wider italic font-heading text-lg">Historial Reciente</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-60">
                {filteredHistory.length < history.length 
                  ? `Mostrando ${filteredHistory.length} de ${history.length} sesiones`
                  : "Últimas 10 sesiones de exportación"
                }
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full md:w-48 group/search">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/20 group-focus-within/search:text-amber-500 transition-colors" />
              <Input 
                placeholder="BUSCAR ID/FILE..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="h-9 pl-9 text-[10px] font-bold tracking-widest bg-white/5 border-white/5 focus:border-amber-500/50 transition-all uppercase"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-32 bg-white/5 border-white/5 text-[10px] font-bold tracking-widest uppercase focus:ring-1 focus:ring-amber-500/50">
                <SelectValue placeholder="ESTADO" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10">
                <SelectItem value="all" className="text-[10px] font-bold tracking-widest uppercase focus:bg-amber-500 focus:text-black">TODOS</SelectItem>
                <SelectItem value="completed" className="text-[10px] font-bold tracking-widest uppercase focus:bg-amber-500 focus:text-black text-green-500">ÉXITO</SelectItem>
                <SelectItem value="error" className="text-[10px] font-bold tracking-widest uppercase focus:bg-amber-500 focus:text-black text-red-500">ERROR</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={fetchHistory}
              disabled={isLoadingHistory}
              className="size-9 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 hover:text-amber-500 transition-all active:scale-95 shrink-0"
            >
              <IconRefresh className={cn("size-4", isLoadingHistory && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pb-4 pl-2 font-mono">Fecha / Hora</th>
                <th className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pb-4 font-mono">Status</th>
                <th className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pb-4 font-mono">Size</th>
                <th className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pb-4 pr-2 text-right font-mono">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoadingHistory && history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <IconLoader2 className="animate-spin size-8 mx-auto text-amber-500/20" />
                    <p className="text-xs text-muted-foreground mt-4 uppercase tracking-widest font-bold">Consultando registros...</p>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <p className="text-sm text-muted-foreground/40 italic uppercase tracking-widest font-medium">
                      {history.length === 0 
                        ? "No se han encontrado registros en el historial."
                        : "No hay resultados para los filtros aplicados."
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((log) => (
                  <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-5 pl-2">
                      <span className="text-xs font-mono text-zinc-400 group-hover:text-white transition-colors">
                        {new Date(log.started_at).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-2">
                        {log.status === "completed" ? (
                          <>
                            <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                            <span className="text-[10px] font-extrabold text-green-500 uppercase tracking-widest">Éxito</span>
                          </>
                        ) : log.status === "error" ? (
                          <>
                            <div className="size-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,44,44,0.4)]" />
                            <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest">Error</span>
                          </>
                        ) : (
                          <>
                            <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest">Ejecutando</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-5">
                      <span className="text-xs text-zinc-500 font-bold group-hover:text-zinc-300 transition-colors uppercase">
                        {formatSize(log.file_size)}
                      </span>
                    </td>
                    <td className="py-5 pr-2 text-right">
                      {log.status === "completed" && log.storage_url && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 gap-2 text-[10px] font-black tracking-widest uppercase border-white/5 bg-white/5 hover:bg-amber-600 hover:text-black hover:border-amber-600 transition-all active:scale-95 shadow-lg shadow-black/50"
                        >
                          <a href={log.storage_url} download>
                            <IconDownload size={14} />
                            JSON
                          </a>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
