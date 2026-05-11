import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Bot,
  Check,
  Loader2,
  MessageSquarePlus,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { request } from "@/services/api";
import { cn } from "@/lib/utils";
import { formatApiError, parseApiError } from "@/lib/errors";
import { useError } from "@/hooks/useError";
import { Markdown } from "@/components/ui/markdown";
import type {
  ChatMessage,
  ChatSession,
  CreateMessageResponse,
} from "@/types/chat";

/* ------------------------------------------------------------------ */
/*  Utils                                                             */
/* ------------------------------------------------------------------ */

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  if (sameDay) return `${hh}:${mm}`;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} ${hh}:${mm}`;
}

function deriveTitle(session: ChatSession, messages: ChatMessage[]): string {
  if (session.title && session.title.trim().length > 0) return session.title;
  const firstUser = messages.find((m) => m.role === "user");
  if (firstUser) {
    const snippet = firstUser.content.replace(/\s+/g, " ").trim();
    return snippet.length > 40 ? `${snippet.slice(0, 40)}…` : snippet;
  }
  return "Nueva conversación";
}

function genTempId(): string {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const GRID_BG: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgba(51,65,85,0.6) 0.5px, transparent 0.5px), linear-gradient(to bottom, rgba(51,65,85,0.6) 0.5px, transparent 0.5px)",
  backgroundSize: "40px 40px",
};

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Chat() {
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams<{ sessionId?: string }>();
  const { showError } = useError();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [pendingAssistant, setPendingAssistant] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  /* -------- Load sessions (callable for retry) -------- */
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const data = await request<ChatSession[] | { items: ChatSession[] }>({
        url: "/chat/sessions/",
        method: "GET",
      });
      const list = Array.isArray(data) ? data : data.items ?? [];
      setSessions(list);
    } catch (err) {
      setSessionsError(formatApiError(err));
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  /* -------- Load messages (callable for retry) -------- */
  const loadMessages = useCallback(
    async (id: string) => {
      setMessagesLoading(true);
      setMessagesError(null);
      setMessages([]);
      try {
        const data = await request<ChatMessage[] | { items: ChatMessage[] }>({
          url: `/chat/sessions/${id}/messages/`,
          method: "GET",
          silent: true,
        });
        const list = Array.isArray(data) ? data : data.items ?? [];
        setMessages(list);
      } catch (err) {
        const parsed = parseApiError(err);
        const friendly =
          parsed.status === 404 ? "Sesión no encontrada" : parsed.message;
        setMessagesError(friendly);
        showError(friendly);
      } finally {
        setMessagesLoading(false);
      }
    },
    [showError],
  );

  useEffect(() => {
    if (!routeSessionId) {
      setMessages([]);
      setMessagesError(null);
      return;
    }
    void loadMessages(routeSessionId);
  }, [routeSessionId, loadMessages]);

  /* -------- Auto-scroll to bottom on new messages -------- */
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, pendingAssistant]);

  /* -------- Focus input on session change -------- */
  useEffect(() => {
    inputRef.current?.focus();
  }, [routeSessionId]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === routeSessionId) ?? null,
    [sessions, routeSessionId],
  );

  const displayedTitle = useMemo(() => {
    if (!activeSession) return null;
    return deriveTitle(activeSession, messages);
  }, [activeSession, messages]);

  /* -------- Actions -------- */

  const handleNewSession = useCallback(async () => {
    setSendError(null);
    try {
      const created = await request<ChatSession>({
        url: "/chat/sessions/",
        method: "POST",
        data: { title: "" },
      });
      setSessions((prev) => [created, ...prev]);
      setDrawerOpen(false);
      navigate(`/chat/${created.id}`);
    } catch (err) {
      setSendError(formatApiError(err));
    }
  }, [navigate]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await request<void>({
        url: `/chat/sessions/${id}/`,
        method: "DELETE",
      });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (routeSessionId === id) {
        navigate("/chat");
      }
    } catch (err) {
      setSessionsError(formatApiError(err));
    }
  }, [deleteTarget, navigate, routeSessionId]);

  const handleRename = useCallback(async (id: string, nextTitle: string) => {
    const trimmed = nextTitle.trim();
    setRenamingId(null);
    if (trimmed.length === 0) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: trimmed } : s)),
    );
    try {
      const updated = await request<ChatSession>({
        url: `/chat/sessions/${id}/`,
        method: "PATCH",
        data: { title: trimmed },
      });
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      setSessionsError(formatApiError(err));
    }
  }, []);

  const handleSend = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || sending) return;

      const isFirstUserMessage = !messages.some((m) => m.role === "user");
      const sessionTitleBefore = activeSession?.title?.trim() ?? "";

      let targetId = routeSessionId;
      if (!targetId) {
        try {
          const created = await request<ChatSession>({
            url: "/chat/sessions/",
            method: "POST",
            data: { title: "" },
          });
          setSessions((prev) => [created, ...prev]);
          targetId = created.id;
          navigate(`/chat/${created.id}`, { replace: true });
        } catch (err) {
          setSendError(formatApiError(err));
          return;
        }
      }

      setSendError(null);
      setSending(true);
      setPendingAssistant(true);

      const optimistic: ChatMessage = {
        id: genTempId(),
        session: targetId,
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const res = await request<CreateMessageResponse | ChatMessage>({
          url: `/chat/sessions/${targetId}/messages/`,
          method: "POST",
          data: { content: trimmed },
          silent: true,
        });

        if ("user_message" in res && "assistant_message" in res) {
          setMessages((prev) =>
            prev
              .filter((m) => m.id !== optimistic.id)
              .concat([res.user_message, res.assistant_message]),
          );
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === optimistic.id ? res : m)),
          );
        }

        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetId
              ? { ...s, updated_at: new Date().toISOString() }
              : s,
          ),
        );

        if (isFirstUserMessage && !sessionTitleBefore) {
          const derived =
            trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
          try {
            const updated = await request<ChatSession>({
              url: `/chat/sessions/${targetId}/`,
              method: "PATCH",
              data: { title: derived },
              silent: true,
            });
            setSessions((prev) =>
              prev.map((s) => (s.id === targetId ? updated : s)),
            );
          } catch {
            /* non-fatal — title stays derived client-side */
          }
        }
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        const parsed = parseApiError(err);
        const friendly =
          parsed.status === 404
            ? "Sesión no encontrada"
            : "Error enviando mensaje";
        setSendError(friendly);
        showError(friendly);
      } finally {
        setSending(false);
        setPendingAssistant(false);
      }
    },
    [activeSession, messages, navigate, routeSessionId, sending, showError],
  );

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <div className="h-full">
      <div className="relative h-[calc(100vh-theme(spacing.navbar))] w-full overflow-hidden bg-gradient-to-br from-surface via-surface to-surface-alt">
        {/* Backgrounds */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={GRID_BG}
        />
        <div
          aria-hidden="true"
          className="absolute -top-32 -right-32 size-[420px] rounded-full bg-primary/10 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-40 -left-40 size-[460px] rounded-full bg-secondary/10 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 flex h-full">
          {/* Sessions sidebar (desktop) */}
          <SessionsSidebar
            className="hidden md:flex"
            sessions={sessions}
            loading={sessionsLoading}
            error={sessionsError}
            onRetry={() => void loadSessions()}
            activeId={routeSessionId ?? null}
            onSelect={(id) => navigate(`/chat/${id}`)}
            onNew={handleNewSession}
            onRequestDelete={(s) => setDeleteTarget(s)}
            renamingId={renamingId}
            onStartRename={(id) => setRenamingId(id)}
            onCancelRename={() => setRenamingId(null)}
            onCommitRename={handleRename}
          />

          {/* Sessions sidebar drawer (mobile) */}
          {drawerOpen && (
            <button
              type="button"
              aria-label="Cerrar lista de sesiones"
              className="fixed inset-0 z-30 bg-black/60 md:hidden animate-fade-in"
              onClick={() => setDrawerOpen(false)}
            />
          )}
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-40 md:hidden",
              "transition-transform duration-modal ease-modal",
              drawerOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <SessionsSidebar
              className="flex h-full"
              sessions={sessions}
              loading={sessionsLoading}
              error={sessionsError}
              onRetry={() => void loadSessions()}
              activeId={routeSessionId ?? null}
              onSelect={(id) => {
                setDrawerOpen(false);
                navigate(`/chat/${id}`);
              }}
              onNew={async () => {
                setDrawerOpen(false);
                await handleNewSession();
              }}
              onRequestDelete={(s) => setDeleteTarget(s)}
              renamingId={renamingId}
              onStartRename={(id) => setRenamingId(id)}
              onCancelRename={() => setRenamingId(null)}
              onCommitRename={handleRename}
              onCloseDrawer={() => setDrawerOpen(false)}
            />
          </div>

          {/* Chat column */}
          <section className="flex min-w-0 flex-1 flex-col">
            <ChatHeader
              title={displayedTitle}
              hasSession={!!activeSession}
              onOpenDrawer={() => setDrawerOpen(true)}
              onRenameSession={() =>
                activeSession && setRenamingId(activeSession.id)
              }
              onDeleteSession={() =>
                activeSession && setDeleteTarget(activeSession)
              }
            />

            <div
              ref={messagesScrollRef}
              className="flex-1 overflow-y-auto px-md md:px-xl py-lg"
            >
              <div className="mx-auto flex w-full max-w-[860px] flex-col gap-lg">
                {!activeSession && !routeSessionId && <EmptyState />}

                {messagesError && routeSessionId && (
                  <InlineError
                    message={messagesError}
                    onRetry={() => void loadMessages(routeSessionId)}
                  />
                )}

                {messagesLoading && (
                  <>
                    <MessageSkeleton role="user" />
                    <MessageSkeleton role="assistant" />
                  </>
                )}

                {!messagesLoading &&
                  messages.map((m) => (
                    <MessageBubble key={m.id} message={m} />
                  ))}

                {pendingAssistant && <MessageSkeleton role="assistant" />}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {sendError && (
              <div className="px-md md:px-xl pb-sm">
                <div className="mx-auto max-w-[860px]">
                  <InlineError message={sendError} />
                </div>
              </div>
            )}

            <ChatInput
              inputRef={inputRef}
              disabled={sending}
              onSend={handleSend}
            />
          </section>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <ConfirmModal
          title="Eliminar conversación"
          description={`Se eliminará "${
            deriveTitle(deleteTarget, []) || "esta conversación"
          }" y todos sus mensajes. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sessions sidebar                                                  */
