import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(contract)/profile/")({
  component: ProfilePage,
});

import { useState, useEffect } from "react";
import { useContract } from "@/providers/ContractProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
// import Link from "next/link";
import {
  BookOpen,
  BadgeIcon as Certificate,
  GraduationCap,
  User,
} from "lucide-react";
import { type Course } from "@/types";
import { type ContractResult } from "contract-instance";
import type { SS58String } from "polkadot-api";
import { Link } from "@tanstack/react-router";

interface CertificateInfo {
  course_id: number;
  course_title: string;
  student: SS58String;
  completion_date: bigint;
}

export default function ProfilePage() {
  const { contract, selectedAccount, connectWallet, isReady } = useContract();
  const [activeTab, setActiveTab] = useState("courses");
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
  const [certificateIds, setCertificateIds] = useState<string[]>([]);
  const [loadingCourseIds, setLoadingCourseIds] = useState(true);
  const [loadingCertificateIds, setLoadingCertificateIds] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isReady || !contract || !selectedAccount) {
        setLoadingCourseIds(false);
        setLoadingCertificateIds(false);
        return;
      }

      try {
        console.log("Fetching enrolled courses for:", selectedAccount.address);

        // Get enrolled course IDs
        const courseIdsResult = (await contract.query("get_student_courses", {
          data: { student: selectedAccount.address },
          origin: selectedAccount.address,
        })) as ContractResult<number[]>;

        if (courseIdsResult.success && courseIdsResult.value?.response) {
          setEnrolledCourseIds(courseIdsResult.value.response);
        } else {
          console.error("Error fetching course IDs:", courseIdsResult.error);
          setEnrolledCourseIds([]);
        }
      } catch (error) {
        console.error("Failed to fetch enrolled courses:", error);
        setEnrolledCourseIds([]);
      } finally {
        setLoadingCourseIds(false);
      }

      try {
        // Get certificate IDs
        const certificateIdsResult = await contract.query(
          "get_student_certificate_vector",
          {
            data: { student: selectedAccount.address },
            origin: selectedAccount.address,
          },
        );

        if (
          certificateIdsResult.success &&
          certificateIdsResult.value?.response
        ) {
          setCertificateIds(certificateIdsResult.value.response);
        } else {
          console.error(
            "Error fetching certificate IDs:",
            certificateIdsResult.error,
          );
          setCertificateIds([]);
        }
      } catch (error) {
        console.error("Failed to fetch certificate IDs:", error);
        setCertificateIds([]);
      } finally {
        setLoadingCertificateIds(false);
      }
    };

    fetchUserData();
  }, [contract, isReady, selectedAccount]);

  if (!selectedAccount) {
    return (
      <div className="container py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <User className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="mb-8 text-muted-foreground max-w-md mx-auto">
            You need to connect your wallet to view your profile and manage your
            courses.
          </p>
          <Button onClick={connectWallet}>Connect Wallet</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="grid gap-8 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage
                  src="/placeholder.svg?height=96&width=96"
                  alt="Profile"
                />
                <AvatarFallback>
                  {selectedAccount.meta.name?.charAt(0) ||
                    selectedAccount.address.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <CardTitle>
                {selectedAccount.meta.name || "Anonymous User"}
              </CardTitle>
              <CardDescription className="break-all">
                {selectedAccount.address}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {enrolledCourseIds?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Courses</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {certificateIds?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Certificates</p>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/dashboard">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  {/* <Link to="/settings">
                    <User className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Link> */}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="md:col-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="courses">
                <BookOpen className="mr-2 h-4 w-4" />
                My Courses
              </TabsTrigger>
              <TabsTrigger value="certificates">
                <Certificate className="mr-2 h-4 w-4" />
                My Certificates
              </TabsTrigger>
            </TabsList>
            <TabsContent value="courses">
              <EnrolledCourses
                courseIds={enrolledCourseIds}
                isLoading={loadingCourseIds}
              />
            </TabsContent>
            <TabsContent value="certificates">
              <Certificates
                certificateIds={certificateIds}
                isLoading={loadingCertificateIds}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

function EnrolledCourses({
  courseIds,
  isLoading,
}: {
  courseIds?: number[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-64 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!courseIds || courseIds.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Courses Yet</h3>
          <p className="text-muted-foreground mb-6">
            You haven't enrolled in any courses yet. Browse our catalog to get
            started.
          </p>
          <Button asChild>
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {courseIds.map((courseId, index) => (
        <EnrolledCourseItem key={courseId} courseId={courseId} index={index} />
      ))}
    </div>
  );
}

function EnrolledCourseItem({
  courseId,
  index,
}: {
  courseId: number;
  index: number;
}) {
  const { contract, selectedAccount, isReady } = useContract();
  const [course, setCourse] = useState<Course | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!isReady || !contract || !selectedAccount) {
        setIsLoading(false);
        return;
      }

      try {
        // Get course details
        const courseResult = (await contract.query("get_course", {
          data: { course_id: courseId },
          origin: selectedAccount.address,
        })) as ContractResult<Course>;

        if (courseResult.success && courseResult.value?.response) {
          setCourse(courseResult.value.response);
        } else {
          console.error(
            `Error fetching course ${courseId}:`,
            courseResult.error,
          );
        }

        // Check if course is completed
        const completionResult = (await contract.query("verify_completion", {
          data: {
            student: selectedAccount.address,
            course_id: courseId,
          },
          origin: selectedAccount.address,
        })) as ContractResult<boolean>;

        if (completionResult.success) {
          setIsCompleted(completionResult.value?.response || false);
        }
      } catch (error) {
        console.error(`Failed to fetch course ${courseId}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseDetails();
  }, [contract, courseId, isReady, selectedAccount]);

  if (isLoading || !course) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-medium mb-2">{course.title}</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div>
                  {new Date(Number(course.start_time)).toLocaleDateString()} -{" "}
                  {new Date(Number(course.end_time)).toLocaleDateString()}
                </div>
                {isCompleted && (
                  <Badge variant="outline" className="ml-auto md:ml-0">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
            <Button asChild>
              <Link to={`/courses/${course.id}`}>
                {isCompleted ? "View Course" : "Continue Learning"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Certificates({
  certificateIds,
  isLoading,
}: {
  certificateIds?: string[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
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
    );
  }

  if (!certificateIds || certificateIds.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Certificate className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Certificates Yet</h3>
          <p className="text-muted-foreground mb-6">
            Complete your enrolled courses to earn certificates as NFTs.
          </p>
          <Button asChild>
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {certificateIds.map((certId, index) => (
        <CertificateItem key={certId} certId={certId} index={index} />
      ))}
    </div>
  );
}

function CertificateItem({ certId, index }: { certId: string; index: number }) {
  const { contract, selectedAccount, isReady } = useContract();
  const [certInfo, setCertInfo] = useState<CertificateInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCertificateInfo = async () => {
      if (!isReady || !contract || !selectedAccount) {
        setIsLoading(false);
        return;
      }

      try {
        // Get certificate info
        const certResult = (await contract.query("verify_certificate", {
          data: { id: certId },
          origin: selectedAccount.address,
        })) as ContractResult<CertificateInfo>;

        if (certResult.success && certResult.value?.response) {
          setCertInfo(certResult.value.response);
        } else {
          console.error(
            `Error fetching certificate ${certId}:`,
            certResult.error,
          );
        }
      } catch (error) {
        console.error(`Failed to fetch certificate ${certId}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificateInfo();
  }, [contract, certId, isReady, selectedAccount]);

  if (isLoading || !certInfo) {
    return (
      <Card className="overflow-hidden">
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
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Certificate className="h-16 w-16 text-primary/70" />
          </div>
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-1">
            {certInfo.course_title}
          </CardTitle>
          <CardDescription>
            Completed on{" "}
            {new Date(Number(certInfo.completion_date)).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" asChild>
            <Link to={`/certificates`}>View Certificate</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
