// src/routes/courses/index.tsx
import { useState, useEffect } from "react";
import { useContract } from "@/providers/ContractProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { type Course } from "@/types";
import { type ContractResult } from "contract-instance";
import { convertPrice } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";

// Define invalid metadata hash values.
const INVALID_HASHES = new Set([
  "null",
  "default",
  "testipsfs",
  "hash.com",
  "",
]);

// Helper function to check if a hash is valid.
const isValidIpfsHash = (hash: string) => {
  return hash && !INVALID_HASHES.has(hash) && hash.length > 0;
};

// Create the TanStack route
export const Route = createFileRoute("/(contract)/courses/")({
  component: CoursesPage,
});

function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { contract, isReady, selectedAccount } = useContract();

  useEffect(() => {
    const fetchCourses = async () => {
      if (!isReady || !contract || !selectedAccount) {
        console.log("Not ready to fetch courses:", {
          isReady,
          hasContract: !!contract,
          hasAccount: !!selectedAccount,
        });
        setIsLoading(false);
        return;
      }
      try {
        console.log("Fetching courses...");
        const coursesResult = (await contract.query("get_courses", {
          origin: selectedAccount.address,
        })) as ContractResult<Course[]>;

        console.log("Courses result:", coursesResult);
        if (coursesResult.success && coursesResult.value?.response) {
          console.log(
            "Query successful, response:",
            coursesResult.value.response,
          );
          // Filter active courses
          const activeCourses = coursesResult.value.response.filter(
            (course) => course.active,
          );
          setCourses(activeCourses);
          console.log("Active courses:", activeCourses);
        } else {
          console.error("Error fetching courses:", coursesResult.error);
          setCourses([]);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        setCourses([]);
      } finally {
        console.log("Setting loading to false");
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [contract, isReady, selectedAccount]);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      category === "all" ||
      (category === "upcoming" && Number(course.start_time) > Date.now()) ||
      (category === "ongoing" &&
        Number(course.start_time) <= Date.now() &&
        Number(course.end_time) >= Date.now()) ||
      (category === "completed" && Number(course.end_time) < Date.now());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">Explore Courses</h1>
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                className="pl-8"
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="mb-8" onValueChange={setCategory}>
          <TabsList>
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
              </Card>
            ))}
          </div>
        ) : filteredCourses && filteredCourses.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <h3 className="text-xl font-medium mb-2">No Courses Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm
                  ? "Try a different search term or filter."
                  : "There are no courses available at the moment."}
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

const CourseCard = ({ course, index }: { course: Course; index: number }) => {
  const [image, setImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      setIsLoading(true);
      setImageError(false);
      setImage(null);

      if (!course.metadata_hash || !isValidIpfsHash(course.metadata_hash)) {
        console.log("Invalid metadata hash:", course.metadata_hash);
        setIsLoading(false);
        return;
      }

      try {
        // Construct the metadata URL using the CID directly
        const metadataUrl = `https://ipfs.io/ipfs/${course.metadata_hash}/metadata.json`;
        console.log("Fetching metadata from:", metadataUrl);

        const res = await fetch(metadataUrl);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch metadata: ${res.status} ${res.statusText}`,
          );
        }

        const metadata = await res.json();
        console.log("Received metadata:", metadata);

        if (metadata?.image) {
          // If the image is a CID, construct the full IPFS URL
          const imageUrl = metadata.image.startsWith("ipfs://")
            ? `https://ipfs.io/ipfs/${metadata.image.replace("ipfs://", "")}`
            : metadata.image.startsWith("http")
              ? metadata.image
              : `https://ipfs.io/ipfs/${metadata.image}`;

          console.log("Image URL:", imageUrl);
          setImage(imageUrl);
        }
      } catch (err) {
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [course.metadata_hash, course.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-video bg-muted relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-full h-full absolute" />
              <div className="z-10 animate-pulse">Loading...</div>
            </div>
          ) : image && !imageError ? (
            <div className="relative w-full h-full">
              <img
                src={image}
                alt={course.title || "Course image"}
                className="object-cover"
                onError={() => {
                  setImageError(true);
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 text-primary/70" />
                <span className="text-primary/70 text-sm">
                  No Preview Available
                </span>
              </div>
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-1">
            {course.title || "Untitled Course"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-2 mb-4">
            {course.description || "No description available"}
          </p>
          <div className="flex justify-between items-center">
            <span className="font-bold">
              {convertPrice(course.price.toString())} AZERO
            </span>
            <Button asChild>
              {/* <a href={`/courses/${course.id}`}>View Details</a> */}
              <a href={`/courses`}>View Details</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
