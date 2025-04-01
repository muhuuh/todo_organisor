import React, { useState } from "react";
import { Note, Tag } from "@/types/note";
import TagSelector from "./TagSelector";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface NoteEditorProps {
  existingTags: Tag[];
  onSaveNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  existingTags,
  onSaveNote,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title is required",
        description: "Please enter a title for your note",
        variant: "destructive",
      });
      return;
    }

    onSaveNote({
      title: title.trim(),
      content: content.trim(),
      tags: selectedTags,
    });

    // Reset form
    setTitle("");
    setContent("");
    setSelectedTags([]);

    toast({
      title: "Note saved",
      description: "Your note has been successfully saved",
    });
  };

  return (
    <Card className="w-full mb-8 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Create New Note</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-medium text-lg"
          />
        </div>
        <div>
          <Textarea
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-y"
          />
        </div>
        <div>
          <TagSelector
            existingTags={existingTags}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-0">
        <Button onClick={handleSave}>Save Note</Button>
      </CardFooter>
    </Card>
  );
};

export default NoteEditor;
