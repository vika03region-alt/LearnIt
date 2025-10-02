import { useState } from "react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Video, Image as ImageIcon, Trash2 } from "lucide-react";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface TelegramMediaUploaderProps {
  onVideoUploaded?: (url: string) => void;
  onCoverUploaded?: (url: string) => void;
}

export function TelegramMediaUploader({
  onVideoUploaded,
  onCoverUploaded,
}: TelegramMediaUploaderProps) {
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload", {});
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload URL:", error);
      toast({
        title: "Upload Error",
        description: "Failed to get upload URL",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleVideoComplete = async (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => {
    setIsVideoUploading(true);
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadURL = result.successful[0].uploadURL;
        
        const response = await apiRequest("PUT", "/api/telegram/media", {
          mediaURL: uploadURL,
        });
        const data = await response.json();
        
        setVideoUrl(data.objectPath);
        onVideoUploaded?.(data.objectPath);
        
        toast({
          title: "Video Uploaded",
          description: "Video has been successfully uploaded",
        });
      }
    } catch (error) {
      console.error("Error setting video ACL:", error);
      toast({
        title: "Upload Error",
        description: "Failed to process video upload",
        variant: "destructive",
      });
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleCoverComplete = async (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => {
    setIsCoverUploading(true);
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadURL = result.successful[0].uploadURL;
        
        const response = await apiRequest("PUT", "/api/telegram/media", {
          mediaURL: uploadURL,
        });
        const data = await response.json();
        
        setCoverUrl(data.objectPath);
        onCoverUploaded?.(data.objectPath);
        
        toast({
          title: "Cover Uploaded",
          description: "Cover image has been successfully uploaded",
        });
      }
    } catch (error) {
      console.error("Error setting cover ACL:", error);
      toast({
        title: "Upload Error",
        description: "Failed to process cover upload",
        variant: "destructive",
      });
    } finally {
      setIsCoverUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-600" />
          Telegram Media Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="video-upload">Video File</Label>
          <div className="flex items-center gap-3">
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={524288000}
              allowedFileTypes={["video/*"]}
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleVideoComplete}
              buttonClassName="w-full"
            >
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span>{videoUrl ? "Change Video" : "Upload Video"}</span>
              </div>
            </ObjectUploader>
            {videoUrl && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setVideoUrl("");
                  onVideoUploaded?.("");
                }}
                data-testid="button-remove-video"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
          {isVideoUploading && (
            <p className="text-sm text-muted-foreground">Processing video...</p>
          )}
          {videoUrl && !isVideoUploading && (
            <p className="text-sm text-green-600">✓ Video uploaded successfully</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover-upload">Cover Image (Optional)</Label>
          <div className="flex items-center gap-3">
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={10485760}
              allowedFileTypes={["image/*"]}
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleCoverComplete}
              buttonClassName="w-full"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>{coverUrl ? "Change Cover" : "Upload Cover"}</span>
              </div>
            </ObjectUploader>
            {coverUrl && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setCoverUrl("");
                  onCoverUploaded?.("");
                }}
                data-testid="button-remove-cover"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
          {isCoverUploading && (
            <p className="text-sm text-muted-foreground">Processing cover...</p>
          )}
          {coverUrl && !isCoverUploading && (
            <p className="text-sm text-green-600">✓ Cover uploaded successfully</p>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Tip:</strong> Videos up to 500MB are supported. Cover images help make your Telegram posts more engaging.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
