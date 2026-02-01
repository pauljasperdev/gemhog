import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ThesisSection {
  label: string;
  color: string;
  text: string;
}

interface ThesisCardProps {
  title: string;
  source: string;
  tag: string;
  summary: ThesisSection;
  insight: ThesisSection;
}

export function ThesisCard({
  title,
  source,
  tag,
  summary,
  insight,
}: ThesisCardProps) {
  return (
    <div className="p-1">
      <Card className="gap-0 border-border bg-card/80 p-0 shadow-2xl ring-0 backdrop-blur-md">
        <CardHeader className="border-border/50 border-b px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-sm">
              Latest Report
            </span>
            <Badge>{tag}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pt-6 pb-6">
          <div>
            <h3 className="font-semibold text-foreground text-xl">{title}</h3>
            <div className="mt-2 flex items-center gap-2 text-chart-3 text-sm">
              <span className="font-medium">Source:</span>
              <span className="text-muted-foreground">{source}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-secondary/50 p-4">
              <span
                className={cn(
                  "mb-1 block font-bold text-xs uppercase tracking-wider",
                  summary.color === "emerald" ? "text-accent" : "text-blue-500",
                )}
              >
                {summary.label}
              </span>
              <p className="text-secondary-foreground text-sm leading-relaxed">
                {summary.text}
              </p>
            </div>

            <div className="rounded-lg bg-secondary/50 p-4">
              <span
                className={cn(
                  "mb-1 block font-bold text-xs uppercase tracking-wider",
                  insight.color === "purple"
                    ? "text-chart-2"
                    : "text-orange-400",
                )}
              >
                {insight.label}
              </span>
              <p className="text-secondary-foreground text-sm leading-relaxed">
                {insight.text}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
