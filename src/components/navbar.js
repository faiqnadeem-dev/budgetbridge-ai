import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";
import VisionModal from "../components/modals/VisionModal";
import AboutModal from "../components/modals/AboutModal";
import ContactModal from "../components/modals/ContactModal";
import { HomeIcon } from "@heroicons/react/24/outline";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [visionOpen, setVisionOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoaded } = useAuth();

  const handleVisionOpen = () => setVisionOpen(true);
  const handleVisionClose = () => setVisionOpen(false);
  const handleAboutOpen = () => setAboutOpen(true);
  const handleAboutClose = () => setAboutOpen(false);
  const handleContactOpen = () => setContactOpen(true);
  const handleContactClose = () => setContactOpen(false);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  // New handlers for authentication
  const handleSignIn = () => {
    window.location.href =
      "https://capital-pup-32.accounts.dev/sign-in?redirect_url=" +
      encodeURIComponent(window.location.origin + "/dashboard");
  };

  const handleSignUp = () => {
    window.location.href =
      "https://capital-pup-32.accounts.dev/sign-up?redirect_url=" +
      encodeURIComponent(window.location.origin + "/dashboard");
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  const navVariants = {
    hidden: { y: -100 },
    visible: {
      y: 0,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 15,
      },
    },
  };

  // If auth isn't loaded yet, show a minimal navbar
  if (!isLoaded) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-white">
            BudgetBridge
          </Link>
          <div className="w-6 h-6 border-t-2 border-b-2 border-r-2 border-white rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={navVariants}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div
        className={`px-4 md:px-6 transition-all duration-500 ${
          scrolled
            ? "bg-white bg-opacity-95 shadow-md text-indigo-900"
            : "bg-transparent text-white"
        }`}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="text-xl font-bold transition-colors duration-300"
            >
              BudgetBridge
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/"
                  className="flex items-center transition-colors duration-300 hover:text-primary-500"
                >
                  <HomeIcon className="w-5 h-5 mr-1" />
                  <span>Home</span>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={handleVisionOpen}
                  className="transition-colors duration-300 hover:text-primary-500"
                >
                  Our Vision
                </button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={handleAboutOpen}
                  className="transition-colors duration-300 hover:text-primary-500"
                >
                  About
                </button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={handleContactOpen}
                  className="transition-colors duration-300 hover:text-primary-500"
                >
                  Contact
                </button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={handleSignIn}
                  className={`px-4 py-2 rounded-lg border transition-colors duration-300 ${
                    scrolled
                      ? "border-indigo-900 hover:bg-indigo-50"
                      : "border-white hover:bg-white hover:bg-opacity-10"
                  }`}
                >
                  Login
                </button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={handleSignUp}
                  className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                    scrolled
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-white bg-opacity-10 hover:bg-opacity-20"
                  }`}
                >
                  Register
                </button>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={toggleMobileMenu} className="flex items-center">
                <div className="space-y-1.5">
                  <span
                    className={`block w-6 h-0.5 transition-all duration-300 ${
                      scrolled ? "bg-indigo-900" : "bg-white"
                    } ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}
                  ></span>
                  <span
                    className={`block w-6 h-0.5 transition-all duration-300 ${
                      scrolled ? "bg-indigo-900" : "bg-white"
                    } ${mobileMenuOpen ? "opacity-0" : ""}`}
                  ></span>
                  <span
                    className={`block w-6 h-0.5 transition-all duration-300 ${
                      scrolled ? "bg-indigo-900" : "bg-white"
                    } ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
                  ></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-500 overflow-hidden ${
            mobileMenuOpen ? "max-h-96 pb-4" : "max-h-0"
          }`}
        >
          <div className="flex flex-col space-y-4 pt-2 pb-3">
            <Link
              to="/"
              className="flex items-center px-4 py-2 hover:bg-gray-100 hover:bg-opacity-20 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              <span>Home</span>
            </Link>

            <button
              onClick={() => {
                handleVisionOpen();
                setMobileMenuOpen(false);
              }}
              className="text-left px-4 py-2 hover:bg-gray-100 hover:bg-opacity-20 rounded-lg"
            >
              Our Vision
            </button>

            <button
              onClick={() => {
                handleAboutOpen();
                setMobileMenuOpen(false);
              }}
              className="text-left px-4 py-2 hover:bg-gray-100 hover:bg-opacity-20 rounded-lg"
            >
              About
            </button>

            <button
              onClick={() => {
                handleContactOpen();
                setMobileMenuOpen(false);
              }}
              className="text-left px-4 py-2 hover:bg-gray-100 hover:bg-opacity-20 rounded-lg"
            >
              Contact
            </button>

            <div className="flex flex-col space-y-3 px-4 pt-2">
              <button
                onClick={handleSignIn}
                className={`w-full px-4 py-2 rounded-lg border text-center ${
                  scrolled
                    ? "border-indigo-900 hover:bg-indigo-50"
                    : "border-white hover:bg-white hover:bg-opacity-10"
                }`}
              >
                Login
              </button>

              <button
                onClick={handleSignUp}
                className={`w-full px-4 py-2 rounded-lg text-center ${
                  scrolled
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-white bg-opacity-10 hover:bg-opacity-20"
                }`}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>

      <VisionModal open={visionOpen} handleClose={handleVisionClose} />
      <AboutModal open={aboutOpen} handleClose={handleAboutClose} />
      <ContactModal open={contactOpen} handleClose={handleContactClose} />
    </motion.div>
  );
};

export default Navbar;
