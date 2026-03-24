import { useDropzone } from "react-dropzone";
import { FileText, UploadCloud } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface UploadZoneProps {
  onFile: (file: File) => void;
  label: string;
}

export function UploadZone({ onFile, label }: UploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: (files) => onFile(files[0]),
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative overflow-hidden border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer group bg-muted/20",
        isDragActive 
          ? "border-primary bg-primary/5 scale-[1.02] shadow-xl shadow-primary/10" 
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <input {...getInputProps()} />
      
      <motion.div 
        animate={{ y: isDragActive ? -10 : 0 }}
        className={cn(
          "mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 shadow-sm",
          isDragActive ? "bg-primary text-primary-foreground" : "bg-background border border-border text-muted-foreground group-hover:text-primary group-hover:border-primary/30"
        )}
      >
        {isDragActive ? <FileText className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
      </motion.div>
      
      <h3 className={cn(
        "text-lg font-bold mb-2 transition-colors",
        isDragActive ? "text-primary" : "text-foreground"
      )}>
        {label}
      </h3>
      <p className="text-muted-foreground text-sm font-medium">
        {isDragActive ? "Drop the PDF right here..." : "Drag & drop PDF or click to browse"}
      </p>
    </div>
  );
}