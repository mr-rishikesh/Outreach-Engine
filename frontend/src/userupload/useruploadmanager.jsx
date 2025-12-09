import React, { useState } from "react";
import {
  Upload,
  Send,
  Check,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Mail,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function UserUploadManager() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [message, setMessage] = useState({ type: "", text: "" });
  const [currentPage, setCurrentPage] = useState("upload"); // 'upload' or 'compose'

  // Compose page states
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [aboutSender, setAboutSender] = useState("");
  const [signature, setSignature] = useState("");
  const [context, setContext] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const formattedUsers = jsonData.map((row, index) => ({
          id: index,
          name: row.name || row.Name || "",
          email: row.email || row.Email || "",
          about: row.about || row.about || row.companey || "",
        }));

        setUsers(formattedUsers);
        setSelectedUsers(new Set());
        setMessage({
          type: "success",
          text: `${formattedUsers.length} users loaded successfully!`,
        });
      } catch (error) {
        setMessage({
          type: "error",
          text: "Error parsing file. Please check the format.",
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  const handleProceedToCompose = () => {
    if (selectedUsers.size === 0) {
      setMessage({ type: "error", text: "Please select at least one user" });
      return;
    }
    setCurrentPage("compose");
    setMessage({ type: "", text: "" });
  };

  const handleSendEmails = async (isHardcoded) => {
    // Validation
    if (!subject.trim()) {
      setMessage({ type: "error", text: "Please enter email subject" });
      return;
    }
    if (!body.trim()) {
      setMessage({ type: "error", text: "Please enter email body" });
      return;
    }
    if (!isHardcoded) {
      if (!aboutSender.trim()) {
        setMessage({
          type: "error",
          text: "Please provide information about sender",
        });
        return;
      }
      if (!signature.trim()) {
        setMessage({ type: "error", text: "Please provide signature" });
        return;
      }
      if (!context.trim()) {
        setMessage({ type: "error", text: "Please provide context" });
        return;
      }
    }
    if (!secretKey.trim()) {
      setMessage({ type: "error", text: "Please enter secret key" });
      return;
    }
    if (!password.trim()) {
      setMessage({ type: "error", text: "Please enter password" });
      return;
    }

    setSending(true);
    setResult(null);

    const selectedUserData = users.filter((u) => selectedUsers.has(u.id));

    const requestData = {
      users: selectedUserData,
      subject1 : subject,
      body1 : body,
      isHardcoded,
      secretKey,
      password,

            aboutSender,
            signature,
            context,
   
    };

    try {
        console.log(requestData)
      const response = await fetch(
        "http://localhost:5000/email/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          sent: data.sentCount || selectedUserData.length,
          failed:  selectedUserData.length - data.sentCount|| 0,
          errors: data.errors || [],
        });
        setMessage({
          type: "success",
          text: `Successfully sent ${
            data.sentCount || selectedUserData.length
          } emails!`,
        });
      } else {
        
        setResult({
          success: false,
          sent: data.sentCount || 0,
          failed: data.failedCount || selectedUserData.length,
          errors: data.errors || ["Failed to send emails"],
        });
        setMessage({
          type: "error",
          text: data.message || "Failed to send emails. Please try again.",
        });
      }
    } catch (error) {
        console.log(error)
      setResult({
        success: false,
        sent: 0,
        failed: selectedUserData.length,
        errors: [error.message || "Network error"],
      });
      setMessage({
        type: "error",
        text: "Network error. Please check your connection.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleBackToUpload = () => {
    setCurrentPage("upload");
    setSubject("");
    setBody("");
    setAboutSender("");
    setSignature("");
    setContext("");
    setSecretKey("");
    setPassword("");
    setResult(null);
    setMessage({ type: "", text: "" });
  };

  if (currentPage === "compose") {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBackToUpload}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to User Selection
          </button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Compose Email
            </h1>
            <p className="text-gray-600 mb-6">
              Sending to {selectedUsers.size} recipients
            </p>

            {/* Message Display */}
            {message.text && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                <AlertCircle className="w-5 h-5" />
                <span>{message.text}</span>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div
                className={`mb-6 p-6 rounded-lg border-2 ${
                  result.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h3 className="font-semibold text-lg mb-3">
                  {result.success
                    ? "✅ Email Send Complete"
                    : "⚠️ Email Send Completed with Errors"}
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="bg-white p-3 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {result.sent}
                    </div>
                    <div className="text-sm text-gray-600">
                      Successfully Sent
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <div className="text-2xl font-bold text-red-600">
                      {result.failed}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-sm mb-2">Errors:</p>
                    <ul className="text-sm space-y-1">
                      {result.errors.map((err, idx) => (
                        <li key={idx} className="text-red-700">
                          • {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-6">
              {/* Common Fields - Used in Both Cases */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Common Fields (Used in both Hardcoded & AI Generated)
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  These fields will be used if AI generation fails or for
                  hardcoded emails
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter email subject..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Body *
                    </label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Enter email body content..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={6}
                    />
                  </div>
                </div>
              </div>

              {/* AI Generation Fields */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Generation Inputs (Required for AI Generated option)
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      About Sender
                    </label>
                    <textarea
                      value={aboutSender}
                      onChange={(e) => setAboutSender(e.target.value)}
                      placeholder="Describe yourself, your background, role, etc..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signature
                    </label>
                    <textarea
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder={
                        "Best regards,\nYour Name\nYour Title\nContact Info"
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Context
                    </label>
                    <select
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select context...</option>
                      <option value="party">
                        Inviting for Party/Function
                      </option>
                      <option value="service">Asking for Service</option>
                      <option value="referral">Asking for Referral</option>
                      <option value="job">Asking for Job Opportunity</option>
                      <option value="networking">Networking Request</option>
                      <option value="collaboration">
                        Collaboration Proposal
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sensitive Information */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-3">
                  🔒 Sensitive Information (Required)
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secret Key *
                    </label>
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="Enter your secret key..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Send Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => handleSendEmails(true)}
                  disabled={sending}
                  className="px-6 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 font-semibold"
                >
                  {sending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Hardcoded
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleSendEmails(false)}
                  disabled={sending}
                  className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 font-semibold"
                >
                  {sending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Send AI Generated
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Upload Page
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          User Upload Manager
        </h1>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
            <Upload className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              Click to upload Excel or CSV file
            </span>
            <span className="text-xs text-gray-400 mt-1">
              Supports .xlsx, .xls, .csv
            </span>
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Message Display */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            <AlertCircle className="w-5 h-5" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Users List */}
        {users.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Users List
                </h2>
                <span className="text-sm text-gray-500">
                  {selectedUsers.size} of {users.length} selected
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  {selectedUsers.size === users.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <button
                  onClick={handleProceedToCompose}
                  disabled={selectedUsers.size === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Proceed to Compose
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedUsers.size === users.length && users.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      about
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`cursor-pointer hover:bg-gray-50 transition ${
                        selectedUsers.has(user.id) ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          {selectedUsers.has(user.id) ? (
                            <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 border-2 border-gray-300 rounded" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.about}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {users.length === 0 && !message.text && (
          <div className="text-center py-12 text-gray-500">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Upload an Excel or CSV file to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
