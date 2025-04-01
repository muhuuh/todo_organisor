import React from "react";
import { Note } from "@/types/note";
import NoteTag from "./NoteTag";
import { formatDistanceToNow } from "date-fns";

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => {
  // Get a preview of the content (first ~100 characters)
  const contentPreview =
    note.content.length > 100
      ? `${note.content.substring(0, 100)}...`
      : note.content;

  // Format the date
  const formattedDate = formatDistanceToNow(new Date(note.updatedAt), {
    addSuffix: true,
  });

  return (
    <div
      className="bg-card rounded-lg border shadow-sm p-4 transition-all hover:shadow-md cursor-pointer"
      onClick={() => onClick(note)}
    >
      <h3 className="font-medium text-lg mb-1 line-clamp-1">{note.title}</h3>
      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
        {contentPreview}
      </p>

      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-1.5">
          {note.tags.slice(0, 3).map((tag) => (
            <NoteTag key={tag.id} tag={tag} />
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-muted-foreground flex items-center">
              +{note.tags.length - 3} more
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>
    </div>
  );
};

export default NoteCard;
