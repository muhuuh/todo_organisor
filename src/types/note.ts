export type TagColor =
  | "blue"
  | "purple"
  | "green"
  | "yellow"
  | "pink"
  | "orange";

export interface Tag {
  id: string;
  name: string;
  color: TagColor;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteFormInput {
  title: string;
  content: string;
  tags: Tag[];
}
