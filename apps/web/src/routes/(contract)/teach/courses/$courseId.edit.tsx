import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/(contract)/teach/courses/$courseId/edit",
)({
  component: EditCoursePage,
});

import type React from "react";

import { useEffect, useState } from "react";
import { useContract } from "@/providers/ContractProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
// import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ContractResult } from "contract-instance";
import { Course } from "@/types";

export default function EditCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const { contract, isReady, selectedAccount } = useContract();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingCourse, setFetchingCourse] = useState(true);

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    maxStudents: "",
    price: "",
    active: true,
    metadataHash: "",
  });

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!isReady || !contract || !selectedAccount) {
        setFetchingCourse(false);
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
          toast({
            title: "Course Not Found",
            description: "The course you're trying to edit doesn't exist.",
            variant: "destructive",
          });
          router.push("/teach/dashboard");
          return;
        }

        const courseDetails = courseResult.value.response;

        // Check if the current user is the teacher of this course
        if (
          selectedAccount &&
          courseDetails.teacher !== selectedAccount.address
        ) {
          toast({
            title: "Unauthorized",
            description: "You don't have permission to edit this course.",
            variant: "destructive",
          });
          router.push("/teach/dashboard");
          return;
        }

        // Set form data from course details
        setFormData({
          title: courseDetails.title,
          description: courseDetails.description,
          maxStudents: courseDetails.max_students.toString(),
          price: courseDetails.price.toString(),
          active: courseDetails.active,
          metadataHash: courseDetails.metadata_hash,
        });

        // Set dates
        setStartDate(new Date(Number(courseDetails.start_time)));
        setEndDate(new Date(Number(courseDetails.end_time)));
      } catch (error) {
        console.error("Failed to fetch course details:", error);
        toast({
          title: "Error",
          description: "Failed to fetch course details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setFetchingCourse(false);
      }
    };

    fetchCourseDetails();
  }, [contract, id, isReady, router, selectedAccount, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, active: checked }));
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contract || !isReady || !selectedAccount) {
      toast({
        title: "Not Ready",
        description: "The contract connection is not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Call the contract to update the course using string-based approach
      const tx = contract.send("update_course", {
        data: {
          course_id: Number(id),
          title: formData.title,
          description: formData.description,
          max_students: Number.parseInt(formData.maxStudents),
          price: BigInt(formData.price),
          active: formData.active,
          metadata_hash: formData.metadataHash || "",
        },
        origin: selectedAccount.address,
      });

      toast({
        title: "Course Updated",
        description: "Your course has been updated successfully.",
      });

      // Redirect to the course details page
      router.push(`/teach/courses/${id}`);
    } catch (error) {
      console.error("Failed to update course:", error);
      toast({
        title: "Update Failed",
        description:
          "There was an error updating your course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingCourse) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <h1 className="text-3xl font-bold mb-6">Edit Course</h1>
        <Card>
          <form onSubmit={handleUpdateCourse}>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>
                Update your course information below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Course Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxStudents">Maximum Students</Label>
                  <Input
                    id="maxStudents"
                    name="maxStudents"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxStudents}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (UNIT)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Course Active</Label>
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={handleSwitchChange}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  When a course is inactive, new students cannot enroll.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metadataHash">Metadata Hash (Optional)</Label>
                <Input
                  id="metadataHash"
                  name="metadataHash"
                  placeholder="IPFS hash or other metadata reference"
                  value={formData.metadataHash}
                  onChange={handleInputChange}
                />
                <p className="text-sm text-muted-foreground">
                  You can provide an IPFS hash or other reference to additional
                  course materials.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push(`/teach/courses/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !isReady}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Course...
                  </>
                ) : (
                  "Update Course"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
