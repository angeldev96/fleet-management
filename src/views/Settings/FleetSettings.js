import React, { useState, useRef } from "react";
import { useHistory } from "react-router-dom";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import IconButton from "@material-ui/core/IconButton";

// @material-ui/icons
import ArrowBack from "@material-ui/icons/ArrowBack";
import CloudUpload from "@material-ui/icons/CloudUpload";
import Delete from "@material-ui/icons/Delete";
import Business from "@material-ui/icons/Business";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import CardIcon from "components/Card/CardIcon.js";
import Button from "components/CustomButtons/Button.js";

// hooks & services
import { useAuth } from "context/AuthContext";
import { uploadFleetLogo, removeFleetLogo } from "services/fleetService";
import SweetAlert from "react-bootstrap-sweetalert";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const useStyles = makeStyles(() => ({
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "24px",
  },
  backButton: {
    marginRight: "16px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E0E4E8",
    "&:hover": {
      backgroundColor: "#F8F9FB",
    },
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "4px",
  },
  cardIconTitle: {
    color: "#3C4858",
    marginTop: "15px",
    minHeight: "auto",
    fontWeight: "300",
    marginBottom: "0px",
    textDecoration: "none",
  },
  logoSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 20px",
  },
  currentLogoContainer: {
    width: "240px",
    height: "120px",
    borderRadius: "12px",
    border: "2px solid #E0E4E8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFBFC",
    marginBottom: "24px",
    overflow: "hidden",
  },
  currentLogo: {
    maxWidth: "220px",
    maxHeight: "100px",
    objectFit: "contain",
  },
  placeholderIcon: {
    fontSize: "48px",
    color: "#D1D5DB",
  },
  placeholderText: {
    color: "#9CA3AF",
    fontSize: "13px",
    marginTop: "8px",
  },
  uploadArea: {
    border: "2px dashed #E0E4E8",
    borderRadius: "12px",
    padding: "32px 20px",
    textAlign: "center",
    backgroundColor: "#FAFBFC",
    cursor: "pointer",
    transition: "all 0.2s ease",
    width: "100%",
    maxWidth: "400px",
    "&:hover": {
      borderColor: "#3E4D6C",
      backgroundColor: "#F5F7FA",
    },
  },
  uploadIcon: {
    fontSize: "40px",
    color: "#9CA3AF",
    marginBottom: "12px",
  },
  uploadText: {
    color: "#6B7280",
    fontSize: "14px",
    marginBottom: "4px",
  },
  uploadSubtext: {
    color: "#9CA3AF",
    fontSize: "12px",
  },
  hiddenInput: {
    display: "none",
  },
  previewContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    width: "100%",
    maxWidth: "400px",
  },
  previewImage: {
    maxWidth: "220px",
    maxHeight: "100px",
    objectFit: "contain",
    borderRadius: "8px",
    border: "1px solid #E0E4E8",
    padding: "8px",
    backgroundColor: "#fff",
  },
  previewFileName: {
    fontSize: "13px",
    color: "#6B7280",
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  },
  submitButton: {
    backgroundColor: "#3E4D6C",
    color: "#FFFFFF",
    padding: "10px 24px",
    textTransform: "none",
    fontWeight: "600",
    "&:hover": {
      backgroundColor: "#2E3B55",
    },
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    color: "#374151",
    padding: "10px 24px",
    textTransform: "none",
    fontWeight: "600",
    "&:hover": {
      backgroundColor: "#E5E7EB",
    },
  },
  removeButton: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    padding: "10px 24px",
    textTransform: "none",
    fontWeight: "600",
    "&:hover": {
      backgroundColor: "#FECACA",
    },
  },
  divider: {
    width: "100%",
    maxWidth: "400px",
    height: "1px",
    backgroundColor: "#E5E7EB",
    margin: "16px 0",
  },
}));

