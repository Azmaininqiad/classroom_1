'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, File, Download } from 'lucide-react';
import { uploadFile, deleteFile, getFileIcon, formatFileSize, type UploadedFile } from '@/lib/storage';
import { toast } from 'sonner';

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  initialFiles?: UploadedFile[];
  maxFiles?: number;
  acceptedTypes?: string;
  folder?: string;
}

export default function FileUpload({
  onFilesChange,
  initialFiles = [],
  maxFiles = 5,
  acceptedTypes = "*/*",
  folder = "general"
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFiles: FileList) => {
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }

        const uploadedFile = await uploadFile(file, folder);
        newFiles.push(uploadedFile);
        toast.success(`${file.name} uploaded successfully`);
      }

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload some files');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = async (index: number) => {
    try {
      const fileToRemove = files[index];
      
      // Extract file path from URL for deletion
      const urlParts = fileToRemove.url.split('/');
      const filePath = urlParts.slice(-2).join('/'); // Get folder/filename
      
      await deleteFile(filePath);
      
      const updatedFiles = files.filter((_, i) => i !== index);
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
      toast.success('File removed successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to remove file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className="border-2 border-dashed border-slate-600 bg-slate-800/30 hover:bg-slate-700/30 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-white font-medium mb-2">
            {uploading ? 'Uploading files...' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Maximum {maxFiles} files, up to 10MB each
          </p>
          <Button 
            type="button" 
            variant="outline" 
            disabled={uploading || files.length >= maxFiles}
            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Choose Files'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-white">Uploaded Files ({files.length})</p>
          {files.map((file, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-600">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{file.name}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span>{formatFileSize(file.size)}</span>
                      <Badge variant="outline" className="text-xs">
                        {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.url, '_blank');
                    }}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}