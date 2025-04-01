import React from "react";
import { X } from "lucide-react";
import { Tag, TagColor } from "@/types/note";

interface NoteTagProps {
  tag: Tag;
  onRemove?: () => void;
  clickable?: boolean;
  onClick?: () => void;
}

const colorClasses: Record<TagColor, string> = {
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  pink: "bg-pink-100 text-pink-800",
  orange: "bg-orange-100 text-orange-800",
};

const NoteTag: React.FC<NoteTagProps> = ({
  tag,
  onRemove,
  clickable = false,
  onClick,
}) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colorClasses[tag.color]
      } ${clickable ? "cursor-pointer hover:opacity-80" : ""}`}
      onClick={onClick}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 inline-flex items-center justify-center"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};

export default NoteTag;
