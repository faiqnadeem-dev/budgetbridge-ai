import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Tooltip,
  Snackbar,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import CloseIcon from "@mui/icons-material/Close";
import EmailIcon from "@mui/icons-material/Email";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const ContactModal = ({ open, handleClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      handleClose();
      setSuccess(false);
      setFormData({ name: "", email: "", message: "" });
    }, 2000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText("faiqn.dev@gmail.com").then(
      () => {
        setSnackbarOpen(true);
      },
      (err) => {
        console.error("Could not copy email: ", err);
      }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <Modal
          open={open}
          onClose={handleClose}
          closeAfterTransition
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 2,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.5 }}
          >
            <Box
              sx={{
                position: "relative",
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: 24,
                p: 4,
                width: "100%",
                maxWidth: 500,
                mx: "auto",
              }}
            >
              <IconButton
                onClick={handleClose}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: "grey.500",
                }}
              >
                <CloseIcon />
              </IconButton>

              <Typography
                variant="h4"
                component="h2"
                sx={{ mb: 3, color: "#1a237e" }}
              >
                Get in Touch
              </Typography>

              {!success ? (
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <TextField
                          id="contact-name"
                          fullWidth
                          label="Name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          variant="outlined"
                        />
                      </motion.div>
                    </Grid>

                    <Grid item xs={12}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <TextField
                          id="contact-email"
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          variant="outlined"
                        />
                      </motion.div>
                    </Grid>

                    <Grid item xs={12}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <TextField
                          id="contact-message"
                          fullWidth
                          label="Message"
                          name="message"
                          multiline
                          rows={4}
                          value={formData.message}
                          onChange={handleChange}
                          required
                          variant="outlined"
                        />
                      </motion.div>
                    </Grid>

                    <Grid item xs={12}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          size="large"
                          disabled={loading}
                          sx={{
                            bgcolor: "#1a237e",
                            "&:hover": { bgcolor: "#283593" },
                          }}
                        >
                          {loading ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            "Send Message"
                          )}
                        </Button>
                      </motion.div>
                    </Grid>
                  </Grid>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <Typography variant="h6" color="primary">
                      Message Sent Successfully!
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Thank you for reaching out.
                    </Typography>
                  </Box>
                </motion.div>
              )}

              <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: "divider" }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2, color: "#1a237e" }}
                >
                  Connect With Me
                </Typography>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconButton
                        color="primary"
                        href="mailto:faiqn.dev@gmail.com"
                        aria-label="Email me"
                      >
                        <EmailIcon />
                      </IconButton>
                    </motion.div>
                    <Tooltip
                      title="Copy email to clipboard"
                      open={tooltipOpen}
                      onClose={() => setTooltipOpen(false)}
                      onOpen={() => setTooltipOpen(true)}
                      placement="top"
                    >
                      <IconButton
                        size="small"
                        onClick={copyEmailToClipboard}
                        sx={{
                          ml: -0.5,
                          color: "#1a237e",
                          opacity: 0.7,
                          "&:hover": { opacity: 1 },
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconButton
                      color="primary"
                      href="https://www.linkedin.com/in/faiq-nadeem-5a426b358"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn profile"
                    >
                      <LinkedInIcon />
                    </IconButton>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconButton
                      color="primary"
                      href="https://github.com/faiqnadeem-dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="GitHub profile"
                    >
                      <GitHubIcon />
                    </IconButton>
                  </motion.div>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, fontSize: "0.85rem" }}
                >
                  Email: faiqn.dev@gmail.com
                </Typography>
              </Box>
            </Box>
          </motion.div>
        </Modal>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Email copied to clipboard!"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </AnimatePresence>
  );
};

export default ContactModal;
