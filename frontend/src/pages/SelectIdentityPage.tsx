import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "@/api/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { useUsers } from "@/hooks/useUsers";
import { UserCard } from "@/components/UserCard";
import { Skeleton } from "@/components/Skeleton";
import type { HealthResponse, WalletInfo } from "@/types/api";

export function SelectIdentityPage() {
	const [health, setHealth] = useState<HealthResponse | null>(null);
	const [healthLoading, setHealthLoading] = useState(true);
	const [healthError, setHealthError] = useState<string | null>(null);

	const { users, loading: usersLoading, error: usersError } = useUsers();
	const { setCurrentUser } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		axiosInstance
			.get<HealthResponse>("/api/health")
			.then((res) => setHealth(res.data))
			.catch(() =>
				setHealthError(
					`Backend non raggiungibile. Assicurati che il server sia in esecuzione su ${import.meta.env.VITE_API_URL ?? "<VITE_API_URL non configurata>"}`,
				),
			)
			.finally(() => setHealthLoading(false));
	}, []);

	function handleSelectUser(user: WalletInfo): void {
		setCurrentUser(user);
		navigate("/dashboard");
	}

	return (
		<div className="min-h-screen flex flex-col items-center p-4 pt-12 bg-[#050508]">
			{/* Header */}
			<div className="w-20 h-20 mb-4 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
          </svg>
        </div>
			<div className="mb-8 text-center">
				<h1 className="text-4xl font-bold tracking-tight text-white mb-2">HaCCaTThon - Chain</h1>
				<p className="text-slate-400 text-sm">La tua identità è la tua chiave blockchain</p>
			</div>

			{/* Health check card */}
			<div className="w-full max-w-2xl mb-6">
				<div className="glass-card p-6">
					{healthLoading && (
						<div className="flex items-center gap-3">
							<div className="w-3 h-3 rounded-full animate-pulse bg-violet-500" />
							<span className="text-slate-400 text-sm">Connessione alla blockchain...</span>
						</div>
					)}

					{healthError && (
						<div className="flex items-start gap-3">
							<div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0 bg-rose-500" />
							<div>
								<p className="text-white font-medium">Backend non raggiungibile</p>
								<p className="text-slate-400 text-sm mt-1">{healthError}</p>
							</div>
						</div>
					)}

					{health?.status === "rpc_unreachable" && (
						<div className="flex items-start gap-3">
							<div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0 bg-rose-500" />
							<div>
								<p className="text-white font-medium">RPC non raggiungibile</p>
								<p className="text-rose-400 text-xs mt-1 font-mono">{health.rpc_url}</p>
							</div>
						</div>
					)}

					{health?.status === "ok" && (
						<div>
							<div className="flex items-center gap-3 mb-4">
								<div className="w-3 h-3 rounded-full animate-pulse bg-emerald-500" />
								<span className="text-white font-medium">Blockchain connessa</span>
							</div>

							<div className="space-y-2 text-sm font-mono border-t border-white/10 pt-4">
								<div className="flex justify-between">
									<span className="text-slate-400">Block</span>
									<span className="text-white">#{health.block_number}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-400">Chain ID</span>
									<span className="text-white">{health.chain_id}</span>
								</div>
								<div className="flex justify-between gap-4">
									<span className="text-slate-400 flex-shrink-0">RPC</span>
									<span className="text-white truncate text-right">{health.rpc_url}</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Users section — visible only when health.status === 'ok' */}
			{health?.status === "ok" && (
				<div className="w-full max-w-2xl">
					<p className="text-slate-500 text-sm text-center mb-6">
						Non è un login tradizionale — la tua identità è la tua chiave blockchain. Scegli un utente per iniziare.
					</p>

					{usersLoading && (
						<div className="flex flex-col gap-3">
							<Skeleton className="h-20" />
							<Skeleton className="h-20" />
							<Skeleton className="h-20" />
						</div>
					)}

					{usersError && (
						<div className="flex items-start gap-3 glass-card p-4">
							<div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0 bg-rose-500" />
							<p className="text-white text-sm">{usersError}</p>
						</div>
					)}

					{!usersLoading && !usersError && users.length === 0 && (
						<p className="text-slate-500 text-sm text-center py-8">Nessun utente trovato sulla blockchain.</p>
					)}

					{!usersLoading && !usersError && users.length > 0 && (
						<div className="flex flex-col gap-3">
							{users.map((user) => (
								<UserCard key={user.address} user={user} onClick={() => handleSelectUser(user)} />
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