export default function FleetSettings() {
  const classes = useStyles();
  const history = useHistory();
  const fileInputRef = useRef(null);
  const { fleetId, fleetName, fleetLogoUrl, refreshProfile } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setAlert(
        <SweetAlert
          warning
          title="Invalid file type"
          onConfirm={() => setAlert(null)}
          confirmBtnCssClass={classes.submitButton}
        >
          Please select a PNG, JPG, SVG, or WebP image.
        </SweetAlert>
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setAlert(
        <SweetAlert
          warning
          title="File too large"
          onConfirm={() => setAlert(null)}
          confirmBtnCssClass={classes.submitButton}
        >
          Maximum file size is 2 MB.
        </SweetAlert>
      );
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
      setAlert(
        <SweetAlert
          danger
          title="Upload failed"
          onConfirm={() => setAlert(null)}
          confirmBtnCssClass={classes.submitButton}
        >
          {error.message || "An error occurred while uploading the logo."}
        </SweetAlert>
      );
      return;
    }

    // Clear selection and refresh profile to update sidebar
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await refreshProfile();

    setAlert(
      <SweetAlert
        success
        title="Logo updated"
        onConfirm={() => setAlert(null)}
        confirmBtnCssClass={classes.submitButton}
      >
        Your fleet logo has been updated successfully.
      </SweetAlert>
    );
  };

  const handleRemove = async () => {
    setAlert(
      <SweetAlert
        warning
        showCancel
        title="Remove logo?"
        onConfirm={async () => {
          setAlert(null);
          setRemoving(true);
          const { error } = await removeFleetLogo(fleetId);
          setRemoving(false);

          if (error) {
            setAlert(
              <SweetAlert
                danger
                title="Error"
                onConfirm={() => setAlert(null)}
                confirmBtnCssClass={classes.submitButton}
              >
                {error.message || "Failed to remove the logo."}
              </SweetAlert>
            );
            return;
          }

          await refreshProfile();
          setAlert(
            <SweetAlert
              success
              title="Logo removed"
              onConfirm={() => setAlert(null)}
              confirmBtnCssClass={classes.submitButton}
            >
              The fleet logo has been removed. The default logo will be used.
            </SweetAlert>
          );
        }}
        onCancel={() => setAlert(null)}
        confirmBtnCssClass={classes.removeButton}
        cancelBtnCssClass={classes.cancelButton}
        confirmBtnText="Yes, remove it"
        cancelBtnText="Cancel"
      >
        This will remove the current fleet logo and revert to the default.
      </SweetAlert>
    );
  };

  const handleCancelSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      {alert}
      <div className={classes.header}>
        <IconButton
          className={classes.backButton}
          onClick={() => history.push("/admin/settings")}
          size="small"
        >
          <ArrowBack style={{ fontSize: "20px", color: "#374151" }} />
        </IconButton>
        <div>
          <h1 className={classes.pageTitle}>Fleet Settings</h1>
          <div className={classes.pageSubtitle}>
            Customize branding for {fleetName || "your fleet"}
          </div>
        </div>
      </div>

      <GridContainer>
        <GridItem xs={12} sm={12} md={8}>
          <Card>
            <CardHeader color="info" icon>
              <CardIcon color="info">
                <Business />
              </CardIcon>
              <h4 className={classes.cardIconTitle}>Fleet Logo</h4>
            </CardHeader>
            <CardBody>
              <div className={classes.logoSection}>
                {/* Current logo */}
                <div className={classes.currentLogoContainer}>
                  {fleetLogoUrl ? (
                    <img
                      src={fleetLogoUrl}
                      alt="Fleet logo"
                      className={classes.currentLogo}
                    />
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <Business className={classes.placeholderIcon} />
                      <div className={classes.placeholderText}>No logo set</div>
                    </div>
                  )}
                </div>

                {/* File selection or upload area */}
                {selectedFile && previewUrl ? (
                  <div className={classes.previewContainer}>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className={classes.previewImage}
                    />
                    <div className={classes.previewFileName}>
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                    <div className={classes.buttonRow}>
                      <Button
                        className={classes.submitButton}
                        onClick={handleUpload}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <CircularProgress size={20} style={{ color: "#fff" }} />
                        ) : (
                          "Upload Logo"
                        )}
                      </Button>
                      <Button
                        className={classes.cancelButton}
                        onClick={handleCancelSelection}
                        disabled={uploading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={classes.uploadArea}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CloudUpload className={classes.uploadIcon} />
                    <div className={classes.uploadText}>
                      Click to select a logo image
                    </div>
                    <div className={classes.uploadSubtext}>
                      PNG, JPG, SVG, or WebP &bull; Max 2 MB
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  className={classes.hiddenInput}
                  onChange={handleFileSelect}
                />

                {/* Remove button - only show if a logo exists and no file is selected */}
                {fleetLogoUrl && !selectedFile && (
                  <>
                    <div className={classes.divider} />
                    <Button
                      className={classes.removeButton}
                      onClick={handleRemove}
                      disabled={removing}
                    >
                      {removing ? (
                        <CircularProgress size={20} style={{ color: "#991B1B" }} />
                      ) : (
                        <>
                          <Delete style={{ fontSize: "18px", marginRight: "6px" }} />
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
