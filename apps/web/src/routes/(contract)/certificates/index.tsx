import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useContract } from "@/providers/ContractProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
// import Link from "next/link";
import { motion } from "framer-motion";
import { CONTRACT_ADDRESS } from "contract-instance";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/(contract)/certificates/")({
  component: CertificatesPage,
});

// interface CertificateInfo {
//   course_id: number;
//   course_title: string;
//   student: SS58String;
//   completion_date: bigint;
// }

interface Certificate {
  id: string;
  courseId: number;
  courseTitle: string;
  completionDate: number;
}

export default function CertificatesPage() {
  const { contract, isReady, selectedAccount, connectWallet } = useContract();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // In your certificates page
  useEffect(() => {
    const fetchCertificates = async () => {
      if (!isReady || !contract || !selectedAccount) {
        setLoading(false);
        return;
      }

      try {
        console.log(
          "Fetching certificates for account:",
          selectedAccount.address,
        );

        // Mock certificate data
        const mockCertificates: Certificate[] = [
          {
            id: "cert-123-456",
            courseId: 1,
            courseTitle: "Introduction to Blockchain Development",
            completionDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // 1 week ago
          },
          {
            id: "cert-789-012",
            courseId: 2,
            courseTitle: "Web3 Frontend Development",
            completionDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 1 month ago
          },
        ];

        setCertificates(mockCertificates);
        console.log("Using mock certificates:", mockCertificates);
      } catch (error) {
        console.error("Failed to fetch certificates:", error);
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [contract, isReady, selectedAccount]);

  if (!selectedAccount && !loading) {
    return (
      <div className="container py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="mb-8 text-muted-foreground max-w-md mx-auto">
            You need to connect your wallet to view your certificates.
          </p>
          <Button onClick={connectWallet}>Connect Wallet</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-[4/3]">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No Certificates Yet</h3>
            <p className="text-muted-foreground mb-6">
              Complete your enrolled courses to earn certificates as NFTs.
            </p>
            <Button asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert, index) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <FileText className="h-16 w-16 text-primary/70" />
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">
                    {cert.courseTitle}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Completed on{" "}
                    {new Date(cert.completionDate).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href={`https://alephzero-testnet.subscan.io/account/${CONTRACT_ADDRESS}/nft/${cert.id}`}
                    >
                      View on NFT Explorer
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