/* ------------------------------------------------------------------ */

interface SessionsSidebarProps {
  className?: string;
  sessions: ChatSession[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRequestDelete: (session: ChatSession) => void;
  renamingId: string | null;
  onStartRename: (id: string) => void;
  onCancelRename: () => void;
  onCommitRename: (id: string, nextTitle: string) => void;
  onCloseDrawer?: () => void;
}

function SessionsSidebar({
  className,
  sessions,
  loading,
  error,
  onRetry,
  activeId,
  onSelect,
  onNew,
  onRequestDelete,
  renamingId,
  onStartRename,
  onCancelRename,
  onCommitRename,
  onCloseDrawer,
}: SessionsSidebarProps) {
  return (
    <aside
      className={cn(
        "w-[280px] shrink-0 flex-col",
        "border-r border-border/70",
        "bg-surface-alt/40 backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-sm px-lg py-md border-b border-border/70">
        <div className="flex items-center gap-sm">
          <Sparkles className="size-4 text-primary" />
          <span className="font-headline text-h4 text-foreground">
            Sesiones
          </span>
        </div>
        <div className="flex items-center gap-xs">
          <button
            type="button"
            onClick={onNew}
            aria-label="Nueva conversación"
            className={cn(
              "size-9 inline-flex items-center justify-center rounded",
              "bg-primary text-primary-foreground",
              "transition-all duration-hover ease-hover",
              "hover:brightness-110 hover:shadow-[0_8px_24px_-6px_rgba(34,197,94,0.55)]",
              "active:brightness-90 active:scale-[0.97]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            )}
          >
            <MessageSquarePlus className="size-4" />
          </button>
          {onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              aria-label="Cerrar"
              className={cn(
                "size-9 inline-flex items-center justify-center rounded",
                "text-foreground-muted hover:text-foreground",
                "hover:bg-surface/60 transition-colors duration-hover",
              )}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-sm">
        {loading && (
          <div className="flex flex-col gap-sm p-sm">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-12 rounded bg-surface/40 animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="p-sm">
            <InlineError message={error} onRetry={onRetry} />
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="p-md text-body-sm text-foreground-muted">
            No hay conversaciones. Crea una con el botón +.
          </div>
        )}

        <ul className="flex flex-col gap-xs">
          {sessions.map((s, idx) => (
            <li
              key={s.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(idx * 30, 240)}ms` }}
            >
              <SessionItem
                session={s}
                active={activeId === s.id}
                renaming={renamingId === s.id}
                onSelect={() => onSelect(s.id)}
                onRequestDelete={() => onRequestDelete(s)}
                onStartRename={() => onStartRename(s.id)}
                onCancelRename={onCancelRename}
                onCommitRename={(t) => onCommitRename(s.id, t)}
              />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Session item                                                      */
/* ------------------------------------------------------------------ */

interface SessionItemProps {
  session: ChatSession;
  active: boolean;
  renaming: boolean;
  onSelect: () => void;
  onRequestDelete: () => void;
  onStartRename: () => void;
  onCancelRename: () => void;
  onCommitRename: (nextTitle: string) => void;
}

function SessionItem({
  session,
  active,
  renaming,
  onSelect,
  onRequestDelete,
  onStartRename,
  onCancelRename,
  onCommitRename,
}: SessionItemProps) {
  const [draft, setDraft] = useState(session.title ?? "");
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const display = session.title?.trim() || "Nueva conversación";

  useEffect(() => {
    if (renaming) {
      setDraft(session.title ?? "");
      const t = setTimeout(() => renameInputRef.current?.select(), 0);
      return () => clearTimeout(t);
    }
  }, [renaming, session.title]);

  return (
    <div
      className={cn(
        "group relative rounded border",
        "transition-all duration-hover ease-hover",
        active
          ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(34,197,94,0.25)]"
          : "border-transparent hover:border-border hover:bg-surface/60 hover:shadow-base",
      )}
    >
      {renaming ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCommitRename(draft);
          }}
          className="flex items-center gap-xs px-md py-sm"
        >
          <input
            ref={renameInputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onCancelRename();
              }
            }}
            autoFocus
            className={cn(
              "flex-1 h-8 rounded px-sm",
              "bg-surface/60 border border-primary/60",
              "text-body text-foreground",
              "focus:outline-none focus:shadow-[0_0_0_3px_rgba(34,197,94,0.18)]",
            )}
          />
          <button
            type="submit"
            aria-label="Guardar"
            className="size-7 inline-flex items-center justify-center rounded text-primary hover:bg-primary/15 transition-colors"
          >
            <Check className="size-4" />
          </button>
          <button
            type="button"
            onClick={onCancelRename}
            aria-label="Cancelar"
            className="size-7 inline-flex items-center justify-center rounded text-foreground-muted hover:bg-surface/60 transition-colors"
          >
            <X className="size-4" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "w-full text-left px-md py-sm pr-[68px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded",
          )}
        >
          <div
            className={cn(
              "truncate text-body font-medium",
              active ? "text-primary" : "text-foreground",
            )}
          >
            {display}
          </div>
          <div className="truncate text-body-sm text-foreground-muted">
            {formatTimestamp(session.updated_at || session.created_at)}
          </div>
        </button>
      )}

      {!renaming && (
        <div
          className={cn(
            "absolute right-sm top-1/2 -translate-y-1/2 flex items-center gap-xs",
            "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
            "transition-opacity duration-hover ease-hover",
          )}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartRename();
            }}
            aria-label="Renombrar"
            className={cn(
              "size-7 inline-flex items-center justify-center rounded",
              "text-foreground-muted hover:text-secondary",
              "hover:bg-secondary/15 transition-colors duration-hover",
            )}
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete();
            }}
            aria-label="Eliminar"
            className={cn(
              "size-7 inline-flex items-center justify-center rounded",
              "text-foreground-muted hover:text-error",
              "hover:bg-error/15 hover:shadow-[0_0_12px_-2px_rgba(255,139,124,0.5)]",
              "transition-all duration-hover ease-hover",
            )}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat header                                                       */
/* ------------------------------------------------------------------ */

interface ChatHeaderProps {
  title: string | null;
  hasSession: boolean;
  onOpenDrawer: () => void;
  onRenameSession: () => void;
  onDeleteSession: () => void;
}

function ChatHeader({
  title,
  hasSession,
  onOpenDrawer,
  onRenameSession,
  onDeleteSession,
}: ChatHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-sm",
        "px-md md:px-xl py-md",
        "border-b border-border/70",
        "bg-surface-alt/30 backdrop-blur-xl",
      )}
    >
      <div className="flex min-w-0 items-center gap-sm">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Abrir lista de sesiones"
          className={cn(
            "md:hidden size-9 inline-flex items-center justify-center rounded",
            "border border-border/70 bg-surface/60",
            "text-foreground hover:bg-surface transition-colors duration-hover",
          )}
        >
          <Sparkles className="size-4 text-primary" />
        </button>
        <h2
          className={cn(
            "truncate font-headline text-h4 text-foreground",
            !title && "text-foreground-muted",
          )}
        >
          {title ?? "Nueva conversación"}
        </h2>
      </div>

      {hasSession && (
        <div className="flex items-center gap-xs">
          <button
            type="button"
            onClick={onRenameSession}
            aria-label="Renombrar sesión"
            className={cn(
              "size-9 inline-flex items-center justify-center rounded",
              "text-foreground-muted hover:text-secondary",
              "hover:bg-secondary/15 transition-colors duration-hover",
            )}
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDeleteSession}
            aria-label="Eliminar sesión"
            className={cn(
              "size-9 inline-flex items-center justify-center rounded",
              "text-foreground-muted hover:text-error",
              "hover:bg-error/15 transition-colors duration-hover",
            )}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                       */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center py-2xl animate-fade-in-up">
      <div
        className={cn(
          "size-16 rounded-full flex items-center justify-center",
          "bg-primary/10 border border-primary/30 mb-lg",
          "shadow-[0_0_24px_-4px_rgba(34,197,94,0.35)]",
        )}
      >
        <Sparkles className="size-7 text-primary" />
      </div>
      <h3 className="font-headline text-h3 text-foreground mb-sm">
        Pregunta sobre ciberseguridad
      </h3>
      <p className="max-w-[440px] text-body text-foreground-muted">
        Vulnerabilidades, OWASP, hardening, threat modeling, análisis de
        código. Empieza escribiendo abajo — crearé una sesión automáticamente.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Message bubble                                                    */
/* ------------------------------------------------------------------ */

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex items-end gap-sm animate-fade-in-up",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div
          className={cn(
            "size-8 shrink-0 rounded-full flex items-center justify-center",
            "bg-primary/10 border border-primary/30",
          )}
        >
          <Bot className="size-4 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[78%] flex flex-col gap-xs",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded px-md py-sm text-body",
            isUser
              ? "bg-secondary text-secondary-foreground shadow-subtle"
              : "bg-surface-alt/80 border border-border text-foreground shadow-base backdrop-blur-sm",
          )}
        >
          <MessageContent content={message.content} role={message.role} />
        </div>
        <span className="text-body-sm text-foreground-muted px-xs">
          {formatTimestamp(message.created_at)}
        </span>
      </div>

      {isUser && (
        <div
          className={cn(
            "size-8 shrink-0 rounded-full flex items-center justify-center",
            "bg-secondary/15 border border-secondary/40",
          )}
        >
          <User className="size-4 text-secondary" />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Message content — assistant uses Markdown, user stays plain text. */
/* ------------------------------------------------------------------ */

function MessageContent({
  content,
  role,
}: {
  content: string;
  role: "user" | "assistant";
}) {
  if (role === "assistant") {
    return <Markdown>{content}</Markdown>;
  }
  return (
    <div className="whitespace-pre-wrap break-words">{content}</div>
  );
}

/* ------------------------------------------------------------------ */
/*  Message skeleton                                                  */
/* ------------------------------------------------------------------ */

function MessageSkeleton({ role }: { role: "user" | "assistant" }) {
  const isUser = role === "user";
  return (
    <div
      className={cn(
        "flex items-end gap-sm animate-fade-in",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="size-8 shrink-0 rounded-full bg-primary/10 border border-primary/30 animate-pulse" />
      )}
      <div
        className={cn(
          "flex flex-col gap-xs",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded px-md py-sm",
            isUser
              ? "bg-secondary/60"
              : "bg-surface-alt/80 border border-border",
            "animate-pulse",
          )}
        >
          <div className="h-3 w-[180px] rounded bg-foreground/15 mb-xs" />
          <div className="h-3 w-[120px] rounded bg-foreground/15" />
        </div>
      </div>
      {isUser && (
        <div className="size-8 shrink-0 rounded-full bg-secondary/15 border border-secondary/40 animate-pulse" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline error                                                      */
/* ------------------------------------------------------------------ */

function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-sm rounded px-md py-sm",
        "border border-error text-error",
        "bg-[rgba(255,139,124,0.1)]",
        "animate-slide-down",
      )}
    >
      <AlertCircle className="size-4 shrink-0 mt-[2px]" />
      <span className="text-body-sm flex-1">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "text-body-sm font-medium underline-offset-2 hover:underline",
            "transition-colors duration-hover",
          )}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat input                                                        */
/* ------------------------------------------------------------------ */

interface ChatInputProps {
  inputRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  disabled: boolean;
  onSend: (content: string) => void;
}

function ChatInput({ inputRef, disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState("");

  const adjustHeight = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    const next = Math.min(120, Math.max(48, el.scrollHeight));
    el.style.height = `${next}px`;
  }, []);

  useEffect(() => {
    if (inputRef.current) adjustHeight(inputRef.current);
  }, [value, inputRef, adjustHeight]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (inputRef.current) {
      inputRef.current.style.height = "48px";
    }
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const empty = value.trim().length === 0;

  return (
    <div className="px-lg md:px-xl pb-lg pt-sm">
      <div className="mx-auto flex max-w-[860px] flex-col gap-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-end gap-md"
        >
          <div
            className={cn(
              "group relative flex-1",
              disabled && "opacity-80",
            )}
          >
            <Sparkles
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute left-md top-1/2 -translate-y-1/2 size-6",
                "text-primary opacity-70",
                "transition-opacity duration-hover",
                "group-focus-within:opacity-100",
              )}
            />
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKey}
              disabled={disabled}
              rows={1}
              placeholder="Pregunta sobre ciberseguridad..."
              className={cn(
                "block w-full rounded resize-y",
                "min-h-[48px] max-h-[120px]",
                "py-md pr-md pl-9 text-body text-foreground placeholder:text-foreground-muted",
                "bg-surface-alt/60 backdrop-blur-xl",
                "border border-border",
                "transition-all duration-hover ease-hover",
                "focus:outline-none focus:bg-surface focus:border-primary focus:shadow-[0_0_0_4px_rgba(34,197,94,0.18)]",
                "disabled:cursor-not-allowed",
              )}
              style={{ height: 48 }}
            />
          </div>
          <SendButton disabled={disabled || empty} loading={disabled} />
        </form>
        <p className="text-body-sm text-foreground-muted px-xs">
          <kbd className="font-mono">Enter</kbd> envía ·{" "}
          <kbd className="font-mono">Shift+Enter</kbd> nueva línea
        </p>
      </div>
    </div>
  );
}

function SendButton({
  disabled,
  loading,
}: {
  disabled: boolean;
  loading: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      aria-label="Enviar mensaje"
      className={cn(
        "size-12 shrink-0 inline-flex items-center justify-center rounded",
        "bg-primary text-primary-foreground",
        "transition-all duration-hover ease-hover",
        "hover:brightness-110 hover:shadow-[0_8px_24px_-6px_rgba(34,197,94,0.55)]",
        "active:brightness-90 active:scale-[0.97]",
        "disabled:bg-disabled disabled:opacity-50 disabled:cursor-not-allowed",
        "disabled:hover:shadow-none disabled:hover:brightness-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-alt",
      )}
    >
      {loading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <Send className="size-5" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Confirm modal                                                     */
/* ------------------------------------------------------------------ */

interface ConfirmModalProps {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    function handleKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-lg">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className={cn(
          "relative z-10 w-full max-w-[420px]",
          "rounded border border-border/70",
          "bg-surface-alt/90 backdrop-blur-xl shadow-large",
          "p-xl animate-card-in",
        )}
      >
        <div className="flex items-start gap-sm mb-md">
          <div className="size-9 rounded-full bg-error/15 border border-error/40 flex items-center justify-center shrink-0">
            <Trash2 className="size-4 text-error" />
          </div>
          <div>
            <h4 id="confirm-title" className="font-headline text-h4 mb-xs">
              {title}
            </h4>
            <p className="text-body-sm text-foreground-muted">
              {description}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-sm">
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "h-10 px-lg rounded text-body font-medium",
              "bg-transparent border border-border text-foreground",
              "hover:bg-surface/60 hover:border-neutral",
              "transition-colors duration-hover ease-hover",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40",
            )}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "h-10 px-lg rounded text-body font-medium",
              "bg-error text-tertiary-foreground",
              "transition-all duration-hover ease-hover",
              "hover:brightness-110 hover:shadow-[0_8px_24px_-6px_rgba(255,139,124,0.55)]",
              "active:brightness-90 active:scale-[0.99]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/50",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
