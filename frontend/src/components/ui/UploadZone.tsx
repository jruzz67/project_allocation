import { useDropzone } from "react-dropzone";
import { Upload, FileText } from "lucide-react";

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
      className={`glass border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer hover:border-violet-500 group ${
        isDragActive ? "border-violet-500 scale-105" : "border-slate-700"
      }`}
    >
      <input {...getInputProps()} />
      <div className="mx-auto w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition">
        <FileText className="w-8 h-8 text-violet-400" />
      </div>
      <p className="text-lg font-medium mb-1">{label}</p>
      <p className="text-slate-400 text-sm">Drag & drop PDF or click to upload</p>
    </div>
  );
}