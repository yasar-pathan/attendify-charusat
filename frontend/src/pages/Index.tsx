import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, User } from "lucide-react";
import { motion } from "framer-motion";

// Animated floating shapes background
const AnimatedShapes = () => (
  <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
    <motion.div
      className="absolute rounded-full bg-gradient-to-br from-yellow-200 via-pink-200 to-blue-200 opacity-60"
      style={{ width: 320, height: 320, top: 40, left: 80 }}
      animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
      transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute rounded-full bg-gradient-to-br from-blue-100 via-green-100 to-yellow-100 opacity-50"
      style={{ width: 220, height: 220, bottom: 60, right: 120 }}
      animate={{ y: [0, -20, 0], x: [0, -15, 0] }}
      transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute rounded-full bg-gradient-to-br from-pink-100 via-yellow-100 to-blue-100 opacity-40"
      style={{ width: 180, height: 180, bottom: 120, left: 180 }}
      animate={{ y: [0, 15, 0], x: [0, 10, 0] }}
      transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
    />
  </div>
);

const Index = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      <AnimatedShapes />
      <motion.div
        className="bg-white/70 backdrop-blur-xl shadow-2xl rounded-3xl p-12 flex flex-col items-center gap-10 border border-white/40 max-w-md w-full z-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <h1
          className="text-4xl font-extrabold text-center mb-2 tracking-tight"
          style={{
            background: 'linear-gradient(90deg, #FFD700 0%, #B8860B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.04em',
          }}
        >
          Welcome to Attendify
        </h1>
        <p className="text-lg text-gray-800 text-center mb-6 max-w-md font-semibold drop-shadow-sm" style={{textShadow: '0 1px 6px #fff'}}> 
          Please select your role to continue
        </p>
        <div className="flex gap-8 w-full justify-center">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 4px 24px 0 rgba(218, 165, 32, 0.10)" }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center gap-2 px-8 py-6 rounded-xl bg-white/90 text-gray-900 font-semibold shadow-md border-2 border-[#FFD700] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/40 w-40"
            onClick={() => navigate("/login?role=admin")}
          >
            <Shield className="w-10 h-10 mb-1 text-[#B8860B]" />
            Admin
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 4px 24px 0 rgba(70, 130, 180, 0.10)" }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center gap-2 px-8 py-6 rounded-xl bg-white/90 text-gray-900 font-semibold shadow-md border-2 border-[#4682B4] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4682B4]/40 w-40"
            onClick={() => navigate("/login?role=teacher")}
          >
            <User className="w-10 h-10 mb-1 text-[#4682B4]" />
            Teacher
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
