import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ContactDetail from "./pages/ContactDetail";
import Sequences from "./pages/Sequences";
import CreateSequence from "./pages/CreateSequence";
import Settings from "./pages/Settings";
import { WorkerProvider } from "./context/WorkerContext";

function App() {
  return (
    <WorkerProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/sequences" element={<Sequences />} />
          <Route path="/sequences/new" element={<CreateSequence />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </WorkerProvider>
  );
}

export default App;
