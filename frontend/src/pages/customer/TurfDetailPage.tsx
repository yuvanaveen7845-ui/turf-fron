import React, { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

export const TurfDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (id) {
      params.set("turf", id);
    }
    // Seamlessly forward to the unified 2-page slot console
    navigate(`/?${params.toString()}`, { replace: true });
  }, [id, searchParams, navigate]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-bold text-slate-500">Loading pitch schedule...</p>
    </div>
  );
};
