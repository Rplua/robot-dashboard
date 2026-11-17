import { BrowserRouter, Route, Routes } from "react-router";
import Connect from "./pages/connect";
import Dashboard from "./pages/dashboard";

export default function App() {
  return (
    <BrowserRouter>
    <Routes>
    <Route path="/" element={<Connect></Connect>}></Route>
    <Route path="/dashboard" element={<Dashboard></Dashboard>}></Route>
    </Routes>

    </BrowserRouter>

  )
}
