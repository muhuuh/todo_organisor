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
import { X, Edit, Save, Trash2, Clock } from "lucide-react";
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-xl">
          {/* Header Section */}
          <div className="bg-background px-4 pt-4 pb-3 border-b sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                {isEditing ? "Edit Note" : "View Note"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full h-8 w-8 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-4 py-3 flex flex-col gap-4">
            {/* Title */}
            {isEditing ? (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Title
                </label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-base font-medium rounded-lg border-muted"
                  placeholder="Note title"
                />
              </div>
            ) : (
              <h3 className="text-lg font-semibold text-foreground break-words">
                {note.title}
              </h3>
            )}

            {/* Tags */}
            <div>
              {isEditing ? (
                <>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Tags
                  </label>
                  <TagSelector
                    existingTags={existingTags}
                    selectedTags={editedTags}
                    onTagsChange={setEditedTags}
                  />
                </>
              ) : note.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {note.tags.map((tag) => (
                    <NoteTag key={tag.id} tag={tag} />
                  ))}
                </div>
              ) : null}
            </div>

            {/* Content */}
            <div>
              {isEditing ? (
                <>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Content
                  </label>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[150px] rounded-lg text-foreground border-muted resize-none"
                    placeholder="Write your note here..."
                  />
                </>
              ) : (
                <div className="bg-muted/30 rounded-lg px-4 py-3 text-muted-foreground whitespace-pre-wrap break-words text-sm min-h-[100px]">
                  {note.content || <span className="italic">No content</span>}
                </div>
              )}
            </div>

            {/* Timestamp */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground mt-1">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1 inline" />
                <span>Created: {format(new Date(note.createdAt), "PP")}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1 inline" />
                <span>Updated: {format(new Date(note.updatedAt), "PP")}</span>
              </div>
            </div>
          </div>

          {/* Footer with Action Buttons */}
          <div className="px-4 py-3 bg-muted/20 border-t flex flex-col gap-2">
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="rounded-lg border-muted bg-background"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-lg font-medium"
                >
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1.5" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {onDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="rounded-lg font-medium"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                )}
                {onUpdate && (
                  <Button
                    onClick={handleEdit}
                    className="rounded-lg font-medium"
                    variant="default"
                  >
                    <Edit className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md p-5 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg text-foreground">
              Delete Note
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to delete "{note.title}"? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 mt-6">
            <AlertDialogCancel className="w-full m-0 rounded-lg bg-background font-medium">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full m-0 rounded-lg font-medium"
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
