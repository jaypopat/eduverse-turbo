import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(contract)/teach/")({
  component: TeachPage,
});

import { useState, useRef } from "react";
import { useContract } from "@/providers/ContractProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Upload,
  X,
  File as FileIcon,
  Image as ImageIcon,
  Calendar,
} from "lucide-react";
// import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
// import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CHAIN_DECIMALS } from "contract-instance";
export default function TeachPage() {
  const router = useRouter();
  const { contract, selectedAccount, connectWallet, getSigner } = useContract();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [courseImage, setCourseImage] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState("");

  const [courseMaterials, setCourseMaterials] = useState<
    Array<{
      name: string;
      hash: string;
      size: string;
    }>
  >([]);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingMaterials, setIsDraggingMaterials] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const materialsInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "50",
    maxStudents: "30",
    imageHash: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (file: Blob) => {
    try {
      setUploading(true);

      // Display preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          setCourseImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      // Upload to IPFS via Pinata API route
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ipfs/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.clone().text();
        console.error("API error response:", errorText);
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setImageHash(data.cid);
        setFormData((prev) => ({
          ...prev,
          imageHash: data.cid,
        }));

        toast({
          title: "Image uploaded successfully",
        });
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast({
        title: "Failed to upload image",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle materials upload using Pinata API route
  const handleMaterialsUpload = async (files: FileList | File[]) => {
    if (files.length === 0) return;

    try {
      setUploading(true);

      // Create form data with multiple files
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      // Upload all files at once to get a single CID
      const response = await fetch("/api/ipfs/materials", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Add all files to the course materials with the same CID (folder)
        Array.from(files).forEach((file) => {
          setCourseMaterials((prev) => [
            ...prev,
            {
              name: file.name,
              hash: data.cid,
              size: formatFileSize(file.size),
            },
          ]);
        });

        toast({
          title: "Materials uploaded successfully",
          description: `${files.length} files uploaded to IPFS`,
        });
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Failed to upload materials:", error);
      toast({
        title: "Failed to upload materials",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  // Input change handlers
  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    handleImageUpload(e.target.files[0]);
  };

  const handleMaterialsInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    handleMaterialsUpload(e.target.files);
  };

  // Drag and drop handlers
  const handleImageDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(true);
  };

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleMaterialsDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingMaterials(true);
  };

  const handleMaterialsDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingMaterials(false);
  };

  const handleMaterialsDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleMaterialsDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingMaterials(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMaterialsUpload(e.dataTransfer.files);
    }
  };

  const removeMaterial = (index: number) => {
    setCourseMaterials((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const removeImage = () => {
    setCourseImage(null);
    setFormData((prev) => ({
      ...prev,
      imageHash: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount) {
      await connectWallet();
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: "Missing dates",
        description: "Please select start and end dates",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare metadata with course materials
      const metadata = {
        title: formData.title,
        description: formData.description,
        image: imageHash,
        materials: courseMaterials,
      };

      // Upload metadata to IPFS via API route
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: "application/json",
      });

      const metadataFormData = new FormData();
      metadataFormData.append(
        "files",
        new File([metadataBlob], "metadata.json", { type: "application/json" }),
      );

      const response = await fetch("/api/ipfs/materials", {
        method: "POST",
        body: metadataFormData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Metadata upload failed");
      }

      const result = contract
        .send("create_course", {
          data: {
            title: formData.title,
            start_time: BigInt(startDate.getTime()),
            price: BigInt(
              Number(formData.price) * Math.pow(10, CHAIN_DECIMALS),
            ),
            metadata_hash: data.cid,
            max_students: Number.parseInt(formData.maxStudents),
            end_time: BigInt(endDate.getTime()),
            description: formData.description,
          },
          origin: selectedAccount.address,
        })
        .signSubmitAndWatch(await getSigner())
        .subscribe({
          next: async (value) => {
            if (value.type === "finalized") {
              // Create a room for the course
              try {
                const events = value.events;
                // Find the ContractEmitted event
                const contractEvent = events.find(
                  (event) =>
                    event.type === "Contracts" &&
                    event.value.type === "ContractEmitted",
                );

                if (contractEvent) {
                  const eventData = contractEvent.value.value.data;
                  const rawBytes = eventData.asBytes?.();

                  if (rawBytes && rawBytes.length >= 4) {
                    // First 4 bytes contain the course ID in little-endian
                    const courseId =
                      rawBytes[0] |
                      (rawBytes[1] << 8) |
                      (rawBytes[2] << 16) |
                      (rawBytes[3] << 24);
                    console.log("Extracted course ID:", courseId);

                    // Create the room with the course ID
                    await fetch("/api/metaverse/room", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ roomId: courseId.toString() }),
                    });
                  }
                }
              } catch (error) {
                console.error("Failed to create metaverse room:", error);
              }

              router.push("/teach/dashboard");
              setLoading(false);
              toast({
                title: "Course created successfully",
              });
            }
          },
          error(err) {
            console.error("Failed to create course:", err);
            toast({
              title: "Failed to create course",
              description: "Please try again",
              variant: "destructive",
            });
            setLoading(false);
          },
        });
    } catch (error) {
      console.error("Failed to create course:", error);
      toast({
        title: "Failed to create course",
        description: "Please try again",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (!selectedAccount) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">
          Connect Your Wallet to Start Teaching
        </h1>
        <Button onClick={connectWallet}>Connect Wallet</Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card>
        <form onSubmit={handleCreateCourse}>
          <CardHeader>
            <CardTitle>Create a New Course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Course Title"
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
                placeholder="Describe your course"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (AZERO)</Label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate
                        ? format(startDate, "PPP")
                        : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => !startDate || date <= startDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Image Upload with Drag & Drop */}
            <div className="space-y-2">
              <Label>Course Image</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 ${
                  isDraggingImage
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25"
                }`}
                onDragEnter={handleImageDragEnter}
                onDragLeave={handleImageDragLeave}
                onDragOver={handleImageDragOver}
                onDrop={handleImageDrop}
              >
                {courseImage ? (
                  <div className="relative w-full max-w-md mx-auto">
                    <div className="aspect-video relative rounded-md overflow-hidden border">
                      <Image
                        src={courseImage}
                        alt="Course preview"
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-8 w-8 p-0 rounded-full"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                    <p className="mb-2">Drag and drop your course image here</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Select Image
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageInputChange}
                />
              </div>
            </div>

            {/* Materials Upload with Drag & Drop */}
            <div className="space-y-2">
              <Label>Course Materials</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 ${
                  isDraggingMaterials
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25"
                }`}
                onDragEnter={handleMaterialsDragEnter}
                onDragLeave={handleMaterialsDragLeave}
                onDragOver={handleMaterialsDragOver}
                onDrop={handleMaterialsDrop}
              >
                <FileIcon className="h-8 w-8 mx-auto mb-2" />
                <p className="mb-2">Drag and drop course materials here</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => materialsInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Select Files
                    </>
                  )}
                </Button>
                <input
                  ref={materialsInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleMaterialsInputChange}
                />
              </div>
            </div>

            {/* Materials List */}
            {courseMaterials.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium">
                  Uploaded Materials ({courseMaterials.length}):
                </p>
                <ul className="space-y-2">
                  {courseMaterials.map((material, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <FileIcon className="h-5 w-5 flex-shrink-0" />
                        <div className="truncate">
                          <p className="font-medium truncate">
                            {material.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {material.size}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => removeMaterial(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Course...
                </>
              ) : (
                "Create Course"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
