import React, { useState, useEffect } from "react";
import { Note, Tag } from "@/types/note";
import { Navbar } from "@/components/layout/Navbar";
import NoteEditor from "@/components/notes/NoteEditor";
import NoteCard from "@/components/notes/NoteCard";
import NoteModal from "@/components/notes/NoteModal";
import SearchBar from "@/components/notes/SearchBar";
import { toast } from "@/hooks/use-toast";
import { supabase, handleSupabaseError } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

// Initial empty state
const INITIAL_TAGS: Tag[] = [];

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>(INITIAL_TAGS);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch notes from Supabase
  const fetchNotes = async (currentUserId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", currentUserId)
        .order("updated_at", { ascending: false });

      if (handleSupabaseError(error)) {
        setIsLoading(false);
        return;
      }

      if (data) {
        // Transform Supabase data to our Note format
        const formattedNotes: Note[] = data.map((note) => ({
          id: note.id,
          title: note.notes_title,
          content: note.notes_text,
          tags: note.tags ? parseTagsFromDb(note.tags) : [],
          createdAt: note.created_at,
          updatedAt: note.updated_at,
        }));

        setNotes(formattedNotes);
        setFilteredNotes(formattedNotes);

        // Extract all unique tags from notes
        const allTags = extractTagsFromNotes(formattedNotes);
        setTags(allTags);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Parse tags from database (converting string array to Tag objects)
  const parseTagsFromDb = (tagsArray: string[]): Tag[] => {
    return tagsArray.map((tagStr) => {
      try {
        // Attempt to parse if it's a JSON string
        const parsedTag = JSON.parse(tagStr);
        return {
          id: parsedTag.id || tagStr,
          name: parsedTag.name || tagStr,
          color: parsedTag.color || "blue",
        };
      } catch (e) {
        // If parsing fails, use the string as both id and name
        return {
          id: tagStr,
          name: tagStr,
          color: "blue",
        };
      }
    });
  };

  // Extract all unique tags from a list of notes
  const extractTagsFromNotes = (notesList: Note[]): Tag[] => {
    const tagMap = new Map<string, Tag>();

    notesList.forEach((note) => {
      note.tags.forEach((tag) => {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, tag);
        }
      });
    });

    return Array.from(tagMap.values());
  };

  // Check for authentication and fetch notes on component mount
  useEffect(() => {
    const checkAuthAndFetchNotes = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setUserId(data.session.user.id);
        fetchNotes(data.session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchNotes();

    // Set up listener for auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user.id || null;
      setUserId(newUserId);

      if (newUserId) {
        fetchNotes(newUserId);
      } else {
        setNotes([]);
        setFilteredNotes([]);
        setIsLoading(false);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Save note to Supabase
  const handleSaveNote = async (
    newNote: Omit<Note, "id" | "createdAt" | "updatedAt">
  ) => {
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to save notes",
        variant: "destructive",
      });
      return;
    }

    // Prepare tags for storage (convert Tag objects to strings for Supabase)
    const tagsForDb = newNote.tags.map((tag) => JSON.stringify(tag));

    // Create the record to insert
    const noteRecord = {
      user_id: userId,
      notes_title: newNote.title,
      notes_text: newNote.content,
      tags: tagsForDb,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from("notes")
        .insert(noteRecord)
        .select()
        .single();

      if (handleSupabaseError(error)) return;

      if (data) {
        // Format the returned data to our Note format
        const savedNote: Note = {
          id: data.id,
          title: data.notes_title,
          content: data.notes_text,
          tags: parseTagsFromDb(data.tags || []),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        // Update local state
        setNotes([savedNote, ...notes]);
        setFilteredNotes([savedNote, ...filteredNotes]);

        // Add any new tags to our tag collection
        const newTags = savedNote.tags.filter(
          (tag) => !tags.some((existingTag) => existingTag.id === tag.id)
        );

        if (newTags.length > 0) {
          setTags([...tags, ...newTags]);
        }

        toast({
          title: "Note created",
          description: "Your note has been saved successfully",
        });
      }
    } catch (err) {
      console.error("Error saving note:", err);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    }
  };

  // Update existing note in Supabase
  const handleUpdateNote = async (updatedNote: Note) => {
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to update notes",
        variant: "destructive",
      });
      return;
    }

    // Prepare tags for storage
    const tagsForDb = updatedNote.tags.map((tag) => JSON.stringify(tag));

    // Create the record to update
    const noteRecord = {
      notes_title: updatedNote.title,
      notes_text: updatedNote.content,
      tags: tagsForDb,
      updated_at: new Date().toISOString(), // Explicitly set the updated_at timestamp
    };

    try {
      // Update in Supabase
      const { data, error } = await supabase
        .from("notes")
        .update(noteRecord)
        .eq("id", updatedNote.id)
        .eq("user_id", userId) // Security check
        .select()
        .single();

      if (handleSupabaseError(error)) return;

      if (data) {
        // Format the returned data to our Note format
        const savedNote: Note = {
          id: data.id,
          title: data.notes_title,
          content: data.notes_text,
          tags: parseTagsFromDb(data.tags || []),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        // Update local state
        const updatedNotes = notes.map((note) =>
          note.id === savedNote.id ? savedNote : note
        );
        setNotes(updatedNotes);

        const updatedFilteredNotes = filteredNotes.map((note) =>
          note.id === savedNote.id ? savedNote : note
        );
        setFilteredNotes(updatedFilteredNotes);

        // Update selected note
        setSelectedNote(savedNote);

        // Add any new tags to our tag collection
        const newTags = savedNote.tags.filter(
          (tag) => !tags.some((existingTag) => existingTag.id === tag.id)
        );

        if (newTags.length > 0) {
          setTags([...tags, ...newTags]);
        }

        toast({
          title: "Note updated",
          description: "Your note has been updated successfully",
        });
      }
    } catch (err) {
      console.error("Error updating note:", err);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  // Delete note from Supabase
  const handleDeleteNote = async (noteId: string) => {
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to delete notes",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", userId); // Security check

      if (handleSupabaseError(error)) return;

      // Update local state
      const updatedNotes = notes.filter((note) => note.id !== noteId);
      setNotes(updatedNotes);

      const updatedFilteredNotes = filteredNotes.filter(
        (note) => note.id !== noteId
      );
      setFilteredNotes(updatedFilteredNotes);

      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting note:", err);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-6 flex justify-center items-center h-[80vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading notes...</p>
          </div>
        </div>
      </div>
    );
  }

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
          onUpdate={handleUpdateNote}
          onDelete={handleDeleteNote}
          existingTags={tags}
        />
      </div>
    </div>
  );
}
