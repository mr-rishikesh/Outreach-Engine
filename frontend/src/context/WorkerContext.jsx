import { createContext, useContext, useState } from "react";
import { api } from "../api";
import toast from "react-hot-toast";

const WorkerContext = createContext();

export function WorkerProvider({ children }) {
  const [status, setStatus] = useState("idle"); // 'idle' | 'running' | 'done'
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [sequenceName, setSequenceName] = useState("");
  const [type, setType] = useState(""); // 'primary' | 'followup'

  const startSending = async (sequenceId, name, sendType) => {
    if (status === "running") {
      toast.error("Another sending job is already in progress!");
      return;
    }

    try {
      // 1. Fetch eligible contacts
      const eligibleRes = await api.getEligibleContacts(sequenceId, { type: sendType });
      const list = eligibleRes.data || [];

      if (list.length === 0) {
        toast.error(`No eligible contacts found for this sequence & touch type.`);
        return;
      }

      // 2. Set worker state
      setSequenceName(name);
      setType(sendType);
      setTotal(list.length);
      setCurrent(0);
      setStatus("running");

      // 3. Process sending loop asynchronously
      processSending(sequenceId, list, sendType);
      toast.success(`Started sending ${sendType === "followup" ? "follow-up" : "primary"} campaign in the background!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to start sequence run.");
      setStatus("idle");
    }
  };

  const processSending = async (sequenceId, contacts, sendType) => {
    // Read Settings to get delays
    let delaySec = 2; // default fallback
    try {
      const settingsRes = await api.getSettings();
      if (settingsRes.success && settingsRes.data) {
        const { minDelaySeconds, maxDelaySeconds } = settingsRes.data;
        delaySec = Math.floor(Math.random() * (maxDelaySeconds - minDelaySeconds + 1)) + minDelaySeconds;
      }
    } catch (err) {
      console.error("Failed to read settings for delay, using default 2s:", err);
    }

    let sentCount = 0;
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      try {
        await api.sendSingleSequenceEmail(sequenceId, { contactId: contact._id, type: sendType });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send email to ${contact.email}:`, err);
      }
      
      setCurrent(i + 1);

      // Apply delay between requests if not the last one
      if (i < contacts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
      }
    }

    setStatus("done");
    toast.success(`Completed sending campaign! Sent: ${sentCount}/${contacts.length} successfully.`);
    setTimeout(() => {
      setStatus("idle");
    }, 5000); // clear banner after 5s
  };

  return (
    <WorkerContext.Provider
      value={{
        status,
        current,
        total,
        sequenceName,
        type,
        startSending
      }}
    >
      {children}
    </WorkerContext.Provider>
  );
}

export function useWorker() {
  return useContext(WorkerContext);
}
