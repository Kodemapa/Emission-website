import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import ArrowStepper from "./components/ArrowStepper";
import Header from "./components/Header";
import Footer from "./components/Footer";
import useAppStore from "./useAppStore";

const App = () => {
  const theme = useAppStore((s) => s.theme);

  return (
    // App.tsx
    <BrowserRouter>
      <div className={theme === "dark" ? "dark" : ""}>
        {/* Fixed Header */}
        <div
          className="fixed top-0 left-0 right-0 h-[110px] box-border z-[1000]
                    bg-white/80 dark:bg-gray-900/80 backdrop-blur
                    border-b border-gray-200 dark:border-gray-800"
        >
          <Header />
        </div>

        {/* Content — pad to avoid overlap */}
        <main className="pt-[110px] pb-[56px]">
          <Routes>
            <Route path="/" element={<ArrowStepper />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </main>

        {/* Fixed Footer */}
        <div
          className="fixed bottom-0 left-0 right-0 max-h-[160px] box-border z-[1000]
                    bg-white/80 dark:bg-gray-900/80 backdrop-blur
                    border-t border-gray-200 dark:border-gray-800"
        >
          <Footer />
        </div>
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
};

export default App;
