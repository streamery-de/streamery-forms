import { useEffect, useState } from "react";
import { Coffee, Github, Heart, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { __ } from "@/lib/i18n";
import {
	dismissSupport,
	getSupportData,
	hasSupportLinks,
	onSupportDismissed,
} from "@/lib/support";

interface SupportCardProps {
	/**
	 * "compact": always-on card in the settings sidebar.
	 * "milestone": one-time prompt once enough entries were collected; can be
	 * dismissed for good.
	 */
	variant?: "compact" | "milestone";
	className?: string;
}

const externalLinkProps = { target: "_blank", rel: "noopener noreferrer" } as const;

export function SupportCard({ variant = "compact", className }: SupportCardProps) {
	const { links, dismissed: initiallyDismissed, milestoneReached, milestoneEntries } = getSupportData();
	const [dismissed, setDismissed] = useState(initiallyDismissed);

	useEffect(() => onSupportDismissed(() => setDismissed(true)), []);

	if (!hasSupportLinks(links)) {
		return null;
	}

	const isMilestone = variant === "milestone";
	if (isMilestone && (dismissed || !milestoneReached)) {
		return null;
	}

	const title = isMilestone
		? __("supportMilestoneTitle", "%d+ submissions collected").replace("%d", String(milestoneEntries))
		: __("supportStreameryForms", "Support Streamery Forms");
	const text = isMilestone ? __("supportMilestoneText") : __("supportText");

	return (
		<div
			className={cn(
				"group relative rounded-lg border bg-gradient-to-br from-rose-50 to-amber-50 p-4 text-sm",
				"dark:border-gray-700 dark:from-rose-950/40 dark:to-amber-950/30",
				className
			)}
		>
			{isMilestone && (
				<button
					type="button"
					onClick={dismissSupport}
					className="absolute right-2 top-2 rounded p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
					aria-label={__("dismissSupport", "Don't show again")}
					title={__("dismissSupport", "Don't show again")}
				>
					<X className="h-3.5 w-3.5" />
				</button>
			)}

			<div className="mb-1.5 flex items-center gap-2 pr-5 font-semibold dark:text-white">
				<Heart
					className={cn(
						"h-4 w-4 shrink-0 fill-rose-500 text-rose-500 transition-transform duration-300 ease-out",
						"motion-safe:group-hover:scale-125"
					)}
					aria-hidden="true"
				/>
				{title}
			</div>
			<p className="mb-3 leading-relaxed text-muted-foreground">{text}</p>

			<div className="flex flex-col gap-2">
				{links.kofi && (
					<Button asChild size="sm" className="justify-start">
						<a href={links.kofi} {...externalLinkProps}>
							<Coffee className="mr-2 h-4 w-4" aria-hidden="true" />
							{__("supportOnKofi", "Buy a coffee")}
						</a>
					</Button>
				)}
				{links.githubSponsors && (
					<Button asChild size="sm" variant="outline" className="justify-start">
						<a href={links.githubSponsors} {...externalLinkProps}>
							<Github className="mr-2 h-4 w-4" aria-hidden="true" />
							{__("sponsorOnGithub", "Sponsor on GitHub")}
						</a>
					</Button>
				)}
				{links.review && (
					<a
						href={links.review}
						{...externalLinkProps}
						className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
					>
						<Star className="h-3.5 w-3.5" aria-hidden="true" />
						{__("leaveReview", "Leave a review")}
					</a>
				)}
			</div>
		</div>
	);
}
