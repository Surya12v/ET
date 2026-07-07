"use client";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ReceiptUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}-upload.${ext}`;
      const { error } = await supabase.storage.from("receipts").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      toast.error((err as Error).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-3">
        <img src={value} alt="Receipt" className="h-16 w-16 rounded-md border object-cover" />
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(null)}>
          <X className="mr-1 h-3.5 w-3.5" /> Remove
        </Button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="mr-1 h-3.5 w-3.5" />}
        Upload from device
      </Button>
    </div>
  );
}
