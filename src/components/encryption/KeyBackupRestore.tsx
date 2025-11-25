/**
 * Component for backing up and restoring E2EE keys
 *
 * Shows when user is on a new device and has encrypted messages they can't read.
 * Allows them to either:
 * 1. Import their key backup from another device
 * 2. Generate new keys (losing access to old messages)
 *
 * Security: Backups are encrypted with PBKDF2 + AES-GCM using a user passphrase
 * Following Signal's approach for key backup encryption
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Download, Upload, Key, AlertTriangle, X, Lock, Eye, EyeOff } from "lucide-react";
import { exportKeysAsBackup, importKeysFromBackup, storeKeys } from "@/lib/keyStorage";
import { generateKeyPair } from "@/lib/encryption";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface KeyBackupRestoreProps {
  clerkId: string;
  hasLocalKeys: boolean;
  serverHasKey: boolean;
  onKeysRestored?: () => void;
  onClose?: () => void;
  variant?: "full" | "compact" | "banner";
}

export function KeyBackupRestore({
  clerkId,
  hasLocalKeys,
  serverHasKey,
  onKeysRestored,
  onClose,
  variant = "full",
}: KeyBackupRestoreProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showImportSection, setShowImportSection] = useState(false);
  const [showPassphraseInput, setShowPassphraseInput] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [needsPassphraseForImport, setNeedsPassphraseForImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePublicKey = useMutation(api.encryption.updatePublicKey);

  // Export keys as encrypted JSON file
  const handleExport = async () => {
    // Show passphrase input first
    if (!showPassphraseInput) {
      setShowPassphraseInput(true);
      setNeedsPassphraseForImport(false);
      return;
    }

    // Validate passphrase
    if (passphrase.length < 6) {
      toast.error("Passphrase must be at least 6 characters");
      return;
    }

    if (passphrase !== confirmPassphrase) {
      toast.error("Passphrases do not match");
      return;
    }

    setIsExporting(true);
    try {
      const backup = await exportKeysAsBackup(clerkId, passphrase);
      if (!backup) {
        toast.error("No keys to export");
        return;
      }

      // Create and download file
      const blob = new Blob([backup], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dateapp-encryption-keys-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Encrypted backup created! Keep this file and passphrase safe.");
      setShowPassphraseInput(false);
      setPassphrase("");
      setConfirmPassphrase("");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export keys");
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file selection - check if passphrase is needed
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const backup = JSON.parse(content);

      // Check if this is an encrypted backup (v2)
      if (backup.version === 2 && backup.encrypted) {
        setPendingFile(file);
        setNeedsPassphraseForImport(true);
        setShowPassphraseInput(true);
        setPassphrase("");
      } else {
        // Legacy unencrypted backup - import directly
        await performImport(file);
      }
    } catch {
      toast.error("Invalid backup file");
    }
  };

  // Perform the actual import
  const performImport = async (file: File, pass?: string) => {
    setIsImporting(true);
    try {
      const content = await file.text();
      const result = await importKeysFromBackup(clerkId, content, pass);

      if (result) {
        // Update public key on server if needed
        await updatePublicKey({ publicKey: result.publicKey });
        toast.success("Keys restored successfully! You can now read your messages.");
        resetState();
        onKeysRestored?.();
      }
    } catch (error) {
      console.error("Import failed:", error);
      const message = error instanceof Error ? error.message : "Failed to import keys";
      toast.error(message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle import with passphrase
  const handleImportWithPassphrase = async () => {
    if (!pendingFile) return;

    if (!passphrase) {
      toast.error("Please enter the passphrase");
      return;
    }

    await performImport(pendingFile, passphrase);
  };

  const resetState = () => {
    setShowPassphraseInput(false);
    setPassphrase("");
    setConfirmPassphrase("");
    setPendingFile(null);
    setNeedsPassphraseForImport(false);
  };

  // Generate new keys (user will lose access to old messages)
  const handleGenerateNew = async () => {
    if (!confirm(
      "⚠️ This will create new encryption keys.\n\n" +
      "You will NOT be able to read any previously encrypted messages.\n\n" +
      "Only do this if you've lost your backup and can't recover it."
    )) {
      return;
    }

    setIsGenerating(true);
    try {
      const newKeyPair = await generateKeyPair();
      await storeKeys(clerkId, newKeyPair.publicKey, newKeyPair.privateKey);
      await updatePublicKey({ publicKey: newKeyPair.publicKey });

      toast.success("New keys generated. Old messages cannot be decrypted.");
      onKeysRestored?.();
    } catch (error) {
      console.error("Key generation failed:", error);
      toast.error("Failed to generate new keys");
    } finally {
      setIsGenerating(false);
    }
  };

  // Hidden file input for import
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".json"
      onChange={handleFileSelect}
      className="hidden"
    />
  );

  // Passphrase input component
  const PassphraseInput = ({ isCompact = false }: { isCompact?: boolean }) => (
    <div className={`space-y-3 ${isCompact ? '' : 'p-4 bg-muted/30 rounded-lg border border-border'}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Lock className="h-4 w-4" />
        {needsPassphraseForImport ? "Enter backup passphrase" : "Create a passphrase"}
      </div>
      <div className="relative">
        <Input
          type={showPassphrase ? "text" : "password"}
          placeholder="Enter passphrase (min 6 characters)"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassphrase(!showPassphrase)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {!needsPassphraseForImport && (
        <Input
          type={showPassphrase ? "text" : "password"}
          placeholder="Confirm passphrase"
          value={confirmPassphrase}
          onChange={(e) => setConfirmPassphrase(e.target.value)}
        />
      )}
      <div className="flex gap-2">
        {needsPassphraseForImport ? (
          <Button
            onClick={handleImportWithPassphrase}
            disabled={isImporting || !passphrase}
            className="flex-1 gap-2"
            size={isCompact ? "sm" : "default"}
          >
            <Upload className="h-4 w-4" />
            {isImporting ? "Decrypting..." : "Decrypt & Import"}
          </Button>
        ) : (
          <Button
            onClick={handleExport}
            disabled={isExporting || passphrase.length < 6}
            className="flex-1 gap-2"
            size={isCompact ? "sm" : "default"}
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Encrypting..." : "Create Backup"}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={resetState}
          size={isCompact ? "sm" : "default"}
        >
          Cancel
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {needsPassphraseForImport
          ? "Enter the passphrase you used when creating this backup."
          : "Your backup will be encrypted. Remember this passphrase - you'll need it to restore."}
      </p>
    </div>
  );

  // Banner variant - shows at top of chat when keys are missing
  if (variant === "banner") {
    if (showPassphraseInput) {
      return (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mx-4 my-2">
          {fileInput}
          <PassphraseInput isCompact />
        </div>
      );
    }

    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mx-4 my-2">
        {fileInput}
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              New device detected
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
              Import your encryption keys to read previous messages.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="gap-1.5 text-xs h-8 border-amber-500/30 hover:bg-amber-500/10"
              >
                <Upload className="h-3.5 w-3.5" />
                {isImporting ? "Importing..." : "Import Backup"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleGenerateNew}
                disabled={isGenerating}
                className="gap-1.5 text-xs h-8 text-muted-foreground"
              >
                <Key className="h-3.5 w-3.5" />
                {isGenerating ? "Generating..." : "New Keys"}
              </Button>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-amber-500/60 hover:text-amber-500">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Compact variant - for profile page settings
  if (variant === "compact") {
    if (showPassphraseInput) {
      return (
        <div className="space-y-3">
          {fileInput}
          <PassphraseInput isCompact />
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {fileInput}
        <div className="flex flex-wrap gap-2">
          {hasLocalKeys && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Backup Keys"}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? "Importing..." : "Restore Keys"}
          </Button>
        </div>
        {!hasLocalKeys && serverHasKey && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ You have encrypted messages but no keys on this device.
          </p>
        )}
      </div>
    );
  }

  // Full variant - modal or dedicated section
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-6 space-y-6 max-w-md mx-auto">
      {fileInput}

      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 text-amber-500">
          <Key className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold">Encryption Keys</h3>
        <p className="text-sm text-muted-foreground">
          {!hasLocalKeys && serverHasKey
            ? "Import your key backup to read encrypted messages on this device."
            : "Backup your encryption keys to access messages on other devices."}
        </p>
      </div>

      {/* Passphrase input overlay */}
      {showPassphraseInput && <PassphraseInput />}

      {/* Export section - only show if user has keys and not showing passphrase input */}
      {hasLocalKeys && !showPassphraseInput && (
        <div className="space-y-3">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Download Key Backup"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Your backup will be encrypted with a passphrase for security.
          </p>
        </div>
      )}

      {/* Import section */}
      {(!hasLocalKeys || showImportSection) && !showPassphraseInput && (
        <div className="space-y-3 pt-4 border-t border-border">
          <p className="text-sm font-medium">
            {hasLocalKeys ? "Or restore from backup:" : "Have a backup?"}
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full gap-2"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? "Importing..." : "Import Key Backup"}
          </Button>
        </div>
      )}

      {/* Show import toggle for users who have keys */}
      {hasLocalKeys && !showImportSection && !showPassphraseInput && (
        <button
          onClick={() => setShowImportSection(true)}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Restore from different backup
        </button>
      )}

      {/* Generate new keys option - only for users without keys */}
      {!hasLocalKeys && !showPassphraseInput && (
        <div className="pt-4 border-t border-border space-y-3">
          <p className="text-xs text-muted-foreground text-center">
            Lost your backup? You can generate new keys, but you won't be able to read old messages.
          </p>
          <Button
            variant="ghost"
            onClick={handleGenerateNew}
            disabled={isGenerating}
            className="w-full gap-2 text-muted-foreground"
          >
            <AlertTriangle className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate New Keys (lose old messages)"}
          </Button>
        </div>
      )}

      {onClose && !showPassphraseInput && (
        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
      )}
    </div>
  );
}
