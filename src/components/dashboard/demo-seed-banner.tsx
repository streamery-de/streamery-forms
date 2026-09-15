import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Database, X } from "lucide-react";

declare const streameryForms: {
  apiUrl: string;
};

export function DemoSeedBanner() {
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    checkDemoData();
  }, []);

  const checkDemoData = async () => {
    try {
      setIsChecking(true);
      const response = await fetch(
        streameryForms.apiUrl +
          "streamery-forms/v1/database/check-demo-data"
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setHasData(data.has_data);
    } catch (error) {
      console.error("Error checking demo data:", error);
      setHasData(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSeed = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        streameryForms.apiUrl +
          "streamery-forms/v1/database/seed-demo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Demo data seeded successfully!");
        setHasData(true);
      } else {
        toast.error(data.message || "Failed to seed demo data");
      }
    } catch (error) {
      console.error("Error seeding demo data:", error);
      toast.error("An error occurred while seeding demo data");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show banner if data exists, is checking, or is dismissed
  if (isChecking || hasData || isDismissed) {
    return null;
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
              Seed Demo Data
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          Get started quickly by seeding your database with sample mailboxes,
          entries, labels, and providers. This will help you explore the
          features of Streamery Forms.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleSeed}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Seeding...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Seed Demo Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

