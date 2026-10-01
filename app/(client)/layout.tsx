// import NavClient from "@/components/client/Navigasi";
import Navbar from "@/components/client/Navigasi";
import Footer from "@/components/client/Footer";
import ChatButton from "@/components/ChatButton";
import { ChatContextProvider } from "@/components/ChatContext";

const LayoutClient = ({ children }: { children: React.ReactNode }) => {
  return (
    <ChatContextProvider>
      <div>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ChatButton />
      </div>
    </ChatContextProvider>
  );
};

export default LayoutClient;
