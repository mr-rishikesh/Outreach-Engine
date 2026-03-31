import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ContactDetail from "./pages/ContactDetail";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contacts/:id" element={<ContactDetail />} />
      </Route>
    </Routes>
  );
}

export default App;
