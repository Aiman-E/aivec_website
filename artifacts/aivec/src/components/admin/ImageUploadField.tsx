import { useRef, useState } from "react";
import { useUpload } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function resolveImageUrl(value: string | null | undefined): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/objects/")) return `/api/storage${value}`;
  return value;
}

interface ImageUploadFieldProps {
  value: string | null | undefined;
  onChange: (next: string) => void;
  label?: string;
  hint?: string;
  previewClassName?: string;
  accept?: string;
}

export function ImageUploadField({
  value,
  onChange,
  label,
  hint,
  previewClassName = "w-32 h-20",
  accept = "image/*",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (res) => {
      onChange(res.objectPath);
      setLocalPreview(null);
      toast({ title: "Upload complete" });
    },
    onError: (err) => {
      setLocalPreview(null);
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    },
  });

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    await uploadFile(file);
  };

  const shownSrc = localPreview ?? resolveImageUrl(value);

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium">{label}</div>}
      <div className="flex items-start gap-3">
        <div
          className={`${previewClassName} shrink-0 bg-muted border border-border overflow-hidden flex items-center justify-center text-xs text-muted-foreground`}
        >
          {(() => {
            const isVideo = accept.startsWith("video/");
            const isImage = accept.startsWith("image/") || accept === "image/*";
            if (!shownSrc) {
              return <span>{isVideo ? "No video" : isImage ? "No image" : "No file"}</span>;
            }
            if (isVideo) {
              return <video src={shownSrc} className="w-full h-full object-contain" muted playsInline controls />;
            }
            if (isImage) {
              return <img src={shownSrc} alt="" className="w-full h-full object-contain" />;
            }
            return (
              <div className="flex flex-col items-center gap-1 px-1 text-center">
                <FileText className="w-6 h-6" />
                <span className="text-[10px] break-all line-clamp-2">
                  {(value ?? "").split("/").pop()}
                </span>
              </div>
            );
          })()}
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-1" />
              )}
              {isUploading ? `${progress}%` : "Upload"}
            </Button>
            {value && !isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange("")}
              >
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            )}
          </div>
          <Input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste a URL / object path"
            dir="ltr"
            className="text-xs font-mono"
          />
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handlePick}
      />
    </div>
  );
}
