"use client";

import { useEffect, useState } from "react";
import { useContract } from "@/providers/ContractProvider";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";
import type { ContractResult } from "contract-instance";
import type { Course } from "@/types";
import { convertPrice } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

interface CourseGridProps {
  limit?: number;
  showViewAll?: boolean;
}

function CourseCard({ course }: { course: Course }) {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const metadataUrl = `https://ipfs.io/ipfs/${course.metadata_hash}/metadata.json`;
        const res = await fetch(metadataUrl);
        if (!res.ok) throw new Error("Failed to fetch course metadata");
        const metadata = await res.json();
        console.log("Metadata:", metadata);

        if (metadata?.image) {
          // Handle different image formats
          const imageUrl = metadata.image.startsWith("ipfs://")
            ? metadata.image.replace("ipfs://", "")
            : metadata.image.startsWith("http")
              ? metadata.image
              : metadata.image;

          console.log("Image URL:", imageUrl);
          setImage(imageUrl);
        }
      } catch (err) {
        console.error("Error fetching metadata for course", course.id, err);
      }
    };

    fetchMetadata();
  }, [course.metadata_hash, course.id]);

  return (
    <motion.div
      key={course.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow">
        <div className="aspect-video bg-muted relative overflow-hidden">
          {image ? (
            <img
              src={`https://ipfs.io/ipfs/${image}`}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-primary/70">No Preview</span>
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
            {course.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-muted-foreground line-clamp-2 mb-4">
            {course.description}
          </p>
          <div className="flex flex-col gap-2 text-sm">
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
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div className="font-bold">
            {convertPrice(course.price.toString())} AZERO
          </div>
          <Button asChild>
            {/* <Link to={`/courses/${course.id}`}>View Details</Link> */}
            <Link to="/">View Details</Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default function CourseGrid({
  limit,
  showViewAll = false,
}: CourseGridProps) {
  const { contract, isReady, selectedAccount } = useContract();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!isReady || !contract || !selectedAccount) {
        setLoading(false);
        return;
      }

      try {
        const coursesResult = (await contract.query("get_courses", {
          origin: selectedAccount.address,
        })) as ContractResult<Course[]>;

        if (coursesResult.success && coursesResult.value?.response) {
          const activeCourses = coursesResult.value.response.filter(
            (course) => course.active,
          );
          setCourses(activeCourses);
        } else {
          setCourses([]);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [contract, isReady, selectedAccount]);

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="p-0">
              <Skeleton className="h-48 rounded-none" />
            </CardHeader>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-2/3 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter className="flex justify-between p-6 pt-0">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-xl font-medium mb-2">No Courses Available</h3>
        <p className="text-muted-foreground mb-4">
          There are no active courses available at the moment.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.slice(0, limit).map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      {showViewAll && courses.length > (limit || 3) && (
        <div className="text-center mt-8">
          <Button asChild>
            <Link to="/">View All Courses</Link>
            {/* <Link to="/courses">View All Courses</Link> */}
          </Button>
        </div>
      )}
    </div>
  );
}
