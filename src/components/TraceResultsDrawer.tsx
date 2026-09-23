import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, ArrowRight, CheckCircle, XCircle, AlertCircle, Building2, Loader2 } from 'lucide-react';

interface TraceCandidate {
  ticker: string;
  companyName: string;
  screenerName: string;
  verification?: {
    status: 'confirmed' | 'mismatch' | 'not_found';
    screenerName: string;
    ownershipName?: string;
    ticker: string;
  };
}

interface TraceResultsDrawerProps {
  candidates: TraceCandidate[];
  isLoading?: boolean;
}

function TraceResultsDrawer({ candidates, isLoading }: TraceResultsDrawerProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const shareholderName = searchParams.get('shareholder');

  if (!shareholderName) return null;

  function handleClose() {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('shareholder');
    setSearchParams(newParams);
  }

  function handleOpen(ticker: string) {
    handleClose();
    navigate(`/trace?ticker=${encodeURIComponent(ticker)}`);
  }

  const confirmedCount = candidates.filter(c => c.verification?.status === 'confirmed').length;
  const mismatchCount = candidates.filter(c => c.verification?.status === 'mismatch').length;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Trace results"
      >
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
              Trace results
            </div>
            <h2 className="mt-0.5 text-lg font-bold text-[var(--color-primary)]">
              {decodeURIComponent(shareholderName)}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-[var(--radius-sm)] p-2 text-[var(--color-muted)] transition-colors hover:bg-gray-100 hover:text-[var(--color-primary)]"
            aria-label="Close trace results"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 size={24} className="animate-spin text-[var(--color-accent)]" />
              <span className="text-sm text-[var(--color-muted)]">Verifying candidates...</span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertCircle size={32} className="text-gray-400" />
              <span className="text-sm text-[var(--color-muted)] max-w-[280px]">
                No companies found where this shareholder appears.
              </span>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-4 flex items-center gap-4 text-xs text-[var(--color-muted)]">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle size={12} className="text-green-500" />
                  {confirmedCount} confirmed
                </span>
                <span className="inline-flex items-center gap-1">
                  <XCircle size={12} className="text-amber-500" />
                  {mismatchCount} mismatch
                </span>
              </div>

              <div className="space-y-3">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.ticker}
                    className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[var(--color-primary)]">
                          <Building2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono text-sm font-medium text-[var(--color-primary)]">
                            {candidate.ticker}
                          </div>
                          <div className="truncate text-sm text-[var(--color-muted)]">
                            {candidate.companyName}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpen(candidate.ticker)}
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-[var(--color-primary)] transition-opacity hover:opacity-80 shrink-0"
                      >
                        Open
                        <ArrowRight size={12} />
                      </button>
                    </div>

                    {candidate.verification && (
                      <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                        {candidate.verification.status === 'confirmed' ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500" />
                            <span className="text-xs font-medium text-green-700">
                              Confirmed as {candidate.verification.ownershipName}
                            </span>
                          </div>
                        ) : candidate.verification.status === 'mismatch' ? (
                          <div className="flex items-center gap-2">
                            <XCircle size={14} className="text-amber-500" />
                            <span className="text-xs font-medium text-amber-700">
                              Name mismatch — found {candidate.verification.ownershipName || 'different holder'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Verification failed
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="border-t border-[var(--color-border)] px-6 py-4">
          <p className="text-xs text-[var(--color-muted)]">
            Data as reported by Sectors. Verification compares shareholder names across API responses.
          </p>
        </footer>
      </aside>
    </>
  );
}

export default TraceResultsDrawer;
