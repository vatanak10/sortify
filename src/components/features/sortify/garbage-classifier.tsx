
"use client";

import type { ChangeEvent } from 'react';
import { useState, useEffect } from 'react';
import * as React from 'react'; // Added React import
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { classifyGarbage, type ClassifyGarbageOutput } from '@/ai/flows/classify-garbage';
import { Loader2, UploadCloud, Recycle, Trash2, HelpCircle, AlertTriangle, Settings, CameraIcon, ImageOff } from 'lucide-react';

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

interface BinIconProps {
  icon: React.ElementType;
  label: string;
  isHighlighted: boolean;
  categorySlug: string;
}

const BinIconDisplay: React.FC<BinIconProps> = ({ icon: Icon, label, isHighlighted, categorySlug }) => (
  <div
    className={`flex flex-col items-center p-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 ${
      isHighlighted
        ? 'bg-accent text-accent-foreground shadow-xl scale-110 border-2 border-accent-foreground/50'
        : 'bg-card-foreground/5 text-foreground border border-transparent'
    }`}
    aria-label={`${label} bin ${isHighlighted ? 'selected' : ''}`}
  >
    <Icon className={`h-12 w-12 mb-2 ${isHighlighted ? 'text-accent-foreground' : 'text-primary'}`} />
    <span className={`text-sm font-medium text-center ${isHighlighted ? 'text-accent-foreground font-bold' : 'text-foreground'}`}>{label}</span>
  </div>
);


export function GarbageClassifier() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [classificationResult, setClassificationResult] = useState<ClassifyGarbageOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setClassificationResult(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size exceeds 5MB. Please choose a smaller image.");
        setSelectedFile(null);
        setPreviewUrl(null);
        event.target.value = ''; // Reset file input
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        setError("Invalid file type. Please upload a JPG, PNG, WEBP, or GIF image.");
        setSelectedFile(null);
        setPreviewUrl(null);
        event.target.value = ''; // Reset file input
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleClassify = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setClassificationResult(null);

    try {
      const photoDataUri = await readFileAsDataURL(selectedFile);
      const result = await classifyGarbage({ photoDataUri });
      setClassificationResult(result);
      toast({
        title: "Classification Successful!",
        description: `Item classified as ${result.category}.`,
      });
    } catch (err) {
      console.error("Classification error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during classification.";
      setError(`Failed to classify: ${errorMessage}`);
      toast({
        title: "Classification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categoryDetails: Record<string, { IconComp: React.ElementType, label: string }> = {
    recyclable: { IconComp: Recycle, label: "Recyclable" },
    'non-recyclable': { IconComp: Trash2, label: "Non-Recyclable" },
    other: { IconComp: HelpCircle, label: "Other" },
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-6 md:p-8 font-body">
      <header className="w-full max-w-5xl mb-8 md:mb-12 text-center">
        <h1 className="text-5xl sm:text-6xl font-headline font-bold text-primary">Sortify</h1>
        <p className="text-muted-foreground mt-2 text-lg sm:text-xl">
          Smart garbage sorting, simplified.
        </p>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className="shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-card-foreground/5">
            <CardTitle className="flex items-center gap-3 text-2xl font-headline text-primary">
              <CameraIcon className="h-7 w-7" /> Upload Garbage Image
            </CardTitle>
            <CardDescription>Select an image of a waste item for AI classification.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="garbage-image" className="text-base font-medium">Choose Image File</Label>
              <div className="flex items-center space-x-2">
             
                <Input
                  id="garbage-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="text-sm file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 h-13"
                  aria-describedby="file-constraints"
                />
              </div>
              <p id="file-constraints" className="text-xs text-muted-foreground">Max 5MB. JPG, PNG, WEBP, GIF accepted.</p>
            </div>

            <div className="aspect-[4/3] w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden border border-dashed border-border">
              {previewUrl ? (
                <Image src={previewUrl} alt="Garbage preview" width={600} height={450} className="object-contain h-full w-full" data-ai-hint="uploaded item" />
              ) : (
                <div className="text-center text-muted-foreground p-4">
                  <ImageOff className="h-16 w-16 mx-auto mb-2 text-gray-400" data-ai-hint="empty state" />
                  <p className="font-medium">Image preview will appear here</p>
                  <p className="text-xs">Upload an image to get started.</p>
                </div>
              )}
            </div>
            <Button onClick={handleClassify} disabled={isLoading || !selectedFile} className="w-full text-base py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Classifying...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-5 w-5" /> Classify Item
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-card-foreground/5">
            <CardTitle className="text-2xl font-headline text-primary">Classification Result</CardTitle>
            <CardDescription>AI-powered analysis of your item.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive text-destructive-foreground">
                <AlertTriangle className="h-5 w-5 !text-destructive" />
                <AlertTitle className="font-headline">Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!classificationResult && !isLoading && !error && (
              <div className="text-center py-10 text-muted-foreground rounded-lg bg-muted/50">
                <HelpCircle className="h-12 w-12 mx-auto mb-3 text-gray-400"/>
                <p className="font-medium">Results will be shown here once an item is classified.</p>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-10 space-y-3 text-primary">
                <Loader2 className="h-12 w-12 animate-spin" />
                <p className="font-semibold text-lg">Analyzing image...</p>
              </div>
            )}

            {classificationResult && (
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {categoryDetails[classificationResult.category]?.IconComp && (
                      React.createElement(categoryDetails[classificationResult.category].IconComp, { className: "h-7 w-7 text-primary" })
                    )}
                    <p className="text-2xl font-bold font-headline text-primary">
                      {categoryDetails[classificationResult.category]?.label || classificationResult.category}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Confidence</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={classificationResult.confidence * 100} className="w-full h-3 bg-primary/20 [&>div]:bg-primary" aria-label={`Confidence: ${Math.round(classificationResult.confidence * 100)}%`} />
                    <span className="text-sm font-semibold text-primary">{Math.round(classificationResult.confidence * 100)}%</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Reasoning</Label>
                  <p className="text-sm mt-1 p-3 bg-muted/50 rounded-md border border-border">{classificationResult.reason}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Recommended Bin</Label>
                   <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {Object.entries(categoryDetails).map(([catKey, { IconComp, label }]) => (
                      <BinIconDisplay
                        key={catKey}
                        icon={IconComp}
                        label={label}
                        isHighlighted={classificationResult.category === catKey}
                        categorySlug={catKey}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="w-full max-w-5xl mt-8 md:mt-12 pt-8 border-t border-border flex flex-col items-center">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="h-6 w-6 text-primary" />
          <Label htmlFor="calibration-mode" className="text-lg font-medium">Calibration Mode</Label>
          <Switch
            id="calibration-mode"
            checked={isCalibrating}
            onCheckedChange={setIsCalibrating}
            aria-label="Toggle calibration mode"
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
          />
        </div>
        {isCalibrating && (
          <Alert variant="default" className="w-full max-w-md bg-accent/10 border-accent text-accent-foreground shadow-md">
            <Settings className="h-5 w-5 !text-accent" />
            <AlertTitle className="font-headline text-accent">Calibration Mode Active</AlertTitle>
            <AlertDescription className="text-sm">
              Simulated calibration mode. In a real app, you could adjust camera settings here for optimal performance.
            </AlertDescription>
          </Alert>
        )}
        <p className="text-xs text-muted-foreground mt-8">&copy; {new Date().getFullYear()} Sortify. All rights reserved.</p>
      </footer>
    </div>
  );
}
