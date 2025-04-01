import React, { useState, useEffect } from "react";
import { Note, Tag } from "@/types/note";
import { Navbar } from "@/components/layout/Navbar";
import NoteEditor from "@/components/notes/NoteEditor";
import NoteCard from "@/components/notes/NoteCard";
import NoteModal from "@/components/notes/NoteModal";
import SearchBar from "@/components/notes/SearchBar";
import { toast } from "@/hooks/use-toast";

// Mock data for demonstration purposes
const MOCK_TAGS: Tag[] = [
  { id: "1", name: "Work", color: "blue" },
  { id: "2", name: "Personal", color: "purple" },
  { id: "3", name: "Ideas", color: "green" },
  { id: "4", name: "Urgent", color: "orange" },
  { id: "5", name: "Learning", color: "yellow" },
  { id: "6", name: "Travel", color: "pink" },
];

const MOCK_NOTES: Note[] = [
  {
    id: "1",
    title: "Project Meeting Notes",
    content:
      "Discussed the timeline for the new feature. Need to follow up with the design team about the mockups. Also, we need to schedule a technical review session before proceeding with development.",
    tags: [MOCK_TAGS[0], MOCK_TAGS[3]],
    createdAt: "2023-06-15T10:30:00Z",
    updatedAt: "2023-06-15T14:45:00Z",
  },
  {
    id: "2",
    title: "Vacation Planning",
    content:
      "Research hotels in Barcelona for summer vacation. Look into flights for mid-July. Make a list of must-visit places and restaurants.",
    tags: [MOCK_TAGS[1], MOCK_TAGS[5]],
    createdAt: "2023-06-10T18:20:00Z",
    updatedAt: "2023-06-14T09:15:00Z",
  },
  {
    id: "3",
    title: "New App Idea",
    content:
      "An app that helps people track their daily water intake and reminds them to stay hydrated throughout the day. Could include features like customized goals based on weight and activity level, visual progress tracking, and integration with smart water bottles.",
    tags: [MOCK_TAGS[2]],
    createdAt: "2023-06-12T21:05:00Z",
    updatedAt: "2023-06-12T21:05:00Z",
  },
  {
    id: "4",
    title: "React Hooks Study Notes",
    content:
      "useState: Manages state in functional components\nuseEffect: Handles side effects\nuseContext: Accesses context\nuseReducer: Alternative to useState for complex state logic\nuseCallback: Memoizes functions\nuseMemo: Memoizes values\nuseRef: Persists values without re-renders",
    tags: [MOCK_TAGS[4], MOCK_TAGS[0]],
    createdAt: "2023-06-08T15:30:00Z",
    updatedAt: "2023-06-13T11:20:00Z",
  },
];

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES);
  const [tags, setTags] = useState<Tag[]>(MOCK_TAGS);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>(MOCK_NOTES);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // In a real app, this would fetch data from Supabase
  useEffect(() => {
    // Simulating data fetch
    console.log("Fetching notes and tags from database...");
    // Would normally be an API call to Supabase
  }, []);

  const handleSaveNote = (
    newNote: Omit<Note, "id" | "createdAt" | "updatedAt">
  ) => {
    // In a real app, this would save to Supabase
    const now = new Date().toISOString();
    const note: Note = {
      id: Date.now().toString(),
      ...newNote,
      createdAt: now,
      updatedAt: now,
    };

    // Update local state
    setNotes([note, ...notes]);
    setFilteredNotes([note, ...filteredNotes]);

    // Add any new tags to our tag collection
    const newTags = newNote.tags.filter(
      (tag) => !tags.some((existingTag) => existingTag.id === tag.id)
    );

    if (newTags.length > 0) {
      setTags([...tags, ...newTags]);
    }

    toast({
      title: "Note created",
      description: "Your note has been created successfully",
    });
  };

  const handleSearch = (filters: {
    term: string;
    tags: Tag[];
    dateFrom?: Date;
    dateTo?: Date;
  }) => {
    let filtered = [...notes];

    // Filter by search term
    if (filters.term) {
      const term = filters.term.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(term) ||
          note.content.toLowerCase().includes(term)
      );
    }

    // Filter by tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter((note) =>
        filters.tags.every((tag) =>
          note.tags.some((noteTag) => noteTag.id === tag.id)
        )
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (note) => new Date(note.updatedAt) >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      // Add one day to include the entire day
      const endDate = new Date(filters.dateTo);
      endDate.setDate(endDate.getDate() + 1);

      filtered = filtered.filter((note) => new Date(note.updatedAt) <= endDate);
    }

    setFilteredNotes(filtered);
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Notes</h1>

        <NoteEditor existingTags={tags} onSaveNote={handleSaveNote} />

        <SearchBar allTags={tags} onSearch={handleSearch} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <NoteCard key={note.id} note={note} onClick={handleNoteClick} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">
                No notes found. Create a new note or try a different search.
              </p>
            </div>
          )}
        </div>

        <NoteModal
          note={selectedNote}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}
