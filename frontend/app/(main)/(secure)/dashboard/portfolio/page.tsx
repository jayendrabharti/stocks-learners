import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";

export default function PortfolioPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <Clock className="text-muted-foreground h-16 w-16" />
          </div>
          <CardTitle className="text-2xl">Portfolio</CardTitle>
          <CardDescription>
            Track and manage your stock investments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground text-lg font-semibold">
              Coming Soon
            </p>
            <p className="text-muted-foreground text-sm">
              We're working hard to bring you a comprehensive portfolio
              management experience. Stay tuned for updates!
            </p>
            <div className="flex justify-center pt-4">
              <Button variant="outline" disabled>
                <BarChart3 className="mr-2 h-4 w-4" />
                Portfolio Features
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
