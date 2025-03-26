import { useEffect, useState, useRef } from "react";
import { useContract } from "@/providers/ContractProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { SS58String } from "polkadot-api";
// import type { Course } from "@/types.ts";
import type { ContractResult } from "contract-instance";

type Course = {
  id: number;
  teacher: SS58String;
  title: string;
  description: string;
  max_students: number;
  enrolled_count: number;
  start_time: bigint;
  end_time: bigint;
  price: bigint;
  active: boolean;
  metadata_hash: string;
  created_at: bigint;
};
export default function Stats() {
  const { contract, isReady, selectedAccount } = useContract();
  const [stats, setStats] = useState({
    courses: 0,
    students: 0,
    certificates: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isReady || !contract || !selectedAccount) {
        setLoading(false);
        return;
      }

      try {
        // Get all courses to count them
        const coursesResult = (await contract.query("get_courses", {
          origin: selectedAccount.address,
        })) as ContractResult<Course[]>;

        let courses: Course[] = [];
        // Check if the result is successful before accessing the response
        if (coursesResult.success) {
          courses = coursesResult.value?.response || [];
        } else {
          console.error("Error fetching courses:", coursesResult.error);
        }

        let certificateCount = 0;
        const uniqueStudents = new Set<string>();

        // Count unique students across all courses
        for (const course of courses) {
          const studentsResult = (await contract.query("get_course_students", {
            data: { course_id: course.id },
            origin: selectedAccount.address,
          })) as ContractResult<SS58String[]>;

          if (studentsResult.success) {
            const students = studentsResult.value?.response || [];
            students.forEach((student: any) => uniqueStudents.add(student));
          } else {
            console.error(
              `Error fetching students for course ${course.id}:`,
              studentsResult.error,
            );
          }
        }

        // Get certificate count if available
        try {
          const allCertificatesResult = (await contract.query(
            "PSP34::total_supply",
            {
              origin: selectedAccount.address,
            },
          )) as ContractResult<bigint>;

          if (allCertificatesResult.success) {
            certificateCount = Number(
              allCertificatesResult.value?.response || 0,
            );
          } else {
            console.error(
              "Error fetching certificate count:",
              allCertificatesResult.error,
            );
          }
        } catch (error) {
          console.error("Failed to fetch certificate count:", error);
        }

        setStats({
          courses: courses.length,
          students: uniqueStudents.size,
          certificates: certificateCount,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [contract, isReady, selectedAccount]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-12">
      <StatCard
        title="Courses"
        value={stats.courses}
        loading={loading}
        delay={0}
      />
      <StatCard
        title="Students"
        value={stats.students}
        loading={loading}
        delay={0.1}
      />
      <StatCard
        title="Certificates Issued"
        value={stats.certificates}
        loading={loading}
        delay={0.2}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
  delay,
}: {
  title: string;
  value: number;
  loading: boolean;
  delay: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const previousValueRef = useRef<number>(0);

  // Animation duration in milliseconds
  const duration = 1500;

  useEffect(() => {
    if (loading) return;

    // Reset animation when value changes
    previousValueRef.current = displayValue;

    const startValue = previousValueRef.current;
    const endValue = value;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;

      // Calculate progress (0 to 1)
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smoother animation (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      // Calculate current value
      const currentValue = Math.floor(
        startValue + (endValue - startValue) * easedProgress,
      );
      setDisplayValue(currentValue);

      // Continue animation if not complete
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, loading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <h3 className="text-lg font-medium text-muted-foreground">{title}</h3>
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin mt-2 text-primary" />
          ) : (
            <p className="text-3xl font-bold">
              {displayValue.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
