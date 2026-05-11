import { useCallback, useState } from "react";
import {
  AlertCircle,
  Code2,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { request } from "@/services/api";
import { cn } from "@/lib/utils";
import { parseApiError } from "@/lib/errors";
import { useError } from "@/hooks/useError";
import { Markdown } from "@/components/ui/markdown";

interface AnalyzeRequest {
  code: string;
  language?: string;
}

interface AnalyzeResponse {
  analysis?: string;
  result?: string;
  summary?: string;
  vulnerabilities?: Vulnerability[];
}

type Severity = "critical" | "high" | "medium" | "low";

interface Vulnerability {
  title: string;
  severity?: Severity;
  description?: string;
  line?: number;
}

const LANGUAGES = [
  "auto",
  "python",
  "javascript",
  "typescript",
  "go",
  "java",
  "c",
  "cpp",
  "rust",
  "php",
  "ruby",
] as const;

type Language = (typeof LANGUAGES)[number];

const SEVERITY_CLASSES: Record<Severity, string> = {
  critical: "border-severity-critical text-severity-critical bg-severity-critical/10",
  high: "border-severity-high text-severity-high bg-severity-high/10",
  medium: "border-severity-medium text-severity-medium bg-severity-medium/10",
  low: "border-severity-low text-severity-low bg-severity-low/10",
};

export function Analyzer() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language>("auto");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { showError, showSuccess } = useError();

  const submit = useCallback(async () => {
    const trimmed = code.trim();
    setValidationError(null);
    if (trimmed.length === 0) {
      const msg = "Código vacío";
      setValidationError(msg);
      showError(msg);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await request<AnalyzeResponse>({
        url: "/analyzer/analyze/",
        method: "POST",
        data: {
          code: trimmed,
          ...(language !== "auto" ? { language } : {}),
        } satisfies AnalyzeRequest,
        silent: true,
      });
      setResult(data);
      showSuccess("Análisis completado");
    } catch (err) {
      const parsed = parseApiError(err);
      const friendly =
        parsed.status >= 500
          ? parsed.message
          : "Error analizando código";
      setError(friendly);
      showError(friendly);
    } finally {
      setLoading(false);
    }
  }, [code, language, showError, showSuccess]);

  const canSubmit = code.trim().length > 0 && !loading;

  return (
    <div className="flex flex-col gap-xl animate-fade-in-up">
      <header className="flex flex-col gap-sm">
        <div className="flex items-center gap-sm text-foreground-muted">
          <ShieldCheck className="size-4 text-primary" />
          <span className="text-body-sm">Análisis estático</span>
        </div>
        <h1 className="font-headline text-h1 text-foreground">
          Code Analyzer
        </h1>
        <p className="text-body text-foreground-muted max-w-[640px]">
          Pega código fuente para detectar vulnerabilidades, malas prácticas y
          posibles vectores de ataque.
        </p>
      </header>

      <section
        className={cn(
          "rounded border border-border/70 bg-surface-alt/40 backdrop-blur-xl",
          "p-lg flex flex-col gap-md",
        )}
      >
        <div className="flex flex-col sm:flex-row gap-sm sm:items-center sm:justify-between">
          <label
            htmlFor="analyzer-code"
            className="text-body font-medium text-foreground flex items-center gap-sm"
          >
            <Code2 className="size-4 text-primary" />
            Código fuente
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            disabled={loading}
            aria-label="Lenguaje"
            className={cn(
              "h-9 rounded px-sm bg-surface border border-border",
              "text-body-sm text-foreground",
              "focus:outline-none focus:border-primary",
              "transition-colors duration-hover ease-hover",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l === "auto" ? "Auto-detect" : l}
              </option>
            ))}
          </select>
        </div>

        <textarea
          id="analyzer-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (validationError) setValidationError(null);
          }}
          disabled={loading}
          spellCheck={false}
          placeholder="// Pega tu código aquí..."
          rows={14}
          className={cn(
            "w-full resize-y rounded p-md",
            "bg-surface border",
            "font-mono text-code text-foreground placeholder:text-foreground-muted",
            "focus:outline-none",
            "transition-all duration-hover ease-hover",
            validationError
              ? "border-error focus:border-error focus:shadow-[0_0_0_4px_rgba(255,139,124,0.15)]"
              : "border-border focus:border-primary focus:shadow-[0_0_0_4px_rgba(34,197,94,0.18)]",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        />

        {validationError && (
          <InlineError message={validationError} />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
          <p className="text-body-sm text-foreground-muted">
            {code.length} caracteres
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={cn(
              "h-11 px-lg rounded inline-flex items-center justify-center gap-sm",
              "bg-primary text-primary-foreground font-medium",
              "transition-all duration-hover ease-hover",
              "hover:brightness-110 hover:shadow-[0_8px_24px_-6px_rgba(34,197,94,0.55)]",
              "active:brightness-90 active:scale-[0.99]",
              "disabled:bg-disabled disabled:opacity-50 disabled:cursor-not-allowed",
              "disabled:hover:shadow-none disabled:hover:brightness-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            )}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analizando…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Analizar
              </>
            )}
          </button>
        </div>
      </section>

      {loading && <LoadingPanel />}

      {error && !loading && (
        <InlineError message={error} onRetry={submit} />
      )}

      {result && !loading && !error && <ResultPanel result={result} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function LoadingPanel() {
  return (
    <div
      className={cn(
        "rounded border border-border/70 bg-surface-alt/40 backdrop-blur-xl",
        "p-xl flex flex-col items-center justify-center gap-md",
        "animate-fade-in",
      )}
    >
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-body text-foreground-muted">
        Analizando código. Puede tardar unos segundos…
      </p>
    </div>
  );
}

function ResultPanel({ result }: { result: AnalyzeResponse }) {
  const text =
    result.analysis ?? result.result ?? result.summary ?? "";
  const vulns = result.vulnerabilities ?? [];
  return (
    <section
      className={cn(
        "rounded border border-border/70 bg-surface-alt/40 backdrop-blur-xl",
        "p-lg flex flex-col gap-md animate-fade-in-up",
      )}
    >
      <header className="flex items-center gap-sm">
        <div className="size-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
          <ShieldCheck className="size-4 text-primary" />
        </div>
        <h2 className="font-headline text-h4 text-foreground">Resultado</h2>
      </header>

      {vulns.length > 0 && (
        <ul className="flex flex-col gap-sm">
          {vulns.map((v, i) => (
            <li key={i}>
              <VulnCard vuln={v} />
            </li>
          ))}
        </ul>
      )}

      {text && (
        <div className="rounded border border-border bg-surface px-md py-sm">
          <Markdown>{text}</Markdown>
        </div>
      )}

      {!text && vulns.length === 0 && (
        <p className="text-body-sm text-foreground-muted">
          Sin hallazgos. El analizador no devolvió resultados.
        </p>
      )}
    </section>
  );
}

function VulnCard({ vuln }: { vuln: Vulnerability }) {
  const sev = vuln.severity ?? "medium";
  return (
    <div
      className={cn(
        "rounded border p-md flex flex-col gap-xs",
        SEVERITY_CLASSES[sev],
      )}
    >
      <div className="flex items-center justify-between gap-sm">
        <p className="font-medium text-foreground">{vuln.title}</p>
        <span
          className={cn(
            "text-body-sm font-medium uppercase tracking-wide rounded px-sm py-[2px]",
            "border",
            SEVERITY_CLASSES[sev],
          )}
        >
          {sev}
        </span>
      </div>
      {typeof vuln.line === "number" && (
        <p className="text-body-sm text-foreground-muted">Línea {vuln.line}</p>
      )}
      {vuln.description && (
        <p className="text-body-sm text-foreground">{vuln.description}</p>
      )}
    </div>
  );
}

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
          className="text-body-sm font-medium underline-offset-2 hover:underline transition-colors duration-hover"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
