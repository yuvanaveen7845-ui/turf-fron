import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  errorMessage: string;
}

/**
 * Resilient Error Boundary adhering to Friends Turf DESIGN.md.
 * Intercepts stale chunk errors and provides an instant one-click refresh mechanism.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isChunkError: false,
    errorMessage: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    const msg = error?.message || "";
    const isChunk =
      msg.includes("dynamically imported module") ||
      msg.includes("Failed to fetch") ||
      msg.includes("MIME type") ||
      msg.includes("Loading chunk") ||
      error.name === "ChunkLoadError";

    return {
      hasError: true,
      isChunkError: isChunk,
      errorMessage: msg,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("[FriendsTurf] Caught view error in ChunkErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    sessionStorage.removeItem("ft_chunk_retry_attempted");
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 text-center shadow-lg space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ECFDF5] border border-emerald-200/60 flex items-center justify-center text-[#059669]">
              {this.state.isChunkError ? (
                <Sparkles className="w-7 h-7 animate-pulse text-[#059669]" />
              ) : (
                <RefreshCw className="w-7 h-7 text-[#059669]" />
              )}
            </div>

            <div className="space-y-2">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full">
                {this.state.isChunkError ? "Live Update Ready" : "Notice"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {this.state.isChunkError
                  ? "A New Version is Available"
                  : "Unable to Load Screen"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {this.state.isChunkError
                  ? "We just deployed fresh turf scheduling enhancements to the platform. Refresh to load the newest version."
                  : "We encountered a temporary connection issue while loading this view. Please refresh to try again."}
              </p>
            </div>

            <button
              onClick={this.handleReload}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-md transition-all duration-200 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Friends Turf</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
