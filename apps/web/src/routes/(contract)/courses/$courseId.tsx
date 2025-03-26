import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(contract)/courses/$courseId")({
  component: CourseDetailsPage,
});

import { useEffect, useState, useCallback, useMemo } from "react";
import { useContract } from "@/providers/ContractProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  FileIcon,
} from "lucide-react";
// import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import type { SS58String } from "polkadot-api";
import type { ContractResult } from "contract-instance";
import type { Course } from "@/types";
import { convertPrice } from "@/lib/utils";

// Helper function to get a normalized IPFS URL
const getIpfsUrl = (
  ipfsPath: string | undefined,
  gateway = "https://ipfs.io/ipfs/",
) => {
  if (!ipfsPath) return "";
  const cleanedPath = ipfsPath.startsWith("ipfs://")
    ? ipfsPath.replace("ipfs://", "")
    : ipfsPath;
  return `${gateway}${cleanedPath}`;
};

// Extract course materials component
const CourseMaterials = ({
  materials,
}: {
  materials: Array<{ name: string; hash: string; size: string }>;
}) => {
  if (!materials || materials.length === 0) return null;

  return (
    <>
      <h3>Course Materials</h3>
      <div className="not-prose">
        <ul className="space-y-2">
          {materials.map((material, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-3 rounded-md border"
            >
              <div className="flex items-center space-x-3">
                <FileIcon className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{material.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {material.size}
                  </p>
                </div>
              </div>
              <a
                href={`https://ipfs.io/ipfs/${material.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                aria-label={`Download ${material.name}`}
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

// Extract course details sidebar component
const CourseDetailsSidebar = ({
  course,
  isEnrolled,
  enrolling,
  handleEnroll,
}: {
  course: Course;
  isEnrolled: boolean;
  enrolling: boolean;
  handleEnroll: () => Promise<void>;
}) => {
  return (
    <motion.div
      className="lg:col-span-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>Enroll to get started learning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-3xl font-bold">
            {convertPrice(course.price.toString())} AZERO
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>
                Starts{" "}
                {new Date(Number(course.start_time)).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>
                {Math.ceil(
                  (Number(course.end_time) - Number(course.start_time)) /
                    (24 * 60 * 60 * 1000),
                )}{" "}
                days
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>
                {course.enrolled_count}/{course.max_students} students enrolled
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span>Certificate included</span>
            </div>
          </div>
          {isEnrolled ? (
            <Button className="w-full" variant="secondary" disabled>
              <CheckCircle className="mr-2 h-4 w-4" />
              Already Enrolled
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleEnroll}
              disabled={enrolling || !course.active}
              aria-busy={enrolling}
            >
              {enrolling ? "Processing..." : "Enroll Now"}
            </Button>
          )}
          {!course.active && (
            <p className="text-sm text-muted-foreground text-center">
              This course is currently not accepting new enrollments.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function CourseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { contract, isReady, selectedAccount, connectWallet, getSigner } =
    useContract();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [teacherName, setTeacherName] = useState<SS58String | null>(null);
  const [courseMetadata, setCourseMetadata] = useState<{
    title: string;
    description: string;
    image: string;
    materials: Array<{ name: string; hash: string; size: string }>;
  } | null>(null);

  // Memoize the course ID to prevent unnecessary re-renders
  const courseId = useMemo(() => {
    const parsedId = Number(id);
    return isNaN(parsedId) ? null : parsedId;
  }, [id]);

  // Fetch course details
  const fetchCourseDetails = useCallback(async () => {
    if (!isReady || !contract || !selectedAccount || courseId === null) {
      setLoading(false);
      setError("Invalid course ID or contract not ready");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get course details from the contract
      const courseResult = (await contract.query("get_course", {
        data: { course_id: courseId },
        origin: selectedAccount.address,
      })) as ContractResult<Course | undefined>;

      if (!courseResult.success || !courseResult.value?.response) {
        setError("Course not found");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Course not found",
        });
        router.push("/courses");
        return;
      }

      setCourse(courseResult.value.response);
      console.log(courseResult.value.response);
      setTeacherName(courseResult.value.response.teacher);

      // Check if the user is enrolled
      const enrolledResult = (await contract.query("verify_enrollment", {
        data: {
          student: selectedAccount.address,
          course_id: courseId,
        },
        origin: selectedAccount.address,
      })) as ContractResult<boolean>;

      if (enrolledResult.success) {
        setIsEnrolled(!!enrolledResult.value?.response);
      }
    } catch (error) {
      console.error("Failed to fetch course details:", error);
      setError("Failed to load course details");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load course details",
      });
    } finally {
      setLoading(false);
    }
  }, [contract, courseId, isReady, selectedAccount, router, toast]);

  const fetchCourseMetadata = useCallback(async () => {
    if (!course?.metadata_hash) {
      console.warn("No metadata hash available");
      return;
    }

    try {
      const metadataUrl = `https://ipfs.io/ipfs/${course.metadata_hash}/metadata.json`;
      console.log("Fetching metadata from:", metadataUrl);

      const response = await fetch(metadataUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const metadata = await response.json();
      if (!metadata || typeof metadata !== "object") {
        throw new Error("Invalid metadata format");
      }

      setCourseMetadata({
        title: metadata.title || "",
        description: metadata.description || "",
        image: metadata.image || "",
        materials: Array.isArray(metadata.materials) ? metadata.materials : [],
      });
    } catch (error) {
      console.error("Failed to fetch course metadata:", error);
      setCourseMetadata({
        title: "",
        description: "",
        image: "",
        materials: [],
      });
    }
  }, [course?.metadata_hash]);

  // Handle enrollment
  const handleEnroll = useCallback(async () => {
    if (!selectedAccount) {
      await connectWallet();
      return;
    }

    if (!course || !contract) return;

    setEnrolling(true);
    try {
      // Call the contract to enroll in the course
      const signer = await getSigner();
      if (!signer) {
        throw new Error("Failed to get signer");
      }

      contract
        .send("enroll", {
          data: { course_id: courseId! },
          value: course.price,
          origin: selectedAccount.address,
        })
        .signSubmitAndWatch(signer)
        .subscribe({
          next(value) {
            if (value.type === "finalized") {
              setIsEnrolled(true);
              toast({
                title: "Success!",
                description: "You have successfully enrolled in the course.",
              });
              router.push(`/dashboard`);
            }
          },
          error(err) {
            console.error("Failed to enroll in course:", err);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to enroll in course. Please try again.",
            });
            setEnrolling(false);
          },
        });
    } catch (error: any) {
      console.error("Failed to enroll:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to enroll in the course",
      });
      setEnrolling(false);
    }
  }, [
    selectedAccount,
    connectWallet,
    course,
    contract,
    courseId,
    getSigner,
    toast,
    router,
  ]);

  // Initial data fetching
  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  // Fetch metadata when course data is available
  useEffect(() => {
    fetchCourseMetadata();
  }, [fetchCourseMetadata]);

  // Loading state
  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-2/3 mb-8" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="container py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p>{getIpfsUrl(courseMetadata?.image)}</p>
          <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            {error ||
              "The course you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => router.push("/courses")}>
            Browse Courses
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
      <div className="flex items-center gap-2 mb-6">
        <Badge variant={course.active ? "default" : "secondary"}>
          {course.active ? "Active" : "Inactive"}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Created by {teacherName}
        </span>
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="aspect-video bg-muted relative rounded-lg overflow-hidden">
            {courseMetadata?.image ? (
              <img
                src={getIpfsUrl(courseMetadata.image)}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-xl font-medium text-primary/70">
                  Course Preview
                </span>
              </div>
            )}
          </div>
          <div className="prose dark:prose-invert max-w-none mt-6">
            <h2>About This Course</h2>
            <p>{course.description}</p>
            <CourseMaterials materials={courseMetadata?.materials ?? []} />
          </div>
        </div>
        <CourseDetailsSidebar
          course={course}
          isEnrolled={isEnrolled}
          enrolling={enrolling}
          handleEnroll={handleEnroll}
        />
      </div>
    </div>
  );
}
