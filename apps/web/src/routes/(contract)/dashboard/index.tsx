"use client";

import { useEffect, useState } from "react";
import { useContract } from "@/providers/ContractProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  FileText,
  BookOpen,
  GraduationCap,
  CheckCircle,
} from "lucide-react";
// import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { type Course } from "@/types";
import { type ContractResult } from "contract-instance";
import type { SS58String } from "polkadot-api";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/(contract)/dashboard/")({
  component: DashboardPage,
  validateSearch: (search) => ({
    tab: search.tab || "courses",
  }),
});
interface EnrolledCourse extends Course {
  completed: boolean;
}

interface Certificate {
  id: string;
  courseId: number;
  courseTitle: string;
  completionDate: number;
}

interface CertificateInfo {
  course_id: number;
  course_title: string;
  student: SS58String;
  completion_date: bigint;
}

export default function DashboardPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { contract, isReady, selectedAccount, connectWallet } = useContract();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Handle tab change
  const handleTabChange = (value: "courses" | "certificate") => {
    navigate({
      search: { tab: value },
    });
  };

  const parsePSP34Id = (value: any): string => {
    if (!value) return "";

    // Handle string or number directly
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (typeof value === "bigint") return value.toString();

    // Handle T8 enum types
    if (value.u8 !== undefined) return value.u8.toString();
    if (value.u16 !== undefined) return value.u16.toString();
    if (value.u32 !== undefined) return value.u32.toString();
    if (value.u64 !== undefined) return value.u64.toString();
    if (value.u128 !== undefined) return value.u128.toString();

    // Handle bytes
    if (value.bytes !== undefined) return value.bytes;

    // Log for debugging
    console.warn("Unknown PSP34 ID format:", value);
    return JSON.stringify(value);
  };

  // Then in your component:
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isReady || !contract || !selectedAccount) {
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching user data for account:", selectedAccount.address);

        // Get enrolled course IDs using string-based query
        const courseIdsResult = (await contract.query("get_student_courses", {
          data: { student: selectedAccount.address },
          origin: selectedAccount.address,
        })) as ContractResult<number[]>;

        console.log("Course IDs result:", courseIdsResult);

        if (!courseIdsResult.success || !courseIdsResult.value?.response) {
          console.error("Error fetching course IDs:", courseIdsResult.error);
          setEnrolledCourses([]);
        } else {
          const courseIds = courseIdsResult.value.response;

          // Fetch details for each course
          const coursesPromises = courseIds.map(async (id) => {
            try {
              const courseResult = (await contract.query("get_course", {
                data: { course_id: id },
                origin: selectedAccount.address,
              })) as ContractResult<Course>;

              if (!courseResult.success || !courseResult.value?.response) {
                console.error(
                  `Error fetching course ${id}:`,
                  courseResult.error,
                );
                return null;
              }

              const course = courseResult.value.response;

              // Check if the course is completed
              const completionResult = (await contract.query(
                "verify_completion",
                {
                  data: {
                    student: selectedAccount.address,
                    course_id: id,
                  },
                  origin: selectedAccount.address,
                },
              )) as ContractResult<boolean>;

              const completed = completionResult.success
                ? completionResult.value?.response || false
                : false;

              return {
                ...course,
                completed,
              };
            } catch (error) {
              console.error(`Failed to fetch course ${id}:`, error);
              return null;
            }
          });

          const coursesWithDetails = (
            await Promise.all(coursesPromises)
          ).filter(Boolean) as EnrolledCourse[];

          console.log("Courses with details:", coursesWithDetails);
          setEnrolledCourses(coursesWithDetails);
        }

        // Get certificates
        try {
          const certificateIdsResult = (await contract.query(
            "get_student_certificate_vector",
            {
              data: { student: selectedAccount.address },
              origin: selectedAccount.address,
            },
          )) as ContractResult<any[]>;

          console.log("Certificate IDs result:", certificateIdsResult);

          if (
            !certificateIdsResult.success ||
            !certificateIdsResult.value?.response
          ) {
            console.error(
              "Error fetching certificate IDs:",
              certificateIdsResult.error,
            );
            setCertificates([]);
          } else {
            const certificateIds = certificateIdsResult.value.response;

            const certificatesPromises = certificateIds.map(async (id) => {
              try {
                // Get certificate metadata
                const metadataResult = (await contract.query(
                  "verify_certificate",
                  {
                    data: { id },
                    origin: selectedAccount.address,
                  },
                )) as ContractResult<CertificateInfo>;

                if (
                  !metadataResult.success ||
                  !metadataResult.value?.response
                ) {
                  console.error(
                    `Error fetching metadata for certificate ${id}:`,
                    metadataResult.error,
                  );
                  return null;
                }

                const metadata = metadataResult.value.response;

                return {
                  id: parsePSP34Id(id),
                  courseId: metadata.course_id,
                  courseTitle: metadata.course_title,
                  completionDate: Number(metadata.completion_date),
                };
              } catch (error) {
                console.error(`Failed to fetch certificate ${id}:`, error);
                return null;
              }
            });

            const validCertificates = (
              await Promise.all(certificatesPromises)
            ).filter(Boolean) as Certificate[];

            console.log("Processed certificates:", validCertificates);
            setCertificates(validCertificates);
          }
        } catch (error) {
          console.error("Failed to fetch certificates:", error);
          setCertificates([]);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setEnrolledCourses([]);
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [contract, isReady, selectedAccount]);

  if (!selectedAccount && !loading) {
    return (
      <div className="container py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GraduationCap className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="mb-8 text-muted-foreground max-w-md mx-auto">
            You need to connect your wallet to access your dashboard and view
            your courses and certificates.
          </p>
          <Button onClick={connectWallet}>Connect Wallet</Button>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid gap-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <Tabs value={tab || "courses"} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="certificates">My Certificates</TabsTrigger>
          </TabsList>
          <TabsContent value="courses">
            {enrolledCourses.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Courses Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't enrolled in any courses yet. Browse our catalog
                    to get started.
                  </p>
                  <Button asChild>
                    <Link to="/courses">Browse Courses</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {enrolledCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-medium mb-2">
                              {course.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(
                                    Number(course.start_time),
                                  ).toLocaleDateString()}{" "}
                                  -{" "}
                                  {new Date(
                                    Number(course.end_time),
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {course.completed
                                    ? "Completed"
                                    : Number(course.start_time) > Date.now()
                                      ? "Starting soon"
                                      : "In progress"}
                                </span>
                              </div>
                              {course.completed && (
                                <Badge
                                  variant="outline"
                                  className="ml-auto md:ml-0"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button asChild>
                            <Link to={`/courses/${course.id}`}>
                              {course.completed
                                ? "View Course"
                                : "Continue Learning"}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="certificates">
            {certificates.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">
                    No Certificates Yet
                  </h3>
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
                        <CardDescription>
                          Completed on{" "}
                          {new Date(cert.completionDate).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" className="w-full" asChild>
                          <Link to={`/certificates`}>View Certificate</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
