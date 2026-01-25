import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Check, Loader2 } from "lucide-react";

interface FileUploaderProps {
  onComplete?: (result: { url: string; objectPath: string }) => void;
  buttonClassName?: string;
  children: ReactNode;
  allowedFileTypes?: string[];
  maxFileSize?: number;
}

export function FileUploader({
  onComplete,
  buttonClassName,
  children,
  allowedFileTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  maxFileSize = 10485760,
}: FileUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (allowedFileTypes.length > 0 && !allowedFileTypes.includes(file.type)) {
      setError(`Tipo de archivo no permitido. Tipos permitidos: ${allowedFileTypes.join(", ")}`);
      return;
    }

    if (file.size > maxFileSize) {
      setError(`Archivo demasiado grande. Máximo: ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    setError(null);
    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      const configResponse = await fetch("/api/objects/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!configResponse.ok) {
        throw new Error("Error al obtener configuración de subida");
      }

      const config = await configResponse.json();
      setProgress(30);

      let result: { url: string; objectPath: string };

      if (config.useMultipart) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch(config.uploadURL, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Error al subir archivo");
        }

        const uploadResult = await uploadResponse.json();
        result = {
          url: uploadResult.url || uploadResult.objectPath,
          objectPath: uploadResult.objectPath,
        };
      } else {
        const uploadResponse = await fetch(config.uploadURL, {
          method: "PUT",
          body: selectedFile,
        });

        if (!uploadResponse.ok) {
          throw new Error("Error al subir archivo a storage");
        }

        setProgress(70);

        const saveResponse = await fetch("/api/images/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ imageURL: config.uploadURL }),
        });

        if (!saveResponse.ok) {
          throw new Error("Error al guardar referencia");
        }

        const saveResult = await saveResponse.json();
        result = {
          url: saveResult.objectPath,
          objectPath: saveResult.objectPath,
        };
      }

      setProgress(100);
      onComplete?.(result);
      
      setTimeout(() => {
        setShowModal(false);
        resetState();
      }, 500);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir archivo");
    } finally {
      setUploading(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setPreview(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setShowModal(false);
      resetState();
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => setShowModal(true)}
        className={buttonClassName}
      >
        {children}
      </Button>

      <Dialog open={showModal} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subir archivo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedFile ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Haz clic para seleccionar un archivo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo {Math.round(maxFileSize / 1024 / 1024)}MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={allowedFileTypes.join(",")}
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {preview && (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded-lg bg-muted"
                    />
                    {!uploading && (
                      <button
                        onClick={resetState}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{selectedFile.name}</span>
                  <span className="text-muted-foreground ml-2">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>

                {uploading && (
                  <Progress value={progress} className="w-full" />
                )}

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={uploading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Subir
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
