import AuthProvider from "@/components/AuthProvider";
import JournalContainer from "@/components/JournalContainer";

export default function Home() {
  return (
    <AuthProvider>
      <JournalContainer />
    </AuthProvider>
  );
}