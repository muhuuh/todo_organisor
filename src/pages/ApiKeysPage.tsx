import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  KeyRound,
  Copy,
  Trash2,
  AlertTriangle,
  PencilIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Navbar } from "@/components/layout/Navbar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define the structure of an API key object
interface ApiKey {
  id: string;
  created_at: string;
  name: string | null;
  token_hint: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  const fetchApiKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("api_keys")
      .select("id, created_at, name")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching API keys:", fetchError);
      setError(`Failed to load API keys: ${fetchError.message}`);
      setApiKeys([]);
    } else if (data) {
      const formattedKeys = data.map((key) => ({
        ...key,
        token_hint: `Key created ${format(new Date(key.created_at), "PPp")}`,
      }));
      setApiKeys(formattedKeys);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  // Generate API key directly using supabase client
  const handleGenerateKey = async () => {
    setIsGenerating(true);
    setError(null);
    setCopySuccess(false);

    try {
      // Generate a random UUID for the token
      const token = self.crypto.randomUUID();

      // Insert the new API key with the user_id from the authenticated session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error("You must be logged in to generate API keys");
      }

      const userId = sessionData.session.user.id;

      const { error: insertError } = await supabase.from("api_keys").insert({
        user_id: userId,
        token: token,
        name: newKeyName.trim() || null,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setNewApiKey(token); // Save the generated token
      fetchApiKeys(); // Refresh the list of keys
      setShowGenerateDialog(false);
    } catch (err: any) {
      console.error("Error generating API key:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    setIsDeleting(keyId);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", keyId);

      if (deleteError) {
        throw deleteError;
      }
      setApiKeys((prevKeys) => prevKeys.filter((key) => key.id !== keyId));
    } catch (err: any) {
      console.error("Error deleting API key:", err);
      setError(`Failed to delete key: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const startEditing = (key: ApiKey) => {
    setIsEditing(key.id);
    setEditName(key.name || "");
  };

  const saveKeyName = async (keyId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("api_keys")
        .update({ name: editName.trim() || null })
        .eq("id", keyId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setApiKeys((keys) =>
        keys.map((key) =>
          key.id === keyId ? { ...key, name: editName.trim() || null } : key
        )
      );
    } catch (err: any) {
      console.error("Error updating API key name:", err);
      setError(`Failed to update key name: ${err.message}`);
    } finally {
      setIsEditing(null);
    }
  };

  const cancelEditing = () => {
    setIsEditing(null);
    setEditName("");
  };

  const copyToClipboard = () => {
    if (!newApiKey) return;
    navigator.clipboard.writeText(newApiKey).then(
      () => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      },
      (err) => {
        console.error("Failed to copy: ", err);
        setError("Failed to copy API key to clipboard.");
      }
    );
  };

  const handleShowGenerateDialog = () => {
    setNewKeyName("");
    setNewApiKey(null);
    setError(null);
    setShowGenerateDialog(true);
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>
                Generate and manage your API keys for external application
                access.
              </CardDescription>
            </div>
            <Button onClick={handleShowGenerateDialog} disabled={isLoading}>
              <KeyRound className="mr-2 h-4 w-4" />
              Create New API Key
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {newApiKey && (
              <Alert>
                <KeyRound className="h-4 w-4" />
                <AlertTitle>New API Key Generated!</AlertTitle>
                <AlertDescription>
                  Please copy your new API key. You won't be able to see it
                  again!
                  <div className="flex items-center space-x-2 mt-2 bg-muted p-2 rounded">
                    <input
                      type="text"
                      readOnly
                      value={newApiKey}
                      className="flex-grow p-1 bg-transparent outline-none font-mono text-sm"
                    />
                    <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-1" />{" "}
                      {copySuccess ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div>
              <h3 className="text-lg font-medium mb-2">Your API Keys</h3>
              {isLoading ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2">Loading keys...</span>
                </div>
              ) : apiKeys.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  You haven't generated any API keys yet.
                </p>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Identifier</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell>
                            {isEditing === key.id ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Enter a name"
                                  className="h-8"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => saveKeyName(key.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <CheckIcon className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={cancelEditing}
                                  className="h-6 w-6 p-0"
                                >
                                  <XIcon className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {key.name || (
                                    <span className="text-muted-foreground italic">
                                      Unnamed key
                                    </span>
                                  )}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startEditing(key)}
                                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                                >
                                  <PencilIcon className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {key.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {format(new Date(key.created_at), "PPp")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteKey(key.id)}
                              disabled={isDeleting === key.id}
                              aria-label="Delete API key"
                            >
                              {isDeleting === key.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog for generating new API key */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Give your API key a descriptive name to help you identify it
              later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">API Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Development, Production, Mobile App"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleGenerateKey}
              disabled={isGenerating}
              className="min-w-[120px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Generating...
                </>
              ) : (
                <>Generate Key</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
