import { createFileRoute } from "@tanstack/react-router";
import Hero from "@/components/hero";
import CourseGrid from "@/components/course-grid";
import Stats from "@/components/stats";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <div className="container px-4 py-8 md:py-12">
        <Stats />
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Courses</h2>
            <Button variant="outline" asChild>
              <Link to="/courses" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Enter Campus
              </Link>
            </Button>
          </div>
          <CourseGrid limit={3} showViewAll />
        </div>
      </div>
    </div>
  );
}
