import React from "react";
import { Note } from "@/types/note";
import NoteTag from "./NoteTag";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface NoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ note, isOpen, onClose }) => {
  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {note.title}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <NoteTag key={tag.id} tag={tag} />
          ))}
        </div>

        <div className="mt-4 whitespace-pre-wrap text-gray-700">
          {note.content}
        </div>

        <div className="mt-6 text-sm text-gray-500 flex justify-between items-center border-t border-gray-100 pt-3">
          <div>Created: {format(new Date(note.createdAt), "PPP")}</div>
          <div>Updated: {format(new Date(note.updatedAt), "PPP")}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NoteModal;
