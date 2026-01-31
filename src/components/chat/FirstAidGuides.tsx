import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, HeartPulse, Droplets, Flame, Wind, Sun, Info } from "lucide-react";
import { FIRST_AID_DATA } from "@/lib/first-aid-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FirstAidGuidesProps {
  language: string;
}

const IconMap: Record<string, any> = {
  HeartPulse,
  Droplets,
  Flame,
  Wind,
  Sun
};

export function FirstAidGuides({ language }: FirstAidGuidesProps) {
  const guides = FIRST_AID_DATA[language] || FIRST_AID_DATA['en'];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors border-dashed"
          title="Quick Aid Guides"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-md">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Info className="h-5 w-5 text-primary" />
            Quick Aid Guides
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Follow these steps while waiting for emergency responders. 
          </p>
        </DialogHeader>
        
        <Tabs defaultValue={guides[0]?.id} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-2 border-b bg-muted/20">
            <TabsList className="w-full justify-start overflow-x-auto bg-transparent h-auto p-0 gap-2 no-scrollbar">
              {guides.map((guide) => (
                <TabsTrigger
                  key={guide.id}
                  value={guide.id}
                  className="px-4 py-2 rounded-full border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  {guide.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            {guides.map((guide) => {
              const Icon = IconMap[guide.icon] || Info;
              return (
                <TabsContent key={guide.id} value={guide.id} className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{guide.title}</h3>
                      <p className="text-xs text-primary/70 font-medium">Critical Emergency Steps</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {guide.steps.map((step, index) => (
                      <div key={index} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold border-2 border-background shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {index + 1}
                          </div>
                          {index !== guide.steps.length - 1 && (
                            <div className="flex-1 w-0.5 bg-muted mt-1" />
                          )}
                        </div>
                        <div className="pb-6">
                          <h4 className="font-bold text-sm mb-1">{step.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              );
            })}
          </ScrollArea>
        </Tabs>
        
        <div className="p-4 bg-muted/30 border-t">
          <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-bold">
            Always prioritize safety. Do not attempt if unsafe.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
