import React, { useState, useRef } from "react";
import { useHistory } from "react-router-dom";

// Lucide icons
import { ArrowLeft, Upload, Trash2, Building, Loader2 } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import CardIcon from "components/Card/CardIcon.js";
import Button from "components/CustomButtons/Button.js";

// shadcn
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "components/ui/alert-dialog";

// hooks & services
import { useAuth } from "context/AuthContext";
import { uploadFleetLogo, removeFleetLogo } from "services/fleetService";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function FleetSettings() {
  const history = useHistory();
  const fileInputRef = useRef(null);
  const { fleetId, fleetName, fleetLogoUrl, refreshProfile } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Alert dialog state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: "", message: "", type: "info" });

  // Remove confirmation dialog
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  const showAlert = (title, message, type = "info") => {
    setAlertConfig({ title, message, type });
    setAlertOpen(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      showAlert("Invalid file type", "Please select a PNG, JPG, SVG, or WebP image.", "warning");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showAlert("File too large", "Maximum file size is 2 MB.", "warning");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !fleetId) return;

    setUploading(true);
    const { logoUrl, error } = await uploadFleetLogo(fleetId, selectedFile);
    setUploading(false);

    if (error) {
      showAlert("Upload failed", error.message || "An error occurred while uploading the logo.", "error");
      return;
    }

    // Clear selection and refresh profile to update sidebar
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await refreshProfile();

    showAlert("Logo updated", "Your fleet logo has been updated successfully.", "success");
  };

  const handleRemoveConfirm = async () => {
    setRemoveConfirmOpen(false);
    setRemoving(true);
    const { error } = await removeFleetLogo(fleetId);
    setRemoving(false);

    if (error) {
      showAlert("Error", error.message || "Failed to remove the logo.", "error");
      return;
    }

    await refreshProfile();
    showAlert("Logo removed", "The fleet logo has been removed. The default logo will be used.", "success");
  };

  const handleCancelSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      {/* Info/Warning/Success Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertConfig.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Confirmation AlertDialog */}
      <AlertDialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove logo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the current fleet logo and revert to the default.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Yes, remove it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center mb-6">
        <button
          className="mr-4 p-2 bg-white border border-border rounded-lg hover:bg-muted/50 transition-colors"
          onClick={() => history.push("/admin/settings")}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground m-0">Fleet Settings</h1>
          <div className="text-sm text-muted-foreground mt-1">
            Customize branding for {fleetName || "your fleet"}
          </div>
        </div>
      </div>

      <GridContainer>
        <GridItem xs={12} sm={12} md={8}>
          <Card>
            <CardHeader color="info" icon>
              <CardIcon color="info">
                <Building className="w-6 h-6" />
              </CardIcon>
              <h4 className="text-foreground mt-4 min-h-0 font-light mb-0 no-underline">
                Fleet Logo
              </h4>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col items-center py-8 px-5">
                {/* Current logo */}
                <div className="w-60 h-[120px] rounded-xl border-2 border-border flex items-center justify-center bg-muted/50 mb-6 overflow-hidden">
                  {fleetLogoUrl ? (
                    <img
                      src={fleetLogoUrl}
                      alt="Fleet logo"
                      className="max-w-[220px] max-h-[100px] object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Building className="w-12 h-12 text-muted-foreground mx-auto" />
                      <div className="text-muted-foreground text-[13px] mt-2">No logo set</div>
                    </div>
                  )}
                </div>

                {/* File selection or upload area */}
                {selectedFile && previewUrl ? (
                  <div className="flex flex-col items-center gap-4 w-full max-w-[400px]">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-[220px] max-h-[100px] object-contain rounded-lg border border-border p-2 bg-white"
                    />
                    <div className="text-[13px] text-muted-foreground">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                    <div className="flex gap-3 mt-2">
                      <Button
                        className="bg-primary text-primary-foreground px-6 py-2.5 normal-case font-semibold hover:bg-primary/90"
                        onClick={handleUpload}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        ) : (
                          "Upload Logo"
                        )}
                      </Button>
                      <Button
                        className="bg-muted text-foreground px-6 py-2.5 normal-case font-semibold hover:bg-muted"
                        onClick={handleCancelSelection}
                        disabled={uploading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-border rounded-xl py-8 px-5 text-center bg-muted/50 cursor-pointer transition-all w-full max-w-[400px] hover:border-primary hover:bg-muted"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <div className="text-muted-foreground text-sm mb-1">
                      Click to select a logo image
                    </div>
                    <div className="text-muted-foreground text-xs">
                      PNG, JPG, SVG, or WebP &bull; Max 2 MB
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* Remove button - only show if a logo exists and no file is selected */}
                {fleetLogoUrl && !selectedFile && (
                  <>
                    <div className="w-full max-w-[400px] h-px bg-muted my-4" />
                    <Button
                      className="bg-red-50 text-red-800 px-6 py-2.5 normal-case font-semibold hover:bg-red-100"
                      onClick={() => setRemoveConfirmOpen(true)}
                      disabled={removing}
                    >
                      {removing ? (
                        <Loader2 className="w-5 h-5 animate-spin text-red-800" />
                      ) : (
                        <>
                          <Trash2 className="w-[18px] h-[18px] mr-1.5" />
                          Remove Logo
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
  );
}
