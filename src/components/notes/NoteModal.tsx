import React, { useState } from "react";
import { Note, Tag } from "@/types/note";
import NoteTag from "./NoteTag";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagSelector from "./TagSelector";
import { X, Edit, Save, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedNote: Note) => Promise<void>;
  onDelete?: (noteId: string) => Promise<void>;
  existingTags: Tag[];
}

const NoteModal: React.FC<NoteModalProps> = ({
  note,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  existingTags = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedTags, setEditedTags] = useState<Tag[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!note) return null;

  const handleEdit = () => {
    setEditedTitle(note.title);
    setEditedContent(note.content);
    setEditedTags(note.tags);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onUpdate) return;

    setIsSaving(true);
    const updatedNote = {
      ...note,
      title: editedTitle,
      content: editedContent,
      tags: editedTags,
    };

    await onUpdate(updatedNote);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    await onDelete(note.id);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            {isEditing ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-2xl font-semibold"
                placeholder="Note title"
              />
            ) : (
              <DialogTitle className="text-2xl font-semibold">
                {note.title}
              </DialogTitle>
            )}
          </DialogHeader>

          {isEditing ? (
            <div className="mt-2">
              <TagSelector
                existingTags={existingTags}
                selectedTags={editedTags}
                onTagsChange={setEditedTags}
              />
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <NoteTag key={tag.id} tag={tag} />
              ))}
            </div>
          )}

          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[200px] mt-4"
              placeholder="Write your note here..."
            />
          ) : (
            <div className="mt-4 whitespace-pre-wrap text-muted-foreground">
              {note.content}
            </div>
          )}

          <div className="mt-6 text-sm text-muted-foreground flex justify-between items-center border-t border-gray-100 pt-3">
            <div>Created: {format(new Date(note.createdAt), "PPP")}</div>
            <div>Updated: {format(new Date(note.updatedAt), "PPP")}</div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
            {onDelete && !isEditing && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                size="sm"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}

            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                onUpdate && (
                  <Button onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Note
                  </Button>
                )
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the note "{note.title}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NoteModal;
