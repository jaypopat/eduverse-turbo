import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/(contract)/teach/dashboard/")({
  component: TeacherDashboard,
});

import { useState, useEffect } from "react";
import { useContract } from "@/providers/ContractProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
// import Link from "next/link";
import { type Course } from "@/types";
import { type ContractResult } from "contract-instance";
import { Calendar, Edit, Plus, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherDashboard() {
  const { contract, isReady, selectedAccount, connectWallet } = useContract();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTeacherCourses = async () => {
      if (!isReady || !contract || !selectedAccount) {
        setLoading(false);
        return;
      }

      try {
        const courseIdsResult = (await contract.query("get_teacher_courses", {
          data: { teacher: selectedAccount.address },
          origin: selectedAccount.address,
        })) as ContractResult<number[]>;

        if (!courseIdsResult.success || !courseIdsResult.value?.response) {
          console.error(
            "Error fetching teacher course IDs:",
            courseIdsResult.error,
          );
          setCourses([]);
          setLoading(false);
          return;
        }

        const courseIds = courseIdsResult.value.response;

        if (courseIds.length === 0) {
          setCourses([]);
          setLoading(false);
          return;
        }

        // Fetch details for each course
        const coursesPromises = courseIds.map(async (id) => {
          try {
            const courseResult = (await contract.query("get_course", {
              data: { course_id: id },
              origin: selectedAccount.address,
            })) as ContractResult<Course>;

            if (courseResult.success && courseResult.value?.response) {
              return courseResult.value.response;
            }
            return null;
          } catch (error) {
            console.error(`Failed to fetch course ${id}:`, error);
            return null;
          }
        });

        const coursesWithDetails = (await Promise.all(coursesPromises)).filter(
          Boolean,
        ) as Course[];

        setCourses(coursesWithDetails);
      } catch (error) {
        console.error("Failed to fetch teacher courses:", error);
        toast({
          title: "Error",
          description: "Failed to fetch your courses. Please try again.",
          variant: "destructive",
        });
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherCourses();
  }, [contract, isReady, selectedAccount, toast]);

  if (!selectedAccount && !loading) {
    return (
      <div className="container py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="mb-8 text-muted-foreground max-w-md mx-auto">
            You need to connect your wallet to access your teacher dashboard and
            manage your courses.
          </p>
          <Button onClick={connectWallet}>Connect Wallet</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <Button asChild>
          <Link to="/teach">
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-2/3 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <h3 className="text-xl font-medium mb-2">No Courses Yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven't created any courses yet. Click the button above to get
              started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-muted-foreground mb-4">
                        {course.description}
                      </p>
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
                          <Users className="h-4 w-4" />
                          <span>
                            {course.enrolled_count}/{course.max_students}{" "}
                            students enrolled
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" asChild>
                        <Link to={`/teach/courses/${course.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to={`/teach/courses/${course.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
