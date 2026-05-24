import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Navbar from "../components/Navbar";
import { ToastContainer, toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaEnvelope,
  FaInfoCircle,
  FaGoogle,
  FaHeading,
  FaImage,
  FaTrash,
  FaCloudUploadAlt,
  FaLink,
} from "react-icons/fa";

/**
 * Ban appeal composer (separate from /complaint).
 * Uses the same mail-template mechanics as ComplaintMail.jsx.
 */
export default function BanComplaintMail() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const [subjectTitle, setSubjectTitle] = useState("");
  const [message, setMessage] = useState("");

  // Asset upload states
  const [base64Image, setBase64Image] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const theme = useMemo(() => {
    const key = userData?.theme || "DeepSpace";
    const themes = {
      DeepSpace: {
        primary: "#38bdf8",
        text: "#ffffff",
        border: "rgba(56,189,248,0.25)",
        navBg: "#02040a",
        card: "rgba(255,255,255,0.03)",
        input: "rgba(255,255,255,0.05)",
        btnBg: "linear-gradient(90deg, rgba(56,189,248,0.95), rgba(168,85,247,0.95))",
        isDark: true,
      },
      Light: {
        primary: "#4f46e5",
        text: "#0f172a",
        border: "rgba(79,70,229,0.25)",
        navBg: "#fcfcf9",
        card: "rgba(0,0,0,0.02)",
        input: "rgba(0,0,0,0.03)",
        btnBg: "linear-gradient(90deg, rgba(79,70,229,0.95), rgba(124,58,237,0.95))",
        isDark: false,
      },
    };
    return themes[key] || themes.DeepSpace;
  }, [userData?.theme]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Max limit is 2MB. 91d");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setBase64Image(base64String);
      await uploadAssetToDatabase(base64String);
    };
    reader.readAsDataURL(file);
  };

  const uploadAssetToDatabase = async (base64Data) => {
    setIsUploading(true);
    toast.info("Uploading asset payload to server cloud... 9a1");

    try {
      const cleanBase64 = base64Data.split(",")[1];
      const formData = new FormData();
      formData.append("image", cleanBase64);

      const response = await fetch("https://api.imgbb.com/1/upload?key=b7a2b417327c6d50519c8191c26f4645", {
        method: "POST",
        body: formData,
      });

      const resData = await response.json();
      if (resData?.success) {
        setUploadedUrl(resData.data.url);
        toast.success("Asset matrix live! Link auto-attached to mail body. 310");
      } else {
        throw new Error("Upload response failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Database connection failed. URL attachment skipped.");
    } finally {
      setIsUploading(false);
    }
  };

  const footer = useMemo(() => {
    const userId = currentUser?.uid || "N/A";
    const name = userData?.name || userData?.displayName || currentUser?.displayName || "Anonymous";
    const registeredEmail = currentUser?.email || "N/A";
    const assetLink = uploadedUrl ? uploadedUrl : "None Provided";

    return `\n\n\u26a1 SYSTEM DIAGNOSTICS\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\ud83c\udd94 USER_ID : ${userId}\n\ud83d\udc64 PROFILE : ${name}\n\u2709\ufe0f AUTH_EM : ${registeredEmail}\n\ud83c\udf10 ASSET_URL : ${assetLink}\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\ud83d\ude80 Sent via Padho Yaar Ban-Appeal ClientConsole`;
  }, [currentUser, userData, uploadedUrl]);

  const emailBody = useMemo(() => {
    const visualAttachmentString = uploadedUrl
      ? `4f8 ATTACHED SCREENSHOT / SCREENSHOT LINK:\n${uploadedUrl}\n\n`
      : "";

    return `Hey Padho Yaar HQ,\n\nI want to appeal my ban/suspension.\n\n\ud83d\udca5 WHAT'S HAPPENING (Appeal):\n${message || "[No context provided]"}\n\n${visualAttachmentString}Please review and let me know if you need more information.\n\nThanks,\n${footer}`;
  }, [message, uploadedUrl, footer]);

  const composeUrls = useMemo(() => {
    const to = "padhoyaarcare@gmail.com";
    const formattedSubject = subjectTitle.trim()
      ? `[Padho Yaar Ban Appeal] ${subjectTitle}`
      : "9a8 [Padho Yaar] Ban Appeal Request";

    const gmailUrl = new URL("https://mail.google.com/mail/");
    gmailUrl.searchParams.append("view", "cm");
    gmailUrl.searchParams.append("fs", "1");
    gmailUrl.searchParams.append("to", to);
    gmailUrl.searchParams.append("su", formattedSubject);
    gmailUrl.searchParams.append("body", emailBody);

    const nativeMailto = `mailto:${to}?subject=${encodeURIComponent(formattedSubject)}&body=${encodeURIComponent(emailBody)}`;

    return { gmail: gmailUrl.toString(), mailto: nativeMailto };
  }, [subjectTitle, emailBody]);

  const handleSendValidation = (e) => {
    if (!subjectTitle.trim()) {
      e.preventDefault();
      toast.warn("Drop a quick subject title first! 3af");
      return;
    }
    if (!message.trim()) {
      e.preventDefault();
      toast.warn("Don't leave the appeal message empty! 9dd");
      return;
    }
    if (isUploading) {
      e.preventDefault();
      toast.warn("Hold up! The screenshot asset is still compiling... 503");
      return;
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.navBg }}>
      <Navbar userData={userData} />
      <ToastContainer position="top-right" theme={theme.isDark ? "dark" : "light"} />

      <main className="max-w-3xl mx-auto pt-10 sm:pt-20 px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[40px] p-8 sm:p-14 border overflow-hidden relative"
          style={{ borderColor: theme.border, background: theme.card }}
        >
          <motion.button
            whileHover={{ x: -5 }}
            onClick={() => navigate("/profile")}
            className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest z-30 transition-colors"
            style={{ borderColor: theme.border, color: theme.text }}
          >
            <FaArrowLeft /> Back
          </motion.button>

          <div className="flex flex-col items-start gap-6 mt-10">
            <div className="w-full">
              <h1 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tight" style={{ color: theme.text }}>
                Ban Appeal x Padho Yaar
              </h1>
              <div className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-70" style={{ color: theme.text }}>
                <FaInfoCircle style={{ color: theme.primary }} /> Write your appeal, attach proof if any, and well review.
              </div>
            </div>

            <div className="w-full space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1" style={{ color: theme.text }}>
                  Email Subject Line 4e8
                </label>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-5 opacity-40 text-sm" style={{ color: theme.text }}>
                    <FaHeading />
                  </span>
                  <input
                    type="text"
                    value={subjectTitle}
                    onChange={(e) => setSubjectTitle(e.target.value)}
                    placeholder="e.g. Appeal for suspension - policy misunderstanding"
                    className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 outline-none font-bold text-sm transition-all focus:scale-[1.01]"
                    style={{ borderColor: theme.border, background: theme.input, color: theme.text }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1" style={{ color: theme.text }}>
                  Appeal / Context 9ea
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain why you were banned and what you want to clarify."
                  className="w-full p-5 rounded-2xl border-2 outline-none font-bold text-sm transition-all focus:scale-[1.01]"
                  style={{ borderColor: theme.border, background: theme.input, color: theme.text, minHeight: 150 }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1" style={{ color: theme.text }}>
                  Attach Screenshot (Optional) 4f8
                </label>

                {!base64Image ? (
                  <label
                    className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:opacity-80"
                    style={{ borderColor: theme.border, background: theme.input }}
                  >
                    <div className="flex flex-col items-center justify-center space-y-2 text-center">
                      <FaImage className="text-xl opacity-60" style={{ color: theme.text }} />
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.text }}>
                        Upload Proof
                      </p>
                      <p className="text-[10px] opacity-50 font-medium" style={{ color: theme.text }}>
                        PNG, JPG up to 2MB (Auto-Links to Mail)
                      </p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 border-2 rounded-2xl" style={{ borderColor: theme.border, background: theme.input }}>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={base64Image}
                          alt="Preview Asset"
                          className={`w-12 h-12 object-cover rounded-xl border ${isUploading ? "opacity-40" : ""}`}
                          style={{ borderColor: theme.border }}
                        />
                        {isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FaCloudUploadAlt className="text-sky-400 animate-pulse text-sm" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider" style={{ color: theme.text }}>
                          {isUploading ? "Uploading..." : "Asset Payload Live"}
                        </p>
                        <p className="text-[10px] opacity-50 font-mono max-w-[180px] sm:max-w-md truncate flex items-center gap-1" style={{ color: theme.text }}>
                          {uploadedUrl ? (
                            <>
                              <FaLink className="text-[8px]" /> {uploadedUrl}
                            </>
                          ) : (
                            "Compiling unique system link..."
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => {
                        setBase64Image("");
                        setUploadedUrl("");
                      }}
                      className="p-3 rounded-xl border text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                      style={{ borderColor: theme.border }}
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
                <a
                  href={composeUrls.gmail}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleSendValidation}
                  className="flex-1 text-center px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest inline-flex items-center justify-center gap-3 select-none transition-transform active:scale-95"
                  style={{ background: theme.btnBg, color: theme.isDark ? "#000" : "#fff", textDecoration: "none" }}
                >
                  <FaGoogle className="text-base" /> Gmail Web
                </a>

                <a
                  href={composeUrls.mailto}
                  onClick={handleSendValidation}
                  className="flex-1 text-center px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border inline-flex items-center justify-center gap-3 select-none transition-transform active:scale-95"
                  style={{ borderColor: theme.border, background: theme.input, color: theme.text, textDecoration: "none" }}
                >
                  <FaEnvelope className="text-base" /> Native Client
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setSubjectTitle("");
                    setBase64Image("");
                    setUploadedUrl("");
                    toast.success("Console matrix cleared. 52c");
                  }}
                  className="px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border transition-colors hover:opacity-80"
                  style={{ borderColor: theme.border, background: theme.input, color: theme.text }}
                >
                  Clear
                </button>
              </div>

              <div className="text-[10px] uppercase font-black tracking-widest opacity-50 text-center sm:text-left" style={{ color: theme.text }}>
                9ee User context + diagnostics auto-append inside the compiled mail payload.
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

