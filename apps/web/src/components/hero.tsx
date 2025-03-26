"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useContract } from "@/providers/ContractProvider";
import { Link } from "@tanstack/react-router";

export default function Hero() {
  const { selectedAccount } = useContract();

  return (
    <div className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.03]" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
      <div className="container relative flex flex-col items-center px-4 py-20 text-center md:py-32">
        <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative">
          <span className="inline-block rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground mb-6">
            Blockchain-powered education
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Learn. Earn.{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Certify.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Eduverse connects teachers and students through blockchain
            technology. Enroll in courses and earn verifiable certificates as
            NFTs.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="h-12 px-6">
              <Link to="/courses">
                Browse Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {selectedAccount ? (
              <Button variant="outline" size="lg" asChild className="h-12 px-6">
                <Link to="/dashboard">My Dashboard</Link>
              </Button>
            ) : (
              <Button variant="outline" size="lg" asChild className="h-12 px-6">
                {/* <Link to="/teach">Become a Teacher</Link> */}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
