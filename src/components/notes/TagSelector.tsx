import React, { useState, useRef, useEffect } from "react";
import { Tag, TagColor } from "@/types/note";
import { Check, Plus } from "lucide-react";
import NoteTag from "./NoteTag";

interface TagSelectorProps {
  existingTags: Tag[];
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  existingTags,
  selectedTags,
  onTagsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState<TagColor>("blue");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const colors: TagColor[] = [
    "blue",
    "purple",
    "green",
    "yellow",
    "pink",
    "orange",
  ];

  const handleAddTag = (tag: Tag) => {
    if (!selectedTags.some((t) => t.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
    }
    setIsOpen(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((tag) => tag.id !== tagId));
  };

  const handleCreateNewTag = () => {
    if (newTagName.trim()) {
      const newTag: Tag = {
        id: Date.now().toString(),
        name: newTagName.trim(),
        color: selectedColor,
      };

      onTagsChange([...selectedTags, newTag]);
      setNewTagName("");
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const availableTags = existingTags.filter(
    (tag) => !selectedTags.some((selectedTag) => selectedTag.id === tag.id)
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <NoteTag
            key={tag.id}
            tag={tag}
            onRemove={() => handleRemoveTag(tag.id)}
          />
        ))}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Tag
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 bg-white rounded-md shadow-lg p-3 border border-gray-200">
          {availableTags.length > 0 && (
            <>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Existing Tags
              </div>
              <div className="max-h-32 overflow-y-auto mb-3">
                {availableTags.map((tag) => (
                  <div
                    key={tag.id}
                    onClick={() => handleAddTag(tag)}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                  >
                    <NoteTag tag={tag} />
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 my-2"></div>
            </>
          )}

          <div className="text-sm font-medium text-gray-700 mb-2">
            Create New Tag
          </div>
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 text-sm"
          />

          <div className="flex flex-wrap gap-2 mb-3">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full bg-tag-${color} flex items-center justify-center ${
                  selectedColor === color ? "ring-2 ring-primary" : ""
                }`}
              >
                {selectedColor === color && (
                  <Check className="h-3 w-3 text-gray-800" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleCreateNewTag}
            disabled={!newTagName.trim()}
            className="w-full bg-primary text-white rounded-md py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Tag
          </button>
        </div>
      )}
    </div>
  );
};

export default TagSelector;
