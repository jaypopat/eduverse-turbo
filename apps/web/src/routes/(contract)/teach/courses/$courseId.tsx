import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(contract)/teach/courses/$courseId")({
  component: CourseDetailsPage,
});

import { useEffect, useState } from "react";
import { useContract } from "@/providers/ContractProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, Users, Edit } from "lucide-react";
// import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
// import Link from "next/link";
import type { Course } from "@/types";
import { type ContractResult } from "contract-instance";
import type { SS58String } from "polkadot-api";
import { convertPrice } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export default function CourseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { contract, isReady, selectedAccount, getSigner } = useContract();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!isReady || !contract || !selectedAccount) {
        setLoading(false);
        return;
      }

      try {
        // Get course details from the contract using string-based query
        const courseId = Number(id);
        const courseResult = (await contract.query("get_course", {
          data: { course_id: courseId },
          origin: selectedAccount.address,
        })) as ContractResult<Course>;

        if (!courseResult.success || !courseResult.value?.response) {
          setLoading(false);
          return; // Course not found
        }

        setCourse(courseResult.value.response);

        // Check if the current user is the teacher of this course
        if (
          selectedAccount &&
          courseResult.value.response.teacher === selectedAccount.address
        ) {
          // Fetch students enrolled in this course
          setLoadingStudents(true);
          const studentsResult = (await contract.query("get_course_students", {
            data: { course_id: courseId },
            origin: selectedAccount.address,
          })) as ContractResult<SS58String[]>;

          if (studentsResult.success && studentsResult.value?.response) {
            setStudents(studentsResult.value.response);
          } else {
            console.error("Error fetching students:", studentsResult.error);
            setStudents([]);
          }
          setLoadingStudents(false);
        }
      } catch (error) {
        console.error("Failed to fetch course details:", error);
        toast({
          title: "Error",
          description: "Failed to fetch course details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [contract, id, isReady, selectedAccount, toast]);

  const handleCompleteCourse = async (studentAddress: string) => {
    if (!contract || !selectedAccount || !course) return;

    try {
      // Use string-based approach for sending transactions
      const tx = await contract
        .send("complete_course", {
          data: {
            course_id: course.id,
            student: studentAddress,
          },
          origin: selectedAccount.address,
        })
        .signAndSubmit(await getSigner());

      toast({
        title: "Course Completed",
        description:
          "The student has been marked as completed and a certificate has been issued.",
      });

      // Refresh the page to show updated status
      router.refresh();
    } catch (error) {
      console.error("Failed to complete course for student:", error);
      toast({
        title: "Error",
        description:
          "Failed to complete course for this student. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  if (!course) {
    return (
      <div className="container py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push("/teach/dashboard")}>
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  const isTeacher =
    selectedAccount && course.teacher === selectedAccount.address;

  return (
    <div className="container py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <div className="flex items-center gap-2">
                <Badge variant={course.active ? "default" : "secondary"}>
                  {course.active ? "Active" : "Inactive"}
                </Badge>
                {isTeacher && (
                  <Badge variant="outline">You are the teacher</Badge>
                )}
              </div>
            </div>
            {isTeacher && (
              <Button variant="outline" asChild>
                <Link to={`/teach/courses/${course.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Course
                </Link>
              </Button>
            )}
          </div>
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Course Description</h2>
              <p className="text-muted-foreground">{course.description}</p>
            </CardContent>
          </Card>

          {isTeacher && (
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStudents ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : students.length === 0 ? (
                  <p className="text-muted-foreground">
                    No students enrolled yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {students.map((student, index) => (
                      <div
                        key={student}
                        className="flex justify-between items-center p-3 border rounded-md"
                      >
                        <div>
                          <p className="font-medium">{`Student ${index + 1}`}</p>
                          <p className="text-sm text-muted-foreground">
                            {student}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCompleteCourse(student)}
                        >
                          Mark Complete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
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
                    {course.enrolled_count}/{course.max_students} students
                    enrolled
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span>Certificate included</span>
                </div>
              </div>
              {isTeacher ? (
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/teach/dashboard">Back to Dashboard</Link>
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => router.push(`/courses/${course.id}`)}
                >
                  View Public Page
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
